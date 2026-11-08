import AVFoundation
import AVKit
import UIKit

final class DuoCameraCoordinator {
    static let deviceTypes: [AVCaptureDevice.DeviceType] = [
        .builtInWideAngleCamera, .builtInUltraWideCamera, .builtInDualWideCamera,
        .builtInInnerUltraWideCamera, .builtInOuterUltraWideCamera,
    ]

    private let model: CameraModel
    private var directions: AVCaptureDeviceDirectionCoordinator?
    private var rotation: AVCaptureDevice.RotationCoordinator?
    private var observations: [NSKeyValueObservation] = []
    private var deviceID: String?
    private weak var previewLayer: AVCaptureVideoPreviewLayer?

    init(view: UIView, model: CameraModel) {
        self.model = model
        directions = AVCaptureDeviceDirectionCoordinator(view: view, deviceTypes: Self.deviceTypes) { [weak model] map in
            let devices = map.forwardFacingDeviceDescriptors.compactMap { AVCaptureDevice(uniqueID: $0.uniqueID) }
            model?.directionsChanged(forwardFacing: devices)
        }
    }

    func observeRotation(deviceID: String?, previewLayer: AVCaptureVideoPreviewLayer) {
        guard deviceID != self.deviceID else { return }
        self.deviceID = deviceID
        observations = []
        rotation = nil
        guard let deviceID, let device = AVCaptureDevice(uniqueID: deviceID) else { return }
        let coordinator = AVCaptureDevice.RotationCoordinator(device: device, previewLayer: previewLayer)
        rotation = coordinator
        self.previewLayer = previewLayer
        let changed: @Sendable (AVCaptureDevice.RotationCoordinator, NSKeyValueObservedChange<CGFloat>) -> Void = { [weak self] _, _ in
            Task { @MainActor in self?.applyRotation() }
        }
        observations = [
            coordinator.observe(\.videoRotationAngleForHorizonLevelPreview, options: [.initial, .new], changeHandler: changed),
            coordinator.observe(\.videoRotationAngleForHorizonLevelCapture, options: [.new], changeHandler: changed),
        ]
    }

    private func applyRotation() {
        guard let rotation else { return }
        let preview = rotation.videoRotationAngleForHorizonLevelPreview
        if let connection = previewLayer?.connection, connection.isVideoRotationAngleSupported(preview) {
            connection.videoRotationAngle = preview
        }
        model.rotationChanged(preview: preview, capture: rotation.videoRotationAngleForHorizonLevelCapture)
    }
}
