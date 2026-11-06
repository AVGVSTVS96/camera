#import "CameraUIFactory.h"
#import "NativeCaptureBridge.h"
#import <dlfcn.h>
#import <objc/runtime.h>
#import <AVFoundation/AVFoundation.h>
#import <Photos/Photos.h>
#import <unistd.h>
#import <errno.h>

@protocol CameraNativeInitializer
- (instancetype)initWithOverrides:(nullable NSDictionary *)overrides usingEmulationMode:(NSInteger)mode;
@end

@implementation CameraUIFactory
static NSString *failure;
static void *frameworkHandle;
static id ReadCameraGetter(id target, NSString *name);

+ (NSString *)failureMessage { return failure; }

static void WriteCameraReport(NSDictionary *report, NSString *name) {
    NSError *error;
    NSData *data = [NSJSONSerialization dataWithJSONObject:report options:NSJSONWritingPrettyPrinted | NSJSONWritingSortedKeys error:&error];
    if (!data) { NSLog(@"CAMERA_REPORT_ERROR=%@", error); return; }
    NSURL *directory = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
    [data writeToURL:[directory URLByAppendingPathComponent:name] atomically:YES];
    NSLog(@"CAMERA_REPORT_%@=%@", name, [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
}

static void RecordCameraPermissions(NSString *phase) {
    WriteCameraReport(@{@"phase": phase,
        @"camera": @([AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeVideo]),
        @"microphone": @([AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio]),
        @"photosReadWrite": @([PHPhotoLibrary authorizationStatusForAccessLevel:PHAccessLevelReadWrite]),
        @"photosAddOnly": @([PHPhotoLibrary authorizationStatusForAccessLevel:PHAccessLevelAddOnly])},
        [NSString stringWithFormat:@"camera-permissions-%@.json", phase]);
}

static void RequestCameraPermissions(void) {
    [AVCaptureDevice requestAccessForMediaType:AVMediaTypeVideo completionHandler:^(BOOL cameraGranted) {
        [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL microphoneGranted) {
            [PHPhotoLibrary requestAuthorizationForAccessLevel:PHAccessLevelReadWrite handler:^(PHAuthorizationStatus status) {
                dispatch_async(dispatch_get_main_queue(), ^{ RecordCameraPermissions(@"after-request"); });
            }];
        }];
    }];
}

+ (void)installApplicationDiagnostics {
    RecordCameraPermissions(@"before-startup");
    NSArray *paths = @[@"/private/var/containers/Bundle/Application/7E85CE5F-B50D-4A05-9C92-8954FE6C9533/Camera.app", @"/Applications/Camera.app", @"/System/Applications/Camera.app", @"/System/Library/PrivateFrameworks/CameraUI.framework"];
    NSMutableArray *bundles = [NSMutableArray array];
    for (NSString *path in paths) {
        NSError *error;
        NSData *data = [NSData dataWithContentsOfFile:[path stringByAppendingPathComponent:@"Info.plist"] options:0 error:&error];
        NSMutableDictionary *entry = [@{@"path": path} mutableCopy];
        if (data) {
            NSDictionary *info = [NSPropertyListSerialization propertyListWithData:data options:NSPropertyListImmutable format:NULL error:&error];
            for (NSString *key in @[@"CFBundleIdentifier", @"CFBundleVersion", @"CFBundleExecutable", @"NSPrincipalClass", @"UIApplicationSceneManifest"]) {
                if (info[key]) { entry[key] = info[key]; }
            }
        }
        if (error) { entry[@"error"] = error.localizedDescription; entry[@"errorCode"] = @(error.code); }
        [bundles addObject:entry];
    }
    NSMutableDictionary *classes = [NSMutableDictionary dictionary];
    for (NSString *name in @[@"CAMApplication", @"CAMApplicationDelegate", @"CAMWindowSceneDelegate", @"_TtC8CameraUI19WindowSceneDelegate"]) {
        Class cls = NSClassFromString(name);
        classes[name] = cls ? NSStringFromClass(cls) : NSNull.null;
    }
    WriteCameraReport(@{@"bundles": bundles, @"classes": classes}, @"camera-startup-bundles.json");
    for (NSString *name in @[UIApplicationDidFinishLaunchingNotification, UIApplicationDidBecomeActiveNotification, UIApplicationWillResignActiveNotification]) {
        [NSNotificationCenter.defaultCenter addObserverForName:name object:nil queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *notification) {
            UIApplication *application = notification.object;
            if (![application isKindOfClass:UIApplication.class]) { return; }
            NSMutableArray *scenes = [NSMutableArray array];
            for (UIScene *scene in application.connectedScenes) {
                NSMutableDictionary *entry = [@{@"class": NSStringFromClass(scene.class), @"delegate": scene.delegate ? NSStringFromClass([scene.delegate class]) : NSNull.null, @"configuration": scene.session.configuration.name ?: @"", @"role": scene.session.role} mutableCopy];
                if ([scene isKindOfClass:UIWindowScene.class]) {
                    NSMutableArray *roots = [NSMutableArray array];
                    for (UIWindow *window in ((UIWindowScene *)scene).windows) {
                        if (window.rootViewController) { [roots addObject:NSStringFromClass(window.rootViewController.class)]; }
                    }
                    entry[@"rootControllers"] = roots;
                }
                [scenes addObject:entry];
            }
            WriteCameraReport(@{@"event": notification.name, @"applicationClass": NSStringFromClass(application.class), @"applicationDelegate": application.delegate ? NSStringFromClass([application.delegate class]) : NSNull.null, @"scenes": scenes}, [notification.name stringByAppendingString:@".json"]);
            if ([notification.name isEqualToString:UIApplicationWillResignActiveNotification]) {
                for (UIScene *scene in application.connectedScenes) {
                    if (![scene isKindOfClass:UIWindowScene.class]) { continue; }
                    for (UIWindow *window in ((UIWindowScene *)scene).windows) {
                        UIViewController *root = window.rootViewController;
                        if ([NSStringFromClass(root.class) isEqualToString:@"CAMViewfinderViewController"]) {
                            WriteCameraReport(@{@"captureMode": ReadCameraGetter(root, @"currentCaptureMode"), @"livePhotoMode": ReadCameraGetter(root, @"livePhotoMode")}, @"native-mode-before-background.json");
                        }
                    }
                }
            }
            if ([notification.name isEqualToString:UIApplicationDidFinishLaunchingNotification] && [NSProcessInfo.processInfo.arguments containsObject:@"--request-camera-permissions"]) {
                RequestCameraPermissions();
            }
            if ([notification.name isEqualToString:UIApplicationDidBecomeActiveNotification]) {
                for (UIScene *scene in application.connectedScenes) {
                    if (![scene isKindOfClass:UIWindowScene.class]) { continue; }
                    for (UIWindow *window in ((UIWindowScene *)scene).windows) {
                        UIViewController *root = window.rootViewController;
                        if ([NSStringFromClass(root.class) isEqualToString:@"CAMViewfinderViewController"]) {
                            if ([NSProcessInfo.processInfo.arguments containsObject:@"--camera-client-save"]) {
                                [NativeCaptureBridge configureViewfinder:root];
                            }
                            [self recordStateForController:root];
                        }
                    }
                }
            }
        }];
    }
}

