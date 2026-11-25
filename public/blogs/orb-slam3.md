# From ORB Features to ORB-SLAM3

*By Harshit Agarwal*

> [!IMPORTANT]
> **Disclaimer:** This research and presentation were first presented at **NISER SMLAB TALKS** on May 31, 2024.

In May 2024 I joined SMLab at NISER as a summer intern on Swayansaasita, the lab's project on sensor data and perception for autonomous two-wheelers. One of my first jobs was to read the SLAM literature and work out what the state of the art looked like. A week in, I had to pick one paper and present it at the lab's talk series. I picked ORB-SLAM3, because so many of the other papers I was reading either compared themselves against it or were built on top of it.

The talk was a short deck and a live demo. This post is the longer version: it starts at a single pixel (how FAST decides something is a corner), builds up the binary ORB descriptor, compares ORB with the other common detectors, shows my demo, and then walks through ORB-SLAM3: tracking, local mapping, loop closing, the Atlas of multiple maps, DBoW2 place recognition and IMU initialisation.

<div class="stat-row">
  <div class="stat"><div class="stat-num">256 bits</div><div class="stat-label">per ORB descriptor</div></div>
  <div class="stat"><div class="stat-num">~3,835</div><div class="stat-label">ORB keypoints per photo in my demo</div></div>
  <div class="stat"><div class="stat-num">~0.02 s</div><div class="stat-label">detect + describe per photo</div></div>
  <div class="stat"><div class="stat-num">~28%</div><div class="stat-label">keypoints with a mutual match</div></div>
</div>

## Why a SLAM system needs features

SLAM (simultaneous localisation and mapping) asks a sensor to work out where it is while building the map it localises against. A camera-based system answers one question thousands of times a second: *is this thing I see now the same physical point I saw before?* That is **data association**, and every later stage (pose estimation, triangulation, bundle adjustment, loop closure) assumes it was answered correctly. A wrong association is much harder to recover from than a missing one.

Feature-based systems answer it in two steps:

- A **keypoint detector** picks pixel locations that are distinctive and repeatable, such as corners. A flat wall gives you nothing; the corner of a window gives you something you can find again.
- A **descriptor** turns the patch around each keypoint into a vector, so that patches showing the same physical point produce close vectors and different points produce distant ones.

Matching is then a nearest-neighbour search in descriptor space. With *n* keypoints in one image and *m* in the next, brute-force matching costs *n × m* distance computations per frame. That cost is why the descriptor matters so much for a real-time system, and it is the reason ORB exists.

## FAST: a corner test on a ring of pixels

FAST (Features from Accelerated Segment Test, Rosten and Drummond) looks at a circle of 16 pixels around a candidate pixel *p* and asks whether a long enough contiguous arc of them is all brighter than *p* by some threshold *t*, or all darker by *t*.

```text
p is a corner if there is a contiguous arc of N pixels q on the ring with
    I(q) > I(p) + t   for every q in the arc      (all brighter), or
    I(q) < I(p) - t   for every q in the arc      (all darker)
```

ORB uses the FAST-9 variant. The test is cheap because most pixels can be rejected after looking at only a few ring positions, and the original FAST work learned a decision tree over those checks so that the common "not a corner" case exits almost immediately.

FAST has three gaps that ORB has to fill:

1. **No cornerness score.** FAST also fires along strong edges. ORB sets the FAST threshold low enough to get more than the target number *N* of points, ranks them by the Harris corner measure, and keeps the top *N*.
2. **No scale.** ORB builds an image pyramid (the image downscaled several times) and runs FAST plus Harris filtering on every level.
3. **No orientation.** Rotate the camera and the patch around a corner rotates too, so a descriptor computed on a fixed grid changes. This is the gap the "O" in ORB fills.

## Orientation from the intensity centroid

The idea, which the ORB paper takes from Rosin's work on measuring corner properties, is that the brightness inside a corner patch is not centred on the corner. Compute the patch's centre of mass, using intensity as mass, and the vector from the corner to that centroid gives a direction that rotates with the image.

The moments of a patch are:

```text
m_pq = Σ_(x,y)  x^p · y^q · I(x, y)

centroid     C = ( m_10 / m_00 ,  m_01 / m_00 )

orientation  θ = atan2( m_01 , m_10 )
```

