import AVFoundation
import Photos
import PhotosUI
import SwiftUI

struct AssetPage: View {
    let asset: PHAsset
    let manager: PHImageManager
    let isCurrent: Bool
    let player: AVPlayer?
    let onTap: () -> Void
    let onZoom: (Bool) -> Void
    let onDrag: (CGFloat) -> Void
    let onDismiss: () -> Void
    @State private var image: UIImage?
    @State private var livePhoto: PHLivePhoto?
    @State private var isZoomed = false
    @Environment(\.displayScale) private var scale

    var body: some View {
        GeometryReader { proxy in
            ZoomView(
                pixelSize: asset.pixelSize,
                image: image,
                livePhoto: livePhoto,
                player: player,
                isCurrent: isCurrent,
                onTap: onTap,
                onZoom: { isZoomed = $0; onZoom($0) },
                onDrag: onDrag,
                onDismiss: onDismiss
            )
            .task(id: isZoomed) {
                let longest = isZoomed ? 4096 : max(proxy.size.width, proxy.size.height) * scale
                let size = CGSize(width: longest, height: longest)
                for await image in manager.images(for: asset, size: size, contentMode: .aspectFit) {
                    self.image = image
                }
            }
            .task(id: asset.localIdentifier) {
                guard asset.isLivePhoto else { return }
                let size = CGSize(width: proxy.size.width * scale, height: proxy.size.height * scale)
                for await livePhoto in manager.livePhoto(for: asset, size: size) {
                    self.livePhoto = livePhoto
                }
            }
        }
    }
}

private struct ZoomView: UIViewRepresentable {
    let pixelSize: CGSize
    let image: UIImage?
    let livePhoto: PHLivePhoto?
    let player: AVPlayer?
    let isCurrent: Bool
    let onTap: () -> Void
    let onZoom: (Bool) -> Void
    let onDrag: (CGFloat) -> Void
    let onDismiss: () -> Void

    func makeUIView(context: Context) -> ZoomingScrollView { ZoomingScrollView() }

    func updateUIView(_ view: ZoomingScrollView, context: Context) {
        view.pixelSize = pixelSize
        view.imageView.image = image
        if view.liveView.livePhoto !== livePhoto { view.liveView.livePhoto = livePhoto }
        view.playerView.player = player
        view.isCurrent = isCurrent
        view.onTap = onTap
        view.onZoom = onZoom
        view.onDrag = onDrag
        view.onDismiss = onDismiss
    }
}

private final class ZoomingScrollView: UIScrollView, UIScrollViewDelegate {
    let imageView = UIImageView()
    let liveView = PHLivePhotoView()
    let playerView = PlayerView()
    var onTap: () -> Void = {}
    var onZoom: (Bool) -> Void = { _ in }
    var onDrag: (CGFloat) -> Void = { _ in }
    var onDismiss: () -> Void = {}
    var pixelSize = CGSize.zero {
        didSet { if pixelSize != oldValue { fit() } }
    }
    var isCurrent = false {
        didSet {
            guard isCurrent != oldValue else { return }
            if isCurrent {
                liveView.startPlayback(with: .hint)
            } else if zoomScale != minimumZoomScale {
                setZoomScale(minimumZoomScale, animated: false)
                onZoom(false)
            }
        }
    }
    private let content = UIView()
    private let dismissPan = UIPanGestureRecognizer()
    private var fittedBounds = CGSize.zero

    init() {
        super.init(frame: .zero)
        delegate = self
        showsHorizontalScrollIndicator = false
        showsVerticalScrollIndicator = false
        contentInsetAdjustmentBehavior = .never
        decelerationRate = .fast
        addSubview(content)
        for view in [imageView, liveView, playerView] {
            view.frame = content.bounds
            view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            view.contentMode = .scaleAspectFit
            content.addSubview(view)
        }

        let doubleTap = UITapGestureRecognizer(target: self, action: #selector(doubleTapped))
        doubleTap.numberOfTapsRequired = 2
        let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
        tap.require(toFail: doubleTap)
        dismissPan.addTarget(self, action: #selector(panned))
        [doubleTap, tap, dismissPan].forEach(addGestureRecognizer)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func layoutSubviews() {
        super.layoutSubviews()
        if bounds.size != fittedBounds {
            fittedBounds = bounds.size
            fit()
        }
    }

    private func fit() {
        guard bounds.width > 0, bounds.height > 0 else { return }
        zoomScale = 1
        let size = pixelSize == .zero ? bounds.size : AVMakeRect(aspectRatio: pixelSize, insideRect: bounds).size
        content.frame = CGRect(origin: .zero, size: size)
        contentSize = size
        maximumZoomScale = max(3, pixelSize.width / (size.width * traitCollection.displayScale))
        center()
        contentOffset = CGPoint(x: -contentInset.left, y: -contentInset.top)
    }

    private func center() {
        let x = max(0, (bounds.width - contentSize.width) / 2)
        let y = max(0, (bounds.height - contentSize.height) / 2)
        let inset = UIEdgeInsets(top: y, left: x, bottom: y, right: x)
        if contentInset != inset { contentInset = inset }
    }

    func viewForZooming(in scrollView: UIScrollView) -> UIView? { content }

    func scrollViewDidZoom(_ scrollView: UIScrollView) { center() }

    func scrollViewDidEndZooming(_ scrollView: UIScrollView, with view: UIView?, atScale scale: CGFloat) {
        onZoom(scale > minimumZoomScale)
    }

    @objc private func tapped() { onTap() }

    @objc private func doubleTapped(_ gesture: UITapGestureRecognizer) {
        guard zoomScale == minimumZoomScale else {
            return setZoomScale(minimumZoomScale, animated: true)
        }
        let fill = max(bounds.width / contentSize.width, bounds.height / contentSize.height)
        let scale = min(maximumZoomScale, fill > 1.2 ? fill : 2.5)
        let point = gesture.location(in: content)
        let size = CGSize(width: bounds.width / scale, height: bounds.height / scale)
        zoom(to: CGRect(origin: CGPoint(x: point.x - size.width / 2, y: point.y - size.height / 2), size: size), animated: true)
    }

    override func gestureRecognizerShouldBegin(_ gesture: UIGestureRecognizer) -> Bool {
        guard gesture === dismissPan else { return super.gestureRecognizerShouldBegin(gesture) }
        let velocity = dismissPan.velocity(in: self)
        return zoomScale == minimumZoomScale && velocity.y > abs(velocity.x)
    }

    @objc private func panned(_ gesture: UIPanGestureRecognizer) {
        let translation = gesture.translation(in: superview)
        let progress = min(1, max(0, translation.y / bounds.height))
        switch gesture.state {
        case .changed:
            let scale = 1 - progress / 2
            transform = CGAffineTransform(translationX: translation.x, y: translation.y).scaledBy(x: scale, y: scale)
            onDrag(progress)
        case .ended where translation.y > 100 || gesture.velocity(in: superview).y > 800:
            onDismiss()
        default:
            UIView.animate(springDuration: 0.35, bounce: 0.15) { transform = .identity }
            onDrag(0)
        }
    }
}

private final class PlayerView: UIView {
    override static var layerClass: AnyClass { AVPlayerLayer.self }

    var player: AVPlayer? {
        get { (layer as? AVPlayerLayer)?.player }
        set { (layer as? AVPlayerLayer)?.player = newValue }
    }
}
