# Turning an iPhone into a LiDAR, IMU and GPS Sensor

*By Harshit Agarwal*

In my first weeks at SMLab, NISER, in May 2024, before the ROS dashboard, I worked on a side track my notes call "iPhone Drone": use a LiDAR-equipped iPhone as the sensor head for a drone, for 3D mesh generation and SLAM. I wrote two iOS apps. **DataSender** (the `SensorRecorder` repo) reads the phone's motion sensors, GPS and LiDAR depth and streams them over TCP to a computer. **LidarModel** scans a space with ARKit and exports the reconstructed mesh as an OBJ file. This post explains the Apple frameworks involved for readers who have never written iOS code, walks through what each app does, and then audits the streaming code. Re-reading it two years later, it had the right pieces and almost none of the plumbing a SLAM pipeline needs: no message boundaries, no timestamps, and a depth timer that most likely never fired.

<div class="stat-row">
  <div class="stat"><div class="stat-num">50 Hz</div><div class="stat-label">configured rate for motion and depth</div></div>
  <div class="stat"><div class="stat-num">3 of 5</div><div class="stat-label">sensor classes in the code wired into the stream</div></div>
  <div class="stat"><div class="stat-num">0</div><div class="stat-label">timestamps sent with the data</div></div>
  <div class="stat"><div class="stat-num">2</div><div class="stat-label">apps, both committed on 21 May 2024</div></div>
</div>

> [!NOTE]
> Sources: my `SensorRecorder` and `LidarModel` repositories (one commit each, 21 May 2024; the Xcode file headers date the work to 5–13 May) and my internship notes and July report. The receiving server isn't in either repo, so this post doesn't describe it. Code excerpts are trimmed; simplifications are marked.

## Why use a phone as a sensor rig

A recent Pro iPhone carries, in one calibrated, battery-powered package, most of what a small mapping platform needs:

- a **LiDAR scanner** that produces depth maps,
- an **IMU** (accelerometer and gyroscope) plus a magnetometer and barometer,
- **GNSS** for global position,
- several **cameras** with factory calibration,
- and a fast processor with **ARKit**, Apple's tracking framework, which fuses camera and IMU into a 6-DoF pose (visual-inertial odometry) without any work from the developer.

For a drone payload, that weight-to-capability ratio is hard to match with separate sensors, cables and a computer. The catch is that the phone was designed for apps, not for robotics. You get processed outputs through Apple's APIs, not raw sensor access, and you inherit the phone's limits on heat, background execution and clocks. Most of this post is about those limits.

My July report described the plan in four phases: learn iOS development; build apps that collect IMU, GPS, LiDAR and camera data; send it over network sockets "with time correlations" to a server for an online SLAM and AliceVision (open-source photogrammetry) pipeline; and build an ARKit app that records a mesh and exports it as OBJ. The two repos are phases two to four.

## Apple's sensor frameworks, for non-iOS readers

iOS doesn't expose sensors as device files. Each kind of sensor has a framework with a manager object, a permission prompt and a callback that delivers samples.

| Framework | What it gives you | How the apps use it |
|---|---|---|
| **Core Motion** | `CMMotionManager`. Raw accelerometer and gyro, or `CMDeviceMotion`: Apple's fused attitude, rotation rate, gravity and user acceleration (gravity removed), each with a timestamp in seconds since boot | Device motion at 50 Hz |
| **Core Location** | `CLLocationManager` and a delegate callback with `CLLocation` objects: coordinate, altitude, accuracy estimates, speed, course and a wall-clock timestamp. Needs a location permission | Latitude and longitude |
| **AVFoundation** | The camera stack. An `AVCaptureSession` connects an input device (a camera, or since iOS 15.4 the LiDAR depth camera) to outputs that deliver frames or `AVDepthData` | Back camera frames; LiDAR depth maps |
| **ARKit** | `ARSession` runs world tracking and delivers an `ARFrame` per camera frame: image, camera pose and, if enabled, `sceneDepth` (a 256×192 float32 depth map in metres with a confidence map). It can also build a mesh of the environment as `ARMeshAnchor`s | Depth in DataSender (unused); meshing in LidarModel |
| **Network** | `NWConnection`, Apple's modern TCP/UDP API | The TCP client |
| **RealityKit, Model I/O, SceneKit** | Rendering an AR view; mesh assets and file export; a 3D viewer | LidarModel's view, OBJ export and viewer |