Here *x* and *y* are measured from the keypoint, so the keypoint is the origin. `atan2` is the quadrant-aware arctangent, and that matters: a plain `arctan(m_01 / m_10)`, which is how I first wrote it in my own notes, cannot tell a patch pointing up-right from one pointing down-left. The paper also restricts the sums to a circular region rather than a square, so that rotating the patch does not change which pixels are included.

On artificially rotated, noisy patches, the ORB authors found the centroid more reliable than two gradient-based estimates, one of them SIFT-like. It is also cheap: three sums over a patch.

## BRIEF, and why binary descriptors

SIFT describes a patch with a 128-dimensional vector of floats built from gradient histograms. Comparing two SIFT descriptors means a Euclidean distance over 128 floats. Do that for every candidate pair in every frame and it becomes the bottleneck.

BRIEF (Calonder et al.) takes a different route. Smooth the patch, pick a fixed list of pixel pairs (*x_i*, *y_i*) inside it, and for each pair write down one bit:

```text
τ(p; x_i, y_i) = 1   if I(p + x_i) < I(p + y_i)
                 0   otherwise

descriptor d(p) = the n bits τ(p; x_1, y_1) ... τ(p; x_n, y_n),   n = 256 in ORB
```

That is the whole descriptor: 256 brightness comparisons, packed into 32 bytes. The distance between two such descriptors is the **Hamming distance**, the number of bit positions where they differ:

```text
Hamming(d_a, d_b) = popcount( d_a XOR d_b )
```

On a modern CPU that is a few XOR and population-count instructions over four 64-bit words. Binary descriptors are cheap to compute, store and compare, and comparison is what dominates matching. My pre-talk notes put it as: every point in image A is compared with all the points in image B, that is heavy, so we use binary descriptors. They also index well: the ORB paper uses multi-probe locality-sensitive hashing, and DBoW2 (below) builds its vocabulary directly on binary descriptors.

## Rotated BRIEF: steering the tests, then relearning them

Plain BRIEF is not rotation invariant, because the pixel pairs are fixed relative to the image axes. The obvious fix is to rotate the pair coordinates by the keypoint's orientation θ before sampling. ORB calls this **steered BRIEF**:

```text
S   = [ x_1 ... x_n ; y_1 ... y_n ]      (2 × n matrix of test locations)
S_θ = R_θ · S                              (rotate every test location by θ)
```

To keep it fast, ORB discretises θ in steps of 12 degrees (30 steps per turn) and precomputes a lookup table of rotated patterns, so steering costs one table lookup per keypoint.

The interesting part of the paper is what goes wrong next. A good binary test has high variance (its mean over many keypoints is near 0.5, so the bit carries information) and is uncorrelated with the other tests. BRIEF's random pattern has both properties on unoriented patches. Once every patch is steered to a canonical orientation, patches start to look alike, the test means drift away from 0.5, and the descriptor loses discriminative power.

ORB's answer, **rBRIEF**, is to learn 256 tests that keep high variance and low correlation *after* steering. The authors enumerated every test inside a 31 × 31 patch that compares two non-overlapping 5 × 5 sub-windows (205,590 candidates), ran them all on about 300,000 training keypoints, sorted them by how close their mean is to 0.5, and then walked that list greedily, keeping a test only if its correlation with every test already kept stayed below a threshold.

<figure>
  <div class="diagram">
    <div class="node muted-node">Image pyramid</div>
    <span class="arrow">→</span>
    <div class="node">FAST-9 corners<br>per level</div>
    <span class="arrow">→</span>
    <div class="node">Harris ranking<br>keep top N</div>
    <span class="arrow">→</span>
    <div class="node">Orientation θ<br>intensity centroid</div>
    <span class="arrow">→</span>
    <div class="node accent">rBRIEF<br>256 learned tests, steered by θ</div>
  </div>
  <figcaption><b>Fig. 1</b> — the ORB pipeline. Each stage fixes one gap in the previous one: scale, cornerness, orientation, and then the loss of descriptor variance that steering causes.</figcaption>
</figure>

The paper's headline claim is that ORB matches about as well as SIFT on many tasks while being roughly two orders of magnitude faster. For a SLAM system that extracts and matches features on every frame, that speed gap is what made ORB the default.

## How ORB compares with SIFT, SURF, KAZE, AKAZE and BRISK

