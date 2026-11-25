# Field Notes on Perception for Two-Wheeler Autonomy

*By Harshit Agarwal*

[Swayansaasita](https://www.niser.ac.in/~smishra/project/swayansaasita/) is SMLab's research initiative on autonomous vehicles and driver-assistance systems for two-wheelers, with a focus on the conditions of developing countries like India. Its central goal is data: a large multi-modal driving dataset with 360-degree point clouds, several IMUs, GPS and camera images, annotated for machine learning. During my internship in 2024, besides the SLAM reading and the sensor dashboard, I wrote the project website's technical articles: computer vision, computer vision for self-driving motorcycles, prediction, point clouds, hardware-software integration, and ROS. I drafted them in August 2024; the first ones went up on the site at the end of that month, and in September I rewrote those and added the point cloud and ROS articles.

Those articles were written fast, for a general audience, and some sections were outlines. This post is the version I would write for engineers: the same topics, explained properly, in the order the data actually flows on a vehicle. Sensors produce measurements, ROS moves them around, calibration puts them in one frame, vision and point-cloud processing turn them into structure, and prediction turns structure into a belief about where the vehicle is and where it is going.

<figure>
  <div class="diagram">
    <div class="node muted-node">Sensors<br>cameras, point clouds, IMU, GPS</div>
    <span class="arrow">→</span>
    <div class="node">ROS nodes + topics<br>drivers, timestamps</div>
    <span class="arrow">→</span>
    <div class="node">Calibration<br>one frame, one clock</div>
    <span class="arrow">→</span>
    <div class="node">Vision + point clouds<br>features, depth, registration</div>
    <span class="arrow">→</span>
    <div class="node accent">Prediction<br>state, map, path</div>
  </div>
  <figcaption><b>Fig. 1</b> — the perception chain these notes follow. Each article on the project site covered one box; this post connects them.</figcaption>
</figure>

## Hardware and software: why integration is the hard part

My hardware-software article started from a simple framing: hardware is processors, sensors and transducers, and network modules; software is the operating system, drivers and the networking code that ties devices together. The useful point in it is that software must be designed around what the hardware can actually do. On a vehicle that becomes concrete very quickly.

The rig I worked with had a ZED stereo camera (which carries its own IMU), a CS20 depth camera and GPS, with the data handled by ROS running on NVIDIA Jetson boards. A Jetson is a capable embedded computer, but it is not a workstation. Uncompressed stereo video, a dense point cloud and high-rate IMU data all compete for the same memory bandwidth, disk throughput and network link. Every design decision downstream, from what gets recorded to what gets previewed live, is a decision about that budget. When I built the browser dashboard for the rig, much of the early work went into getting images to the browser at all: raw `bgr8` frames had to be drawn onto a canvas by hand, JPEG-compressed frames decoded from base64, and Theora video needed a separate JavaScript decoder.

The section of that article I would keep is the one on **calibration**, which I split into two kinds. Here they are properly.

### Type 1: calibrating each sensor on its own (intrinsics)

- **Camera intrinsics.** A pinhole camera maps a 3D point in its own frame to a pixel through a focal length, a principal point and lens distortion coefficients. You estimate these by imaging a known pattern (a checkerboard) from many angles. Wrong intrinsics bend straight lines and corrupt every depth estimate.
- **IMU intrinsics.** Accelerometers and gyroscopes have biases (a non-zero reading at rest), scale errors and noise. Some of this is estimated once on a bench; biases drift with temperature and time, so good estimators keep estimating them online, as ORB-SLAM3 does.

### Type 2: aligning sensors with each other (extrinsics and time)

- **Extrinsics.** Each sensor needs a rigid transform to a common body frame: where the camera sits relative to the IMU, the lidar relative to the camera. These are the `T_body_sensor` matrices from the coordinate-frames section of my [Bayes filter post](/blog/niser-slam-bayes-filter). A one-degree error in a lidar-to-camera rotation misplaces a point 30 m away by about half a metre.
- **Time.** Fusion needs every measurement stamped on the same clock. A camera frame and an IMU sample that are 20 ms apart in reality but stamped together will make the estimator see motion that did not happen. On a vehicle at speed, small timing offsets become position errors.

In the original article I also listed tuning detection and path-planning algorithms under Type 2. That is better called validation than calibration; the point I was reaching for is that data from several sensors is only useful once it is consistent, in space and in time.

## ROS: the plumbing

My ROS article opened with the problem ROS solves: before it, every robotics project wrote its own hardware drivers, inter-process communication, logging and visualisation. ROS (Robot Operating System) is not an operating system. It is a framework of conventions, libraries and tools for building robot software out of small processes that talk to each other.

The concepts that matter:

- **Nodes** are processes that do one job each: a camera driver, an IMU driver, a localisation node, a recorder.
- **Topics** are named, typed channels. A node *publishes* messages on a topic and any number of nodes *subscribe* to it. Publishers and subscribers do not know about each other, which is what makes the system modular.
- **Messages** are typed structures: `sensor_msgs/Imu`, `sensor_msgs/Image`, `sensor_msgs/PointCloud2`, `sensor_msgs/NavSatFix`. Every sensor message carries a header with a timestamp and a `frame_id`, which is how the calibration and timing above are attached to the data.
- **Services** are request-response calls for things that are not continuous, like "start recording".
- **Actions** are for long-running goals with feedback and cancellation, like "drive to this waypoint".
- **Bags** record selected topics to disk with their timestamps so a drive can be replayed later as if it were live. For a dataset project, bags *are* the product: everything else is how you get clean bags.

<figure>
  <div class="diagram">
    <div class="node muted-node">camera driver</div>
    <div class="node muted-node">IMU driver</div>
    <div class="node muted-node">GPS driver</div>
    <span class="arrow">→</span>
    <div class="node">topics<br>/image, /imu, /fix, /points</div>
    <span class="arrow">→</span>
    <div class="node accent">recorder (bag)</div>
    <div class="node">rosbridge → browser preview</div>
  </div>
  <figcaption><b>Fig. 2</b> — publish-subscribe on a sensor rig. Drivers do not know who is listening; the recorder and the live preview subscribe to the same topics independently.</figcaption>
</figure>

On Swayansaasita, ROS ran on the Jetsons (while I worked on it, one ran ROS 1 and the other ROS 2). My dashboard connected to it through rosbridge, which exposes topics over a WebSocket, and used roslibjs in the browser. It showed the live frequency of every topic, start and stop buttons that called the recording services, disk usage, and previews of each stream. One small rule turned out to be useful: only allow recording to start when every expected topic is publishing at a non-zero rate, so a dead sensor is caught before a drive rather than after. The dashboard has its own post, [A Browser Dashboard for a ROS 2 Sensor Rig](/blog/niser-ros-dashboard).

A minimal ROS 2 subscriber in Python shows how little code a node needs:

```python
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Imu

class ImuListener(Node):
    def __init__(self):
        super().__init__("imu_listener")
        self.create_subscription(Imu, "/imu/data", self.on_imu, 50)

    def on_imu(self, msg: Imu):
        # header.stamp and header.frame_id say when and in which frame
        a = msg.linear_acceleration
        self.get_logger().info(f"{msg.header.stamp.sec}: a=({a.x:.2f}, {a.y:.2f}, {a.z:.2f})")

rclpy.init()
rclpy.spin(ImuListener())
```

(The topic name here is illustrative; each driver chooses its own.)

## Computer vision: what the cameras are for

My computer vision article defined vision as the ability to acquire, process, analyse and understand information from the electromagnetic spectrum, and computer vision as the same thing for digital images. The goal is to go from pixels to high-level understanding by building up from low-level features, filtering out what is not useful (which also saves compute), and associating what is left.

The classic high-level tasks are:

- **Classification:** what is in this image, as a whole?
- **Detection:** what objects are in the image, and where (usually as bounding boxes)?
- **Segmentation:** which pixels belong to which object or class?

For a two-wheeler, all three matter, but they sit on top of something more basic: geometry. A detector says "there is a car"; geometry says how far away it is and how it is moving relative to you. The rest of the article was about that geometric layer.

### Features and data association

Feature extraction finds keypoints that can be found again and describes them so they can be matched. The article surveyed SIFT, SURF, BRISK and ORB. The short version: SIFT and SURF use floating-point descriptors and are robust but expensive; BRISK and ORB use binary descriptors compared with Hamming distance, and are fast enough to run on every frame. My [ORB-SLAM3 post](/blog/orb-slam3) covers how ORB works and how these compare in detail.

**Data association** is deciding which observation corresponds to which thing: this keypoint to that map point, this bounding box to that tracked car, this lidar cluster to that camera detection. It appears in three places on a vehicle:

- **Frame to frame**, for visual odometry and object tracking. Associating detections across frames turns a series of boxes into tracks with velocities.
- **Sensor to sensor**, for fusion. Projecting lidar points into the camera image (using the extrinsics above) lets a camera detection get a depth, and a lidar cluster get a class.
- **Now to the past**, for loop closure and relocalisation.

Occlusion, sensor noise and changes in appearance all make association ambiguous. That is why probabilistic tools show up here too: Kalman and particle filters for tracking, and graph methods that can tolerate and later reject wrong associations.

### Stereo depth

The rig's main camera was a stereo pair. A stereo camera has two lenses a fixed distance apart (the baseline *B*). After rectification, a point appears on the same row in both images, shifted horizontally by a **disparity** *d*. Depth follows from similar triangles:

```text
Z = f · B / d

Z : depth of the point (metres)
f : focal length (pixels)
B : baseline between the two lenses (metres)
d : disparity (pixels)
```

Two consequences matter outdoors. Depth error grows with the square of distance, because a one-pixel disparity error is a much bigger fraction of a small disparity. And disparity needs texture to match: a blank wall, a uniformly grey road or a sky gives the matcher nothing. Both are reasons a road vehicle wants lidar as well as stereo.

### Photogrammetry: geometry from many images

The article walked through the photogrammetry pipeline, which is also, almost step for step, the offline version of visual SLAM:

<figure>
  <div class="diagram">
    <div class="node muted-node">Acquire images<br>overlapping views</div>
    <span class="arrow">→</span>
    <div class="node">Calibrate<br>intrinsics + extrinsics</div>
    <span class="arrow">→</span>
    <div class="node">Extract + match<br>features</div>
    <span class="arrow">→</span>
    <div class="node">Triangulate<br>3D points</div>
    <span class="arrow">→</span>
    <div class="node accent">Bundle adjustment<br>refine all poses + points</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Surface + texture</div>
  </div>
  <figcaption><b>Fig. 3</b> — the photogrammetry pipeline. Swap "offline, all images at once" for "online, one frame at a time" and this is visual SLAM.</figcaption>
</figure>

**Triangulation** finds the 3D point whose projections best match the observed pixels in two or more views: each observation defines a ray from a camera centre, and the point is where the rays (nearly) meet. **Bundle adjustment** then refines every camera pose and every 3D point together to minimise reprojection error. Dense reconstruction and meshing come after, if you need surfaces rather than points.

### What makes vision hard on a road

The challenges section listed four, and they hold up:

- **Lighting.** Sun low on the horizon, tunnels, night, headlights, wet reflections. Features that match at noon do not match at dusk.
- **Detection and classification** in cluttered scenes with occlusion: a scooter half-hidden behind a bus is still a scooter.
- **Real-time processing** on embedded hardware, which forces choices like binary descriptors and capped feature counts.
- **Robustness** to noise, vibration and viewpoint changes, all of which a motorcycle produces more of than a car.

## Point clouds

A point cloud is a set of points in some coordinate frame. For a lidar, each point is where one laser return came back from, usually with extra fields: intensity of the return, which laser (ring) fired it, and the time within the sweep. A stereo camera can produce a point cloud too, by turning every pixel with a valid disparity into a 3D point coloured from the image.

My point cloud article was the one I left closest to an outline on the site, so this section fills it in.

### How the data is structured

In ROS, a cloud travels as `sensor_msgs/PointCloud2`: a flat byte buffer plus a description of its layout.

```text
PointCloud2
  header        stamp + frame_id
  height, width height = 1 for an unordered cloud; rows × columns for an organised one
  fields        e.g. x (float32, offset 0), y (float32, 4), z (float32, 8), intensity (float32, 12)
  point_step    bytes per point
  row_step      bytes per row  (= point_step × width)
  data          the raw bytes
  is_dense      true if there are no invalid (NaN) points
```

An **organised** cloud keeps the sensor's grid (each point knows its neighbours by index, like pixels in an image), which makes neighbourhood operations fast. An **unorganised** cloud is just a list. Parsing this format in JavaScript for the dashboard's point cloud preview was one of the first things I had to work out on the project: you read each point by walking the buffer in `point_step` strides and decoding the fields at their offsets. A stereo camera that publishes one point per pixel makes these messages very large, which is its own problem for anything that has to move them over a network.

**PCL**, the Point Cloud Library, is the standard C++ library for this kind of processing: filtering, feature estimation, registration, segmentation and visualisation.

### Downsampling and denoising

A single lidar sweep can contain a very large number of points, most of them redundant for any given task. **Voxel-grid downsampling** divides space into cubes of a chosen size and replaces all points in each cube with their centroid. It gives a cloud with roughly uniform density, which also makes later algorithms behave more predictably.

```python
import numpy as np

def voxel_downsample(points: np.ndarray, voxel: float) -> np.ndarray:
    """points: (N, 3). Returns one centroid per occupied voxel."""
    keys = np.floor(points / voxel).astype(np.int64)
    _, inverse, counts = np.unique(keys, axis=0, return_inverse=True, return_counts=True)
    inverse = inverse.reshape(-1)
    sums = np.zeros((counts.size, 3))
    np.add.at(sums, inverse, points)
    return sums / counts[:, None]
```

**Denoising** removes points that are probably not real: returns from dust, rain or the vehicle itself, and stray points at depth discontinuities. The two standard filters are statistical outlier removal (compute each point's mean distance to its *k* nearest neighbours, and drop points whose mean distance is far above the global average) and radius outlier removal (drop points with too few neighbours within a radius).

**Visualisation** sounds trivial and is not. A cloud only makes sense to a human when coloured by height, intensity or distance, and viewed with the right frame and scale.

### Registration with ICP

Registration finds the rigid transform that aligns one cloud with another: two consecutive sweeps (giving lidar odometry), or a sweep and a map (giving localisation). **Iterative Closest Point** alternates two steps until it converges:

1. **Associate:** for each point in the source cloud, take the closest point in the target cloud as its correspondence.
2. **Align:** find the transform *T* that minimises the distance between the corresponding pairs, apply it, and repeat.

```text
E(T) = Σ_(x, y) ∈ K  || x − T · y ||²        K : the set of corresponding pairs
```

When the correspondences are fixed, step 2 has a closed-form answer using the SVD, which is the "known data association" case in the lecture I linked from the article:

```python
def best_rigid_transform(src: np.ndarray, dst: np.ndarray):
    """src, dst: (N, 3) corresponding points. Returns R, t with dst ≈ R @ src + t."""
    mu_s, mu_d = src.mean(axis=0), dst.mean(axis=0)
    W = (dst - mu_d).T @ (src - mu_s)          # 3 × 3 cross-covariance
    U, _, Vt = np.linalg.svd(W)
    R = U @ Vt
    if np.linalg.det(R) < 0:                   # guard against a reflection
        U[:, -1] *= -1
        R = U @ Vt
    t = mu_d - R @ mu_s
    return R, t
```

ICP's weakness is step 1. "Closest point" is only the right correspondence if the clouds are already roughly aligned, so ICP needs a good initial guess, which on a vehicle comes from the IMU or wheel odometry. Practical variants match points to planes rather than points to points, reject pairs that are too far apart, and weight pairs by their reliability.

### What point clouds are used for

On a vehicle: obstacle detection and free-space estimation, lidar odometry and mapping, localisation against a prior map, and 3D object detection. In a dataset project like this one, annotated clouds are also training data for learned 3D detectors.

## Prediction: from measurements to a belief about the path

My prediction article argued that the primary task of an autonomous vehicle is to estimate a path and a map of its surroundings from its controls and observations. That is the SLAM problem, written as a posterior over the path and the map:

```text
p( x_0:t , m | z_1:t , u_1:t )
```

I derived the recursive Bayes filter that solves the online version, and the Kalman filter as its linear-Gaussian case, in [SLAM from the Bayes Filter Up](/blog/niser-slam-bayes-filter). The figure in the original article was the Kalman filter algorithm; here is what it means for this rig in one paragraph. The IMU drives the prediction step: integrate acceleration and rotation rate to predict the next pose, with uncertainty growing because the IMU is noisy and biased. GPS, visual odometry and lidar registration drive the correction step: each one is a measurement with its own noise model, and the Kalman gain decides how much to trust it against the prediction. Since the motion of a leaning, turning motorcycle is strongly non-linear, a real system uses an extended or unscented variant, or replaces the filter with a smoother.

That smoother is the **pose graph**: robot poses (and possibly landmarks) as nodes; odometry, observations and scan matches as edges; loop closures as edges between distant poses that correct accumulated drift; and the whole graph solved as non-linear least squares with Gauss-Newton or Levenberg-Marquardt. The article listed which nodes and edges there are; the Bayes filter post shows the optimisation.

### Sensor fusion

Fusion is what makes a set of mediocre sensors into a good one. Each sensor fails differently:

| Sensor | Good at | Fails when |
|---|---|---|
| Camera | Texture, colour, classes, lane markings | Glare, darkness, low texture; no direct depth (mono) |
| Stereo depth | Dense depth up close | Error grows with distance squared; texture-less surfaces |
| Lidar | Accurate geometry at range, day or night | Rain and dust returns; sparse at long range; no colour |
| IMU | High-rate motion, no external dependency | Drifts within seconds when integrated alone |
| GPS | Global position, no drift | Urban canyons, trees, tunnels; metre-level noise |

A probabilistic estimator fuses them by giving each one a noise model and letting the math weigh them. The table is also a useful checklist for dataset design: every "fails when" row is a condition the dataset should include on purpose.

### Learning-based approaches

The article also covered where machine learning comes in. Classical registration (ICP and global methods like Fast Global Registration) uses hand-designed objectives; some newer work instead learns the registration loss itself from data. Learned SLAM systems such as DeepSLAM train networks for tracking and mapping with photometric and geometric consistency losses instead of hand-designed features. And for predicting the future paths of other road users, sequence models (recurrent networks, LSTMs) and convolutional networks trained on large driving datasets are the common tools. All of these depend on large, well-calibrated, well-synchronised datasets, which is the reason the project put data collection first.

### What makes prediction hard

- **Dynamic objects.** Classical SLAM assumes a static world. Traffic is not static, so moving vehicles and people must be detected, tracked and excluded from the map, or modelled explicitly.
- **A low feature pool.** At night, in rain, on an empty highway or a featureless road, there may not be enough reliable features to localise against. The answer is more sensor types, not a better feature detector.

## What I would tell myself before writing these

Writing six short articles for a general audience was good practice in knowing which details matter. Rewriting them for engineers, two years later, mostly meant adding the parts I had glossed over: the message format I actually had to parse, the closed-form step inside ICP, why stereo depth degrades with distance, and calibration framed as frames and clocks rather than as "tuning". The project site still has the original articles, linked from the [Swayansaasita page](https://www.niser.ac.in/~smishra/project/swayansaasita/).

## References

1. M. Quigley et al. *ROS: an open-source Robot Operating System*. ICRA Workshop on Open Source Software, 2009.
2. R. B. Rusu, S. Cousins. *3D is here: Point Cloud Library (PCL)*. ICRA 2011.
3. P. J. Besl, N. D. McKay. *A Method for Registration of 3-D Shapes*. IEEE Transactions on Pattern Analysis and Machine Intelligence 14(2), 1992.
4. K. S. Arun, T. S. Huang, S. D. Blostein. *Least-Squares Fitting of Two 3-D Point Sets*. IEEE Transactions on Pattern Analysis and Machine Intelligence 9(5), 1987.
5. Q.-Y. Zhou, J. Park, V. Koltun. *Fast Global Registration*. ECCV 2016.
6. C. Stachniss. *ICP & Point Cloud Registration, Part 1: Known Data Association & SVD*. Lecture, 2021.
7. S. Thrun, W. Burgard, D. Fox. *Probabilistic Robotics*. MIT Press, 2005.
8. R. Hartley, A. Zisserman. *Multiple View Geometry in Computer Vision*. Cambridge University Press, 2nd ed., 2004.

## More from Research at NISER & IISER Bhopal

- [NISER Internship Retrospective](/blog/niser-internship-retrospective): going back to the lab, and what the internship gave me.
- [From ORB Features to ORB-SLAM3](/blog/orb-slam3): FAST, rotated BRIEF and binary matching, then every thread of ORB-SLAM3.
- [SLAM from the Bayes Filter Up](/blog/niser-slam-bayes-filter): the probabilistic foundations under every SLAM system, from Bayes' rule to pose graphs.
- [A Browser Dashboard for a ROS 2 Sensor Rig](/blog/niser-ros-dashboard): live camera, point cloud, IMU and GPS previews in a web app.
- [Turning an iPhone into a LiDAR, IMU and GPS Sensor](/blog/niser-iphone-sensor-rig): phone sensors streamed to a server for mapping.
- [Hands-on Quantum Programming at IISER Bhopal](/blog/iiser-bhopal-quantum-workshop): qubits, Bell states and Deutsch–Jozsa worked through from scratch at the QuCIS workshop.
