import Photos
import SwiftUI
import UIKit

public struct PhotosBrowser: View {
    let onDismiss: () -> Void
    @State private var library: Library
    @State private var path: [String]
    @State private var current: String?
    @Namespace private var namespace

    public init(onDismiss: @escaping () -> Void) {
        self.onDismiss = onDismiss
        let library = Library()
        let newest = library.assets.last?.localIdentifier
        _library = State(initialValue: library)
        _path = State(initialValue: newest.map { [$0] } ?? [])
        _current = State(initialValue: newest)
    }

    public var body: some View {
        NavigationStack(path: $path) {
            AssetGrid(library: library, path: $path, current: $current, namespace: namespace, onDismiss: onDismiss)
                .navigationDestination(for: String.self) { _ in
                    AssetViewer(library: library, path: $path, current: $current, onDismiss: onDismiss)
                        .navigationTransition(.zoom(sourceID: current, in: namespace))
                }
        }
        .presentationBackground(.clear)
        .task {
            guard !library.isAuthorized else { return }
            _ = await Self.requestAccess()
            library.reload()
            guard path.isEmpty, let newest = library.assets.last?.localIdentifier else { return }
            current = newest
            withTransaction(Transaction(animation: nil)) { path = [newest] }
        }
    }

    public static func requestAccess() async -> PHAuthorizationStatus {
        await PHPhotoLibrary.requestAuthorization(for: .readWrite)
    }

    public static func latestThumbnail(pointSize: CGSize, scale: CGFloat) async -> UIImage? {
        guard let asset = Library.fetch(newestFirst: true, limit: 1).firstObject else { return nil }
        let size = CGSize(width: pointSize.width * scale, height: pointSize.height * scale)
        var latest: UIImage?
        for await image in PHImageManager.default().images(for: asset, size: size) {
            latest = image
        }
        return latest
    }
}
