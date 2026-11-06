import UIKit
import Darwin

@main
enum CameraLauncher {
    @MainActor
    static func main() {
        #if DEBUG
        if CommandLine.arguments.contains("--reset-prototype-scene") {
            let files = FileManager.default
            let library = files.urls(for: .libraryDirectory, in: .userDomainMask)[0]
            let state = library.appendingPathComponent("Saved Application State/\(Bundle.main.bundleIdentifier!).savedState")
            if files.fileExists(atPath: state.path) {
                let documents = files.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let backup = documents.appendingPathComponent("prototype-scene-backup-\(UUID().uuidString)")
                do {
                    try files.moveItem(at: state, to: backup)
                    print("CAMERA_PROTOTYPE_SCENE_BACKUP=\(backup.path)")
                } catch {
                    fputs("CAMERA_PROTOTYPE_SCENE_RESET_FAILED=\(error)\n", stderr)
                    exit(1)
                }
            }
        }
        if CommandLine.arguments.contains("--runtime-probe") {
            CameraRuntimeProbe.run()
            if CommandLine.arguments.contains("--configuration-probe") {
                NativeCaptureBridge.runConfigurationProbe()
            }
            exit(0)
        }
        #endif
        let path = "/System/Library/PrivateFrameworks/CameraUI.framework/CameraUI"
        guard let handle = dlopen(path, RTLD_NOW),
              let entry = dlsym(handle, "CAMApplicationMain") else {
            fputs("CAMERA_APPLICATION_ENTRY_UNAVAILABLE\n", stderr)
            exit(1)
        }
        typealias CameraMain = @convention(c) (Int32, UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>) -> Int32
        let cameraMain = unsafeBitCast(entry, to: CameraMain.self)
        guard NativeCaptureBridge.installLivePhotoMetadataAdapter(),
              CameraUIFactory.useCameraAppCapabilities(),
              NativeCaptureBridge.installClientPersistence() else {
            fputs("CAMERA_NATIVE_CONFIGURATION_UNAVAILABLE\n", stderr)
            exit(1)
        }
        #if DEBUG
        NativeCaptureBridge.installConfigurationDiagnostics()
        CameraUIFactory.installApplicationDiagnostics()
        #endif
        exit(cameraMain(CommandLine.argc, CommandLine.unsafeArgv))
    }
}
