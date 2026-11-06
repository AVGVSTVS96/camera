#if DEBUG
import Foundation
import ObjectiveC.runtime
import Darwin

enum CameraRuntimeProbe {
    static let frameworks = ["CameraUI", "CameraKit", "CameraEffectsKit", "CameraCapture", "CameraUIFoundation", "CameraServices", "CameraCommon", "CameraUtilities", "CMCapture", "PhotoLibrary"]
    static let selectors = ["init", "initWithNibName:bundle:", "viewDidLoad", "viewWillAppear:", "startCapture", "startPreview", "capturePhoto", "capture", "setCaptureMode:", "setDelegate:", "cameraViewController", "sharedInstance"]
    static let candidates = ["CAMCameraViewController", "CAMViewfinderViewController", "CAMApplication", "CAMApplicationDelegate", "CAMCaptureEngine", "CAMPersistenceResponse", "CAMStillImagePersistenceResponse", "CAMVideoPersistenceResponse", "CAMStillImageCaptureResponse", "CAMVideoCaptureResponse", "CAMCaptureCapabilities", "CAMUserPreferences"]
    static func run() {
        var loads: [[String: Any]] = []
        for name in frameworks {
            print("CAMERA_PROBE_LOAD_START=\(name)")
            fflush(stdout)
            let path = "/System/Library/PrivateFrameworks/\(name).framework/\(name)"
            if dlopen(path, RTLD_NOW) != nil { loads.append(["framework": name, "candidatePath": path, "loaded": true]) }
            else { loads.append(["framework": name, "candidatePath": path, "loaded": false, "error": String(cString: dlerror())]) }
        }
        if let data = try? JSONSerialization.data(withJSONObject: loads, options: [.sortedKeys]),
           let text = String(data: data, encoding: .utf8) {
            print("CAMERA_PROBE_FRAMEWORK_LOADS=" + text)
            fflush(stdout)
        }
        let classes = candidates.filter { name in
            name.withCString { objc_lookUpClass($0) != nil }
        }.sorted()
        let selected = classes.map { name -> [String: Any] in
            guard let cls = name.withCString({ objc_lookUpClass($0) }) else { return ["class": name] }
            var count: UInt32 = 0
            let methods = class_copyMethodList(cls, &count)
            var methodTypes: [String: String] = [:]
            if ["CAMCameraViewController", "CAMViewfinderViewController", "CAMApplication", "CAMCaptureCapabilities", "CAMUserPreferences"].contains(name) || name.hasSuffix("Response") {
                for index in 0..<Int(count) {
                    let method = methods![index]
                    let selector = String(cString: sel_getName(method_getName(method)))
                    if let encoding = method_getTypeEncoding(method) {
                        methodTypes[selector] = String(cString: encoding)
                    }
                }
            }
            let own = (0..<Int(count)).map { String(cString: sel_getName(method_getName(methods![$0]))) }.filter {
                ["CAMCameraViewController", "CAMViewfinderViewController", "CAMApplication"].contains(name)
                    || $0.hasPrefix("init") || selectors.contains($0)
            }.sorted()
            free(methods)
            let superclass: Any = class_getSuperclass(cls).map { String(cString: class_getName($0)) as Any } ?? NSNull()
            return ["class": name, "superclass": superclass, "focusedSelectors": own, "methodTypes": methodTypes]
        }
        let report: [String: Any] = [
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "simulatorDevice": ProcessInfo.processInfo.environment["SIMULATOR_UDID"] ?? "not a simulator",
            "os": ProcessInfo.processInfo.operatingSystemVersionString,
            "bundleID": Bundle.main.bundleIdentifier ?? "unknown",
            "note": "Candidate paths are probes. Loaded classes do not establish usable UI or parity.",
            "frameworkLoads": loads,
            "candidateClasses": candidates,
            "matchingClasses": classes,
            "classDetails": selected,
        ]
        do {
            let data = try JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys])
            let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("camera-runtime-probe.json")
            try data.write(to: url, options: .atomic)
            print("CAMERA_PROBE_REPORT=" + String(data: data, encoding: .utf8)!)
            print("CAMERA_PROBE_PATH=" + url.path)
        } catch { print("CAMERA_PROBE_WRITE_ERROR=\(error)") }
    }
}

#endif
