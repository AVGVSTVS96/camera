import AVFoundation
import CoreLocation
import Observation
import PhotosBrowser
import SwiftUI

@Observable
final class CameraModel {
    static let shared = CameraModel()

    let session: AVCaptureSession?

    private(set) var capabilities = CameraCapabilities.none
    private(set) var settings = CameraModel.loadSettings()
    private(set) var phase = CapturePhase.starting
    private(set) var zoom: CGFloat = 1
    private(set) var exposureBias: Float = 0
    private(set) var thumbnail: UIImage?
    private(set) var glyphRotation = Angle.zero
    private(set) var isMirrored = false
    private(set) var isCameraControlFullscreen = false
    var error: CameraError?

    private let engine: CameraEngine?
    private let settingsUpdates: AsyncStream<CameraSettings>.Continuation
    private let zoomUpdates: AsyncStream<(CGFloat, Bool)>.Continuation
    private let exposureUpdates: AsyncStream<Float>.Continuation
    private var simulatedFrame: UIImage?
    private var location: CLLocation?
    private var locationTask: Task<Void, Never>?
    private var shutterTask: Task<Void, Never>?

    init(session: AVCaptureSession? = AVCaptureSession()) {
        self.session = session
        let engine = session.map { session in
            nonisolated(unsafe) let session = session
            return CameraEngine(session: session)
        }
        self.engine = engine

        let (settingsStream, settingsUpdates) = AsyncStream.makeStream(of: CameraSettings.self, bufferingPolicy: .bufferingNewest(1))
        let (zoomStream, zoomUpdates) = AsyncStream.makeStream(of: (CGFloat, Bool).self, bufferingPolicy: .bufferingNewest(1))
        let (exposureStream, exposureUpdates) = AsyncStream.makeStream(of: Float.self, bufferingPolicy: .bufferingNewest(1))
        self.settingsUpdates = settingsUpdates
        self.zoomUpdates = zoomUpdates
        self.exposureUpdates = exposureUpdates

        guard let engine else { return }
        Task {
            for await settings in settingsStream { await engine.apply(settings) }
        }
        Task {
            for await (factor, animated) in zoomStream { await engine.setZoom(factor, animated: animated) }
        }
        Task {
            for await bias in exposureStream { await engine.setExposureBias(bias) }
        }
        Task { [weak self] in
            for await event in engine.events { self?.handle(event) }
        }
    }

    func start() async {
        guard let engine else { return }
        guard await Self.requestAccess(for: .video) else {
            phase = .unavailable(.denied)
            return
        }
        _ = await Self.requestAccess(for: .audio)
        guard await engine.start(settings) else {
            phase = .unavailable(.noCamera)
            return
        }
        phase = .ready
        locationTask = Task {
            do {
                for try await update in CLLocationUpdate.liveUpdates() {
                    if let location = update.location { self.location = location }
                }
            } catch {}
        }
        await refreshThumbnail()
    }

    func stop() async {
        locationTask?.cancel()
        shutterTask?.cancel()
        await engine?.stop()
    }

    func update(_ change: (inout CameraSettings) -> Void) {
        var new = settings
        change(&new)
        if case .recording = phase {
            new.mode = settings.mode
            new.position = settings.position
        }
        commit(new)
    }

    func shutter() {
        switch phase {
        case .recording:
            Task { await engine?.stopRecording() }
        case .countdown:
            shutterTask?.cancel()
            phase = .ready
        case .ready:
            let movie = settings.mode.recordsMovie
            shutterTask = Task {
                for second in stride(from: settings.timer.rawValue, to: 0, by: -1) {
                    phase = .countdown(second)
                    try? await Task.sleep(for: .seconds(1))
                    if Task.isCancelled { return }
                }
                if movie { await record() } else { await capturePhoto() }
            }
        default:
            break
        }
    }

    func captureStill() {
        guard case .recording = phase, capabilities.stillsWhileRecording else { return }
        Task { await capturePhoto() }
    }

    func flip() {
        guard capabilities.canFlip else { return }
        update { $0.position = $0.position == .back ? .front : .back }
    }

    func setZoom(_ factor: CGFloat, animated: Bool) {
        zoom = min(max(factor, capabilities.zoomRange.lowerBound), capabilities.zoomRange.upperBound)
        zoomUpdates.yield((zoom, animated))
    }

    func focus(at devicePoint: CGPoint, lock: Bool) {
        Task { await engine?.focus(at: devicePoint, lock: lock) }
    }

    func setExposureBias(_ ev: Float) {
        exposureBias = min(max(ev, capabilities.exposureBiasRange.lowerBound), capabilities.exposureBiasRange.upperBound)
        exposureUpdates.yield(exposureBias)
    }

    func directionsChanged(forwardFacing: [AVCaptureDevice]) {
        let ids = forwardFacing.map(\.uniqueID)
        Task { await engine?.setForwardFacing(ids) }
    }

    func rotationChanged(preview: CGFloat, capture: CGFloat) {
        glyphRotation = .degrees(90 - capture)
        Task { await engine?.setRotation(preview: preview, capture: capture) }
    }