Two facts from this table come back later. First, Core Motion and AVFoundation stamp samples against the device's uptime clock, while Core Location stamps fixes with a wall-clock date. Second, a depth map in both AVFoundation and ARKit arrives as a `CVPixelBuffer`, a block of memory you must lock before reading on the CPU.

## DataSender: what it streams

The app has two text fields (IP address and port) and two buttons, Start Streaming and Stop Streaming. Everything else is in four files: one class per sensor in `DataSource.swift`, a `TCPClient` over `NWConnection`, and a `DataStreamer` that ties them together.

<figure>
  <div class="diagram">
    <div class="node muted-node">Core Location<br>lat, lon as JSON</div>
    <span class="arrow">→</span>
    <div class="node">Core Motion<br>accel + gyro as JSON, 50 Hz</div>
    <span class="arrow">→</span>
    <div class="node">AVFoundation LiDAR<br>float32 depth bytes, 50 Hz timer</div>
    <span class="arrow">→</span>
    <div class="node accent">One TCP stream<br>to the server</div>
  </div>
  <figcaption><b>Fig. 1</b> — DataSender's pipeline. Each stage is started from the previous stage's callback, and everything shares one connection.</figcaption>
</figure>

### Motion

`MotionSensor` asks Core Motion for fused device motion fifty times a second and turns each sample into JSON:

```swift
motionManager.deviceMotionUpdateInterval = 1/50
motionManager.startDeviceMotionUpdates(to: .main) { (motionData, error) in
    ...
    let jsonData = try self.motionDataToJSON(motionData: motionData)
    completion(.success(jsonData))
}

// motionDataToJSON:
"acceleration": ["x": motionData.userAcceleration.x, ...],
"gyroscope":    ["x": motionData.rotationRate.x, ...]
```

`userAcceleration` has gravity already removed by Apple's sensor fusion, and `rotationRate` is the bias-corrected gyro in radians per second. For SLAM that's a questionable choice: visual-inertial estimators usually want the raw accelerometer including gravity, because gravity is how they find "down". The attitude Core Motion computes is dropped, and so is `motionData.timestamp`.

### Location

`LocationSensor` requests "when in use" permission and starts location updates. Each fix becomes `{"latitude": ..., "longitude": ...}`. Altitude, the accuracy estimates and the fix's own timestamp are all dropped. Without `horizontalAccuracy`, a downstream filter can't tell a good fix from a poor one.

### LiDAR depth

`LidarSensor` opens an `AVCaptureSession` on `.builtInLiDARDepthCamera` with an `AVCaptureDepthDataOutput`, keeps the latest depth map as bytes, and a 50 Hz timer hands that buffer to the sender. The conversion is where the worst bugs are:

```swift
private func depthDataToBinary(depthData: AVDepthData) throws -> Data {
    let depthDataMap = depthData.depthDataMap
    let width = CVPixelBufferGetWidth(depthDataMap)
    let height = CVPixelBufferGetHeight(depthDataMap)
    guard let baseAddress = CVPixelBufferGetBaseAddress(depthData.depthDataMap) else { throw ... }
    let depthDataArray = Array(UnsafeBufferPointer(
        start: baseAddress.assumingMemoryBound(to: Float.self), count: width * height))

    var depthDataBytes = [UInt8]()
    for depthValue in depthDataArray {
        depthDataBytes.append(contentsOf: withUnsafeBytes(of: depthValue) { Array($0) })
    }
    return Data(bytes: &depthDataBytes, count: depthDataBytes.count * MemoryLayout<Float32>.size)
}
```

Four problems, in order of severity:

1. **It reads four times past the end of its buffer.** `depthDataBytes` is already a byte array, four bytes per float. Passing `count: depthDataBytes.count * 4` tells `Data` to copy four times as many bytes as exist. The extra three quarters is whatever memory follows the array. It may crash, or it may quietly send garbage after every real depth map.
2. **The pixel buffer is never locked.** Core Video requires `CVPixelBufferLockBaseAddress` before CPU access; without it the base address may be invalid.
3. **It assumes 32-bit floats** without checking the buffer's pixel format. `AVDepthData` can arrive as 16-bit depth or as disparity; `converting(toDepthDataType:)` exists to normalise it.
4. **It ignores row padding.** Pixel buffers can have more bytes per row than `width × 4`, and reading `width × height` contiguous floats then misaligns every row after the first.