static id ReadCameraGetter(id target, NSString *name) {
    SEL selector = NSSelectorFromString(name);
    NSMethodSignature *signature = [target methodSignatureForSelector:selector];
    if (!signature || signature.numberOfArguments != 2) { return @"unavailable"; }
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    invocation.target = target;
    invocation.selector = selector;
    @try {
        [invocation invoke];
        switch (signature.methodReturnType[0]) {
            case 'B': { BOOL value; [invocation getReturnValue:&value]; return @(value); }
            case 'q': { long long value; [invocation getReturnValue:&value]; return @(value); }
            case 'Q': { unsigned long long value; [invocation getReturnValue:&value]; return @(value); }
            case '@': {
                __unsafe_unretained id value;
                [invocation getReturnValue:&value];
                if (!value) { return NSNull.null; }
                if ([value isKindOfClass:NSArray.class] && [name hasSuffix:@"CaptureModes"]) { return value; }
                if ([value isKindOfClass:NSSet.class] && [name hasSuffix:@"CaptureModes"]) { return [[value allObjects] sortedArrayUsingSelector:@selector(compare:)]; }
                return NSStringFromClass([value class]);
            }
            default: return @"unhandled return type";
        }
    } @catch (NSException *exception) { return exception.name; }
}

static id CameraObjectForGetter(id target, NSString *name) {
    SEL selector = NSSelectorFromString(name);
    NSMethodSignature *signature = [target methodSignatureForSelector:selector];
    if (!signature || signature.numberOfArguments != 2 || signature.methodReturnType[0] != '@') { return nil; }
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    invocation.target = target;
    invocation.selector = selector;
    [invocation invoke];
    __unsafe_unretained id value = nil;
    [invocation getReturnValue:&value];
    return value;
}

