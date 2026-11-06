import SwiftUI

extension Color {
    static let cameraYellow = Color(red: 0.976, green: 0.847, blue: 0.282)
    static let recordRed = Color(red: 1, green: 0.56, blue: 0.52)
    static let cameraKnob = Color.black.opacity(0.28)
}

extension Font {
    static func camera(_ size: CGFloat, weight: Font.Weight = .medium) -> Font {
        .system(size: size, weight: weight)
    }
}

struct CircleGlassButton<Label: View>: View {
    var size: CGFloat = 48
    var ring: Color?
    let action: () -> Void
    @ViewBuilder let label: Label

    var body: some View {
        Button(action: action) {
            label
                .frame(width: size, height: size)
                .overlay {
                    if let ring {
                        Circle().strokeBorder(ring, lineWidth: 3).padding(2)
                    }
                }
                .contentShape(.circle)
        }
        .buttonStyle(.plain)
        .glassEffect(.clear.tint(.cameraKnob).interactive(), in: .circle)
    }
}

extension CaptureMode {
    var isPhoto: Bool { !recordsMovie }
}

extension PhotoFormat {
    var codecTitle: String {
        switch codec {
        case .heif: "HEIF"
        case .jpeg: "JPEG"
        case .proRAW: "RAW"
        }
    }
}

extension VideoFormat {
    var resolutionTitle: String {
        switch height {
        case 2160...: "4K"
        case 1440..<2160: "2.8K"
        default: "HD"
        }
    }
}

extension CameraModel {
    var isRecording: Bool {
        if case .recording = phase { true } else { false }
    }

    var activeVideoFormats: [VideoFormat] {
        settings.mode == .slowMotion ? capabilities.slowMotionFormats : capabilities.videoFormats
    }

    var activeVideoFormat: VideoFormat? {
        (settings.mode == .slowMotion ? settings.slowMotionFormat : settings.videoFormat) ?? activeVideoFormats.first
    }

    func setVideoFormat(_ format: VideoFormat) {
        update {
            if $0.mode == .slowMotion { $0.slowMotionFormat = format } else { $0.videoFormat = format }
        }
    }

    var activePhotoFormat: PhotoFormat? {
        settings.photoFormat ?? capabilities.photoFormats.first
    }
}
