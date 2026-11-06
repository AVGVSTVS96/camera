import AVFoundation
import SwiftUI

struct Viewfinder: View {
    let model: CameraModel
    let openTray: () -> Void

    @State private var layer: AVCaptureVideoPreviewLayer?
    @State private var focus: Focus?
    @State private var pinchStart: CGFloat?
    @State private var biasStart: Float?
    @State private var flipTurn = 0.0

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                feed
                    .rotation3DEffect(.degrees(flipTurn), axis: (0, 1, 0))
                    .blur(radius: abs(sin(flipTurn * .pi / 180)) * 30)
                if let focus {
                    FocusReticle(focus: focus, bias: model.exposureBias, rotation: model.glyphRotation)
                        .position(focus.point)
                        .transition(.scale(scale: 1.4).combined(with: .opacity))
                        .id(focus.id)
                }
                if model.phase == .capturing {
                    Color.black.transition(.opacity.animation(.easeOut(duration: 0.25)))
                }
                if case .countdown(let n) = model.phase {
                    Text("\(n)")
                        .font(.system(size: 120, weight: .thin).monospacedDigit())
                        .foregroundStyle(.white)
                        .rotationEffect(model.glyphRotation)
                        .contentTransition(.numericText(countsDown: true))
                        .animation(.smooth, value: n)
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .clipped()
            .contentShape(.rect)
            .gesture(tap(in: geometry.size).exclusively(before: drag))
            .simultaneousGesture(pinch)
            .overlay(alignment: .top) {
                if focus?.locked == true {
                    Text("AE/AF LOCK")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.black)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.cameraYellow, in: .rect(cornerRadius: 4))
                        .padding(.top, 90)
                        .transition(.opacity)
                }
            }
        }
        .animation(.smooth(duration: 0.25), value: focus)
        .onChange(of: model.settings.position) {
            flipTurn = 0
            withAnimation(.smooth(duration: 0.5)) { flipTurn = 180 }
            Task {
                try? await Task.sleep(for: .seconds(0.5))
                flipTurn = 0
            }
            focus = nil
        }
        .onChange(of: model.settings.mode) { focus = nil }
    }

    @ViewBuilder private var feed: some View {
        if let session = model.session {
            PreviewLayerView(model: model, session: session) { layer = $0 }
        } else {
            #if DEBUG
            Image(uiImage: CameraFixture.image)
                .resizable()
                .scaledToFill()
                .scaleEffect(x: model.settings.position == .front ? -model.zoom : model.zoom, y: model.zoom)
                .brightness(Double(model.exposureBias) * 0.12)
            #else
            Color.black
            #endif
        }
    }

    private func devicePoint(_ point: CGPoint, in size: CGSize) -> CGPoint {
        if let layer { return layer.captureDevicePointConverted(fromLayerPoint: point) }
        return CGPoint(x: point.y / size.height, y: 1 - point.x / size.width)
    }

    private func tap(in size: CGSize) -> some Gesture {
        let lock = LongPressGesture(minimumDuration: 0.6)
            .sequenced(before: DragGesture(minimumDistance: 0))
            .onEnded { value in
                guard case .second(true, let drag?) = value else { return }
                setFocus(at: drag.startLocation, in: size, lock: true)
            }
        let tap = SpatialTapGesture()
            .onEnded { value in setFocus(at: value.location, in: size, lock: false) }
        return lock.exclusively(before: tap)
    }

    private func setFocus(at point: CGPoint, in size: CGSize, lock: Bool) {
        focus = Focus(point: point, locked: lock)
        model.setExposureBias(0)
        model.focus(at: devicePoint(point, in: size), lock: lock)
        guard !lock else { return }
        let id = focus?.id
        Task {
            try? await Task.sleep(for: .seconds(3))
            if focus?.id == id, focus?.locked == false { focus?.dimmed = true }
        }
    }

    private var drag: some Gesture {
        DragGesture(minimumDistance: 20)
            .onChanged { value in
                guard focus != nil, abs(value.translation.height) > abs(value.translation.width) else { return }
                let range = model.capabilities.exposureBiasRange
                let start = biasStart ?? model.exposureBias
                biasStart = start
                let bias = start - Float(value.translation.height / 120)
                model.setExposureBias(min(max(bias, range.lowerBound), range.upperBound))
                focus?.dimmed = false
            }
            .onEnded { value in
                defer { biasStart = nil }
                let t = value.translation
                if abs(t.width) > abs(t.height), abs(t.width) > 50 {
                    stepMode(t.width < 0 ? 1 : -1)
                } else if focus == nil, t.height < -60 {
                    openTray()
                }
            }
    }

    private var pinch: some Gesture {
        MagnifyGesture()
            .onChanged { value in
                let start = pinchStart ?? model.zoom
                pinchStart = start
                let range = model.capabilities.zoomRange
                model.setZoom(min(max(start * value.magnification, range.lowerBound), range.upperBound), animated: false)
            }
            .onEnded { _ in pinchStart = nil }
    }

    private func stepMode(_ delta: Int) {
        let modes = model.capabilities.modes
        guard !model.isRecording, let index = modes.firstIndex(of: model.settings.mode) else { return }
        let next = min(max(index + delta, 0), modes.count - 1)
        model.update { $0.mode = modes[next] }
    }
}

struct Focus: Equatable {
    let id = UUID()
    var point: CGPoint
    var locked: Bool
    var dimmed = false
}

private struct FocusReticle: View {
    let focus: Focus
    let bias: Float
    let rotation: Angle

    var body: some View {
        HStack(spacing: 6) {
            Rectangle()
                .strokeBorder(Color.cameraYellow, lineWidth: 1)
                .overlay { ticks }
                .frame(width: 74, height: 74)
            VStack(spacing: 2) {
                Rectangle().fill(Color.cameraYellow).frame(width: 1, height: 30 - CGFloat(bias) * 10)
                Image(systemName: "sun.max.fill")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.cameraYellow)
                    .rotationEffect(rotation)
                Rectangle().fill(Color.cameraYellow).frame(width: 1, height: 30 + CGFloat(bias) * 10)
            }
            .frame(width: 20)
            .opacity(focus.locked ? 0 : 1)
        }
        .offset(x: 13)
        .opacity(focus.dimmed ? 0.45 : 1)
        .allowsHitTesting(false)
    }

    private var ticks: some View {
        ZStack {
            ForEach(0..<4) { i in
                Rectangle()
                    .fill(Color.cameraYellow)
                    .frame(width: 1, height: 6)
                    .offset(y: -34)
                    .rotationEffect(.degrees(Double(i) * 90))
            }
        }
    }
}

private struct PreviewLayerView: UIViewRepresentable {
    let model: CameraModel
    let session: AVCaptureSession
    let onLayer: (AVCaptureVideoPreviewLayer) -> Void

    func makeUIView(context: Context) -> PreviewUIView {
        let view = PreviewUIView()
        view.previewLayer.session = session
        view.previewLayer.videoGravity = .resizeAspectFill
        view.coordinator = DuoCameraCoordinator(view: view, model: model)
        let layer = view.previewLayer
        Task { onLayer(layer) }
        return view
    }

    func updateUIView(_ view: PreviewUIView, context: Context) {
        view.coordinator?.observeRotation(deviceID: model.capabilities.activeDeviceID, previewLayer: view.previewLayer)
    }
}

final class PreviewUIView: UIView {
    var coordinator: DuoCameraCoordinator?

    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
    var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
}
