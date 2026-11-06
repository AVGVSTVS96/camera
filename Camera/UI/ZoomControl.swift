import SwiftUI

struct ZoomControl: View {
    let model: CameraModel
    @Binding var dialOpen: Bool

    @State private var dragStart: CGFloat?

    private var stops: [CGFloat] { model.capabilities.zoomStops }
    private var range: ClosedRange<CGFloat> { model.capabilities.zoomRange }

    var body: some View {
        ZStack(alignment: .bottom) {
            if dialOpen {
                ZoomDial(zoom: model.zoom, range: range, stops: stops)
                    .transition(.opacity.combined(with: .scale(scale: 0.96, anchor: .bottom)))
            } else {
                stopsRow.transition(.opacity)
            }
        }
        .frame(height: dialOpen ? 120 : 44, alignment: .bottom)
        .contentShape(.rect)
        .gesture(dialGesture)
        .animation(.smooth(duration: 0.25), value: dialOpen)
        .sensoryFeedback(.selection, trigger: activeStop)
    }

    private var stopsRow: some View {
        HStack(spacing: 1) {
            ForEach(stops, id: \.self) { stop in
                let active = stop == activeStop
                Button {
                    model.setZoom(stop, animated: true)
                } label: {
                    Text(label(for: stop, active: active))
                        .font(.system(size: active ? 14 : 15.5, weight: .medium).monospacedDigit())
                        .foregroundStyle(active ? Color.cameraYellow : .white)
                        .rotationEffect(model.glyphRotation)
                        .frame(width: 38, height: 38)
                        .background {
                            if active { Circle().fill(.black.opacity(0.42)) }
                        }
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var activeStop: CGFloat? {
        stops.last { model.zoom >= $0 - 0.001 }
    }

    private func label(for stop: CGFloat, active: Bool) -> String {
        let value = active ? model.zoom : stop
        let rounded = (value * 10).rounded() / 10
        var text = Double(rounded).formatted(.number.precision(.fractionLength(0...1)))
        if text.hasPrefix("0") { text.removeFirst() }
        return active ? text + "×" : text
    }

    private var dialGesture: some Gesture {
        LongPressGesture(minimumDuration: 0.25)
            .sequenced(before: DragGesture(minimumDistance: 0))
            .onChanged { value in
                guard case .second(true, let drag) = value else { return }
                if !dialOpen { dialOpen = true }
                let start = dragStart ?? model.zoom
                dragStart = start
                let dx = drag?.translation.width ?? 0
                let factor = start * pow(2, -dx / 90)
                model.setZoom(min(max(factor, range.lowerBound), range.upperBound), animated: false)
            }
            .onEnded { _ in
                dragStart = nil
                Task {
                    try? await Task.sleep(for: .seconds(1.2))
                    if dragStart == nil { dialOpen = false }
                }
            }
    }
}

struct ZoomDial: View {
    let zoom: CGFloat
    let range: ClosedRange<CGFloat>
    let stops: [CGFloat]

    var body: some View {
        Canvas { context, size in
            let radius = size.width * 1.1
            let center = CGPoint(x: size.width / 2, y: radius + 30)
            let spread = 0.09
            let current = log2(zoom)
            var t = log2(range.lowerBound)
            while t <= log2(range.upperBound) + 0.0001 {
                let value = pow(2, t)
                let isStop = stops.contains { abs($0 - value) < 0.01 }
                let angle = -Double.pi / 2 + (t - current) * spread * 4.5
                let length: CGFloat = isStop ? 14 : 8
                let outer = point(center, radius, angle)
                let inner = point(center, radius - length, angle)
                var path = Path()
                path.move(to: outer)
                path.addLine(to: inner)
                context.stroke(path, with: .color(.white.opacity(isStop ? 1 : 0.6)), lineWidth: isStop ? 1.5 : 1)
                if isStop {
                    let labelPoint = point(center, radius - 28, angle)
                    var label = Double(value).formatted(.number.precision(.fractionLength(0...1)))
                    if label.hasPrefix("0") { label.removeFirst() }
                    context.draw(Text(label).font(.system(size: 13, weight: .medium)).foregroundStyle(.white), at: labelPoint)
                }
                t += 1.0 / 12
            }
            var marker = Path()
            marker.move(to: CGPoint(x: size.width / 2, y: 30 - 6))
            marker.addLine(to: CGPoint(x: size.width / 2, y: 30 + 14))
            context.stroke(marker, with: .color(.cameraYellow), lineWidth: 2)
        }
        .overlay(alignment: .top) {
            Text((Double(zoom).formatted(.number.precision(.fractionLength(1)))) + "×")
                .font(.system(size: 14, weight: .semibold).monospacedDigit())
                .foregroundStyle(Color.cameraYellow)
                .offset(y: -2)
        }
        .padding(.top, 4)
        .background {
            Ellipse()
                .fill(.black.opacity(0.35))
                .frame(width: 900, height: 900)
                .offset(y: 450 - 10)
                .clipped()
        }
        .clipShape(.rect)
        .allowsHitTesting(false)
    }

    private func point(_ center: CGPoint, _ radius: CGFloat, _ angle: Double) -> CGPoint {
        CGPoint(x: center.x + radius * cos(angle), y: center.y + radius * sin(angle))
    }
}