+ (void)recordStateForController:(UIViewController *)controller {
    NSMutableDictionary *report = [NSMutableDictionary dictionary];
    report[@"timestamp"] = [NSISO8601DateFormatter.new stringFromDate:NSDate.date];
    report[@"controllerClass"] = NSStringFromClass(controller.class);
    report[@"applicationClass"] = NSStringFromClass(UIApplication.sharedApplication.class);
    report[@"classIsEmulatingImagePicker"] = ReadCameraGetter(controller.class, @"isEmulatingImagePicker");
    for (NSString *name in @[@"persistenceBehavior", @"captureDelegate", @"configurationDelegate", @"presentationDelegate", @"captureController", @"persistenceController"]) {
        report[name] = ReadCameraGetter(controller, name);
    }
    id viewfinder = [controller respondsToSelector:NSSelectorFromString(@"viewfinderViewController")] ? [controller valueForKey:@"viewfinderViewController"] : controller;
    NSMutableDictionary *state = [NSMutableDictionary dictionary];
    for (NSString *name in @[@"emulationMode", @"options", @"persistenceBehavior", @"isEmulatingImagePicker", @"availableCaptureModes", @"currentCaptureModes", @"currentCaptureMode", @"configuredCaptureMode", @"currentCaptureDevice", @"isDisablingAdditionalCaptures", @"isDisablingMultipleCaptureFeatures", @"isPreventingAdditionalCaptures", @"isCapturingPhoto", @"isRecording", @"shouldEnableCaptureMenuCommand", @"shouldEnableLivePhotoMenuCommand", @"livePhotoMode", @"photoResolution", @"chromeConfigurator"]) {
        state[name] = ReadCameraGetter(viewfinder, name);
    }
    report[@"viewfinder"] = state;
    id capabilities = CameraObjectForGetter(NSClassFromString(@"CAMCaptureCapabilities"), @"capabilities");
    if (capabilities) {
        NSMutableDictionary *features = [NSMutableDictionary dictionary];
        for (NSString *name in @[@"hostProcess", @"isLivePhotoSupported", @"isNightModeSupported", @"isBackPortraitModeSupported", @"isCinematicModeSupported", @"isIntelligenceModeSupported", @"isBackDualCameraSupported", @"isBackTripleCameraSupported", @"isCameraButtonSupported", @"isDeferredProcessingSupported", @"wantsFullscreenViewfinder", @"useMultiCamSession"]) {
            features[name] = ReadCameraGetter(capabilities, name);
        }
        report[@"capabilities"] = features;
    }
    id protection = CameraObjectForGetter(UIApplication.sharedApplication.delegate, @"protectionController");
    SEL pathSelector = NSSelectorFromString(@"_persistenceProtectionPathForType:");
    NSMethodSignature *pathSignature = [protection methodSignatureForSelector:pathSelector];
    if (pathSignature.numberOfArguments == 3 && pathSignature.methodReturnType[0] == '@' && strchr("qQ", [pathSignature getArgumentTypeAtIndex:2][0])) {
        NSMutableArray *paths = [NSMutableArray array];
        // These two numeric cases are the ones present in the cached path getter.
        for (NSInteger type = 0; type <= 1; type++) {
            NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:pathSignature];
            invocation.target = protection;
            invocation.selector = pathSelector;
            [invocation setArgument:&type atIndex:2];
            [invocation invoke];
            __unsafe_unretained id path = nil;
            [invocation getReturnValue:&path];
            if ([path isKindOfClass:NSString.class]) {
                NSString *directory = [path stringByDeletingLastPathComponent];
                BOOL writable = access(directory.fileSystemRepresentation, W_OK) == 0;
                int accessError = writable ? 0 : errno;
                [paths addObject:@{@"type": @(type), @"path": path, @"parentWritable": @(writable), @"accessErrno": @(accessError)}];
            }
        }
        report[@"persistenceProtectionPaths"] = paths;
    }
    if ([viewfinder respondsToSelector:NSSelectorFromString(@"_cameraRollController")]) {
        id cameraRoll = [viewfinder valueForKey:@"_cameraRollController"];
        report[@"cameraRollController"] = ReadCameraGetter(viewfinder, @"_cameraRollController");
        report[@"cameraRollCanPresent"] = ReadCameraGetter(cameraRoll, @"canPresentCameraRollViewController");
    }
    NSError *error;
    NSData *data = [NSJSONSerialization dataWithJSONObject:report options:NSJSONWritingPrettyPrinted | NSJSONWritingSortedKeys error:&error];
    if (data) {
        NSURL *url = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
        [data writeToURL:[url URLByAppendingPathComponent:@"native-camera-state.json"] atomically:YES];
        NSLog(@"CAMERA_NATIVE_STATE=%@", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
    } else { NSLog(@"CAMERA_NATIVE_STATE_ERROR=%@", error); }
}