    func refreshThumbnail() async {
        if let latest = await PhotosBrowser.latestThumbnail(pointSize: CGSize(width: 48, height: 48), scale: 3) {
            thumbnail = latest
        }
    }

    private func capturePhoto() async {
        let recording = if case .recording = phase { true } else { false }
        if !recording { phase = .capturing }
        defer { if !recording { phase = .ready } }

        guard let engine else {
            await saveSimulatedFrame()
            return
        }
        do {
            let photo = try await engine.capturePhoto(settings)
            defer { if let movie = photo.livePhotoMovie { try? FileManager.default.removeItem(at: movie) } }
            thumbnail = UIImage(data: photo.data).flatMap(Self.thumbnail)
            var resources: [LibraryResource] = [.data(.photo, photo.data)]
            if let movie = photo.livePhotoMovie { resources.append(.file(.pairedVideo, movie)) }
            _ = try await LibrarySaver.save(resources, location: location)
        } catch {
            self.error = CameraError(message: error.localizedDescription)
        }
    }

    private func record() async {
        guard let engine else { return }
        phase = .recording(since: .now)
        do {
            let movie = try await engine.record()
            phase = .ready
            defer { try? FileManager.default.removeItem(at: movie) }
            _ = try await LibrarySaver.save([.file(.video, movie)], location: location)
            await refreshThumbnail()
        } catch {
            phase = .ready
            self.error = CameraError(message: error.localizedDescription)
        }
    }

    private func saveSimulatedFrame() async {
        guard let frame = simulatedFrame, let data = frame.heicData() else { return }
        do {
            _ = try await LibrarySaver.save([.data(.photo, data, filename: "simulated-capture.heic")], location: location)
            thumbnail = Self.thumbnail(frame)
        } catch {
            self.error = CameraError(message: error.localizedDescription)
        }
    }

    private func handle(_ event: CameraEngine.Event) {
        switch event {
        case .capabilities(let capabilities):
            self.capabilities = capabilities
            commit(settings)
        case .zoom(let factor): zoom = factor
        case .exposureBias(let bias): exposureBias = bias
        case .mirrored(let mirrored): isMirrored = mirrored
        case .interrupted(true): phase = .interrupted
        case .interrupted(false): if phase == .interrupted { phase = .ready }
        case .controlsFullscreen(let fullscreen): isCameraControlFullscreen = fullscreen
        case .failed(let message): error = CameraError(message: message)
        }
    }

    private func commit(_ new: CameraSettings) {
        var s = new
        let c = capabilities
        if c != .none {
            if !c.modes.contains(s.mode) { s.mode = .photo }
            s.photoFormat = Self.choose(s.photoFormat, from: c.photoFormats, preferring: [
                PhotoFormat(codec: .heif, megapixels: 24), PhotoFormat(codec: .heif, megapixels: 12),
            ])
            s.videoFormat = Self.choose(s.videoFormat, from: c.videoFormats, preferring: [
                VideoFormat(height: 2160, frameRate: 30, hdr: true), VideoFormat(height: 1080, frameRate: 30, hdr: true),
                VideoFormat(height: 1080, frameRate: 30, hdr: false),
            ])
            s.slowMotionFormat = Self.choose(s.slowMotionFormat, from: c.slowMotionFormats, preferring: [
                VideoFormat(height: 1080, frameRate: 120, hdr: false),
            ])
            if let range = c.cinematicApertureRange, let aperture = s.cinematicAperture, !range.contains(aperture) {
                s.cinematicAperture = nil
            }
        }
        guard s != settings else { return }
        settings = s
        if let data = try? JSONEncoder().encode(s) { UserDefaults.standard.set(data, forKey: Self.settingsKey) }
        settingsUpdates.yield(s)
    }

    private static func choose<T: Equatable>(_ current: T?, from available: [T], preferring: [T]) -> T? {
        if let current, available.contains(current) { return current }
        return preferring.first(where: available.contains) ?? available.last
    }

    private static let settingsKey = "cameraSettings"

    private static func loadSettings() -> CameraSettings {
        func object(_ data: Data?) -> [String: Any] {
            data.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] } ?? [:]
        }
        let saved = object(UserDefaults.standard.data(forKey: settingsKey))
        let merged = object(try? JSONEncoder().encode(CameraSettings())).merging(saved) { $1 }
        return (try? JSONSerialization.data(withJSONObject: merged))
            .flatMap { try? JSONDecoder().decode(CameraSettings.self, from: $0) } ?? CameraSettings()
    }

    private static func requestAccess(for media: AVMediaType) async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: media) {
        case .authorized: true
        case .notDetermined: await AVCaptureDevice.requestAccess(for: media)
        default: false
        }
    }

    private static func thumbnail(_ image: UIImage) -> UIImage? {
        let side: CGFloat = 144
        let scale = side / min(image.size.width, image.size.height)
        return image.preparingThumbnail(of: CGSize(width: image.size.width * scale, height: image.size.height * scale))
    }

    #if DEBUG
    static func simulated(capabilities: CameraCapabilities, frame: UIImage?) -> CameraModel {
        let model = CameraModel(session: nil)
        model.capabilities = capabilities
        model.simulatedFrame = frame
        model.thumbnail = frame
        model.phase = .ready
        return model
    }
    #endif
}
