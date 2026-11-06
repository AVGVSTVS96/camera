import AVFoundation

actor CameraEngine {
    enum Event: Sendable {
        case capabilities(CameraCapabilities)
        case zoom(CGFloat)
        case exposureBias(Float)
        case mirrored(Bool)
        case interrupted(Bool)
        case controlsFullscreen(Bool)
        case failed(String)
    }

    nonisolated let events: AsyncStream<Event>
    private nonisolated let emit: AsyncStream<Event>.Continuation
    private nonisolated let queue = DispatchSerialQueue(label: "com.bassim.camera.capture")
    nonisolated var unownedExecutor: UnownedSerialExecutor { queue.asUnownedSerialExecutor() }

    private static let deviceTypes: [AVCaptureDevice.DeviceType] = [
        .builtInTripleCamera, .builtInDualWideCamera, .builtInDualCamera, .builtInWideAngleCamera,
        .builtInTrueDepthCamera, .builtInInnerUltraWideCamera, .builtInOuterUltraWideCamera,
    ]

    private let session: AVCaptureSession
    private let photoOutput = AVCapturePhotoOutput()
    private let movieOutput = AVCaptureMovieFileOutput()
    private let controlsDelegate: ControlsDelegate
    private var input: AVCaptureDeviceInput?
    private var audioInput: AVCaptureDeviceInput?
    private var settings = CameraSettings()
    private var forwardFacingIDs: [String] = []
    private var rotation: (preview: CGFloat, capture: CGFloat) = (90, 90)
    private var photoCaptures: [Int64: PhotoCapture] = [:]
    private var movieCapture: MovieCapture?
    private var focusLocked = false
    private var observers: [any NSObjectProtocol] = []

    init(session: AVCaptureSession) {
        self.session = session
        (events, emit) = AsyncStream.makeStream()
        controlsDelegate = ControlsDelegate(emit: emit)
    }

    func start(_ settings: CameraSettings) -> Bool {
        self.settings = settings
        observe()
        session.setControlsDelegate(controlsDelegate, queue: queue)
        do {
            try configure()
        } catch {
            emit.yield(.failed(error.localizedDescription))
            return false
        }
        session.startRunning()
        return true
    }

    func stop() {
        if movieOutput.isRecording { movieOutput.stopRecording() }
        session.stopRunning()
    }

    func apply(_ settings: CameraSettings) {
        self.settings = settings
        guard !movieOutput.isRecording, input != nil else {
            if let device = input?.device { try? configureTorch(device) }
            return
        }
        do { try configure() } catch { emit.yield(.failed(error.localizedDescription)) }
    }

    func setForwardFacing(_ ids: [String]) {
        forwardFacingIDs = ids
        guard input != nil, device(for: settings) != input?.device else { return }
        apply(settings)
    }

    func setRotation(preview: CGFloat, capture: CGFloat) {
        rotation = (preview, capture)
        applyRotation()
    }


    func capturePhoto(_ settings: CameraSettings) async throws -> CapturedPhoto {
        let codec = (settings.photoFormat?.codec ?? .heif).videoCodec
        let photoSettings = photoOutput.availablePhotoCodecTypes.contains(codec)
            ? AVCapturePhotoSettings(format: [AVVideoCodecKey: codec]) : AVCapturePhotoSettings()
        photoSettings.maxPhotoDimensions = photoOutput.maxPhotoDimensions
        photoSettings.photoQualityPrioritization = .balanced
        let recording = movieOutput.isRecording
        if !recording, photoOutput.supportedFlashModes.contains(settings.flash.device) {
            photoSettings.flashMode = settings.flash.device
        }
        var movie: URL?
        if settings.livePhoto, !recording, photoOutput.isLivePhotoCaptureEnabled {
            movie = URL.temporaryDirectory.appending(path: "\(UUID().uuidString).mov")
            photoSettings.livePhotoMovieFileURL = movie
        }
        if photoOutput.isDepthDataDeliveryEnabled {
            photoSettings.isDepthDataDeliveryEnabled = true
            photoSettings.embedsDepthDataInPhoto = true
        }
        if photoOutput.isPortraitEffectsMatteDeliveryEnabled {
            photoSettings.isPortraitEffectsMatteDeliveryEnabled = true
            photoSettings.embedsPortraitEffectsMatteInPhoto = true
        }

        let id = photoSettings.uniqueID
        defer { photoCaptures[id] = nil }
        return try await withCheckedThrowingContinuation { continuation in
            let capture = PhotoCapture(livePhotoMovie: movie, continuation: continuation)
            photoCaptures[id] = capture
            photoOutput.capturePhoto(with: photoSettings, delegate: capture)
        }
    }

    func record() async throws -> URL {
        guard movieOutput.connection(with: .video) != nil, !movieOutput.isRecording else {
            throw CocoaError(.featureUnsupported)
        }
        let url = URL.temporaryDirectory.appending(path: "\(UUID().uuidString).mov")
        defer { movieCapture = nil }
        return try await withCheckedThrowingContinuation { continuation in
            let capture = MovieCapture(continuation: continuation)
            movieCapture = capture
            movieOutput.startRecording(to: url, recordingDelegate: capture)
        }
    }

    func stopRecording() {
        movieOutput.stopRecording()
    }


    func setZoom(_ displayFactor: CGFloat, animated: Bool) {
        guard let device = input?.device, (try? device.lockForConfiguration()) != nil else { return }
        defer { device.unlockForConfiguration() }
        let multiplier = device.displayVideoZoomFactorMultiplier
        let range = device.minAvailableVideoZoomFactor...device.maxAvailableVideoZoomFactor
        let factor = min(max(displayFactor / multiplier, range.lowerBound), range.upperBound)
        if animated {
            device.ramp(toVideoZoomFactor: factor, withRate: 12)
        } else {
            device.videoZoomFactor = factor
        }
        emit.yield(.zoom(factor * multiplier))
    }

    func focus(at point: CGPoint, lock: Bool) {
        guard let device = input?.device, (try? device.lockForConfiguration()) != nil else { return }
        defer { device.unlockForConfiguration() }
        if device.isFocusPointOfInterestSupported, device.isFocusModeSupported(.autoFocus) {
            device.focusPointOfInterest = point
            device.focusMode = .autoFocus
        }
        if device.isExposurePointOfInterestSupported, device.isExposureModeSupported(.autoExpose) {
            device.exposurePointOfInterest = point
            device.exposureMode = .autoExpose
        }
        device.setExposureTargetBias(0)
        device.isSubjectAreaChangeMonitoringEnabled = !lock
        focusLocked = lock
        emit.yield(.exposureBias(0))
    }

    func setExposureBias(_ bias: Float) {
        guard let device = input?.device, (try? device.lockForConfiguration()) != nil else { return }
        defer { device.unlockForConfiguration() }
        let value = min(max(bias, device.minExposureTargetBias), device.maxExposureTargetBias)
        device.setExposureTargetBias(value)
        emit.yield(.exposureBias(value))
    }

    private func resetFocus() {
        guard !focusLocked, let device = input?.device, (try? device.lockForConfiguration()) != nil else { return }
        defer { device.unlockForConfiguration() }
        let center = CGPoint(x: 0.5, y: 0.5)
        if device.isFocusPointOfInterestSupported, device.isFocusModeSupported(.continuousAutoFocus) {
            device.focusPointOfInterest = center
            device.focusMode = .continuousAutoFocus
        }
        if device.isExposurePointOfInterestSupported, device.isExposureModeSupported(.continuousAutoExposure) {
            device.exposurePointOfInterest = center
            device.exposureMode = .continuousAutoExposure
        }
        device.isSubjectAreaChangeMonitoringEnabled = false
    }


    private func devices() -> [AVCaptureDevice] {
        AVCaptureDevice.DiscoverySession(deviceTypes: Self.deviceTypes, mediaType: .video, position: .unspecified)
            .devices
            .sorted { Self.deviceTypes.firstIndex(of: $0.deviceType)! < Self.deviceTypes.firstIndex(of: $1.deviceType)! }
    }

    private func device(for settings: CameraSettings) -> AVCaptureDevice? {
        let all = devices()
        switch settings.position {
        case .front:
            return all.first { forwardFacingIDs.contains($0.uniqueID) } ?? all.first { $0.position == .front }
        case .back:
            let back = all.filter { $0.position == .back && !forwardFacingIDs.contains($0.uniqueID) }
            if settings.mode == .spatial, let device = back.first.flatMap(CameraCapabilities.spatialDevice) {
                return device
            }
            return back.first
        }
    }

    private func configure() throws {
        guard let device = device(for: settings) else { throw CocoaError(.featureUnsupported) }
        let switched = input?.device != device
        try configureSession(device)
        configureOutputs(device)
        applyRotation()
        if switched {
            installControls(device)
            focusLocked = false
            resetFocus()
            setZoom(1, animated: false)
        }
        var back = settings, front = settings
        back.position = .back
        front.position = .front
        let capabilities = CameraCapabilities(
            device: device, photoOutput: photoOutput,
            canFlip: self.device(for: back) != nil && self.device(for: front) != nil,
            canRecord: session.outputs.contains(movieOutput) || session.canAddOutput(movieOutput))
        emit.yield(.capabilities(capabilities))
        emit.yield(.zoom(device.videoZoomFactor * device.displayVideoZoomFactorMultiplier))
        emit.yield(.exposureBias(device.exposureTargetBias))
    }

    private func configureSession(_ device: AVCaptureDevice) throws {
        if movieOutput.isSpatialVideoCaptureEnabled { movieOutput.isSpatialVideoCaptureEnabled = false }
        session.beginConfiguration()
        defer { session.commitConfiguration() }

        if input?.device != device {
            let new = try AVCaptureDeviceInput(device: device)
            if let input { session.removeInput(input) }
            guard session.canAddInput(new) else {
                if let input { session.addInput(input) }
                throw CocoaError(.featureUnsupported)
            }
            session.addInput(new)
            input = new
        }
        if audioInput == nil, AVCaptureDevice.authorizationStatus(for: .audio) == .authorized,
           let microphone = AVCaptureDevice.default(for: .audio),
           let audio = try? AVCaptureDeviceInput(device: microphone), session.canAddInput(audio) {
            session.addInput(audio)
            audioInput = audio
        }
        if !session.outputs.contains(photoOutput), session.canAddOutput(photoOutput) {
            session.addOutput(photoOutput)
        }

        let format = movieFormat(device)
        if settings.mode.recordsMovie {
            if !session.outputs.contains(movieOutput), session.canAddOutput(movieOutput) {
                session.addOutput(movieOutput)
            }
            if format == nil, session.canSetSessionPreset(.high) { session.sessionPreset = .high }
        } else {
            session.removeOutput(movieOutput)
            session.sessionPreset = .photo
        }
        session.automaticallyConfiguresCaptureDeviceForWideColor = format == nil

        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }
        if let (format, video) = format {
            if device.activeFormat != format { device.activeFormat = format }
            let duration = CMTime(value: 1, timescale: CMTimeScale(video.frameRate))
            device.activeVideoMinFrameDuration = duration
            device.activeVideoMaxFrameDuration = duration
            let colorSpaces = format.supportedColorSpaces
            device.activeColorSpace = video.hdr && colorSpaces.contains(.HLG_BT2020) ? .HLG_BT2020
                : colorSpaces.contains(.P3_D65) ? .P3_D65 : .sRGB
        }
        if device.primaryConstituentDeviceSwitchingBehavior != .unsupported {
            device.setPrimaryConstituentDeviceSwitchingBehavior(
                settings.macro ? .auto : .restricted, restrictedSwitchingBehaviorConditions: [])
        }
        if device.position == .front, device.formats.contains(where: \.isCenterStageSupported) {
            AVCaptureDevice.centerStageControlMode = .cooperative
            AVCaptureDevice.isCenterStageEnabled = settings.centerStage
        }
        try configureTorch(device, locked: true)
    }

    private func movieFormat(_ device: AVCaptureDevice) -> (AVCaptureDevice.Format, VideoFormat)? {
        let mode = settings.mode
        guard mode.recordsMovie,
              let video = mode == .slowMotion ? settings.slowMotionFormat : settings.videoFormat
        else { return nil }
        let required: (AVCaptureDevice.Format) -> Bool = { format in
            switch mode {
            case .cinematic: format.isCinematicVideoCaptureSupported
            case .spatial: format.isSpatialVideoCaptureSupported
            case .video where self.settings.actionMode: format.isVideoStabilizationModeSupported(.cinematicExtendedEnhanced)
            default: true
            }
        }
        let candidates = device.formats.filter { $0.matches(video) && required($0) }
        if let format = candidates.first(where: { !$0.isVideoBinned }) ?? candidates.first {
            return (format, video)
        }
        guard let fallback = device.formats.last(where: required),
              let rate = [video.frameRate, 30, 24].first(where: fallback.supports(frameRate:))
        else { return nil }
        return (fallback, VideoFormat(height: video.height, frameRate: rate, hdr: false))
    }

    private func configureTorch(_ device: AVCaptureDevice, locked: Bool = false) throws {
        guard device.hasTorch else { return }
        let mode: AVCaptureDevice.TorchMode = settings.mode.recordsMovie ? settings.flash.torch : .off
        guard device.isTorchModeSupported(mode), device.torchMode != mode else { return }
        if !locked { try device.lockForConfiguration() }
        device.torchMode = mode
        if !locked { device.unlockForConfiguration() }
    }

    private func configureOutputs(_ device: AVCaptureDevice) {
        let mode = settings.mode
        let dimensions = device.activeFormat.supportedMaxPhotoDimensions
        let wanted = mode.recordsMovie ? nil : settings.photoFormat?.megapixels
        if let chosen = dimensions.first(where: { $0.megapixels == wanted })
            ?? dimensions.max(by: { $0.megapixels < $1.megapixels }) {
            photoOutput.maxPhotoDimensions = chosen
        }
        photoOutput.maxPhotoQualityPrioritization = .quality
        photoOutput.isLivePhotoCaptureEnabled = mode == .photo && photoOutput.isLivePhotoCaptureSupported
        photoOutput.isDepthDataDeliveryEnabled = mode == .portrait && photoOutput.isDepthDataDeliverySupported
        photoOutput.isPortraitEffectsMatteDeliveryEnabled = mode == .portrait && photoOutput.isPortraitEffectsMatteDeliverySupported
        photoOutput.isResponsiveCaptureEnabled = photoOutput.isResponsiveCaptureSupported
        photoOutput.isFastCapturePrioritizationEnabled = photoOutput.isFastCapturePrioritizationSupported

        guard mode.recordsMovie else { return }
        if let connection = movieOutput.connection(with: .video), connection.isVideoStabilizationSupported {
            connection.preferredVideoStabilizationMode = switch mode {
            case .spatial: .cinematicExtended
            case .video where settings.actionMode && device.activeFormat.isVideoStabilizationModeSupported(.cinematicExtendedEnhanced):
                .cinematicExtendedEnhanced
            default: .auto
            }
        }
        movieOutput.isSpatialVideoCaptureEnabled = mode == .spatial && movieOutput.isSpatialVideoCaptureSupported
        if let input {
            input.isCinematicVideoCaptureEnabled = mode == .cinematic && input.isCinematicVideoCaptureSupported
            if input.isCinematicVideoCaptureEnabled {
                let format = device.activeFormat
                let aperture = settings.cinematicAperture ?? format.defaultSimulatedAperture
                input.simulatedAperture = min(max(aperture, format.minSimulatedAperture), format.maxSimulatedAperture)
            }
        }
    }

    private func applyRotation() {
        let mirrored = input?.device.position == .front
        let outputs: [AVCaptureConnection] = [photoOutput, movieOutput].compactMap { $0.connection(with: .video) }
        let previews = session.connections.filter { $0.videoPreviewLayer != nil }
        for (connections, angle) in [(outputs, rotation.capture), (previews, rotation.preview)] {
            for connection in connections {
                if connection.isVideoRotationAngleSupported(angle) { connection.videoRotationAngle = angle }
                if connection.isVideoMirroringSupported {
                    connection.automaticallyAdjustsVideoMirroring = false
                    connection.isVideoMirrored = mirrored
                }
            }
        }
        emit.yield(.mirrored(mirrored))
    }

    private func installControls(_ device: AVCaptureDevice) {
        guard session.supportsControls else { return }
        session.beginConfiguration()
        defer { session.commitConfiguration() }
        for control in session.controls { session.removeControl(control) }
        let emit = emit
        let multiplier = device.displayVideoZoomFactorMultiplier
        let controls: [AVCaptureControl] = [
            AVCaptureSystemZoomSlider(device: device) { emit.yield(.zoom($0 * multiplier)) },
            AVCaptureSystemExposureBiasSlider(device: device) { emit.yield(.exposureBias($0)) },
        ]
        for control in controls where session.canAddControl(control) { session.addControl(control) }
    }


    private func observe() {
        guard observers.isEmpty else { return }
        let center = NotificationCenter.default
        observers = [
            center.addObserver(forName: AVCaptureSession.wasInterruptedNotification, object: session, queue: nil) { [weak self] _ in
                self?.emit.yield(.interrupted(true))
            },
            center.addObserver(forName: AVCaptureSession.interruptionEndedNotification, object: session, queue: nil) { [weak self] _ in
                self?.emit.yield(.interrupted(false))
            },
            center.addObserver(forName: AVCaptureSession.runtimeErrorNotification, object: session, queue: nil) { [weak self] note in
                let error = note.userInfo?[AVCaptureSessionErrorKey] as? AVError
                Task { await self?.runtimeError(error) }
            },
            center.addObserver(forName: AVCaptureDevice.subjectAreaDidChangeNotification, object: nil, queue: nil) { [weak self] _ in
                Task { await self?.resetFocus() }
            },
        ]
    }

    private func runtimeError(_ error: AVError?) {
        emit.yield(.failed(error?.localizedDescription ?? "The camera stopped unexpectedly."))
        if error?.code == .mediaServicesWereReset { session.startRunning() }
    }
}

private nonisolated final class ControlsDelegate: NSObject, AVCaptureSessionControlsDelegate {
    let emit: AsyncStream<CameraEngine.Event>.Continuation

    init(emit: AsyncStream<CameraEngine.Event>.Continuation) {
        self.emit = emit
    }

    func sessionControlsDidBecomeActive(_ session: AVCaptureSession) {}
    func sessionControlsWillEnterFullscreenAppearance(_ session: AVCaptureSession) { emit.yield(.controlsFullscreen(true)) }
    func sessionControlsWillExitFullscreenAppearance(_ session: AVCaptureSession) { emit.yield(.controlsFullscreen(false)) }
    func sessionControlsDidBecomeInactive(_ session: AVCaptureSession) {}
}
