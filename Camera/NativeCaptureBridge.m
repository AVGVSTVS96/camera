#import "NativeCaptureBridge.h"
@import PhotosSupport;
#import <AVFoundation/AVFoundation.h>
#import <Photos/Photos.h>
#import <TargetConditionals.h>
#import <objc/runtime.h>

static id CaptureValue(id object, NSString *name) {
    SEL selector = NSSelectorFromString(name);
    NSMethodSignature *signature = [object methodSignatureForSelector:selector];
    if (!signature || signature.numberOfArguments != 2) { return nil; }
    NSInvocation *call = [NSInvocation invocationWithMethodSignature:signature];
    call.target = object;
    call.selector = selector;
    [call invoke];
    switch (signature.methodReturnType[0]) {
        case '@': { __unsafe_unretained id value = nil; [call getReturnValue:&value]; return value; }
        case 'B': { BOOL value; [call getReturnValue:&value]; return @(value); }
        case 'q': { NSInteger value; [call getReturnValue:&value]; return @(value); }
        case 'Q': { NSUInteger value; [call getReturnValue:&value]; return @(value); }
        default: return nil;
    }
}

static void CaptureReceipt(NSString *identifier, NSDictionary *receipt) {
    NSData *data = [NSJSONSerialization dataWithJSONObject:receipt options:NSJSONWritingPrettyPrinted | NSJSONWritingSortedKeys error:nil];
    if (!data) { return; }
    NSURL *documents = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
    NSURL *url = [documents URLByAppendingPathComponent:[NSString stringWithFormat:@"capture-%@.json", identifier]];
    [data writeToURL:url atomically:YES];
    NSLog(@"CAMERA_CAPTURE_RECEIPT=%@", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
}

static void FinishCaptureProbe(void) {
    #if DEBUG
    if ([NSProcessInfo.processInfo.arguments containsObject:@"--capture-probe"]) {
        dispatch_async(dispatch_get_main_queue(), ^{ UIApplication.sharedApplication.idleTimerDisabled = NO; });
    }
    #endif
}

static NSDictionary *CaptureErrorDetails(NSError *error, NSUInteger depth) {
    if (!error) { return @{}; }
    NSMutableDictionary *details = [@{@"domain": error.domain, @"code": @(error.code), @"description": error.localizedDescription} mutableCopy];
    NSMutableDictionary *info = [NSMutableDictionary dictionary];
    if (depth < 3) {
        [error.userInfo enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
            if (![key isKindOfClass:NSString.class]) { return; }
            if ([value isKindOfClass:NSError.class]) { info[key] = CaptureErrorDetails(value, depth + 1); }
            else if ([value isKindOfClass:NSString.class] || [value isKindOfClass:NSNumber.class]) { info[key] = value; }
            else if ([value isKindOfClass:NSURL.class]) { info[key] = [value path] ?: [value absoluteString]; }
        }];
    }
    if (info.count) { details[@"userInfo"] = info; }
    return details;
}

static void RecordCaptureResponse(NSString *callback, id request, id response, NSError *error) {
    NSMutableDictionary *receipt = [@{@"kind": @"native-callback", @"timestamp": [NSISO8601DateFormatter.new stringFromDate:NSDate.date], @"callback": callback, @"requestClass": request ? NSStringFromClass([request class]) : @"nil", @"responseClass": response ? NSStringFromClass([response class]) : @"nil"} mutableCopy];
    receipt[@"mainThread"] = @(NSThread.isMainThread);
    if (NSThread.isMainThread) { receipt[@"applicationState"] = @(UIApplication.sharedApplication.applicationState); }
    if (error) { receipt[@"error"] = error.localizedDescription; receipt[@"errorDetails"] = CaptureErrorDetails(error, 0); }
    if (error) { FinishCaptureProbe(); }
    for (NSString *name in @[@"persistenceUUID", @"stillPersistenceUUID", @"persistenceURL", @"irisVideoPersistenceURL", @"isExpectingPairedVideo", @"mediaType", @"captureMode"]) {
        id value = CaptureValue(response, name);
        if ([value isKindOfClass:NSUUID.class]) { value = [value UUIDString]; }
        if ([value isKindOfClass:NSURL.class]) { value = [value path]; }
        if ([value isKindOfClass:NSString.class] || [value isKindOfClass:NSNumber.class]) { receipt[name] = value; }
    }
    CaptureReceipt(NSUUID.UUID.UUIDString, receipt);
}

