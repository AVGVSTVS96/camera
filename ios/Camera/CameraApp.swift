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
            CameraScreen(model: Self.model)
        }
    }

    private static let model: CameraModel = {
        #if DEBUG && targetEnvironment(simulator)
        if CommandLine.arguments.contains("--simulated-camera") { return CameraFixture.model() }
        #endif
        return .shared
    }()
}
