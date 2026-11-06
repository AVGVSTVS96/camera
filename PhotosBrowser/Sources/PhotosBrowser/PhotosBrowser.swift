import Photos
import SwiftUI
import UIKit

public struct PhotosBrowser: View {
    let onDismiss: () -> Void

    public init(onDismiss: @escaping () -> Void) {
        self.onDismiss = onDismiss
    }

    public var body: some View {
        Color.black.onTapGesture(perform: onDismiss)
    }

    public static func requestAccess() async -> PHAuthorizationStatus {
        await PHPhotoLibrary.requestAuthorization(for: .readWrite)
    }

    public static func latestThumbnail(pointSize: CGSize, scale: CGFloat) async -> UIImage? {
        nil
    }
}
