import CoreGraphics
import Foundation

enum CaptureMode: String, CaseIterable, Identifiable, Codable, Sendable {
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

enum CameraPosition: String, Codable, Sendable { case back, front }
enum FlashMode: String, CaseIterable, Codable, Sendable { case auto, on, off }
enum TimerDuration: Int, CaseIterable, Codable, Sendable { case off = 0, three = 3, five = 5, ten = 10 }
enum AspectRatio: String, CaseIterable, Codable, Sendable { case square, fourByThree, sixteenByNine }
enum OuterDisplayContent: String, CaseIterable, Codable, Sendable { case off, preview, kidCue }

struct PhotoFormat: Hashable, Codable, Sendable {
    enum Codec: String, Codable, Sendable { case heif, jpeg, proRAW }
    var codec: Codec
    var megapixels: Int
}

struct VideoFormat: Hashable, Codable, Sendable {
    var height: Int
    var frameRate: Int
    var hdr: Bool
}

struct CameraSettings: Equatable, Codable, Sendable {
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
}

struct CameraCapabilities: Equatable, Sendable {
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

    static let none = CameraCapabilities()
}

enum CameraUnavailable: Equatable, Sendable { case denied, noCamera }

enum CapturePhase: Equatable, Sendable {
    case unavailable(CameraUnavailable)
    case starting
    case ready
    case countdown(Int)
    case capturing
    case recording(since: Date)
    case interrupted
}

struct CameraError: Error, Equatable, Sendable {
    var message: String
}