+ (UIViewController *)makeController {
    failure = nil;
    if (!frameworkHandle) {
        frameworkHandle = dlopen("/System/Library/PrivateFrameworks/CameraUI.framework/CameraUI", RTLD_NOW);
    }
    if (!frameworkHandle) {
        const char *message = dlerror();
        failure = message ? @(message) : @"CameraUI could not be loaded.";
        return nil;
    }
    Class controllerClass = NSClassFromString(@"CAMCameraViewController");
    SEL initializer = NSSelectorFromString(@"initWithOverrides:usingEmulationMode:");
    NSMethodSignature *signature = [controllerClass instanceMethodSignatureForSelector:initializer];
    if (![controllerClass isSubclassOfClass:UIViewController.class] ||
        signature.numberOfArguments != 4 || signature.methodReturnType[0] != '@' ||
        [signature getArgumentTypeAtIndex:2][0] != '@' ||
        !strchr("BqQiIlLsScC", [signature getArgumentTypeAtIndex:3][0])) {
        failure = @"The observed CameraUI initializer is unavailable or has a different signature.";
        return nil;
    }
    @try {
        NSLog(@"CAMERA_UI_EXPERIMENT: initWithOverrides:nil usingEmulationMode:0");
        id<CameraNativeInitializer> instance = (id<CameraNativeInitializer>)[controllerClass alloc];
        UIViewController *controller = (UIViewController *)[instance initWithOverrides:nil usingEmulationMode:0];
        if (!controller) { failure = @"CameraUI initialization returned nil."; }
        return controller;
    } @catch (NSException *exception) {
        failure = [NSString stringWithFormat:@"%@: %@", exception.name, exception.reason];
        NSLog(@"CAMERA_UI_EXPERIMENT_FAILED: %@", failure);
        return nil;
    }
}

+ (BOOL)useCameraAppCapabilities {
    Class cls = NSClassFromString(@"CAMCaptureCapabilities");
    Method shared = class_getClassMethod(cls, NSSelectorFromString(@"capabilities"));
    Method camera = class_getClassMethod(cls, NSSelectorFromString(@"capabilitiesForCameraApp"));
    if (!shared || !camera || strcmp(method_getTypeEncoding(shared), method_getTypeEncoding(camera)) != 0) {
        NSLog(@"CAMERA_CAPABILITIES_EXPERIMENT_UNAVAILABLE");
        return NO;
    }
    id before = CameraObjectForGetter(cls, @"capabilities");
    NSLog(@"CAMERA_CAPABILITIES_BEFORE=%@", ReadCameraGetter(before, @"hostProcess"));
    id cameraCapabilities = CameraObjectForGetter(cls, @"capabilitiesForCameraApp");
    if (!cameraCapabilities) { return NO; }
    NSArray *intelligenceQueries = @[@"isIntelligenceModeSupported", @"isIntelligenceModeSupportedForDevice:", @"isIntelligenceModeSupportedForDevicePosition:"];
    for (NSString *name in intelligenceQueries) {
        NSMethodSignature *signature = [cls instanceMethodSignatureForSelector:NSSelectorFromString(name)];
        if (!signature || signature.methodReturnType[0] != 'B' || (signature.numberOfArguments != 2 && signature.numberOfArguments != 3)) { return NO; }
        if (signature.numberOfArguments == 3 && !strchr("qQ", [signature getArgumentTypeAtIndex:2][0])) { return NO; }
    }
    for (NSString *name in intelligenceQueries) {
        SEL selector = NSSelectorFromString(name);
        Method method = class_getInstanceMethod(cls, selector);
        IMP original = method_getImplementation(method);
        IMP supported;
        if (method_getNumberOfArguments(method) == 2) {
            supported = imp_implementationWithBlock(^BOOL(id capabilities) {
                return capabilities == cameraCapabilities ? NO : ((BOOL (*)(id, SEL))original)(capabilities, selector);
            });
        } else {
            supported = imp_implementationWithBlock(^BOOL(id capabilities, NSInteger device) {
                return capabilities == cameraCapabilities ? NO : ((BOOL (*)(id, SEL, NSInteger))original)(capabilities, selector, device);
            });
        }
        method_setImplementation(method, supported);
    }
    NSLog(@"CAMERA_INTELLIGENCE_UNAVAILABLE=private capture entitlement absent");
    // Select the framework's named Camera-app factory inside this test process.
    IMP selectedFactory = imp_implementationWithBlock(^id(id receiver) { return cameraCapabilities; });
    method_setImplementation(shared, selectedFactory);
    id after = CameraObjectForGetter(cls, @"capabilities");
    NSLog(@"CAMERA_CAPABILITIES_AFTER=%@", ReadCameraGetter(after, @"hostProcess"));
    return after != nil;
}
@end