static id IndexedCaptureValue(id object, NSString *name, NSInteger index) {
    NSMethodSignature *signature = [object methodSignatureForSelector:NSSelectorFromString(name)];
    if (!signature || signature.numberOfArguments != 3 || !strchr("qQ", [signature getArgumentTypeAtIndex:2][0])) { return nil; }
    NSInvocation *call = [NSInvocation invocationWithMethodSignature:signature];
    call.target = object;
    call.selector = NSSelectorFromString(name);
    [call setArgument:&index atIndex:2];
    [call invoke];
    if (signature.methodReturnType[0] == '@') {
        __unsafe_unretained id value = nil;
        [call getReturnValue:&value];
        return value;
    }
    if (strchr("qQ", signature.methodReturnType[0])) {
        NSInteger value;
        [call getReturnValue:&value];
        return @(value);
    }
    return nil;
}

static BOOL SelectVerifiedLivePhotoMode(UIViewController *viewfinder, NSString *requestedTitle) {
    Class cls = NSClassFromString(@"CAMLivePhotoButton");
    if (![cls isSubclassOfClass:UIView.class]) { return NO; }
    UIView *button = [[cls alloc] initWithFrame:CGRectZero];
    NSArray *modes = CaptureValue(button, @"_availableModes");
    if (![modes isKindOfClass:NSArray.class] || modes.count > 4) { return NO; }
    NSMutableArray *mapping = [NSMutableArray array];
    NSNumber *selected;
    for (NSInteger index = 0; index < (NSInteger)modes.count; index++) {
        NSNumber *mode = IndexedCaptureValue(button, @"modeForIndex:", index);
        NSString *title = IndexedCaptureValue(button, @"titleForMenuItemAtIndex:", index);
        if (![mode isKindOfClass:NSNumber.class] || ![title isKindOfClass:NSString.class]) { continue; }
        [mapping addObject:@{@"mode": mode, @"title": title}];
        if ([title caseInsensitiveCompare:requestedTitle] == NSOrderedSame || [title caseInsensitiveCompare:[@"Live " stringByAppendingString:requestedTitle]] == NSOrderedSame) { selected = mode; }
    }
    CaptureReceipt(@"live-photo-modes", @{@"kind": @"runtime-menu-mapping", @"modes": mapping});
    NSMethodSignature *signature = [viewfinder methodSignatureForSelector:NSSelectorFromString(@"setLivePhotoMode:")];
    if (!selected || signature.numberOfArguments != 3 || !strchr("qQ", [signature getArgumentTypeAtIndex:2][0])) { return NO; }
    NSInteger value = selected.integerValue;
    NSInvocation *call = [NSInvocation invocationWithMethodSignature:signature];
    call.target = viewfinder;
    call.selector = NSSelectorFromString(@"setLivePhotoMode:");
    [call setArgument:&value atIndex:2];
    [call invoke];
    return [CaptureValue(viewfinder, @"livePhotoMode") isEqual:selected];
}

static __weak UIViewController *probeViewfinder;
static BOOL probeSessionRunning;
static BOOL probeAttempted;

static void TryCaptureProbe(void) {
    UIViewController *viewfinder = probeViewfinder;
    if (!viewfinder || !probeSessionRunning || probeAttempted || UIApplication.sharedApplication.applicationState != UIApplicationStateActive || !viewfinder.view.window) { return; }
    if (![CaptureValue(viewfinder, @"shouldEnableCaptureMenuCommand") boolValue]) { return; }
    probeAttempted = YES;
    NSString *liveMode = [NSProcessInfo.processInfo.arguments containsObject:@"--live-probe"] ? @"On" : @"Off";
    if ([CaptureValue(viewfinder, @"currentCaptureMode") integerValue] != 0 || !SelectVerifiedLivePhotoMode(viewfinder, liveMode)) {
        CaptureReceipt(@"probe", @{@"kind": @"capture-probe", @"accepted": @NO, @"reason": @"Photo mode or the requested runtime-verified Live Photo menu choice is unavailable."});
        return;
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        if (UIApplication.sharedApplication.applicationState != UIApplicationStateActive) { return; }
        NSMethodSignature *signature = [viewfinder methodSignatureForSelector:NSSelectorFromString(@"capturePhoto")];
        if (signature.numberOfArguments != 2 || signature.methodReturnType[0] != 'B') { return; }
        NSInvocation *call = [NSInvocation invocationWithMethodSignature:signature];
        call.target = viewfinder;
        call.selector = NSSelectorFromString(@"capturePhoto");
        [call invoke];
        BOOL accepted = NO;
        [call getReturnValue:&accepted];
        CaptureReceipt(@"probe", @{@"kind": @"capture-probe", @"accepted": @(accepted), @"persistenceBehavior": CaptureValue(viewfinder, @"persistenceBehavior") ?: NSNull.null, @"livePhotoMode": CaptureValue(viewfinder, @"livePhotoMode") ?: NSNull.null});
    });
}

