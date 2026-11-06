import Photos
import SwiftUI

struct AssetGrid: View {
    let library: Library
    @Binding var path: [String]
    @Binding var current: String?
    let namespace: Namespace.ID
    let onDismiss: () -> Void

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 110), spacing: 2)], spacing: 2) {
                    ForEach(library.assets, id: \.localIdentifier) { asset in
                        Button {
                            current = asset.localIdentifier
                            path = [asset.localIdentifier]
                        } label: {
                            Thumbnail(asset: asset, manager: library.images)
                        }
                        .buttonStyle(.plain)
                        .matchedTransitionSource(id: asset.localIdentifier, in: namespace)
                    }
                }
                Text(library.assets.summary)
                    .font(.subheadline.weight(.semibold))
                    .padding(.vertical, 24)
            }
            .defaultScrollAnchor(.bottom)
            .ignoresSafeArea(edges: .horizontal)
            .overlay {
                if !library.isAuthorized {
                    ContentUnavailableView("No Access to Photos", systemImage: "photo.on.rectangle", description: Text("Allow access in Settings to see your photos here."))
                } else if library.assets.isEmpty {
                    ContentUnavailableView("No Photos or Videos", systemImage: "photo.on.rectangle")
                }
            }
            .onChange(of: path.isEmpty) {
                if path.isEmpty { proxy.scrollTo(current, anchor: .center) }
            }
        }
        .navigationTitle("Recents")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button(role: .close, action: onDismiss)
            }
        }
    }
}

private struct Thumbnail: View {
    let asset: PHAsset
    let manager: PHCachingImageManager
    @State private var image: UIImage?
    @Environment(\.displayScale) private var scale

    var body: some View {
        Color(.secondarySystemFill)
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                if let image {
                    Image(uiImage: image).resizable().scaledToFill()
                }
            }
            .clipped()
            .overlay(alignment: .bottom) {
                HStack {
                    if asset.isFavorite { Image(systemName: "heart.fill") }
                    Spacer()
                    if asset.mediaType == .video {
                        Text(Duration.seconds(asset.duration.rounded()).formatted(.time(pattern: .minuteSecond)))
                    }
                }
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white)
                .shadow(color: .black.opacity(0.4), radius: 2)
                .padding(5)
            }
            .contentShape(.rect)
            .task(id: asset.localIdentifier) {
                let side = 180 * scale
                for await image in manager.images(for: asset, size: CGSize(width: side, height: side)) {
                    self.image = image
                }
            }
    }
}
