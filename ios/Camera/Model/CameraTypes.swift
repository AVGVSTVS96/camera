import CoreGraphics
import Foundation

nonisolated enum CaptureMode: String, CaseIterable, Identifiable, Codable, Sendable {
    case timeLapse, slowMotion, cinematic, video, photo, portrait, spatial, panorama

    var id: Self { self }

    var title: LocalizedStringResource {
        switch self {
        case .timeLapse: "TIME-LAPSE"
        case .slowMotion: "SLO-MO"
        case .cinematic: "CINEMATIC"
        case .video: "VIDEO"
        case .photo: "PHOTO"
        case .portrait: "PORTRAIT"
        case .spatial: "SPATIAL"
        case .panorama: "PANO"
        }
    }

    var recordsMovie: Bool {
        switch self {
        case .timeLapse, .slowMotion, .cinematic, .video, .spatial: true
        case .photo, .portrait, .panorama: false
        }
    }
}

nonisolated enum CameraPosition: String, Codable, Sendable { case back, front }
nonisolated enum FlashMode: String, CaseIterable, Codable, Sendable { case auto, on, off }
nonisolated enum TimerDuration: Int, CaseIterable, Codable, Sendable { case off = 0, three = 3, five = 5, ten = 10 }
nonisolated enum AspectRatio: String, CaseIterable, Codable, Sendable { case square, fourByThree, sixteenByNine }
nonisolated enum OuterDisplayContent: String, CaseIterable, Codable, Sendable { case off, preview, kidCue }

nonisolated struct PhotoFormat: Hashable, Codable, Sendable {
    enum Codec: String, Codable, Sendable { case heif, jpeg, proRAW }
    var codec: Codec
    var megapixels: Int
}

nonisolated struct VideoFormat: Hashable, Codable, Sendable {
    var height: Int
    var frameRate: Int
    var hdr: Bool
}

nonisolated struct CameraSettings: Equatable, Codable, Sendable {
    var mode: CaptureMode = .photo
    var position: CameraPosition = .back
    var flash: FlashMode = .auto
    var livePhoto = true
    var timer: TimerDuration = .off
    var aspectRatio: AspectRatio = .fourByThree
    var photoFormat: PhotoFormat?
    var videoFormat: VideoFormat?
    var slowMotionFormat: VideoFormat?
    var actionMode = false
    var macro = true
    var cinematicAperture: Float?
    var outerDisplay: OuterDisplayContent = .off
    var centerStage = true
    var grid = false
}

nonisolated struct CameraCapabilities: Equatable, Sendable {
    var modes: [CaptureMode] = []
    var canFlip = false
    var zoomStops: [CGFloat] = [1]
    var zoomRange: ClosedRange<CGFloat> = 1...1
    var flashModes: [FlashMode] = []
    var torch = false
    var livePhoto = false
    var photoFormats: [PhotoFormat] = []
    var videoFormats: [VideoFormat] = []
    var slowMotionFormats: [VideoFormat] = []
    var aspectRatios: [AspectRatio] = []
    var actionMode = false
    var macro = false
    var cinematicApertureRange: ClosedRange<Float>?
    var exposureBiasRange: ClosedRange<Float> = 0...0
    var activeDeviceID: String?
    var centerStage = false
    var stillsWhileRecording = false

    static let none = CameraCapabilities()
}

nonisolated enum CameraUnavailable: Equatable, Sendable { case denied, noCamera }

nonisolated enum CapturePhase: Equatable, Sendable {
    case unavailable(CameraUnavailable)
    case starting
    case ready
    case countdown(Int)
    case capturing
    case recording(since: Date)
    case interrupted
}

nonisolated struct CameraError: Error, Equatable, Sendable {
    var message: String
}