static NSString *PhotosStagingMethodName(PhotosResourceStagingMethod method) {
    switch (method) {
        case PhotosResourceStagingMethodClone: return @"clone";
        case PhotosResourceStagingMethodFileDescriptorCopy: return @"fd-copy";
        case PhotosResourceStagingMethodNone: return @"none";
    }
    return @"unknown";
}

static void SaveStagedResource(NSURL *staged, NSString *originalFilename, NSDate *creationDate, BOOL video, NSString *identifier, NSMutableDictionary *receipt, NSURL *pairedVideo, NSString *pairedFilename) {
    PhotosLibrarySaveCompletion completion = ^(NSString *assetIdentifier, NSError *error) {
        BOOL success = assetIdentifier != nil && error == nil;
        receipt[@"savedToPhotos"] = @(success);
        if (assetIdentifier) { receipt[@"assetIdentifier"] = assetIdentifier; }
        if (error) { receipt[@"saveError"] = error.localizedDescription; receipt[@"errorDetails"] = CaptureErrorDetails(error, 0); }
        if (success && assetIdentifier) {
            PHAsset *asset = [PHAsset fetchAssetsWithLocalIdentifiers:@[assetIdentifier] options:nil].firstObject;
            if (asset) {
                receipt[@"pixelWidth"] = @(asset.pixelWidth);
                receipt[@"pixelHeight"] = @(asset.pixelHeight);
                receipt[@"duration"] = @(asset.duration);
                receipt[@"mediaType"] = @(asset.mediaType);
                receipt[@"mediaSubtypes"] = @(asset.mediaSubtypes);
                receipt[@"livePhoto"] = @((asset.mediaSubtypes & PHAssetMediaSubtypePhotoLive) != 0);
                NSMutableArray *resources = [NSMutableArray array];
                for (PHAssetResource *resource in [PHAssetResource assetResourcesForAsset:asset]) {
                    [resources addObject:@{@"type": @(resource.type), @"uniformTypeIdentifier": resource.uniformTypeIdentifier}];
                }
                receipt[@"resources"] = resources;
            }
        }
        CaptureReceipt(identifier, receipt);
        FinishCaptureProbe();
    };
    if (pairedVideo) {
        [PhotosLibrarySaver saveLivePhotoAtURL:staged
                                  photoFilename:originalFilename
                                    creationDate:creationDate
                                  pairedVideoURL:pairedVideo
                               pairedVideoFilename:pairedFilename
                                        completion:completion];
    } else {
        [PhotosLibrarySaver saveResourceAtURL:staged
                             originalFilename:originalFilename
                                 creationDate:creationDate
                                 resourceType:video ? PHAssetResourceTypeVideo : PHAssetResourceTypePhoto
                                   completion:completion];
    }
}

static PhotosLivePhotoPairStore *PairStore(void) {
    static PhotosLivePhotoPairStore *store;
    static dispatch_once_t once;
    dispatch_once(&once, ^{
        store = [[PhotosLivePhotoPairStore alloc] initWithCompletion:^(PhotosLivePhotoPair *pair, NSError *error) {
            NSString *identifier = NSUUID.UUID.UUIDString;
            NSMutableDictionary *receipt = [@{@"kind": @"live-photo-pair", @"validated": @(pair != nil)} mutableCopy];
            if (!pair) {
                receipt[@"error"] = error.localizedDescription ?: @"Live Photo validation failed.";
                receipt[@"stillPersistenceUUID"] = error.userInfo[@"stillPersistenceUUID"] ?: @"";
                CaptureReceipt(identifier, receipt);
                FinishCaptureProbe();
                return;
            }
            receipt[@"stillPersistenceUUID"] = pair.stillPersistenceUUID;
            SaveStagedResource(pair.photoURL, pair.photoOriginalFilename, pair.creationDate, NO, identifier, receipt, pair.videoURL, pair.videoOriginalFilename);
        }];
    });
    return store;
}

