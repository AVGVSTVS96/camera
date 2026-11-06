import AVFoundation

nonisolated extension CameraCapabilities {
    init(device: AVCaptureDevice, photoOutput: AVCapturePhotoOutput, canFlip: Bool, canRecord: Bool) {
        let multiplier = device.displayVideoZoomFactorMultiplier
        let zoom = device.activeFormat.systemRecommendedVideoZoomRange
            ?? device.minAvailableVideoZoomFactor...device.maxAvailableVideoZoomFactor
        let native = [1] + device.virtualDeviceSwitchOverVideoZoomFactors.map { CGFloat($0.doubleValue) }
            + device.activeFormat.secondaryNativeResolutionZoomFactors.map { CGFloat($0) }
        let bias = device.activeFormat.systemRecommendedExposureBiasRange
            ?? device.minExposureTargetBias...device.maxExposureTargetBias
        let videoFormats = Self.videoFormats(of: device, frameRates: 24...60)
        let slowMotionFormats = Self.videoFormats(of: device, frameRates: 120...240).filter { !$0.hdr }
        let depth = device.formats.contains { !$0.supportedDepthDataFormats.isEmpty }
        let cinematic = device.formats.filter(\.isCinematicVideoCaptureSupported)

        var modes: [CaptureMode] = []
        if canRecord, !slowMotionFormats.isEmpty { modes.append(.slowMotion) }
        if canRecord, !cinematic.isEmpty { modes.append(.cinematic) }
        if canRecord { modes.append(.video) }
        modes.append(.photo)
        if depth { modes.append(.portrait) }
        if canRecord, Self.spatialDevice(near: device) != nil {
            modes.append(.spatial)
        }

        self.init(
            modes: modes,
            canFlip: canFlip,
            zoomStops: Self.stops(native.filter { zoom.contains($0) }.map { $0 * multiplier }),
            zoomRange: zoom.lowerBound * multiplier...zoom.upperBound * multiplier,
            flashModes: photoOutput.supportedFlashModes.compactMap(FlashMode.init),
            torch: device.hasTorch && device.isTorchModeSupported(.on),
            livePhoto: photoOutput.isLivePhotoCaptureSupported,
            photoFormats: Self.photoFormats(device: device, output: photoOutput),
            videoFormats: videoFormats,
            slowMotionFormats: slowMotionFormats,
            aspectRatios: [],
            actionMode: device.formats.contains { $0.isVideoStabilizationModeSupported(.cinematicExtendedEnhanced) },
            macro: device.primaryConstituentDeviceSwitchingBehavior != .unsupported
                && device.constituentDevices.contains { $0.deviceType == .builtInUltraWideCamera },
            cinematicApertureRange: cinematic.map { $0.minSimulatedAperture...$0.maxSimulatedAperture }.first,
            exposureBiasRange: bias,
            activeDeviceID: device.uniqueID,
            centerStage: device.formats.contains(where: \.isCenterStageSupported),
            stillsWhileRecording: canRecord
        )
    }

    static func stops(_ factors: [CGFloat]) -> [CGFloat] {
        Array(Set(factors.map { ($0 * 10).rounded() / 10 })).sorted()
    }

    static func photoFormats(device: AVCaptureDevice, output: AVCapturePhotoOutput) -> [PhotoFormat] {
        let megapixels = Set(device.activeFormat.supportedMaxPhotoDimensions.map(\.megapixels)).sorted()
        let codecs: [PhotoFormat.Codec] = [.heif, .jpeg].filter { output.availablePhotoCodecTypes.contains($0.videoCodec) }
        return codecs.flatMap { codec in megapixels.map { PhotoFormat(codec: codec, megapixels: $0) } }
    }

    static func videoFormats(of device: AVCaptureDevice, frameRates: ClosedRange<Int>) -> [VideoFormat] {
        let rates = [24, 25, 30, 60, 120, 240].filter(frameRates.contains)
        var formats = Set<VideoFormat>()
        for format in device.formats {
            let size = format.formatDescription.dimensions
            guard [720, 1080, 2160].contains(Int(size.height)), size.width * 9 == size.height * 16 else { continue }
            let hdr = format.supportedColorSpaces.contains(.HLG_BT2020)
            for rate in rates where format.supports(frameRate: rate) {
                formats.insert(VideoFormat(height: Int(size.height), frameRate: rate, hdr: hdr))
            }
        }
        return formats.sorted { ($0.height, $0.frameRate, $0.hdr ? 1 : 0) < ($1.height, $1.frameRate, $1.hdr ? 1 : 0) }
    }

    static func spatialDevice(near device: AVCaptureDevice) -> AVCaptureDevice? {
        guard device.position == .back,
              let dualWide = AVCaptureDevice.default(.builtInDualWideCamera, for: .video, position: .back),
              dualWide.formats.contains(where: \.isSpatialVideoCaptureSupported)
        else { return nil }
        return dualWide
    }
}

nonisolated extension FlashMode {
    init?(_ mode: AVCaptureDevice.FlashMode) {
        switch mode {
        case .auto: self = .auto
        case .on: self = .on
        case .off: self = .off
        @unknown default: return nil
        }
    }

    var device: AVCaptureDevice.FlashMode {
        switch self {
        case .auto: .auto
        case .on: .on
        case .off: .off
        }
    }

    var torch: AVCaptureDevice.TorchMode {
        switch self {
        case .auto: .auto
        case .on: .on
        case .off: .off
        }
    }
}

nonisolated extension PhotoFormat.Codec {
    var videoCodec: AVVideoCodecType {
        switch self {
        case .heif: .hevc
        case .jpeg, .proRAW: .jpeg
        }
    }
}

nonisolated extension CMVideoDimensions {
    var megapixels: Int { Int((Double(width) * Double(height) / 1_000_000).rounded()) }
}

nonisolated extension AVCaptureDevice.Format {
    func matches(_ video: VideoFormat) -> Bool {
        let size = formatDescription.dimensions
        return Int(size.height) == video.height && size.width * 9 == size.height * 16
            && supportedColorSpaces.contains(.HLG_BT2020) == video.hdr
            && supports(frameRate: video.frameRate)
    }

    func supports(frameRate: Int) -> Bool {
        videoSupportedFrameRateRanges.contains { $0.minFrameRate...$0.maxFrameRate ~= Double(frameRate) }
    }
}
