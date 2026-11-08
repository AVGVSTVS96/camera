import AVFoundation
import AVKit
import SwiftUI
import UIKit

@Observable
final class OuterDisplay {
    static let shared = OuterDisplay()
    var isConnected = false
}

struct CaptureAccessoryRegistrar: UIViewControllerRepresentable {
    let model: CameraModel

    func makeUIViewController(context: Context) -> Controller {
        Controller(model: model)
    }

    func updateUIViewController(_ controller: Controller, context: Context) {}

    final class Controller: UIViewController {
        let model: CameraModel
        private var registration: UISceneAccessoryRegistration?

        init(model: CameraModel) {
            self.model = model
            super.init(nibName: nil, bundle: nil)
        }

        required init?(coder: NSCoder) { nil }

        override func viewDidAppear(_ animated: Bool) {
            super.viewDidAppear(animated)
            guard registration == nil else { return }
            let configuration = UISceneConfiguration(name: "Outer Display", sessionRole: .windowCameraCaptureAccessory)
            configuration.delegateClass = OuterDisplaySceneDelegate.self
            registration = registerSceneAccessory(.cameraCapture(sceneConfiguration: configuration, userInfo: model))
        }

        override func viewDidDisappear(_ animated: Bool) {
            super.viewDidDisappear(animated)
            if let registration { unregisterSceneAccessory(registration) }
            registration = nil
        }
    }
}

final class OuterDisplaySceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let scene = scene as? UIWindowScene else { return }
        let model = options.sceneAccessoryUserInfo as? CameraModel ?? .shared
        let window = UIWindow(windowScene: scene)
        window.rootViewController = UIHostingController(rootView: OuterDisplayView(model: model))
        window.makeKeyAndVisible()
        self.window = window
        OuterDisplay.shared.isConnected = true
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        OuterDisplay.shared.isConnected = false
        window = nil
    }
}

struct OuterDisplayView: View {
    let model: CameraModel
    @State private var selfie = false

    var body: some View {
        ZStack {
            preview
            if selfie {
                selfieControls
            } else {
                switch model.settings.outerDisplay {
                case .preview: EmptyView()
                case .kidCue: KidCue().background(.black)
                case .off: Color.black
                }
            }
        }
        .ignoresSafeArea()
        .environment(\.colorScheme, .dark)
        .animation(.smooth, value: model.settings.outerDisplay)
        .onCameraCaptureEvent { event in
            if event.phase == .ended { model.shutter() }
        }
    }

    @ViewBuilder private var preview: some View {
        if let session = model.session {
            AccessoryPreview(session: session, activeDeviceID: model.capabilities.activeDeviceID) { selfie = $0 }
        } else {
            #if DEBUG
            Image(uiImage: CameraFixture.image)
                .resizable()
                .scaledToFill()
                .scaleEffect(x: -1)
            #endif
        }
    }

    private var selfieControls: some View {
        VStack {
            TopBar(model: model).padding(.top, 30)
            Spacer()
            ZoomControl(model: model, dialOpen: .constant(false))
            ShutterButton(model: model).padding(.vertical, 24)
        }
    }
}

private struct AccessoryPreview: UIViewRepresentable {
    let session: AVCaptureSession
    let activeDeviceID: String?
    let facingViewer: (Bool) -> Void

    func makeUIView(context: Context) -> PreviewUIView {
        let view = PreviewUIView()
        let layer = view.previewLayer
        layer.videoGravity = .resizeAspectFill
        layer.session = session
        if layer.isDeferredStartSupported { layer.isDeferredStartEnabled = true }
        context.coordinator.directions = AVCaptureDeviceDirectionCoordinator(
            view: view, deviceTypes: DuoCameraCoordinator.deviceTypes
        ) { [coordinator = context.coordinator] map in
            coordinator.forward = Set(map.forwardFacingDeviceDescriptors.map(\.uniqueID))
            coordinator.report()
        }
        context.coordinator.facingViewer = facingViewer
        return view
    }

    func updateUIView(_ view: PreviewUIView, context: Context) {
        if let connection = view.previewLayer.connection, connection.isVideoMirroringSupported {
            connection.automaticallyAdjustsVideoMirroring = false
            connection.isVideoMirrored = true
        }
        context.coordinator.activeDeviceID = activeDeviceID
        context.coordinator.report()
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator {
        var directions: AVCaptureDeviceDirectionCoordinator?
        var forward: Set<String> = []
        var activeDeviceID: String?
        var facingViewer: (Bool) -> Void = { _ in }

        func report() {
            facingViewer(activeDeviceID.map(forward.contains) ?? false)
        }
    }
}

private struct KidCue: View {
    var body: some View {
        TimelineView(.animation) { context in
            let t = context.date.timeIntervalSinceReferenceDate
            Canvas { canvas, size in
                let center = CGPoint(x: size.width / 2, y: size.height / 2)
                for i in 0..<14 {
                    let phase = t * 0.6 + Double(i) * 0.45
                    let radius = (phase.truncatingRemainder(dividingBy: 3) / 3) * max(size.width, size.height)
                    let hue = (Double(i) / 14 + t * 0.05).truncatingRemainder(dividingBy: 1)
                    let rect = CGRect(x: center.x - radius / 2, y: center.y - radius / 2, width: radius, height: radius)
                    canvas.stroke(Circle().path(in: rect), with: .color(Color(hue: hue, saturation: 0.7, brightness: 1).opacity(1 - radius / max(size.width, size.height))), lineWidth: 18)
                }
                let bounce = abs(sin(t * 2.4)) * 30
                for dx in [-46.0, 46.0] {
                    let eye = CGRect(x: center.x + dx - 30, y: center.y - 50 - bounce, width: 60, height: 76)
                    canvas.fill(Ellipse().path(in: eye), with: .color(.white))
                    let look = CGSize(width: cos(t * 1.7) * 12, height: sin(t * 2.3) * 14)
                    let pupil = CGRect(x: eye.midX - 15 + look.width, y: eye.midY - 15 + look.height, width: 30, height: 30)
                    canvas.fill(Circle().path(in: pupil), with: .color(.black))
                }
            }
        }
        .accessibilityLabel("Kid Cue animation")
    }
}
