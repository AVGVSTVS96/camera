import PhotosBrowser
import SwiftUI

@main
struct CameraApp: App {
    init() {
        #if DEBUG
        if CommandLine.arguments.contains("--recover-live-pairs") {
            Task {
                await LiveRecovery.run()
                exit(0)
            }
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            Text("Camera")
        }
    }
}