static void SaveClientResponse(id response, NSError *captureError, BOOL video) {
    NSString *identifier = NSUUID.UUID.UUIDString;
    NSMutableDictionary *receipt = [@{@"timestamp": [NSISO8601DateFormatter.new stringFromDate:NSDate.date], @"responseClass": response ? NSStringFromClass([response class]) : @"nil", @"video": @(video)} mutableCopy];
    if (captureError) {
        receipt[@"captureError"] = captureError.localizedDescription;
        receipt[@"errorDetails"] = CaptureErrorDetails(captureError, 0);
        CaptureReceipt(identifier, receipt);
        FinishCaptureProbe();
        return;
    }
    NSURL *source = CaptureValue(response, @"persistenceURL");
    NSNumber *expectsPair = CaptureValue(response, @"isExpectingPairedVideo");
    receipt[@"expectsPairedVideo"] = expectsPair ?: @NO;
    id persistenceUUID = CaptureValue(response, @"persistenceUUID");
    id stillPersistenceUUID = CaptureValue(response, @"stillPersistenceUUID");
    if ([persistenceUUID isKindOfClass:NSUUID.class] || [persistenceUUID isKindOfClass:NSString.class]) {
        receipt[@"persistenceUUID"] = [persistenceUUID description];
    }
    if ([stillPersistenceUUID isKindOfClass:NSUUID.class] || [stillPersistenceUUID isKindOfClass:NSString.class]) {
        receipt[@"stillPersistenceUUID"] = [stillPersistenceUUID description];
    }
    if (![source isKindOfClass:NSURL.class] || !source.isFileURL) {
        receipt[@"error"] = @"The native response has no local persistence URL.";
        CaptureReceipt(identifier, receipt);
        return;
    }
    receipt[@"sourceURL"] = source.path;
    NSString *extension = source.pathExtension.length ? source.pathExtension : (video ? @"mov" : @"heic");
    NSURL *staged = [NSURL fileURLWithPath:[NSTemporaryDirectory() stringByAppendingPathComponent:[NSString stringWithFormat:@"CameraLab-%@.%@", identifier, extension]]];
    NSDate *creationDate = CaptureValue(response, @"creationDate");
    [PhotosResourceStager stageResourceAtURL:source toURL:staged completion:^(NSError *copyError, PhotosResourceStagingMethod method) {
        receipt[@"stagingMethod"] = PhotosStagingMethodName(method);
        if (copyError) {
            receipt[@"copyError"] = copyError.localizedDescription;
            CaptureReceipt(identifier, receipt);
            FinishCaptureProbe();
            return;
        }
        if (expectsPair.boolValue || stillPersistenceUUID) {
            receipt[@"stagedURL"] = staged.path;
            receipt[@"pairValidationPending"] = @YES;
            CaptureReceipt(identifier, receipt);
            id key = video ? stillPersistenceUUID : persistenceUUID;
            NSString *uuid = [key isKindOfClass:NSUUID.class] ? [key UUIDString] : ([key isKindOfClass:NSString.class] ? key : @"");
            if (video) {
                [PairStore() addVideoAtURL:staged originalFilename:source.lastPathComponent stillPersistenceUUID:uuid error:nil];
            } else {
                [PairStore() addPhotoAtURL:staged originalFilename:source.lastPathComponent stillPersistenceUUID:uuid creationDate:[creationDate isKindOfClass:NSDate.class] ? creationDate : nil error:nil];
            }
            return;
        }
        SaveStagedResource(staged, source.lastPathComponent, creationDate, video, identifier, receipt, nil, nil);
    }];
}