The fix for all four is short: lock the buffer, convert to `kCVPixelFormatType_DepthFloat32`, copy row by row using `CVPixelBufferGetBytesPerRow`, and build `Data` from the exact byte count.

### Camera and ARKit depth: written, not wired

`DataSource.swift` also has a `CameraSensor` (back camera frames as JPEG at quality 1.0) and an `ARCameraSensor` (ARKit `sceneDepth`). `DataStreamer` never uses either: the camera line is commented out and the AR class is never created. Only location, motion and LiDAR depth were wired into the stream, three of the five sensor classes in the code, and the depth path has the timer problem described below. Neither unused class would have worked as written. `CameraSensor` creates a new `CIContext` for every frame on the main queue, an expensive object Apple recommends reusing. `ARCameraSensor` turns on scene reconstruction but never adds `.sceneDepth` to the configuration's `frameSemantics`, so `frame.sceneDepth` is always nil and, once recording, it would print "No scene depth available" on every frame.

## The send chain

`DataStreamer.startStreaming` connects, sends the string "Hello Server", and then starts each sensor from inside the previous one's success callback. Simplified:

```swift
client.connect(to: ipAddress, with: port) { error in
    self.client.send(data: "Hello Server".data(using: .utf8)!) { _ in
        self.locationSensor.startUpdatingLocation { result in          // every fix:
            self.client.send(data: locationData) { _ in
                self.motionSensor.startMotionUpdates { result in       // every 20 ms:
                    self.client.send(data: motionData) { _ in
                        self.lidarSensor.updateDepthMap { result in    // starts a new 50 Hz timer
                            self.client.send(data: depthMapData) { ... }
                        }
                    }
                }
            }
        }
    }
}
```

Read the comments down the right side. Every location fix restarts motion updates. Every motion sample, fifty a second, calls `updateDepthMap`, and `updateDepthMap` schedules a **new repeating 50 Hz timer** each time it's called. Where that timer lands decides how it fails. `updateDepthMap` runs inside a send completion, and `NWConnection` calls completions on its own dispatch queue. `Timer.scheduledTimer` attaches the timer to the current thread's run loop, and GCD worker threads don't run one, so these timers most likely **never fire and depth is never sent**. Had the call been on the main thread, the timers would pile up instead: about 500 after ten seconds, each resending the latest depth map fifty times a second, with nothing to stop them, since `stopStreaming` holds no reference to them. I never confirmed which happened on the device. The intent was one depth stream at 50 Hz; the fix is to start each sensor once, independently, with its own send path.

Two smaller issues in `TCPClient`: `connect` calls its completion with no error immediately after `start()`, before the TCP handshake, and the check that the connection is ready before sending is commented out. So the code can't tell a wrong IP address from a working one at connect time. And `receive` is armed only once, so only the server's first reply is ever read.

## What actually goes over the wire

Put together, the server receives one TCP byte stream that looks like this:

<figure>
  <div class="diagram">
    <div class="node muted-node">"Hello Server"</div>
    <span class="arrow">→</span>
    <div class="node">{ "latitude": …,<br>"longitude": … }</div>
    <span class="arrow">→</span>
    <div class="node">{ "acceleration": …,<br>"gyroscope": … }</div>
    <span class="arrow">→</span>
    <div class="node accent">float32 depth bytes<br>(if the timer fires)</div>
    <span class="arrow">→</span>
    <div class="node">more motion JSON …</div>
  </div>
  <figcaption><b>Fig. 2</b> — the stream as the server sees it: text, JSON and binary back to back, with no lengths, no type tags and no timestamps.</figcaption>
</figure>

TCP delivers bytes, not messages. One `send` on the phone can arrive as two reads on the server, and three sends can arrive as one. A protocol on TCP therefore needs **framing**: some way to know where each message ends. Common answers are a length prefix, or a delimiter that can't appear inside a message. DataSender has neither. The JSON is pretty-printed, so newlines can't serve as delimiters, and the depth bytes can contain any value at all. A server could guess by looking for `{`, but a float in a depth map can contain that byte too.

A minimal framed format is a fixed header before every payload. This is a sketch of what I'd write now, not code from the repo:

