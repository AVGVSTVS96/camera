// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "PhotosBrowser",
    platforms: [.iOS("27.1")],
    products: [
        .library(name: "PhotosBrowser", targets: ["PhotosBrowser"]),
    ],
    targets: [
        .target(
            name: "PhotosBrowser",
            swiftSettings: [.defaultIsolation(MainActor.self)]
        ),
    ]
)
