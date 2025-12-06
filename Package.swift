// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "react-two",
    platforms: [
        .iOS(.v13),
        .tvOS(.v13),
        .visionOS(.v1)
    ],
    products: [
        .library(
            name: "react-two",
            targets: ["react-two"]),
    ],
    dependencies: [
        // React Native dependencies are typically handled by the host application
        // when using SPM for React Native modules.
    ],
    targets: [
        .target(
            name: "react-two",
            dependencies: [],
            path: "ios",
            exclude: [],
            sources: [
                "TwoViewManager.swift",
                "TwoViewManager.m", 
                "TwoMetalView.swift", 
                "TwoRenderer.swift",
                "Shaders.metal" // Also add the shaders!
            ]
        )
    ]
)
