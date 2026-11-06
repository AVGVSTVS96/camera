import AVFoundation
import ImageIO
import MapKit
import Photos
import SwiftUI
import UniformTypeIdentifiers

struct AssetInfo: View {
    let asset: PHAsset
    @State private var details: Details?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(dateLine)
                    .font(.headline)

                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Text(details?.camera ?? "No Camera Information")
                            .font(.subheadline.weight(.semibold))
                        Spacer()
                        if let format = details?.format {
                            Text(format)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(.quaternary, in: .rect(cornerRadius: 4))
                        }
                    }
                    .padding(12)
                    .background(.quaternary.opacity(0.5))

                    VStack(alignment: .leading, spacing: 4) {
                        if let lens = details?.lens { Text(lens) }
                        Text(sizeLine)
                        if let filename = details?.filename {
                            Text(filename).foregroundStyle(.secondary)
                        }
                    }
                    .font(.subheadline)
                    .padding(12)

                    if let exposure = details?.exposure, !exposure.isEmpty {
                        Divider()
                        HStack {
                            ForEach(exposure.indices, id: \.self) { index in
                                if index > 0 { Divider() }
                                Text(exposure[index]).frame(maxWidth: .infinity)
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.vertical, 10)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.background.secondary, in: .rect(cornerRadius: 14))
                .clipShape(.rect(cornerRadius: 14))

                if let location = asset.location {
                    Map(initialPosition: .camera(MapCamera(centerCoordinate: location.coordinate, distance: 2000))) {
                        Marker("", coordinate: location.coordinate)
                    }
                    .frame(height: 200)
                    .clipShape(.rect(cornerRadius: 14))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
        }
        .task(id: asset.localIdentifier) {
            details = await Details.load(for: asset)
        }
    }

    private var dateLine: String {
        guard let date = asset.creationDate else { return "" }
        return [
            date.formatted(.dateTime.weekday(.wide)),
            date.formatted(date: .abbreviated, time: .omitted),
            date.formatted(date: .omitted, time: .shortened),
        ].joined(separator: " • ")
    }

    private var sizeLine: String {
        let megapixels = Double(asset.pixelWidth * asset.pixelHeight) / 1_000_000
        var parts = ["\(asset.pixelWidth) × \(asset.pixelHeight)"]
        if asset.mediaType == .image { parts.insert("\(Int(megapixels.rounded())) MP", at: 0) }
        if asset.mediaType == .video {
            parts.append(Duration.seconds(asset.duration.rounded()).formatted(.time(pattern: .minuteSecond)))
        }
        if let bytes = details?.bytes { parts.append(bytes.formatted(.byteCount(style: .file))) }
        return parts.joined(separator: " • ")
    }
}

private struct Details: Sendable {
    var camera: String?
    var lens: String?
    var format: String?
    var filename: String?
    var bytes: Int64?
    var exposure: [String] = []

    static func load(for asset: PHAsset) async -> Details {
        let resource = PHAssetResource.assetResources(for: asset).first { [.photo, .video].contains($0.type) }
        var details = asset.mediaType == .video
            ? await video(asset)
            : image(await PHImageManager.default().imageData(for: asset))
        details.filename = resource?.filename
        details.format = resource.flatMap { UTType($0.uniformTypeIdentifier) }.map(formatName)
        return details
    }

    private static func formatName(_ type: UTType) -> String {
        if type.conforms(to: .heic) || type.conforms(to: .heif) { return "HEIF" }
        if type.conforms(to: .quickTimeMovie) { return "MOV" }
        return type.preferredFilenameExtension?.uppercased() ?? type.identifier
    }

    nonisolated private static func image(_ data: Data?) -> Details {
        guard let data,
              let source = CGImageSourceCreateWithData(data as CFData, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
        else { return Details() }
        let tiff = properties[kCGImagePropertyTIFFDictionary] as? [CFString: Any] ?? [:]
        let exif = properties[kCGImagePropertyExifDictionary] as? [CFString: Any] ?? [:]
        let make = tiff[kCGImagePropertyTIFFMake] as? String
        let model = tiff[kCGImagePropertyTIFFModel] as? String
        let camera = [model?.hasPrefix(make ?? "\u{0}") == true ? nil : make, model].compactMap(\.self).joined(separator: " ")
        let focal = exif[kCGImagePropertyExifFocalLenIn35mmFilm] as? Int
        let aperture = exif[kCGImagePropertyExifFNumber] as? Double
        let iso = (exif[kCGImagePropertyExifISOSpeedRatings] as? [Int])?.first
        let bias = exif[kCGImagePropertyExifExposureBiasValue] as? Double
        let shutter = exif[kCGImagePropertyExifExposureTime] as? Double

        return Details(
            camera: camera.isEmpty ? nil : camera,
            lens: exif[kCGImagePropertyExifLensModel] as? String,
            bytes: Int64(data.count),
            exposure: [
                iso.map { "ISO \($0)" },
                focal.map { "\($0) mm" },
                bias.map { "\($0.formatted(.number.precision(.fractionLength(0...1)))) ev" },
                aperture.map { "ƒ\($0.formatted(.number.precision(.fractionLength(0...2))))" },
                shutter.map { $0 >= 1 ? "\($0.formatted()) s" : "1/\(Int((1 / $0).rounded())) s" },
            ].compactMap(\.self)
        )
    }

    private static func video(_ asset: PHAsset) async -> Details {
        guard let video = await PHImageManager.default().video(for: asset) else { return Details() }
        var details = Details()
        if let url = (video as? AVURLAsset)?.url {
            details.bytes = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize).map(Int64.init)
        }
        if let track = try? await video.loadTracks(withMediaType: .video).first,
           let fps = try? await track.load(.nominalFrameRate), fps > 0 {
            details.exposure = ["\(Int(fps.rounded())) FPS"]
        }
        let metadata = (try? await video.load(.commonMetadata)) ?? []
        let make = try? await AVMetadataItem.metadataItems(from: metadata, filteredByIdentifier: .commonIdentifierMake).first?.load(.stringValue)
        let model = try? await AVMetadataItem.metadataItems(from: metadata, filteredByIdentifier: .commonIdentifierModel).first?.load(.stringValue)
        let camera = [make, model].compactMap { $0 ?? nil }.joined(separator: " ")
        details.camera = camera.isEmpty ? nil : camera
        return details
    }
}
