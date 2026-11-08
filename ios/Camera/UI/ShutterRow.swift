import PhotosBrowser
import SwiftUI

struct ShutterButton: View {
    let model: CameraModel

    var body: some View {
        let movie = model.settings.mode.recordsMovie
        let recording = model.isRecording
        Button(action: model.shutter) {
            ZStack {
                Circle()
                    .fill(.clear)
                    .glassEffect(.clear.tint(.white.opacity(0.08)), in: .circle)
                RoundedRectangle(cornerRadius: recording ? 7 : 34, style: .continuous)
                    .fill(movie ? Color.recordRed : .white)
                    .frame(width: recording ? 30 : 68, height: recording ? 30 : 68)
            }
            .frame(width: 81, height: 81)
            .contentShape(.circle)
        }
        .buttonStyle(ShutterPressStyle())
        .disabled(model.phase == .starting || model.phase == .interrupted)
        .animation(.spring(duration: 0.3, bounce: 0.2), value: recording)
        .animation(.smooth(duration: 0.25), value: movie)
        .sensoryFeedback(.impact(weight: .medium), trigger: model.phase) { _, new in new == .capturing }
        .accessibilityLabel(movie ? (recording ? "Stop recording" : "Record") : "Take photo")
    }
}

private struct ShutterPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.9 : 1)
            .animation(.spring(duration: 0.2), value: configuration.isPressed)
    }
}

struct ThumbnailButton: View {
    let model: CameraModel
    @State private var browsing = false
    @Namespace private var zoom

    var body: some View {
        Button { browsing = true } label: {
            ZStack {
                Circle().fill(.black.opacity(0.3))
                if let thumbnail = model.thumbnail {
                    Image(uiImage: thumbnail)
                        .resizable()
                        .scaledToFill()
                        .rotationEffect(model.glyphRotation)
                        .transition(.scale(scale: 0.4).combined(with: .opacity))
                        .id(thumbnail)
                }
            }
            .frame(width: 48, height: 48)
            .clipShape(.circle)
            .animation(.spring(duration: 0.35), value: model.thumbnail)
        }
        .buttonStyle(.plain)
        .matchedTransitionSource(id: "library", in: zoom)
        .accessibilityLabel("Photos")
        .fullScreenCover(isPresented: $browsing, onDismiss: { Task { await model.refreshThumbnail() } }) {
            PhotosBrowser { browsing = false }
                .navigationTransition(.zoom(sourceID: "library", in: zoom))
        }
    }
}

struct FlipButton: View {
    let model: CameraModel
    @State private var turns = 0.0

    var body: some View {
        CircleGlassButton {
            turns += 1
            model.flip()
        } label: {
            Image(systemName: "arrow.triangle.2.circlepath")
                .font(.system(size: 21, weight: .medium))
                .foregroundStyle(.white)
                .rotationEffect(.degrees(turns * 180) + model.glyphRotation)
                .animation(.spring(duration: 0.45), value: turns)
        }
        .disabled(model.isRecording)
        .accessibilityLabel("Switch camera")
    }
}

struct MacroButton: View {
    let model: CameraModel

    var body: some View {
        let on = model.settings.macro
        CircleGlassButton(ring: on ? .cameraYellow : nil) {
            model.update { $0.macro.toggle() }
        } label: {
            Image(systemName: on ? "camera.macro" : "camera.macro.slash")
                .font(.system(size: 19, weight: .medium))
                .foregroundStyle(on ? Color.cameraYellow : .white.opacity(0.7))
                .rotationEffect(model.glyphRotation)
        }
        .accessibilityLabel(on ? "Macro on" : "Macro off")
    }
}

struct MoreButton: View {
    let rotation: Angle
    let highlighted: Bool
    let action: () -> Void

    var body: some View {
        CircleGlassButton(ring: highlighted ? .cameraYellow : nil, action: action) {
            Grid(horizontalSpacing: 4.5, verticalSpacing: 4.5) {
                ForEach(0..<2, id: \.self) { _ in
                    GridRow {
                        ForEach(0..<3, id: \.self) { _ in Circle().frame(width: 5.5, height: 5.5) }
                    }
                }
            }
            .foregroundStyle(.white)
            .rotationEffect(rotation)
        }
        .accessibilityLabel("Camera controls")
    }
}