#if DEBUG && TARGET_OS_SIMULATOR
static void ImportPhotosFixture(void) {
    static BOOL attempted;
    if (attempted || ![NSProcessInfo.processInfo.arguments containsObject:@"--photos-fixture"]) { return; }
    attempted = YES;
    NSString *identifier = NSUUID.UUID.UUIDString;
    NSURL *documents = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
    NSURL *source = [documents URLByAppendingPathComponent:@"native-photos-fixture.png"];
    NSURL *staged = [NSURL fileURLWithPath:[NSTemporaryDirectory() stringByAppendingPathComponent:[NSString stringWithFormat:@"CameraLab-%@.png", identifier]]];
    NSMutableDictionary *receipt = [@{@"kind": @"simulator-photos-fixture", @"cameraCapture": @NO, @"sourceURL": source.path} mutableCopy];
    [PhotosResourceStager stageResourceAtURL:source toURL:staged completion:^(NSError *error, PhotosResourceStagingMethod method) {
        receipt[@"stagingMethod"] = PhotosStagingMethodName(method);
        if (error) {
            receipt[@"copyError"] = error.localizedDescription;
            CaptureReceipt(identifier, receipt);
            return;
        }
        SaveStagedResource(staged, source.lastPathComponent, NSDate.date, NO, identifier, receipt, nil, nil);
    }];
}

static void ImportInvalidLivePairFixture(void) {
    static BOOL attempted;
    if (attempted || ![NSProcessInfo.processInfo.arguments containsObject:@"--invalid-live-fixture"]) { return; }
    attempted = YES;
    NSString *uuid = NSUUID.UUID.UUIDString;
    NSURL *documents = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
    NSURL *source = [documents URLByAppendingPathComponent:@"native-photos-fixture.png"];
    NSURL *photo = [NSURL fileURLWithPath:[NSTemporaryDirectory() stringByAppendingPathComponent:[uuid stringByAppendingString:@".png"]]];
    NSURL *movie = [NSURL fileURLWithPath:[NSTemporaryDirectory() stringByAppendingPathComponent:[uuid stringByAppendingString:@".mov"]]];
    [PhotosResourceStager stageResourceAtURL:source toURL:photo completion:^(NSError *photoError, PhotosResourceStagingMethod photoMethod) {
        [PhotosResourceStager stageResourceAtURL:source toURL:movie completion:^(NSError *movieError, PhotosResourceStagingMethod movieMethod) {
            PhotosLivePhotoPairStore *store = [[PhotosLivePhotoPairStore alloc] initWithCompletion:^(PhotosLivePhotoPair *pair, NSError *error) {
                CaptureReceipt(@"invalid-live-fixture", @{@"kind": @"simulator-invalid-live-pair", @"cameraCapture": @NO, @"validated": @(pair != nil), @"error": error.localizedDescription ?: NSNull.null, @"photoStaging": PhotosStagingMethodName(photoMethod), @"movieStaging": PhotosStagingMethodName(movieMethod)});
            }];
            [store addVideoAtURL:movie originalFilename:@"invalid-live-movie.mov" stillPersistenceUUID:uuid error:movieError];
            [store addPhotoAtURL:photo originalFilename:@"invalid-live-photo.png" stillPersistenceUUID:uuid creationDate:NSDate.date error:photoError];
        }];
    }];
}

#endif

@implementation NativeCaptureBridge

+ (void)runConfigurationProbe {
    #if DEBUG
    NSArray *targets = @[
        @{@"object": AVCaptureSession.new, @"selector": @"setVisualIntelligenceCameraEnabled:"},
        @{@"object": AVCapturePhotoOutput.new, @"selector": @"setPreservesLivePhotoCaptureSuspendedOnSessionStop:"}
    ];
    for (NSDictionary *target in targets) {
        id object = target[@"object"];
        SEL selector = NSSelectorFromString(target[@"selector"]);
        NSMethodSignature *signature = [object methodSignatureForSelector:selector];
        NSMutableDictionary *receipt = [@{@"kind": @"unconfigured-object-probe", @"class": NSStringFromClass([object class]), @"selector": NSStringFromSelector(selector)} mutableCopy];
        if (signature.numberOfArguments != 3 || signature.methodReturnType[0] != 'v' || [signature getArgumentTypeAtIndex:2][0] != 'B') {
            receipt[@"result"] = @"unavailable or incompatible ABI";
        } else {
            NSInvocation *call = [NSInvocation invocationWithMethodSignature:signature];
            call.target = object;
            call.selector = selector;
            BOOL enabled = YES;
            [call setArgument:&enabled atIndex:2];
            @try {
                [call invoke];
                receipt[@"result"] = @"accepted on an unconfigured object";
            } @catch (NSException *exception) {
                receipt[@"exception"] = exception.name;
                receipt[@"reason"] = exception.reason ?: @"";
            }
        }
        CaptureReceipt([NSString stringWithFormat:@"configuration-probe-%@", NSStringFromClass([object class])], receipt);
    }
    #endif
}

