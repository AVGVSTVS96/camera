import CoreLocation
import Photos

nonisolated enum LibraryResource: Sendable {
    case file(PHAssetResourceType, URL)
    case data(PHAssetResourceType, Data, filename: String)
}

nonisolated enum LibrarySaver {
    static func save(_ resources: [LibraryResource], location: CLLocation? = nil) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            nonisolated(unsafe) var identifier: String?
            PHPhotoLibrary.shared().performChanges {
                let request = PHAssetCreationRequest.forAsset()
                request.location = location
                for resource in resources {
                    let options = PHAssetResourceCreationOptions()
                    switch resource {
                    case .file(let type, let url):
                        options.originalFilename = url.lastPathComponent
                        request.addResource(with: type, fileURL: url, options: options)
                    case .data(let type, let data, let filename):
                        options.originalFilename = filename
                        request.addResource(with: type, data: data, options: options)
                    }
                }
                identifier = request.placeholderForCreatedAsset?.localIdentifier
            } completionHandler: { success, error in
                if success, let identifier {
                    continuation.resume(returning: identifier)
                } else {
                    continuation.resume(throwing: error ?? CocoaError(.fileWriteUnknown))
                }
            }
        }
    }
}
