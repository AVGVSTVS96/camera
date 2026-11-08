import AVFoundation
import Photos
import UIKit

@Observable
final class Library: NSObject, PHPhotoLibraryChangeObserver {
    private(set) var assets = Assets(result: PHFetchResult())
    private(set) var isAuthorized = false
    let images = PHCachingImageManager()

    override init() {
        super.init()
        reload()
    }

    deinit {
        PHPhotoLibrary.shared().unregisterChangeObserver(self)
    }

    func reload() {
        let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        guard status == .authorized || status == .limited else { return }
        if !isAuthorized {
            isAuthorized = true
            PHPhotoLibrary.shared().register(self)
        }
        assets = Assets(result: Self.fetch())
    }

    nonisolated func photoLibraryDidChange(_ change: PHChange) {
        Task { @MainActor in reload() }
    }

    static func fetch(newestFirst: Bool = false, limit: Int = 0) -> PHFetchResult<PHAsset> {
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: !newestFirst)]
        options.fetchLimit = limit
        return PHAsset.fetchAssets(with: options)
    }
}

nonisolated struct Assets: RandomAccessCollection, Equatable {
    let result: PHFetchResult<PHAsset>

    var startIndex: Int { 0 }
    var endIndex: Int { result.count }
    subscript(index: Int) -> PHAsset { result.object(at: index) }

    func index(of id: String?) -> Int? {
        firstIndex { $0.localIdentifier == id }
    }

    var summary: String {
        let photos = result.countOfAssets(with: .image)
        let videos = result.countOfAssets(with: .video)
        return [
            photos > 0 ? "\(photos.formatted()) \(photos == 1 ? "Photo" : "Photos")" : nil,
            videos > 0 ? "\(videos.formatted()) \(videos == 1 ? "Video" : "Videos")" : nil,
        ].compactMap(\.self).joined(separator: ", ")
    }
}

extension PHAsset {
    var pixelSize: CGSize { CGSize(width: pixelWidth, height: pixelHeight) }
    var isLivePhoto: Bool { mediaSubtypes.contains(.photoLive) }

    nonisolated func setFavorite(_ isFavorite: Bool) {
        let asset = self
        PHPhotoLibrary.shared().performChanges {
            PHAssetChangeRequest(for: asset).isFavorite = isFavorite
        }
    }

    nonisolated func delete() {
        let asset = self
        PHPhotoLibrary.shared().performChanges {
            PHAssetChangeRequest.deleteAssets([asset] as NSArray)
        }
    }
}

extension PHImageManager {
    nonisolated func images(for asset: PHAsset, size: CGSize, contentMode: PHImageContentMode = .aspectFill) -> AsyncStream<UIImage> {
        AsyncStream { continuation in
            let options = PHImageRequestOptions()
            options.deliveryMode = .opportunistic
            options.resizeMode = .fast
            options.isNetworkAccessAllowed = true
            let request = requestImage(for: asset, targetSize: size, contentMode: contentMode, options: options) { image, info in
                if let image { continuation.yield(image) }
                if info?[PHImageResultIsDegradedKey] as? Bool != true { continuation.finish() }
            }
            continuation.onTermination = { _ in self.cancelImageRequest(request) }
        }
    }

    nonisolated func livePhoto(for asset: PHAsset, size: CGSize) -> AsyncStream<PHLivePhoto> {
        AsyncStream { continuation in
            let options = PHLivePhotoRequestOptions()
            options.deliveryMode = .highQualityFormat
            options.isNetworkAccessAllowed = true
            let request = requestLivePhoto(for: asset, targetSize: size, contentMode: .aspectFit, options: options) { livePhoto, info in
                if let livePhoto { continuation.yield(livePhoto) }
                if info?[PHImageResultIsDegradedKey] as? Bool != true { continuation.finish() }
            }
            continuation.onTermination = { _ in self.cancelImageRequest(request) }
        }
    }

    nonisolated func video(for asset: PHAsset) async -> AVAsset? {
        await withCheckedContinuation { continuation in
            let options = PHVideoRequestOptions()
            options.isNetworkAccessAllowed = true
            requestAVAsset(forVideo: asset, options: options) { video, _, _ in
                nonisolated(unsafe) let video = video
                continuation.resume(returning: video)
            }
        }
    }

    nonisolated func imageData(for asset: PHAsset) async -> Data? {
        await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.isNetworkAccessAllowed = true
            options.version = .original
            requestImageDataAndOrientation(for: asset, options: options) { data, _, _, _ in
                continuation.resume(returning: data)
            }
        }
    }
}
