import SwiftUI

enum TrayItem: String, Identifiable {
    case flash, live, aspect, timer, exposure, resolution, frameRate, action, depth, outerDisplay

    var id: Self { self }

    var title: LocalizedStringResource {
        switch self {
        case .flash: "FLASH"
        case .live: "LIVE"
        case .aspect: "ASPECT"
        case .timer: "TIMER"
        case .exposure: "EXPOSURE"
        case .resolution: "RESOLUTION"
        case .frameRate: "FRAME RATE"
        case .action: "ACTION"
        case .depth: "DEPTH"
        case .outerDisplay: "OUTER DISPLAY"
        }
    }
}

struct ControlsTray: View {
    let model: CameraModel
    let close: () -> Void

    @State private var open: TrayItem?
    @GestureState private var pull: CGFloat = 0

    var body: some View {
        VStack(spacing: 0) {
            Capsule()
                .fill(.white.opacity(0.55))
                .frame(width: 37, height: 5)
                .padding(.top, 11)
                .padding(.bottom, 18)
            if let open {
                TrayDetail(model: model, item: open) { self.open = nil }
                    .transition(.blurReplace)
            } else {
                grid.transition(.blurReplace)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .glassEffect(.regular.tint(.black.opacity(0.18)), in: .rect(cornerRadius: 52, style: .continuous))
        .offset(y: max(0, pull))
        .gesture(
            DragGesture()
                .updating($pull) { value, state, _ in state = value.translation.height }
                .onEnded { if $0.translation.height > 80 || $0.predictedEndTranslation.height > 200 { close() } }
        )
        .animation(.smooth(duration: 0.3), value: open)
    }

    private var grid: some View {
        ScrollView {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 3), spacing: 22) {
                ForEach(items) { item in
                    Button { tap(item) } label: {
                        VStack(spacing: 14) {
                            knob(for: item)
                                .frame(width: 67, height: 67)
                                .background(.black.opacity(0.5), in: .circle)
                                .rotationEffect(model.glyphRotation)
                            Text(item.title)
                                .font(.system(size: 13, weight: .medium))
                                .tracking(1.6)
                                .foregroundStyle(.white)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 24)
        }
        .scrollIndicators(.hidden)
    }

    private var items: [TrayItem] {
        let caps = model.capabilities
        let mode = model.settings.mode
        var items: [TrayItem] = []
        if mode.isPhoto {
            if caps.flashModes.count > 1 { items.append(.flash) }
            if caps.livePhoto, mode == .photo { items.append(.live) }
            if caps.aspectRatios.count > 1 { items.append(.aspect) }
            items.append(.timer)
        } else if caps.torch {
            items.append(.flash)
        }
        if caps.exposureBiasRange.lowerBound < caps.exposureBiasRange.upperBound { items.append(.exposure) }
        if mode.isPhoto, caps.photoFormats.count > 1 { items.append(.resolution) }
        if !mode.isPhoto {
            if Set(model.activeVideoFormats.map(\.height)).count > 1 { items.append(.resolution) }
            if model.frameRates.count > 1 { items.append(.frameRate) }
            if caps.actionMode, mode == .video { items.append(.action) }
        }
        if mode == .cinematic, caps.cinematicApertureRange != nil { items.append(.depth) }
        if OuterDisplay.shared.isConnected { items.append(.outerDisplay) }
        return items
    }

    private func tap(_ item: TrayItem) {
        switch item {
        case .live: model.update { $0.livePhoto.toggle() }
        case .action: model.update { $0.actionMode.toggle() }
        default: open = item
        }
    }

    @ViewBuilder private func knob(for item: TrayItem) -> some View {
        let s = model.settings
        switch item {
        case .flash:
            let symbol = s.mode.isPhoto ? s.flash.symbol : (s.flash == .on ? "bolt.fill" : "bolt.slash")
            glyph(symbol, active: s.flash == .on)
        case .live:
            glyph(s.livePhoto ? "livephoto" : "livephoto.slash", active: s.livePhoto)
        case .aspect:
            Text(s.aspectRatio.title)
                .font(.system(size: 15, weight: .medium))
                .padding(5)
                .overlay { CornerBrackets().stroke(.white, lineWidth: 1.5) }
                .foregroundStyle(.white)
        case .timer:
            if s.timer == .off {
                glyph("timer", active: false).slashed(true).foregroundStyle(.white)
            } else {
                Text("\(s.timer.rawValue)s").font(.system(size: 20, weight: .medium)).foregroundStyle(Color.cameraYellow)
            }
        case .exposure:
            if model.exposureBias == 0 {
                glyph("plusminus", active: false)
            } else {
                Text(model.exposureBias.signedEV).font(.system(size: 17, weight: .medium).monospacedDigit())
                    .foregroundStyle(Color.cameraYellow)
            }
        case .resolution:
            if s.mode.isPhoto, let format = model.activePhotoFormat {
                stacked(format.codecTitle, "\(format.megapixels)")
            } else if let format = model.activeVideoFormat {
                stacked(format.resolutionTitle, format.hdr ? "HDR" : "SDR")
            }
        case .frameRate:
            stacked("\(model.activeVideoFormat?.frameRate ?? 30)", "FPS")
        case .action:
            glyph("figure.run", active: s.actionMode).slashed(!s.actionMode).foregroundStyle(.white)
        case .depth:
            Text("ƒ \((s.cinematicAperture ?? 2.8).formatted(.number.precision(.fractionLength(1))))")
                .font(.system(size: 17, weight: .medium))
                .foregroundStyle(.white)
        case .outerDisplay:
            glyph(s.outerDisplay.symbol, active: s.outerDisplay != .off)
        }
    }

    private func glyph(_ symbol: String, active: Bool) -> some View {
        Image(systemName: symbol)
            .font(.system(size: 26, weight: .regular))
            .foregroundStyle(active ? Color.cameraYellow : .white)
    }

    private func stacked(_ top: String, _ bottom: String) -> some View {
        VStack(spacing: -2) {
            Text(top).font(.system(size: 21, weight: .medium))
            Text(bottom).font(.system(size: 15, weight: .medium))
        }
        .foregroundStyle(.white)
    }
}

private struct TrayDetail: View {
    let model: CameraModel
    let item: TrayItem
    let back: () -> Void

    var body: some View {
        VStack(spacing: 26) {
            Button(action: back) {
                HStack(spacing: 6) {
                    Image(systemName: "chevron.left").font(.system(size: 13, weight: .semibold))
                    Text(item.title).font(.system(size: 13, weight: .medium)).tracking(1.6)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .glassEffect(.clear.interactive(), in: .capsule)
            }
            .buttonStyle(.plain)
            content
                .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 16)
    }

    @ViewBuilder private var content: some View {
        let s = model.settings
        let caps = model.capabilities
        switch item {
        case .flash:
            if s.mode.isPhoto {
                options(caps.flashModes, selected: s.flash, label: \.title, symbol: \.symbol) { f in model.update { $0.flash = f } }
            } else {
                options([FlashMode.off, .on], selected: s.flash == .on ? .on : .off, label: \.title,
                        symbol: { $0 == .on ? "bolt.fill" : "bolt.slash" }) { f in model.update { $0.flash = f } }
            }
        case .aspect:
            options(caps.aspectRatios, selected: s.aspectRatio, label: \.title) { a in model.update { $0.aspectRatio = a } }
        case .timer:
            options(TimerDuration.allCases, selected: s.timer, label: { $0 == .off ? "Off" : "\($0.rawValue)s" }) { t in
                model.update { $0.timer = t }
            }
        case .exposure:
            ValueRuler(
                value: Double(model.exposureBias),
                range: Double(caps.exposureBiasRange.lowerBound)...Double(caps.exposureBiasRange.upperBound),
                step: 1.0 / 3, label: { Float($0).signedEV }
            ) { model.setExposureBias(Float($0)) }
        case .depth:
            if let range = caps.cinematicApertureRange {
                ValueRuler(
                    value: Double(s.cinematicAperture ?? range.lowerBound),
                    range: Double(range.lowerBound)...Double(range.upperBound),
                    step: 0.1, label: { "ƒ\($0.formatted(.number.precision(.fractionLength(1))))" }
                ) { v in model.update { $0.cinematicAperture = Float(v) } }
            }
        case .resolution:
            if s.mode.isPhoto, let current = model.activePhotoFormat {
                options(caps.photoFormats, selected: current, label: { "\($0.codecTitle) \($0.megapixels)" }) { f in
                    model.update { $0.photoFormat = f }
                }
            } else if let current = model.activeVideoFormat {
                let choices = model.activeVideoFormats.filter { $0.frameRate == current.frameRate }
                options(choices.isEmpty ? [current] : choices, selected: current,
                        label: { "\($0.resolutionTitle)\($0.hdr ? " HDR" : "")" }) { model.setVideoFormat($0) }
            }
        case .frameRate:
            if let current = model.activeVideoFormat {
                let choices = model.activeVideoFormats.filter { $0.height == current.height }
                options(choices, selected: current, label: { "\($0.frameRate)" }) { model.setVideoFormat($0) }
            }
        case .outerDisplay:
            options(OuterDisplayContent.allCases, selected: s.outerDisplay, label: \.title, symbol: \.symbol) { o in
                model.update { $0.outerDisplay = o }
            }
        case .live, .action:
            EmptyView()
        }
    }

    private func options<T: Hashable>(
        _ values: [T], selected: T, label: @escaping (T) -> String, symbol: ((T) -> String)? = nil, choose: @escaping (T) -> Void
    ) -> some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: min(values.count, 3)), spacing: 18) {
            ForEach(values, id: \.self) { value in
                let on = value == selected
                Button { choose(value) } label: {
                    VStack(spacing: 10) {
                        Group {
                            if let symbol {
                                Image(systemName: symbol(value)).font(.system(size: 24))
                            } else {
                                Text(label(value)).font(.system(size: 17, weight: .medium)).minimumScaleFactor(0.6)
                            }
                        }
                        .foregroundStyle(on ? Color.black : .white)
                        .frame(width: 67, height: 67)
                        .background(on ? Color.cameraYellow : .black.opacity(0.5), in: .circle)
                        .rotationEffect(model.glyphRotation)
                        if symbol != nil {
                            Text(label(value).uppercased()).font(.system(size: 12, weight: .medium)).tracking(1.2)
                                .foregroundStyle(on ? Color.cameraYellow : .white)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .sensoryFeedback(.selection, trigger: selected)
    }
}

struct ValueRuler: View {
    let value: Double
    let range: ClosedRange<Double>
    let step: Double
    let label: (Double) -> String
    let change: (Double) -> Void

    @State private var start: Double?
    private let spacing: CGFloat = 12

    var body: some View {
        VStack(spacing: 10) {
            Text(label(value))
                .font(.system(size: 17, weight: .semibold).monospacedDigit())
                .foregroundStyle(Color.cameraYellow)
            Canvas { context, size in
                let mid = size.width / 2
                let ticks = Int(((range.upperBound - range.lowerBound) / step).rounded())
                for i in 0...ticks {
                    let v = range.lowerBound + Double(i) * step
                    let x = mid + CGFloat((v - value) / step) * spacing
                    guard x > -4, x < size.width + 4 else { continue }
                    let major = abs(v.rounded() - v) < step / 2 && abs(v - v.rounded()) < 0.001
                    var p = Path()
                    p.move(to: CGPoint(x: x, y: major ? 4 : 10))
                    p.addLine(to: CGPoint(x: x, y: size.height - 4))
                    context.stroke(p, with: .color(.white.opacity(major ? 0.95 : 0.5)), lineWidth: 1.2)
                }
                var marker = Path()
                marker.move(to: CGPoint(x: mid, y: 0))
                marker.addLine(to: CGPoint(x: mid, y: size.height))
                context.stroke(marker, with: .color(.cameraYellow), lineWidth: 2)
            }
            .frame(height: 34)
            .mask(LinearGradient(colors: [.clear, .black, .black, .clear], startPoint: .leading, endPoint: .trailing))
            .contentShape(.rect)
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { drag in
                        let origin = start ?? value
                        start = origin
                        let raw = origin - Double(drag.translation.width / spacing) * step
                        change(min(max((raw / step).rounded() * step, range.lowerBound), range.upperBound))
                    }
                    .onEnded { _ in start = nil }
            )
        }
        .sensoryFeedback(.selection, trigger: value)
    }
}

private nonisolated struct CornerBrackets: Shape {
    func path(in rect: CGRect) -> Path {
        let l: CGFloat = 6
        var p = Path()
        for (corner, dx, dy) in [(CGPoint(x: rect.minX, y: rect.minY), 1.0, 1.0), (CGPoint(x: rect.maxX, y: rect.minY), -1.0, 1.0),
                                 (CGPoint(x: rect.minX, y: rect.maxY), 1.0, -1.0), (CGPoint(x: rect.maxX, y: rect.maxY), -1.0, -1.0)] {
            p.move(to: CGPoint(x: corner.x + dx * l, y: corner.y))
            p.addLine(to: corner)
            p.addLine(to: CGPoint(x: corner.x, y: corner.y + dy * l))
        }
        return p
    }
}

extension AspectRatio {
    var title: String {
        switch self {
        case .square: "1:1"
        case .fourByThree: "4:3"
        case .sixteenByNine: "16:9"
        }
    }

    var portraitRatio: CGFloat {
        switch self {
        case .square: 1
        case .fourByThree: 3.0 / 4
        case .sixteenByNine: 9.0 / 16
        }
    }
}

extension OuterDisplayContent {
    var title: String {
        switch self {
        case .off: "Off"
        case .preview: "Preview"
        case .kidCue: "Kid Cue"
        }
    }

    var symbol: String {
        switch self {
        case .off: "rectangle.slash"
        case .preview: "person.crop.rectangle"
        case .kidCue: "face.smiling"
        }
    }
}

extension Float {
    var signedEV: String {
        let text = abs(self).formatted(.number.precision(.fractionLength(1)))
        return self == 0 ? "0.0" : (self > 0 ? "+" : "−") + text
    }
}

extension CameraModel {
    var frameRates: [Int] {
        guard let height = activeVideoFormat?.height else { return [] }
        return activeVideoFormats.filter { $0.height == height }.map(\.frameRate)
    }

    var trayHighlighted: Bool {
        settings.timer != .off || exposureBias != 0 || (settings.mode.isPhoto && settings.aspectRatio != .fourByThree)
    }
}
