import PhotosBrowser
import SwiftUI

@main
struct CameraApp: App {
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
