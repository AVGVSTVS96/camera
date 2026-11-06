#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN
@interface NativeCaptureBridge : NSObject
+ (void)installConfigurationDiagnostics;
+ (void)runConfigurationProbe;
+ (BOOL)installLivePhotoMetadataAdapter;
+ (BOOL)installClientPersistence;
+ (BOOL)configureViewfinder:(UIViewController *)viewfinder;
@end
NS_ASSUME_NONNULL_END