While preparing the talk I read a 2018 comparison by Tareen and Saleem. They ran all six detector-descriptors on scaled (5% to 500%), rotated (0 to 360 degrees) and perspective-warped versions of benchmark images, matched with the nearest-neighbour distance ratio, and fitted transforms with RANSAC. They also ran ORB and BRISK capped at 1,000 features, written ORB(1000) and BRISK(1000), next to the uncapped versions. Their conclusions, paraphrased:

| Method | Descriptor | What the comparison found |
|---|---|---|
| SIFT | 128 floats, gradient histograms | Most accurate overall; among the most scale invariant; expensive to compute |
| SURF | 64 or 128 floats, Haar responses | Among the most scale invariant; the 128-d version was slowest at matching |
| KAZE | Floats, nonlinear scale space | Accurate under rotation; slowest to detect and describe |
| AKAZE | Binary, nonlinear scale space | Among the most rotation invariant; middle of the pack on speed |
| BRISK | Binary | With SIFT, the most accurate overall; also among the most efficient |
| ORB | Binary, 256 bits | Cheapest to detect and describe per feature; finds the most features; *least* scale invariant |

The line I highlighted in the paper was that ORB(1000) has the least feature-matching cost. Their ranking of total image matching time puts ORB(1000) first but *uncapped* ORB near the bottom, and that explains why ORB-based systems cap the number of features. Uncapped ORB finds so many keypoints that matching all of them takes longer than matching SIFT's smaller set, even though each comparison is far cheaper. A fixed budget keeps matching bounded, at some cost in accuracy, which the paper also reports.

> [!NOTE]
> "Least scale invariant" is about repeatability across large scale changes in that benchmark. A SLAM system mostly matches neighbouring frames, where scale changes are small, so ORB's weakness matters less there than in one-shot image registration.

## The live demo: ORB matching on two phone photos

For the talk I ran a small ORB demo in a Colab notebook with OpenCV. I took two phone photos of the same corner of the lab (a sensor enclosure with a red breakout board, and a laptop showing the notebook itself) from different positions, and measured how long ORB took per image, how many keypoints it found, and what fraction of keypoints found a match.

```python
orb = cv.ORB_create(1000000)          # effectively no cap on features
bf  = cv.BFMatcher(cv.NORM_HAMMING, crossCheck=True)

kp1, des1 = orb.detectAndCompute(img1, None)
kp2, des2 = orb.detectAndCompute(img2, None)

matches = bf.knnMatch(des1, des2, k=1)
matches = sorted([m for m in matches if len(m) > 0], key=lambda x: x[0].distance)
fraction_matched = len(matches) / len(kp1)
```

`NORM_HAMMING` is the XOR-and-popcount distance from above. `crossCheck=True` keeps a pair only if each descriptor is the other's nearest neighbour, a cheap first filter against wrong matches. The notebook printed:

```text
Average time for ORB features:   0.019579744338989256
Average number of ORB features:  3835.2
Percentage of Matched Keypoints: 0.28125
```

So, on the images in my folder: about 3,835 keypoints per image in about 20 ms each, and about 28% of the first image's keypoints had a mutual nearest neighbour in the second. On the slide I rounded this to "about 30% matched, in very little time". (Despite the label, the last number is a fraction, not a percentage.)

<figure>
  <img src="/assets/niser/orb-slam3/orb-matching-demo.webp" alt="Two photos of the same lab bench side by side, a sensor enclosure with a red circuit board and a laptop screen, joined by hundreds of coloured lines connecting matched ORB keypoints" style="width:100%; border-radius: 6px;" />
  <figcaption><b>Fig. 2</b> — the 500 best cross-checked ORB matches from my talk demo. Roughly parallel lines are consistent matches; the long diagonals that cut across the bundle are wrong ones. (Browser bars blurred.)</figcaption>
</figure>

Looking at the figure now, it shows the limits as much as the strengths. Many lines cut across the bundle at steep angles: keypoints on the enclosure's repeated hole pattern matched to the wrong hole, text matched to different text. Cross-checking does not catch those. A real pipeline adds a ratio test (is the best match clearly better than the second best?) and a geometric check such as RANSAC. ORB-SLAM goes further and almost never matches blindly: it predicts where a map point should appear and searches a small window around that prediction.

The notebook also printed a "drift" metric computed under an assumed transform between the photos. That transform does not describe how these photos were taken, so I have left the number out.

## From features to a SLAM system

ORB-SLAM3 (Campos et al., IEEE Transactions on Robotics, 2021) builds on ORB-SLAM, ORB-SLAM2 and the visual-inertial ORB-SLAM-VI from the University of Zaragoza. It is one library for monocular, stereo and RGB-D cameras, with or without an IMU, using pinhole or fisheye lens models.

