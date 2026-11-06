import AVFoundation
import Photos
import SwiftUI

struct AssetViewer: View {
    let library: Library
    @Binding var path: [String]
    @Binding var current: String?
    let onDismiss: () -> Void
    @State private var chromeHidden = false
    @State private var isZoomed = false
    @State private var dragProgress: CGFloat = 0
    @State private var showsInfo = false
    @State private var player = AVPlayer()

    private var asset: PHAsset? {
        library.assets.index(of: current).map { library.assets[$0] }
    }

    var body: some View {
        ScrollView(.horizontal) {
            LazyHStack(spacing: 20) {
                ForEach(library.assets, id: \.localIdentifier) { asset in
                    let isCurrent = asset.localIdentifier == current
                    AssetPage(
                        asset: asset,
                        manager: library.images,
                        isCurrent: isCurrent,
                        player: isCurrent && asset.mediaType == .video ? player : nil,
                        onTap: { withAnimation(.easeInOut(duration: 0.2)) { chromeHidden.toggle() } },
                        onZoom: { isZoomed = $0 },
                        onDrag: { dragProgress = $0 },
                        onDismiss: onDismiss
                    )
                    .containerRelativeFrame([.horizontal, .vertical])
                }
            }
            .scrollTargetLayout()
        }
        .scrollTargetBehavior(.viewAligned(limitBehavior: .alwaysByOne))
        .scrollPosition(id: $current)
        .scrollIndicators(.hidden)
        .scrollDisabled(isZoomed)
        .ignoresSafeArea()
        .background {
            (chromeHidden ? Color.black : Color(.systemBackground))
                .opacity(1 - dragProgress * 2)
                .ignoresSafeArea()
        }
        .overlay(alignment: .topLeading) {
            if asset?.isLivePhoto == true {
                Label("LIVE", systemImage: "livephoto")
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .glassEffect()
                    .padding(.horizontal)
                    .padding(.top, 8)
                    .opacity(chrome ? 1 : 0)
            }
        }
        .overlay(alignment: .bottom) {
            if asset?.mediaType == .video {
                VideoControls(player: player)
                    .padding(.horizontal)
                    .padding(.bottom, 8)
                    .opacity(chrome ? 1 : 0)
            }
        }
        .containerBackground(.clear, for: .navigation)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let asset {
                ToolbarItem(placement: .principal) {
                    DatePill(date: asset.creationDate ?? .now)
                }
                .sharedBackgroundVisibility(.hidden)
                ToolbarItem(placement: .bottomBar) {
                    Button("Favorite", systemImage: asset.isFavorite ? "heart.fill" : "heart") {
                        asset.setFavorite(!asset.isFavorite)
                    }
                }
                ToolbarSpacer(.flexible, placement: .bottomBar)
                ToolbarItem(placement: .bottomBar) {
                    Button("Info", systemImage: "info.circle") { showsInfo = true }
                }
                ToolbarSpacer(.flexible, placement: .bottomBar)
                ToolbarItem(placement: .bottomBar) {
                    Button("Delete", systemImage: "trash", action: asset.delete)
                }
            }
        }
        .toolbarVisibility(chrome ? .visible : .hidden, for: .navigationBar, .bottomBar)
        .toolbarBackgroundVisibility(.hidden, for: .navigationBar, .bottomBar)
        .sheet(isPresented: $showsInfo) {
            if let asset {
                AssetInfo(asset: asset)
                    .presentationDetents([.medium, .large])
            }
        }
        .task(id: current) {
            player.replaceCurrentItem(with: nil)
            isZoomed = false
            guard let asset, asset.mediaType == .video, let video = await library.images.video(for: asset) else { return }
            player.replaceCurrentItem(with: AVPlayerItem(asset: video))
            player.play()
        }
        .onChange(of: library.assets) { old, new in
            guard new.index(of: current) == nil else { return }
            guard !new.isEmpty else { return path.removeAll() }
            let index = min(old.index(of: current) ?? 0, new.count - 1)
            current = new[index].localIdentifier
        }
        .onDisappear { player.pause() }
    }

    private var chrome: Bool { !chromeHidden && dragProgress == 0 }
}

private struct DatePill: View {
    let date: Date

    var body: some View {
        VStack(spacing: 0) {
            Text(title).font(.subheadline.weight(.semibold))
            Text(date.formatted(date: .omitted, time: .shortened)).font(.caption2)
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 6)
        .glassEffect()
    }

    private var title: String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today" }
        if calendar.isDateInYesterday(date) { return "Yesterday" }
        if let days = calendar.dateComponents([.day], from: date, to: .now).day, days < 7 {
            return date.formatted(.dateTime.weekday(.wide))
        }
        return date.formatted(date: .long, time: .omitted)
    }
}

private struct VideoControls: View {
    let player: AVPlayer
    @State private var isPlaying = false
    @State private var isMuted = false

    var body: some View {
        HStack(spacing: 12) {
            Button(isPlaying ? "Pause" : "Play", systemImage: isPlaying ? "pause.fill" : "play.fill") {
                if isPlaying {
                    player.pause()
                } else {
                    if let item = player.currentItem, item.currentTime() >= item.duration { player.seek(to: .zero) }
                    player.play()
                }
            }
            TimelineView(.animation(minimumInterval: 1 / 30)) { _ in
                Slider(value: progress, in: 0...1)
            }
            Button(isMuted ? "Unmute" : "Mute", systemImage: isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill") {
                isMuted.toggle()
                player.isMuted = isMuted
            }
        }
        .labelStyle(.iconOnly)
        .buttonStyle(.plain)
        .font(.body.weight(.semibold))
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .glassEffect()
        .onReceive(player.publisher(for: \.timeControlStatus)) { isPlaying = $0 != .paused }
    }

    private var progress: Binding<Double> {
        Binding {
            guard let item = player.currentItem, item.duration.seconds > 0 else { return 0 }
            return item.currentTime().seconds / item.duration.seconds
        } set: { value in
            guard let duration = player.currentItem?.duration, duration.seconds > 0 else { return }
            player.seek(to: CMTime(seconds: value * duration.seconds, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
        }
    }
}
