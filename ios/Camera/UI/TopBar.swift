import SwiftUI

struct TopBar: View {
    let model: CameraModel

    var body: some View {
        Group {
            if case .recording(let since) = model.phase {
                RecordingTimer(since: since)
            } else {
                HStack(spacing: 12) {
                    if model.settings.mode.isPhoto { photoItems } else { videoItems }
                }
            }
        }
        .frame(height: 44)
        .animation(.snappy, value: model.isRecording)
    }

    @ViewBuilder private var photoItems: some View {
        let caps = model.capabilities
        let settings = model.settings
        if caps.flashModes.count > 1 {
            item(settings.flash.symbol, active: settings.flash == .on) {
                model.update { $0.flash = $0.flash.next(in: caps.flashModes) }
            }
        }
        if caps.livePhoto, settings.mode == .photo {
            item(settings.livePhoto ? "livephoto" : "livephoto.slash", active: settings.livePhoto) {
                model.update { $0.livePhoto.toggle() }
            }
        }
        if caps.photoFormats.count > 1, let format = model.activePhotoFormat {
            badge(format.codecTitle, "\(format.megapixels)") {
                model.update { $0.photoFormat = caps.photoFormats.next(after: format) }
            }
        }
    }

    @ViewBuilder private var videoItems: some View {
        let caps = model.capabilities
        if caps.torch {
            item(model.settings.flash == .on ? "bolt.fill" : "bolt.slash", active: model.settings.flash == .on) {
                model.update { $0.flash = $0.flash == .on ? .off : .on }
            }
        }
        if caps.actionMode, model.settings.mode == .video {
            item("figure.run", active: model.settings.actionMode, slashed: !model.settings.actionMode) {
                model.update { $0.actionMode.toggle() }
            }
        }
        if model.activeVideoFormats.count > 1, let format = model.activeVideoFormat {
            badge(format.resolutionTitle, "\(format.frameRate)", monospaced: true) {
                model.setVideoFormat(model.activeVideoFormats.next(after: format))
            }
        }
    }

    private func item(_ symbol: String, active: Bool, slashed: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 19, weight: .regular))
                .symbolRenderingMode(.monochrome)
                .slashed(slashed)
                .foregroundStyle(active ? Color.cameraYellow : .white)
                .rotationEffect(model.glyphRotation)
                .frame(width: 30, height: 44)
                .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }

    private func badge(_ title: String, _ detail: String, monospaced: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: -1) {
                Text(title).font(.system(size: 14, weight: .semibold))
                Text(detail).font(.system(size: 9.5, weight: .semibold, design: monospaced ? .monospaced : .default))
            }
            .foregroundStyle(.white)
            .rotationEffect(model.glyphRotation)
            .frame(minWidth: 30, minHeight: 44)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }
}

struct RecordingTimer: View {
    let since: Date

    var body: some View {
        TimelineView(.periodic(from: since, by: 1)) { context in
            let seconds = max(0, Int(context.date.timeIntervalSince(since)))
            Text(String(format: "%02d:%02d:%02d", seconds / 3600, seconds / 60 % 60, seconds % 60))
                .font(.system(size: 17, weight: .medium).monospacedDigit())
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Color(red: 1, green: 0.23, blue: 0.19), in: .rect(cornerRadius: 6))
        }
    }
}

extension View {
    func slashed(_ isSlashed: Bool) -> some View {
        overlay {
            if isSlashed {
                Rectangle()
                    .frame(width: 1.6, height: 26)
                    .rotationEffect(.degrees(-45))
            }
        }
    }
}

extension FlashMode {
    var symbol: String {
        switch self {
        case .auto: "bolt.badge.automatic.fill"
        case .on: "bolt.fill"
        case .off: "bolt.slash"
        }
    }

    var title: String {
        switch self {
        case .auto: "Auto"
        case .on: "On"
        case .off: "Off"
        }
    }

    func next(in modes: [FlashMode]) -> FlashMode {
        modes.next(after: self)
    }
}

extension Array where Element: Equatable {
    func next(after element: Element) -> Element {
        guard let index = firstIndex(of: element) else { return first ?? element }
        return self[(index + 1) % count]
    }
}
