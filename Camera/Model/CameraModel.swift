import AVFoundation
import Observation
import SwiftUI

@Observable
final class CameraModel {
    static let shared = CameraModel()

    let session: AVCaptureSession?

    private(set) var capabilities = CameraCapabilities.none
    private(set) var settings = CameraSettings()
    private(set) var phase = CapturePhase.starting
    private(set) var zoom: CGFloat = 1
    private(set) var exposureBias: Float = 0
    private(set) var thumbnail: UIImage?
    private(set) var glyphRotation = Angle.zero
    private(set) var isMirrored = false
    var error: CameraError?

    init(session: AVCaptureSession? = AVCaptureSession()) {
        self.session = session
    }

    func start() async {}
    func stop() async {}

    func update(_ change: (inout CameraSettings) -> Void) {
        change(&settings)
    }

    func shutter() {}
    func flip() {}
    func setZoom(_ factor: CGFloat, animated: Bool) { zoom = factor }
    func focus(at devicePoint: CGPoint, lock: Bool) {}
    func setExposureBias(_ ev: Float) { exposureBias = ev }
    func directionsChanged(forwardFacing: [AVCaptureDevice]) {}
    func rotationChanged(preview: CGFloat, capture: CGFloat) {}
    func refreshThumbnail() async {}

    #if DEBUG
    static func simulated(capabilities: CameraCapabilities, frame: UIImage?) -> CameraModel {
        let model = CameraModel(session: nil)
        model.capabilities = capabilities
        model.thumbnail = frame
        model.phase = .ready
        return model
    }
    #endif
}