+ (void)installConfigurationDiagnostics {
    #if DEBUG
    NSArray *targets = @[
        @{@"class": @"AVCaptureSession", @"selector": @"setVisualIntelligenceCameraEnabled:"},
        @{@"class": @"AVCapturePhotoOutput", @"selector": @"setPreservesLivePhotoCaptureSuspendedOnSessionStop:"}
    ];
    for (NSDictionary *target in targets) {
        Class cls = NSClassFromString(target[@"class"]);
        SEL selector = NSSelectorFromString(target[@"selector"]);
        Method method = class_getInstanceMethod(cls, selector);
        NSMethodSignature *signature = [cls instanceMethodSignatureForSelector:selector];
        if (!method || signature.numberOfArguments != 3 || signature.methodReturnType[0] != 'v' || [signature getArgumentTypeAtIndex:2][0] != 'B') { continue; }
        IMP original = method_getImplementation(method);
        IMP observer = imp_implementationWithBlock(^(id receiver, BOOL enabled) {
            @try {
                ((void (*)(id, SEL, BOOL))original)(receiver, selector, enabled);
            } @catch (NSException *exception) {
                CaptureReceipt(@"configuration-exception", @{@"class": NSStringFromClass(cls), @"selector": NSStringFromSelector(selector), @"enabled": @(enabled), @"exception": exception.name, @"reason": exception.reason ?: @"", @"stack": exception.callStackSymbols});
                @throw;
            }
        });
        method_setImplementation(method, observer);
    }
    for (NSString *name in @[UIApplicationWillResignActiveNotification, UIApplicationDidEnterBackgroundNotification, AVCaptureSessionRuntimeErrorNotification, AVCaptureSessionWasInterruptedNotification, AVCaptureSessionInterruptionEndedNotification]) {
        [NSNotificationCenter.defaultCenter addObserverForName:name object:nil queue:nil usingBlock:^(NSNotification *notification) {
            NSMutableDictionary *receipt = [@{@"kind": @"session-lifecycle", @"timestamp": [NSISO8601DateFormatter.new stringFromDate:NSDate.date], @"event": notification.name} mutableCopy];
            NSError *error = notification.userInfo[AVCaptureSessionErrorKey];
            if (error) { receipt[@"errorDetails"] = CaptureErrorDetails(error, 0); }
            if (notification.userInfo[AVCaptureSessionInterruptionReasonKey]) { receipt[@"interruptionReason"] = notification.userInfo[AVCaptureSessionInterruptionReasonKey]; }
            CaptureReceipt(NSUUID.UUID.UUIDString, receipt);
        }];
    }
    #endif
}

+ (BOOL)installLivePhotoMetadataAdapter {
    Method setter = class_getInstanceMethod(AVCapturePhotoSettings.class, @selector(setLivePhotoMovieMetadata:));
    if (!setter || method_getNumberOfArguments(setter) != 3) { return NO; }
    IMP original = method_getImplementation(setter);
    IMP adapter = imp_implementationWithBlock(^(id settings, NSArray<AVMetadataItem *> *items) {
        NSMutableArray *accepted = [NSMutableArray array];
        for (AVMetadataItem *item in items) {
            BOOL generatedIdentifier = [item.keySpace isEqualToString:AVMetadataKeySpaceQuickTimeMetadata] && [item.key isEqual:AVMetadataQuickTimeMetadataKeyContentIdentifier];
            if (!generatedIdentifier) { [accepted addObject:item]; }
        }
        ((void (*)(id, SEL, id))original)(settings, @selector(setLivePhotoMovieMetadata:), accepted);
    });
    method_setImplementation(setter, adapter);
    return YES;
}