```swift
// [type: UInt8][timestamp: Float64, seconds][length: UInt32][payload: length bytes]
func frame(type: UInt8, timestamp: Double, payload: Data) -> Data {
    var out = Data([type])
    withUnsafeBytes(of: timestamp.bitPattern.bigEndian) { out.append(contentsOf: $0) }
    withUnsafeBytes(of: UInt32(payload.count).bigEndian) { out.append(contentsOf: $0) }
    out.append(payload)
    return out
}
```

The server reads 13 bytes, learns the type, time and length, then reads exactly that many bytes. Depth maps go as raw float32 with width and height in a small prefix, and motion goes as eight doubles rather than pretty-printed JSON.

## Time: the part SLAM needs most

SLAM and sensor fusion depend on knowing when each measurement was taken, to well under the interval between samples. A visual-inertial estimator integrates IMU samples between camera frames, so an IMU sample assigned to the wrong 20 ms window is a wrong motion estimate.

DataSender sends no timestamps at all. The one attempt is in the location path, and it's a near miss:

```swift
let timestamp = Date().timeIntervalSince1970
var jsonDictionary = try JSONSerialization.jsonObject(with: locationData, ...) as? [String: Any] ?? [:]
jsonDictionary["timestamp"] = timestamp
let jsonData = try JSONSerialization.data(withJSONObject: jsonDictionary, options: [])

self.client.send(data: locationData) { ... }   // sends the copy without the timestamp
```

The timestamped `jsonData` is built and never used. Even if it had been sent, it would be the time the callback ran, not the time of the fix.

Doing this properly takes three steps:

1. **Keep the sensor's own timestamp.** `CMDeviceMotion.timestamp`, the depth callback's `timestamp: CMTime` parameter (the code receives it and ignores it), and `ARFrame.timestamp` all mark when the sample was taken.
2. **Put them on one clock.** Core Motion, AVFoundation and ARKit use the device's uptime clock; Core Location uses a wall-clock `Date`. Convert everything to uptime, which doesn't jump when the network corrects the wall clock.
3. **Map the phone's clock to the server's.** The phone sends its uptime *t₁*, the server replies with its own time *s*, and the phone notes when the reply arrives, *t₂*. The offset is about *s* − (*t₁* + *t₂*)/2, with an error of at most half the round trip. Repeat it, keep the estimate from the fastest round trip, and refresh it periodically because the two clocks drift.

There's a simpler alternative that avoids most of this: use **ARKit as the only source**. Every `ARFrame` carries the camera image, the scene depth and the camera's pose under one timestamp, already aligned by Apple. You give up the 50 Hz IMU stream, but ARKit has already fused it into the pose.

## LidarModel: scanning a space into an OBJ

The second app is closer to finished. It shows a live AR view; you move the phone around a room, then tap Export, type a file name, and it writes the reconstructed mesh to an OBJ file. A list on the left shows saved files, and tapping one opens a 3D viewer.

