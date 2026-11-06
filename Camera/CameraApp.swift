import PhotosBrowser
import SwiftUI

@main
struct CameraApp: App {
    var body: some Scene {
        WindowGroup {
            #if DEBUG
            if CommandLine.arguments.contains("--photos-browser") {
                PhotosBrowserHarness()
            } else {
                Text("Camera")
            }
            #else
            Text("Camera")
            #endif
        }
    }
}

#if DEBUG
private struct PhotosBrowserHarness: View {
    @State private var isPresented = true

    var body: some View {
        Button("Photos") { isPresented = true }
            .fullScreenCover(isPresented: $isPresented) { PhotosBrowser { isPresented = false } }
    }
}
#endif