+ (BOOL)installClientPersistence {
    Class cls = NSClassFromString(@"CAMViewfinderViewController");
    NSArray *selectors = @[@"stillImageRequestDidCompleteStillImageLocalPersistence:withResponse:error:", @"videoRequestDidCompleteLocalPersistence:withResponse:error:", @"panoramaRequestDidCompleteLocalPersistence:withResponse:error:", @"stillImageRequestDidCompleteVideoCapture:withResponse:error:"];
    for (NSString *name in selectors) {
        SEL selector = NSSelectorFromString(name);
        Method method = class_getInstanceMethod(cls, selector);
        NSMethodSignature *signature = [cls instanceMethodSignatureForSelector:selector];
        if (!method || signature.numberOfArguments != 5 || signature.methodReturnType[0] != 'v') { return NO; }
        for (NSUInteger index = 2; index < 5; index++) {
            if ([signature getArgumentTypeAtIndex:index][0] != '@') { return NO; }
        }
    }
    for (NSString *name in selectors) {
        SEL selector = NSSelectorFromString(name);
        Method method = class_getInstanceMethod(cls, selector);
        IMP original = method_getImplementation(method);
        BOOL captureStage = [name isEqualToString:@"stillImageRequestDidCompleteVideoCapture:withResponse:error:"];
        BOOL video = [name hasPrefix:@"video"] || captureStage;
        IMP observer = imp_implementationWithBlock(^(id viewfinder, id request, id response, NSError *error) {
            RecordCaptureResponse(name, request, response, error);
            BOOL completedLiveMovie = captureStage && [response isKindOfClass:NSClassFromString(@"CAMVideoCaptureResponse")];
            if (!captureStage || completedLiveMovie || [response isKindOfClass:NSClassFromString(@"CAMPersistenceResponse")]) {
                SaveClientResponse(response, error, video);
            }
            ((void (*)(id, SEL, id, id, id))original)(viewfinder, selector, request, response, error);
        });
        method_setImplementation(method, observer);
    }
    [NSNotificationCenter.defaultCenter addObserverForName:UIApplicationDidBecomeActiveNotification object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *notification) {
        #if DEBUG && TARGET_OS_SIMULATOR
        ImportPhotosFixture();
        ImportInvalidLivePairFixture();
        #endif
        for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
            if (![scene isKindOfClass:UIWindowScene.class]) { continue; }
            for (UIWindow *window in ((UIWindowScene *)scene).windows) {
                UIViewController *root = window.rootViewController;
                if ([NSStringFromClass(root.class) isEqualToString:@"CAMViewfinderViewController"]) {
                    [self configureViewfinder:root];
                }
            }
        }
    }];
    if ([NSProcessInfo.processInfo.arguments containsObject:@"--capture-probe"]) {
        [NSNotificationCenter.defaultCenter addObserverForName:AVCaptureSessionDidStartRunningNotification object:nil queue:nil usingBlock:^(NSNotification *notification) {
            dispatch_async(dispatch_get_main_queue(), ^{
                probeSessionRunning = YES;
                TryCaptureProbe();
            });
        }];
    }
    return YES;
}

+ (BOOL)configureViewfinder:(UIViewController *)viewfinder {
    SEL selector = NSSelectorFromString(@"setPersistenceBehavior:");
    NSMethodSignature *signature = [viewfinder methodSignatureForSelector:selector];
    if (signature.numberOfArguments != 3 || signature.methodReturnType[0] != 'v' || !strchr("qQ", [signature getArgumentTypeAtIndex:2][0])) { return NO; }
    NSUInteger behavior = 2;
    NSInvocation *call = [NSInvocation invocationWithMethodSignature:signature];
    call.target = viewfinder;
    call.selector = selector;
    [call setArgument:&behavior atIndex:2];
    [call invoke];
    NSLog(@"CAMERA_CLIENT_PERSISTENCE_BEHAVIOR=%@", CaptureValue(viewfinder, @"persistenceBehavior"));
    if ([NSProcessInfo.processInfo.arguments containsObject:@"--capture-probe"]) {
        probeViewfinder = viewfinder;
        UIApplication.sharedApplication.idleTimerDisabled = !probeAttempted;
        dispatch_async(dispatch_get_main_queue(), ^{ TryCaptureProbe(); });
    }
    return YES;
}
@end
