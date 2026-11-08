import AVFoundation

nonisolated final class MovieCapture: NSObject, AVCaptureFileOutputRecordingDelegate, @unchecked Sendable {
    private let continuation: CheckedContinuation<URL, Error>

    init(continuation: CheckedContinuation<URL, Error>) {
        self.continuation = continuation
    }

    func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo url: URL, from connections: [AVCaptureConnection], error: Error?) {
        let finished = (error as NSError?)?.userInfo[AVErrorRecordingSuccessfullyFinishedKey] as? Bool
        if let error, finished != true {
            try? FileManager.default.removeItem(at: url)
            continuation.resume(throwing: error)
        } else {
            continuation.resume(returning: url)
        }
    }
}
