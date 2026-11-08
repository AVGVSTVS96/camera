#if DEBUG
import Photos
import UIKit

enum LiveRecovery {
    struct Pair: Codable {
        var stillPersistenceUUID: String
        var photoFilename: String
        var movieFilename: String
        var previousStagedPhotoFilename: String?
    }

    struct Entry: Codable {
        var photoFilename: String
        var movieFilename: String
        var status: String
        var assetID: String?
        var mediaSubtypes: [String] = []
        var isLivePhoto = false
        var resources: [String] = []
        var deletedTemporaryFiles = false
        var detail: String?
    }

    struct Report: Codable {
        var startedAt: Date
        var finishedAt: Date?
        var authorization: String
        var entries: [Entry] = []
    }

    static func run() async {
        let documents = URL.documentsDirectory
        let tmp = FileManager.default.temporaryDirectory
        let status = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        var report = Report(startedAt: .now, authorization: name(status))

        do {
            let pairs = try JSONDecoder().decode(
                [Pair].self, from: Data(contentsOf: documents.appending(path: "live-recovery-manifest.json")))
            if status == .authorized {
                let existing = existingLiveFilenames()
                for pair in pairs {
                    report.entries.append(await recover(pair, in: tmp, existing: existing))
                }
            }
        } catch {
            report.entries.append(Entry(photoFilename: "", movieFilename: "", status: "manifestError", detail: "\(error)"))
        }

        report.finishedAt = .now
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let data = (try? encoder.encode(report)) ?? Data()
        try? data.write(to: documents.appending(path: "live-recovery-report.json"))
        print(String(decoding: data, as: UTF8.self))
    }

    private static func recover(_ pair: Pair, in tmp: URL, existing: Set<String>) async -> Entry {
        var entry = Entry(photoFilename: pair.photoFilename, movieFilename: pair.movieFilename, status: "")
        let photo = tmp.appending(path: pair.photoFilename)
        let movie = tmp.appending(path: pair.movieFilename)

        let candidates = [pair.photoFilename, pair.previousStagedPhotoFilename].compactMap(\.self)
        if let match = candidates.first(where: existing.contains) {
            entry.status = "skippedAlreadyInLibrary"
            entry.detail = match
            return entry
        }
        guard FileManager.default.fileExists(atPath: photo.path), FileManager.default.fileExists(atPath: movie.path) else {
            entry.status = "missingFiles"
            return entry
        }
        if let failure = await validate(photo: photo, movie: movie) {
            entry.status = "invalidLivePhoto"
            entry.detail = failure
            return entry
        }

        do {
            let id = try await LibrarySaver.save([.file(.photo, photo), .file(.pairedVideo, movie)])
            entry.assetID = id
            guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [id], options: nil).firstObject else {
                entry.status = "savedButNotFetched"
                return entry
            }
            let resources = PHAssetResource.assetResources(for: asset)
            entry.mediaSubtypes = names(asset.mediaSubtypes)
            entry.isLivePhoto = asset.mediaSubtypes.contains(.photoLive)
            entry.resources = resources.map { "\(name($0.type)):\($0.filename ?? "")" }
            let types = Set(resources.map(\.type))
            guard entry.isLivePhoto, types.contains(.photo), types.contains(.pairedVideo) else {
                entry.status = "savedButNotLive"
                return entry
            }
            try FileManager.default.removeItem(at: photo)
            try FileManager.default.removeItem(at: movie)
            entry.deletedTemporaryFiles = true
            entry.status = "recovered"
        } catch {
            entry.status = entry.assetID == nil ? "saveFailed" : "deleteFailed"
            entry.detail = "\(error)"
        }
        return entry
    }

    private static func validate(photo: URL, movie: URL) async -> String? {
        await withCheckedContinuation { continuation in
            var resumed = false
            func finish(_ result: String?) {
                guard !resumed else { return }
                resumed = true
                continuation.resume(returning: result)
            }
            let request = PHLivePhoto.request(
                withResourceFileURLs: [photo, movie], placeholderImage: nil,
                targetSize: CGSize(width: 1024, height: 1024), contentMode: .aspectFit
            ) { livePhoto, info in
                MainActor.assumeIsolated {
                    if let error = info[PHLivePhotoInfoErrorKey] {
                        finish("\(error)")
                    } else if info[PHLivePhotoInfoCancelledKey] as? Bool == true {
                        finish("cancelled")
                    } else if livePhoto != nil, info[PHLivePhotoInfoIsDegradedKey] as? Bool != true {
                        finish(nil)
                    }
                }
            }
            Task {
                try? await Task.sleep(for: .seconds(30))
                PHLivePhoto.cancelRequest(withRequestID: request)
                finish("timedOut")
            }
        }
    }

    private static func existingLiveFilenames() -> Set<String> {
        let options = PHFetchOptions()
        options.predicate = NSPredicate(format: "(mediaSubtypes & %d) != 0", PHAssetMediaSubtype.photoLive.rawValue)
        options.includeHiddenAssets = true
        var names = Set<String>()
        PHAsset.fetchAssets(with: .image, options: options).enumerateObjects { asset, _, _ in
            for resource in PHAssetResource.assetResources(for: asset) {
                if let filename = resource.filename { names.insert(filename) }
            }
        }
        return names
    }

    private static func name(_ status: PHAuthorizationStatus) -> String {
        switch status {
        case .authorized: "authorized"
        case .limited: "limited"
        case .denied: "denied"
        case .restricted: "restricted"
        case .notDetermined: "notDetermined"
        @unknown default: "\(status.rawValue)"
        }
    }

    private static func names(_ subtypes: PHAssetMediaSubtype) -> [String] {
        let known: [(PHAssetMediaSubtype, String)] = [
            (.photoPanorama, "photoPanorama"), (.photoHDR, "photoHDR"), (.photoScreenshot, "photoScreenshot"),
            (.photoLive, "photoLive"), (.photoDepthEffect, "photoDepthEffect"), (.spatialMedia, "spatialMedia"),
            (.videoStreamed, "videoStreamed"), (.videoHighFrameRate, "videoHighFrameRate"),
            (.videoTimelapse, "videoTimelapse"), (.videoCinematic, "videoCinematic"),
        ]
        let named = known.filter { subtypes.contains($0.0) }
        let rest = subtypes.subtracting(PHAssetMediaSubtype(named.map(\.0)))
        return named.map(\.1) + (rest.isEmpty ? [] : ["raw:\(rest.rawValue)"])
    }

    private static func name(_ type: PHAssetResourceType) -> String {
        switch type {
        case .photo: "photo"
        case .video: "video"
        case .audio: "audio"
        case .alternatePhoto: "alternatePhoto"
        case .fullSizePhoto: "fullSizePhoto"
        case .fullSizeVideo: "fullSizeVideo"
        case .adjustmentData: "adjustmentData"
        case .adjustmentBasePhoto: "adjustmentBasePhoto"
        case .pairedVideo: "pairedVideo"
        case .fullSizePairedVideo: "fullSizePairedVideo"
        case .adjustmentBasePairedVideo: "adjustmentBasePairedVideo"
        case .adjustmentBaseVideo: "adjustmentBaseVideo"
        case .photoProxy: "photoProxy"
        @unknown default: "\(type.rawValue)"
        }
    }
}
#endif
