import AVFoundation

nonisolated struct CapturedPhoto: Sendable {
    var data: Data
    var livePhotoMovie: URL?
}

nonisolated final class PhotoCapture: NSObject, AVCapturePhotoCaptureDelegate, @unchecked Sendable {
    private let continuation: CheckedContinuation<CapturedPhoto, Error>
    private let livePhotoMovie: URL?
    private var data: Data?
    private var failure: Error?

    init(livePhotoMovie: URL?, continuation: CheckedContinuation<CapturedPhoto, Error>) {
        self.livePhotoMovie = livePhotoMovie
        self.continuation = continuation
    }

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error { failure = error } else { data = photo.fileDataRepresentation() }
    }

    func photoOutput(
        _ output: AVCapturePhotoOutput, didFinishProcessingLivePhotoToMovieFileAt outputFileURL: URL,
        duration: CMTime, photoDisplayTime: CMTime, resolvedSettings: AVCaptureResolvedPhotoSettings, error: Error?
    ) {
        if let error { failure = error }
    }

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishCaptureFor resolvedSettings: AVCaptureResolvedPhotoSettings, error: Error?) {
        if let data, failure == nil, error == nil {
            continuation.resume(returning: CapturedPhoto(data: data, livePhotoMovie: livePhotoMovie))
        } else {
            if let livePhotoMovie { try? FileManager.default.removeItem(at: livePhotoMovie) }
            continuation.resume(throwing: error ?? failure ?? CocoaError(.fileWriteUnknown))
        }
    }
}