The paper's two main contributions are a visual-inertial system that is formulated as maximum-a-posteriori (MAP) estimation all the way through, including IMU initialisation, and a multi-map system built on a place recognition method with better recall. The ORB descriptor is used at every time scale: short-term association (frame to frame), mid-term association (frame to local map), and long-term association (place recognition through DBoW2).

<figure>
  <div class="diagram">
    <div class="node muted-node">Camera + IMU</div>
    <span class="arrow">→</span>
    <div class="node accent">Tracking<br>every frame</div>
    <span class="arrow">→</span>
    <div class="node">Local mapping<br>every keyframe</div>
    <span class="arrow">→</span>
    <div class="node">Loop closing &amp;<br>map merging</div>
    <span class="arrow">→</span>
    <div class="node muted-node">Full BA<br>separate thread</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">Atlas: active map + non-active maps<br>one DBoW2 keyframe database shared by all</div>
  </div>
  <figcaption><b>Fig. 3</b> — the main threads of ORB-SLAM3. Tracking runs per frame; local mapping and place recognition run per keyframe; all of them read from and write to the Atlas.</figcaption>
</figure>

### Tracking

The tracking thread runs on every frame and has to be real-time. It extracts ORB features, predicts the current pose, projects the points of the active map into the image at that predicted pose, searches for matching descriptors in small windows around each projection, and then optimises the pose by minimising the reprojection error of those matches. It also decides whether the current frame should become a **keyframe**, which is what the other threads work on.

In visual-inertial mode, the IMU readings between frames give a much better pose prediction, and the optimisation also estimates the body velocity and the IMU biases. To keep it cheap, only the states of the last two frames are optimised and the map points are held fixed.

Tracking loss is handled in two stages. With fewer than 15 tracked map points the system is "short-term lost": it predicts the pose from the IMU and searches a wider window. If that fails for 5 seconds it is "long-term lost" and starts a new map, which becomes the active map in the Atlas.

### Local mapping

The local mapping thread takes each new keyframe, triangulates new map points, removes redundant keyframes and points, and refines the neighbourhood with **local bundle adjustment**, the core optimisation of visual SLAM. Given camera poses *T_i*, 3D points *X_j*, and the observed pixel *x_ij* of point *j* in keyframe *i*, it adjusts all of them together to minimise reprojection error:

```text
min over {T_i}, {X_j}   Σ_(i,j)  ρ( || x_ij − π( T_i · X_j ) ||²_Σ )

π  : projects a 3D point in the camera frame to pixels (pinhole or fisheye model)
ρ  : the Huber robust cost, so a few bad matches do not dominate
Σ  : the measurement covariance of each observation
```

Solving this for the whole map at every keyframe would be intractable, so ORB-SLAM3 optimises a sliding window of recent keyframes and their points, with the other keyframes that observe those points (the "covisible" keyframes) held fixed. In visual-inertial mode the problem gains terms for the preintegrated IMU measurements between keyframes.

### Loop closing and map merging

Every new keyframe is checked against the whole Atlas for a place the system has seen before. If the match is in the active map, it is a **loop closure**: accumulated drift is corrected by a pose-graph optimisation, and then a full bundle adjustment runs in a separate thread so tracking is not blocked. If the match is in a different, non-active map, the two maps are **merged** into one, which becomes the active map.

Merging happens in a "welding window": the two matched keyframes, their covisible neighbours and the points they observe. The old map is aligned to the active one, duplicated points are fused, a bundle adjustment runs on the welding window, and a pose-graph optimisation over the merged map's *essential graph* (a sparse subset of the covisibility graph) spreads the correction to the rest of the map.

The paper reports about 10 ms per keyframe for place recognition and under a second for merging and loop closing with pose-graph optimisation only. A full bundle adjustment after a loop can take a few seconds, which is why it has its own thread.

## The Atlas: what happens when tracking fails

Earlier visual SLAM systems kept one map. When tracking was lost (a fast turn, a blank wall) the system could only try to relocalise in that map, and until it succeeded, nothing new was recorded.

The **Atlas** is a set of disconnected maps. One is active: tracking localises against it and local mapping grows it. When tracking is lost for long enough, the active map is stored and a fresh one starts, so mapping continues. When place recognition later finds an overlap, the merge step stitches the maps together. All maps share one DBoW2 keyframe database, so one query searches every map, and a map saved from an earlier session is just another non-active map.

