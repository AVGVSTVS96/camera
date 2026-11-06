import SwiftUI

struct ModeDial: View {
    let modes: [CaptureMode]
    let selection: CaptureMode
    let select: (CaptureMode) -> Void

    @State private var widths: [CaptureMode: CGFloat] = [:]
    @GestureState private var drag: CGFloat = 0

    private let spacing: CGFloat = 33
    private let width: CGFloat = 220
    private let height: CGFloat = 47

    var body: some View {
        let selectedWidth = widths[selection] ?? 46
        ZStack {
            Capsule()
                .fill(.white.opacity(0.13))
                .strokeBorder(
                    LinearGradient(colors: [.white.opacity(0.45), .white.opacity(0.08), .white.opacity(0.3)], startPoint: .top, endPoint: .bottom),
                    lineWidth: 1
                )
                .shadow(color: .black.opacity(0.18), radius: 3, y: 1)
                .frame(width: selectedWidth + 44, height: 42)
            labels
        }
        .frame(width: width, height: height)
        .glassEffect(.clear.tint(.black.opacity(0.08)).interactive(), in: .capsule)
        .animation(.smooth(duration: 0.3), value: selection)
        .contentShape(.capsule)
        .gesture(swipe)
        .sensoryFeedback(.selection, trigger: selection)
    }

    private var labels: some View {
        HStack(spacing: spacing) {
            ForEach(modes) { mode in
                Text(mode.title)
                    .font(.system(size: 15.5, weight: .medium))
                    .tracking(0.6)
                    .fixedSize()
                    .foregroundStyle(mode == selection ? Color.cameraYellow : .white)
                    .onGeometryChange(for: CGFloat.self, of: \.size.width) { widths[mode] = $0 }
                    .onTapGesture { select(mode) }
            }
        }
        .offset(x: offset + drag)
        .frame(width: width, height: height, alignment: .leading)
        .mask {
            LinearGradient(
                stops: [.init(color: .clear, location: 0), .init(color: .black, location: 0.1),
                        .init(color: .black, location: 0.9), .init(color: .clear, location: 1)],
                startPoint: .leading, endPoint: .trailing
            )
        }
    }

    private var offset: CGFloat {
        guard let index = modes.firstIndex(of: selection) else { return 0 }
        let before = modes[..<index].reduce(0) { $0 + (widths[$1] ?? 0) + spacing }
        return width / 2 - before - (widths[selection] ?? 0) / 2
    }

    private var swipe: some Gesture {
        DragGesture(minimumDistance: 12)
            .updating($drag) { value, state, _ in state = value.translation.width * 0.5 }
            .onEnded { value in step(value.translation.width < 0 ? 1 : -1) }
    }

    private func step(_ delta: Int) {
        guard let index = modes.firstIndex(of: selection) else { return }
        let next = min(max(index + delta, 0), modes.count - 1)
        select(modes[next])
    }
}
