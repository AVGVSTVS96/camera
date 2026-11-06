#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN
@interface CameraUIFactory : NSObject
@property(class, nonatomic, readonly, nullable) NSString *failureMessage;
+ (nullable UIViewController *)makeController;
+ (void)recordStateForController:(UIViewController *)controller NS_SWIFT_NAME(recordState(for:));
+ (void)installApplicationDiagnostics;
+ (BOOL)useCameraAppCapabilities;
@end
NS_ASSUME_NONNULL_END