For a vehicle this matters a lot: losing visual tracking on a road is routine, every time the camera faces the sun or a truck fills the frame.

## Place recognition with DBoW2

Tracking always has a pose prediction to search around. Place recognition does not, so it needs a way to find similar keyframes without geometry. ORB-SLAM uses the **bag of words** idea from text retrieval, which I described in the talk as treating image features as words:

1. Offline, cluster a large set of ORB descriptors into a hierarchical vocabulary tree. Each leaf is a "visual word".
2. For each keyframe, push every descriptor down the tree to find its word, and represent the keyframe as a weighted histogram of words (tf-idf style weights, so common words count less).
3. Keep an inverted index from each word to the keyframes that contain it. A query only scores keyframes that share words with it.

DBoW2 (Gálvez-López and Tardós) implements this for binary descriptors. Raw queries are fast but noisy: the ORB-SLAM3 paper cites precision and recall of roughly 50% to 80% for the top candidate. To avoid false loops that would corrupt the map, DBoW2 adds consistency checks, one of which is temporal: the same place must be recognised in three consecutive keyframes. That pushes precision to 100% but delays recognition by at least three keyframes and lowers recall, and the ORB-SLAM3 authors found that this delay too often left duplicated areas in the Atlas.

ORB-SLAM3 replaces the temporal check with geometric checks that use what is already in the map:

