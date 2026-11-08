import CoreLocation
import Photos

actor PendingCaptures {
    static let shared = PendingCaptures()

    nonisolated static let root = URL.temporaryDirectory.appending(path: "PendingCaptures", directoryHint: .isDirectory)

    private var saving: Set<URL> = []

    func stage(_ resources: [(PHAssetResourceType, Staged)]) throws -> URL {
        let capture = Self.root.appending(path: UUID().uuidString, directoryHint: .isDirectory)
        let files = FileManager.default
        for (type, source) in resources {
            let folder = capture.appending(path: "\(type.rawValue)", directoryHint: .isDirectory)
            try files.createDirectory(at: folder, withIntermediateDirectories: true)
            switch source {
            case .data(let data, let filename): try data.write(to: folder.appending(path: filename))
            case .file(let url): try files.moveItem(at: url, to: folder.appending(path: url.lastPathComponent))
            }
        }
        return capture
    }

    func save(_ capture: URL, location: CLLocation?) async throws {
        guard saving.insert(capture).inserted else { return }
        defer { saving.remove(capture) }
        let files = FileManager.default
        var resources: [LibraryResource] = []
        let types = try files.contentsOfDirectory(atPath: capture.path).compactMap(Int.init).sorted()
        for raw in types {
            guard let type = PHAssetResourceType(rawValue: raw) else { continue }
            let folder = capture.appending(path: "\(raw)", directoryHint: .isDirectory)
            for file in try files.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil) {
                resources.append(.file(type, file))
            }
        }
        _ = try await LibrarySaver.save(resources, location: location)
        try files.removeItem(at: capture)
    }

    func retryAll(location: CLLocation?) async -> Error? {
        let captures = (try? FileManager.default.contentsOfDirectory(at: Self.root, includingPropertiesForKeys: nil)) ?? []
        var failure: Error?
        for capture in captures {
            do { try await save(capture, location: location) } catch { failure = error }
        }
        return failure
    }

    enum Staged: Sendable {
        case data(Data, filename: String)
        case file(URL)
    }
}
