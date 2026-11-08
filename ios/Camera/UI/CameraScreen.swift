import AVKit
import SwiftUI

struct CameraScreen: View {
    let model: CameraModel

    #if DEBUG
    @State private var trayOpen = CameraFixture.flag("--fixture-tray")
    @State private var dialOpen = CameraFixture.flag("--fixture-zoom-dial")
    #else
    @State private var trayOpen = false
    @State private var dialOpen = false
    #endif
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size
            let wide = size.width >= 600
            let area = CGSize(width: size.width, height: size.height - (wide ? 210 : 0))
            let preview = previewSize(in: area)
            let chrome = min(size.width, preview.width)

            ZStack {
                Color.black
                Viewfinder(model: model) { trayOpen = true }
                    .frame(width: preview.width, height: preview.height)
                    .position(x: area.width / 2, y: area.height / 2)
                controls(width: chrome, height: size.height)
                    .frame(width: chrome, height: size.height)
                    .position(x: size.width / 2, y: size.height / 2)
                if trayOpen {
                    tray(height: size.height)
                }
                unavailable
            }
            .animation(.smooth(duration: 0.35), value: model.settings.mode)
            .animation(.smooth(duration: 0.35), value: model.settings.aspectRatio)
        }
        .ignoresSafeArea()
        #if DEBUG
        .fixtureEmulatedSize()
        #endif
        .environment(\.colorScheme, .dark)
        .persistentSystemOverlays(.hidden)
        .animation(.spring(duration: 0.4), value: model.glyphRotation)
        .animation(.spring(duration: 0.4, bounce: 0.15), value: trayOpen)
        .background {
            if model.session != nil { CaptureAccessoryRegistrar(model: model) }
        }
        .onCameraCaptureEvent { event in
            if event.phase == .ended { model.shutter() }
        }
        .onChange(of: scenePhase, initial: true) { _, phase in
            Task { phase == .active ? await model.start() : await model.stop() }
        }
        .alert(
            model.error?.message ?? "",
            isPresented: Binding { model.error != nil } set: { if !$0 { model.error = nil } }
        ) {}
    }

    private func previewSize(in area: CGSize) -> CGSize {
        let movie = model.settings.mode.recordsMovie
        if !movie, model.settings.aspectRatio == .fourByThree { return area }
        let ratio = movie ? 9.0 / 16 : model.settings.aspectRatio.portraitRatio
        if ratio < area.width / area.height { return CGSize(width: area.height * ratio, height: area.height) }
        return CGSize(width: area.width, height: area.width / ratio)
    }

    private func controls(width: CGFloat, height: CGFloat) -> some View {
        let side = min(175, width / 2 - 40)
        return VStack(spacing: 0) {
            TopBar(model: model)
                .padding(.top, 28)
            Spacer(minLength: 0)
            if !trayOpen {
                VStack(spacing: 0) {
                    ZoomControl(model: model, dialOpen: $dialOpen)
                        .frame(width: width)
                        .padding(.bottom, 32)
                    row(side: side) {
                        if model.capabilities.macro, model.settings.position == .back {
                            MacroButton(model: model)
                        }
                    } center: {
                        ShutterButton(model: model)
                    } trailing: {
                        MoreButton(rotation: model.glyphRotation, highlighted: model.trayHighlighted) { trayOpen = true }
                    }
                    .padding(.bottom, 32)
                    row(side: side) {
                        ThumbnailButton(model: model)
                    } center: {
                        ModeDial(modes: model.capabilities.modes, selection: model.settings.mode) { mode in
                            guard !model.isRecording else { return }
                            model.update { $0.mode = mode }
                        }
                        .opacity(model.isRecording ? 0 : 1)
                    } trailing: {
                        if model.capabilities.canFlip { FlipButton(model: model) }
                    }
                    .padding(.bottom, 34.5)
                }
                .transition(.opacity)
            }
        }
    }

    private func row(
        side: CGFloat,
        @ViewBuilder leading: () -> some View,
        @ViewBuilder center: () -> some View,
        @ViewBuilder trailing: () -> some View
    ) -> some View {
        ZStack {
            leading().offset(x: -side)
            center()
            trailing().offset(x: side)
        }
    }

    private func tray(height: CGFloat) -> some View {
        ZStack(alignment: .bottom) {
            Color.clear
                .contentShape(.rect)
                .onTapGesture { trayOpen = false }
            ControlsTray(model: model) { trayOpen = false }
                .frame(height: height - max(205, height * 0.3) - 8)
                .padding(.horizontal, 8)
                .padding(.bottom, 8)
        }
        .padding(.top, 72)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    @ViewBuilder private var unavailable: some View {
        switch model.phase {
        case .unavailable(.denied):
            message("Camera access is off", detail: "Allow camera access in Settings to take photos and videos.", settings: true)
        case .unavailable(.noCamera):
            message("No camera available", detail: "This device doesn't have a camera this app can use.", settings: false)
        case .interrupted:
            message("Camera paused", detail: "Another app is using the camera.", settings: false)
        default:
            EmptyView()
        }
    }

    private func message(_ title: LocalizedStringResource, detail: LocalizedStringResource, settings: Bool) -> some View {
        VStack(spacing: 12) {
            Text(title).font(.title3.weight(.semibold))
            Text(detail).font(.callout).foregroundStyle(.secondary).multilineTextAlignment(.center)
            if settings, let url = URL(string: UIApplication.openSettingsURLString) {
                Link("Open Settings", destination: url)
                    .buttonStyle(.glass)
                    .padding(.top, 6)
            }
        }
        .foregroundStyle(.white)
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.ultraThinMaterial)
    }
}