1. Query DBoW2 for the three most similar keyframes that are not already covisible with the current one, and build a local window around each: the candidate, its best covisible keyframes and their map points.
2. Estimate an aligning transform from 3D-3D matches with RANSAC (Horn's method on three-point samples): Sim(3) while scale is unknown, SE(3) once it is known. Refine it with guided matching in both directions.
3. Verify it against keyframes already covisible with the current one in the active map, instead of waiting for new keyframes. In visual-inertial mode, also require small pitch and roll, since gravity fixes those two angles.

The result is higher recall without the delay, which is what the Atlas needs to merge maps soon after they overlap.

## IMU initialisation as MAP estimation

An IMU provides scale and the gravity direction, which a single camera cannot observe, but only once its biases, gravity direction and velocity are known. Some earlier systems solved the full visual-inertial problem from scratch and took tens of seconds to converge; others used closed-form equations that ignore sensor noise.

ORB-SLAM3 frames initialisation as three MAP estimation steps:

1. **Vision only.** Run pure monocular SLAM for about 2 seconds, inserting keyframes at 4 Hz, and refine with visual bundle adjustment. This gives an accurate trajectory up to an unknown scale.
2. **Inertial only.** Hold that trajectory fixed and estimate only the inertial variables from the IMU readings between keyframes.
3. **Visual-inertial.** Scale and rotate the map using the estimates, then run a joint visual-inertial bundle adjustment.

The inertial-only step is the interesting one:

```text
Y_k = { s, R_wg, b, v_0:k }

s      : scale of the vision-only map           (kept positive: s_new = s_old · exp(δs))
R_wg   : rotation giving gravity in the world frame
         (updated with two angles only; rotating about gravity does not change it)
b      : accelerometer and gyroscope biases, assumed constant during initialisation
v_0:k  : body velocity at each keyframe

Y_k* = argmax  p(Y_k) · Π_i p( I_(i-1,i) | s, R_wg, b, v_(i-1), v_i )

     = argmin  || b ||²_(Σ_b)  +  Σ_i || r_I(i-1,i) ||²_(Σ_I)     (negative log, Gaussian errors)
```

The prior *p(Y_k)* says the biases should be near zero, with a covariance encoding how large they can realistically be. That prior makes it MAP rather than maximum likelihood, and keeps the problem well posed when two seconds of motion do not excite every axis.

The paper reports about 5% scale error after 2 seconds of trajectory on EuRoC, and about 1% after two further visual-inertial bundle adjustments at 5 and 15 seconds. For stereo-inertial setups the scale is fixed to one and removed from the problem, which helps convergence.

## What the results say

In my copy of the paper I highlighted three findings from the evaluation:

- Of the four sensor configurations (monocular and stereo, each with and without an IMU), stereo-inertial is clearly the most robust and accurate.
- On the long indoor "magistrale" sequences of TUM-VI, up to 900 m, errors stayed around a metre, with one sequence near 5 m.
- On some long outdoor sequences, the lack of nearby visual features let the inertial parameters (scale and accelerometer bias especially) drift, giving errors of tens of metres.

The abstract also gives an average accuracy of 3.5 cm for stereo-inertial SLAM on the EuRoC drone dataset, and 9 mm for quick hand-held motion in the TUM-VI room sequences. For a two-wheeler the outdoor finding is the relevant one: roads are exactly where most features are far away.

## What I would change in the talk

- **Show the failure cases from the demo.** The crossing lines in Fig. 2 argue for guided matching better than any slide I had.
- **Say what ORB-SLAM assumes about the world.** It assumes a static scene. My notes from that week list Det-SLAM (ORB-SLAM3 plus Detectron2 segmentation and depth, to discard points on moving objects) as a possible successor, though its authors note it does not run in real time. Traffic is about as dynamic as a scene gets.

## References

1. E. Rublee, V. Rabaud, K. Konolige, G. Bradski. *ORB: An efficient alternative to SIFT or SURF*. ICCV 2011. [doi:10.1109/ICCV.2011.6126544](https://doi.org/10.1109/ICCV.2011.6126544)
2. C. Campos, R. Elvira, J. J. Gómez Rodríguez, J. M. M. Montiel, J. D. Tardós. *ORB-SLAM3: An Accurate Open-Source Library for Visual, Visual-Inertial and Multimap SLAM*. IEEE Transactions on Robotics 37(6), 2021. [arXiv:2007.11898](https://arxiv.org/abs/2007.11898)
3. S. A. K. Tareen, Z. Saleem. *A Comparative Analysis of SIFT, SURF, KAZE, AKAZE, ORB, and BRISK*. International Conference on Computing, Mathematics and Engineering Technologies (iCoMET), 2018.
4. E. Rosten, T. Drummond. *Machine learning for high-speed corner detection*. ECCV 2006.
5. M. Calonder, V. Lepetit, C. Strecha, P. Fua. *BRIEF: Binary Robust Independent Elementary Features*. ECCV 2010.
6. P. L. Rosin. *Measuring corner properties*. Computer Vision and Image Understanding 73(2), 1999.
7. D. Gálvez-López, J. D. Tardós. *Bags of Binary Words for Fast Place Recognition in Image Sequences*. IEEE Transactions on Robotics 28(5), 2012.
8. R. Mur-Artal, J. M. M. Montiel, J. D. Tardós. *ORB-SLAM: A Versatile and Accurate Monocular SLAM System*. IEEE Transactions on Robotics 31(5), 2015.
9. R. Mur-Artal, J. D. Tardós. *ORB-SLAM2: An Open-Source SLAM System for Monocular, Stereo, and RGB-D Cameras*. IEEE Transactions on Robotics 33(5), 2017.
10. A. Eslamian, M. R. Ahmadzadeh. *Det-SLAM: A semantic visual SLAM for highly dynamic scenes using Detectron2*.

## Additional Resources
*   [Arxiv Paper](https://arxiv.org/pdf/2007.11898)
*   [GitHub Repository](https://github.com/UZ-SLAMLab/ORB_SLAM3)

## Presentation Slides
<iframe src="/pdfs/2024-05-31--Harshit--ORB-SLAM3.pdf" width="100%" height="600px" style="border: none; border-radius: 8px;"></iframe>

## More from Research at NISER & IISER Bhopal

- [NISER Internship Retrospective](/blog/niser-internship-retrospective): going back to the lab, and what the internship gave me.
- [SLAM from the Bayes Filter Up](/blog/niser-slam-bayes-filter): the probabilistic foundations under every SLAM system, from Bayes' rule to pose graphs.
- [A Browser Dashboard for a ROS 2 Sensor Rig](/blog/niser-ros-dashboard): live camera, point cloud, IMU and GPS previews in a web app.
- [Turning an iPhone into a LiDAR, IMU and GPS Sensor](/blog/niser-iphone-sensor-rig): phone sensors streamed to a server for mapping.
- [Field Notes on Perception for Two-Wheeler Autonomy](/blog/niser-perception-notes): computer vision, point clouds and prediction for autonomous two-wheelers, written for the Swayansaasita project site.
- [Hands-on Quantum Programming at IISER Bhopal](/blog/iiser-bhopal-quantum-workshop): qubits, Bell states and Deutsch–Jozsa worked through from scratch at the QuCIS workshop.
