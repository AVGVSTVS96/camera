#if DEBUG
import SwiftUI

enum CameraFixture {
    static let capabilities = CameraCapabilities(
        modes: [.slowMotion, .cinematic, .video, .photo, .portrait],
        canFlip: true,
        zoomStops: [0.5, 1, 2],
        zoomRange: 0.5...10,
        flashModes: [.auto, .on, .off],
        torch: true,
        livePhoto: true,
        photoFormats: [12, 24, 48].flatMap { mp in
            [PhotoFormat(codec: .heif, megapixels: mp), PhotoFormat(codec: .jpeg, megapixels: mp)]
        },
        videoFormats: [
            VideoFormat(height: 2160, frameRate: 24, hdr: true),
            VideoFormat(height: 2160, frameRate: 30, hdr: true),
            VideoFormat(height: 2160, frameRate: 60, hdr: true),
            VideoFormat(height: 1080, frameRate: 30, hdr: true),
            VideoFormat(height: 1080, frameRate: 60, hdr: true),
        ],
        slowMotionFormats: [
            VideoFormat(height: 2160, frameRate: 120, hdr: true),
            VideoFormat(height: 1080, frameRate: 120, hdr: false),
            VideoFormat(height: 1080, frameRate: 240, hdr: false),
        ],
        aspectRatios: [.square, .fourByThree, .sixteenByNine],
        actionMode: true,
        macro: true,
        cinematicApertureRange: 2...16,
        exposureBiasRange: -2...2,
        activeDeviceID: "fixture.back.dual-wide"
    )

    static let image: UIImage = UIGraphicsImageRenderer(
        size: CGSize(width: 1080, height: 1440),
        format: { let f = UIGraphicsImageRendererFormat(); f.scale = 1; return f }()
    ).image { context in
        let cg = context.cgContext
        let size = CGSize(width: 1080, height: 1440)
        let space = CGColorSpaceCreateDeviceRGB()

        func gradient(_ colors: [UIColor], from: CGPoint, to: CGPoint) {
            let g = CGGradient(colorsSpace: space, colors: colors.map(\.cgColor) as CFArray, locations: nil)!
            cg.drawLinearGradient(g, start: from, end: to, options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
        }

        gradient(
            [UIColor(red: 0.29, green: 0.47, blue: 0.72, alpha: 1),
             UIColor(red: 0.93, green: 0.66, blue: 0.52, alpha: 1),
             UIColor(red: 0.99, green: 0.84, blue: 0.62, alpha: 1)],
            from: .zero, to: CGPoint(x: 0, y: 820)
        )

        let sun = CGPoint(x: 700, y: 690)
        let glow = CGGradient(
            colorsSpace: space,
            colors: [UIColor(red: 1, green: 0.95, blue: 0.8, alpha: 1).cgColor,
                     UIColor(red: 1, green: 0.8, blue: 0.55, alpha: 0).cgColor] as CFArray,
            locations: [0.18, 1]
        )!
        cg.drawRadialGradient(glow, startCenter: sun, startRadius: 0, endCenter: sun, endRadius: 420, options: [])

        func ridge(base: CGFloat, amplitude: CGFloat, phase: CGFloat, color: UIColor) {
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 0, y: size.height))
            for x in stride(from: 0, through: size.width, by: 8) {
                let t = x / size.width * .pi * 2
                let y = base - amplitude * (0.6 * sin(t * 1.3 + phase) + 0.4 * sin(t * 3.1 + phase * 2))
                path.addLine(to: CGPoint(x: x, y: y))
            }
            path.addLine(to: CGPoint(x: size.width, y: size.height))
            path.close()
            color.setFill()
            path.fill()
        }

        ridge(base: 780, amplitude: 70, phase: 0.4, color: UIColor(red: 0.56, green: 0.5, blue: 0.62, alpha: 1))
        ridge(base: 900, amplitude: 90, phase: 2.1, color: UIColor(red: 0.36, green: 0.36, blue: 0.5, alpha: 1))
        ridge(base: 1040, amplitude: 80, phase: 4.0, color: UIColor(red: 0.22, green: 0.27, blue: 0.36, alpha: 1))
        ridge(base: 1200, amplitude: 60, phase: 1.2, color: UIColor(red: 0.13, green: 0.18, blue: 0.22, alpha: 1))

        let water = CGRect(x: 0, y: 1260, width: size.width, height: 180)
        cg.saveGState()
        cg.clip(to: water)
        gradient(
            [UIColor(red: 0.24, green: 0.3, blue: 0.42, alpha: 1), UIColor(red: 0.08, green: 0.1, blue: 0.14, alpha: 1)],
            from: CGPoint(x: 0, y: water.minY), to: CGPoint(x: 0, y: water.maxY)
        )
        cg.restoreGState()
    }

    static func model() -> CameraModel {
        let model = CameraModel.simulated(capabilities: capabilities, frame: image)
        model.update {
            $0.photoFormat = PhotoFormat(codec: .heif, megapixels: 24)
            $0.videoFormat = VideoFormat(height: 2160, frameRate: 30, hdr: true)
            $0.slowMotionFormat = VideoFormat(height: 1080, frameRate: 240, hdr: false)
            $0.cinematicAperture = 2.8
            if let mode = argument("--fixture-mode").flatMap(CaptureMode.init(rawValue:)) { $0.mode = mode }
        }
        if let zoom = argument("--fixture-zoom").flatMap(Double.init) { model.setZoom(zoom, animated: false) }
        return model
    }

    static func flag(_ name: String) -> Bool {
        CommandLine.arguments.contains(name)
    }

    static func argument(_ name: String) -> String? {
        let arguments = CommandLine.arguments
        guard let index = arguments.firstIndex(of: name), index + 1 < arguments.count else { return nil }
        return arguments[index + 1]
    }

    static var emulatedSize: CGSize? {
        guard let parts = argument("--fixture-size")?.split(separator: "x").compactMap({ Double($0) }), parts.count == 2 else { return nil }
        return CGSize(width: parts[0], height: parts[1])
    }
}

extension View {
    @ViewBuilder func fixtureEmulatedSize() -> some View {
        if let size = CameraFixture.emulatedSize {
            GeometryReader { geometry in
                let scale = min(geometry.size.width / size.width, geometry.size.height / size.height)
                self.frame(width: size.width, height: size.height)
                    .scaleEffect(scale)
                    .frame(width: geometry.size.width, height: geometry.size.height)
            }
            .background(.black)
            .ignoresSafeArea()
        } else {
            self
        }
    }
}
#endif