<figure>
  <div class="diagram">
    <div class="node muted-node">ARKit world tracking<br>+ LiDAR</div>
    <span class="arrow">→</span>
    <div class="node">ARMeshAnchors<br>local mesh chunks</div>
    <span class="arrow">→</span>
    <div class="node accent">World-space MDLMesh<br>per anchor</div>
    <span class="arrow">→</span>
    <div class="node">MDLAsset.export<br>Documents/OBJ_FILES/*.obj</div>
    <span class="arrow">→</span>
    <div class="node muted-node">SceneKit viewer<br>or share sheet</div>
  </div>
  <figcaption><b>Fig. 3</b> — LidarModel's export path.</figcaption>
</figure>

The session configuration is the core of it:

```swift
let configuration = ARWorldTrackingConfiguration()
configuration.environmentTexturing = .automatic
configuration.sceneReconstruction = .meshWithClassification
if type(of: configuration).supportsFrameSemantics(.sceneDepth) {
    configuration.frameSemantics = .sceneDepth
}
arView.debugOptions.insert(.showFeaturePoints)
arView.debugOptions.insert(.showSceneUnderstanding)
```

`sceneReconstruction` is the LiDAR feature that matters. ARKit builds a triangle mesh of the surroundings as you move and splits it into chunks, each an **`ARMeshAnchor`** with its own transform and an `ARMeshGeometry` (vertex buffer, face index buffer, normals and, with `.meshWithClassification`, a label per face such as wall, floor or table). The two debug options draw ARKit's tracked feature points and the mesh itself over the camera feed, so you can see which areas still have holes before exporting.

Each anchor's vertices are stored relative to the anchor. To export one coherent model, every vertex is multiplied by its anchor's transform into world coordinates, and the anchors become `MDLMesh` objects in one Model I/O `MDLAsset`. Model I/O then writes the asset in the format the file extension names. The conversion function is **not my code**: its header credits another project, and it links the Stack Overflow answer it's based on. One thing to know about it: it writes the world-space vertices back into ARKit's own vertex buffer instead of a copy, which is risky with memory ARKit owns.

The saved-files list reads `Documents/OBJ_FILES`, supports swipe-to-delete, and opens a file in a SceneKit view with camera control and a default light. Getting a file off the phone goes through the iOS share sheet.

What didn't work, from the code:

- **Export works on every other tap.** The button toggles a Boolean, and the AR view exports when it sees `true`. The first tap sets it to true and exports; the second sets it to false and does nothing.
- **The share sheet shares the wrong file.** The exported URL is never passed back to the view (that binding is commented out), so the share sheet always gets a default path, `file1234.obj`.
- **Every SwiftUI update re-runs the AR session configuration**, because `session.run` sits in `updateUIView`.
- **The other ways out were stubs.** Sending the OBJ over TCP to the computer is commented out, and so is a Google Drive upload, though the Google sign-in pods are installed.

The plan in my report, sending meshes "outside of the app's sandbox to the computing system for further post-processing and cloud comparing", got as far as the share sheet.

## Limitations of a phone as a sensor rig

Beyond my bugs, these are the constraints the platform imposes:

| Limitation | Why it matters | What to do about it |
|---|---|---|
| **Processed depth, not raw LiDAR returns** | You get Apple's depth maps and meshes, not range measurements per laser point | Treat it as an RGB-D camera, not a LiDAR |
| **Short-range depth** | The scanner is built for rooms and objects, not open roads | Fine for indoor mapping; outdoors, use it for near-field only |
| **Clocks** | Uptime and wall clocks differ, and the phone's clock drifts from the server's | Stamp at the source, use uptime, estimate an offset |
| **Bandwidth** | One 256×192 float32 depth map is 196,608 bytes; at 30 frames a second that's about 5.9 MB/s before images | Send raw binary, not JSON; compress depth; or record on the phone and upload later |
| **Heat** | Camera, LiDAR, ARKit and the radio together load the phone continuously, and phones throttle when hot. DataSender starts the LiDAR session at app launch, not at Start | Run sensors only while recording; I never measured this |
| **Background execution** | Neither app declares background modes, so iOS suspends them when the screen locks or the app loses focus | Keep the app in front with the screen on, or add the needed background modes |

## What I'd do now

If I rebuilt DataSender today:

1. **One clock, stamped at the source**, and a clock-offset exchange at connect.
2. **A framed binary protocol**: type, timestamp and length before every payload.
3. **Independent sensor pipelines** that each start once, instead of a callback chain that restarts sensors and multiplies timers.
4. **ARKit frames as the main stream** (image, depth and pose share a timestamp), with raw Core Motion only if the estimator really needs 50 Hz or faster IMU.
5. **Record locally, upload later** for anything bigger than poses. A phone's Wi-Fi link is the weakest part of the chain, and a dropped TCP connection loses data that a file wouldn't.

The phone was a good idea for a drone payload, and ARKit's meshing worked with very little code. The lesson I took from re-reading DataSender is that a sensor stream is only as useful as its metadata. Bytes without boundaries or timestamps can't be fused, however good the sensor that produced them.

## More from Research at NISER & IISER Bhopal

- [NISER Internship Retrospective](/blog/niser-internship-retrospective): going back to the lab, and what the internship gave me.
- [From ORB Features to ORB-SLAM3](/blog/orb-slam3): the lab talk on feature extraction, matching and ORB-SLAM3.
- [SLAM from the Bayes Filter Up](/blog/niser-slam-bayes-filter): the probabilistic basics behind SLAM.
- [A Browser Dashboard for a ROS 2 Sensor Rig](/blog/niser-ros-dashboard): a Vue and rosbridge control panel for the lab's recording rig.
- [Field Notes on Perception for Two-Wheeler Autonomy](/blog/niser-perception-notes): notes on perception for an autonomous motorcycle.
- [Hands-on Quantum Programming at IISER Bhopal](/blog/iiser-bhopal-quantum-workshop): a hands-on quantum programming workshop.
