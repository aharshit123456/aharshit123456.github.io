# ORB-SLAM3: An Accurate Open-Source Library for Visual, Visual-Inertial and Multi-Map SLAM

> [!IMPORTANT]
> **Disclaimer:** This research and presentation were first presented at **NISER SMLAB TALKS** on May 31, 2024.

This paper presents ORB-SLAM3, the first system able to perform visual, visual-inertial and multi-map SLAM with monocular, stereo and RGB-D cameras, using pin-hole and fisheye lens models. The first main novelty is a feature-based tightly-integrated visual-inertial SLAM system that fully relies on Maximum-a-Posteriori (MAP) estimation, even during the IMU initialization phase. The result is a system that operates robustly in real time, in small and large, indoor and outdoor environments, and is two to ten times more accurate than previous approaches.

The second main novelty is a multiple map system that relies on a new place recognition method with improved recall. Thanks to it, ORB-SLAM3 is able to survive to long periods of poor visual information: when it gets lost, it starts a new map that will be seamlessly merged with previous maps when revisiting mapped areas. Compared with visual odometry systems that only use information from the last few seconds, ORB-SLAM3 is the first system able to reuse in all the algorithm stages all previous information. This allows to include in bundle adjustment co-visible keyframes, that provide high parallax observations boosting accuracy, even if they are widely separated in time or if they come from a previous mapping session.

<figure>
<div class="diagram">
  <div class="node muted-node">Input Frames</div>
  <span class="arrow">→</span>
  <div class="node accent">Tracking</div>
  <span class="arrow">→</span>
  <div class="node">Local Mapping</div>
  <span class="arrow">→</span>
  <div class="node">Loop Closing</div>
  <span class="arrow">→</span>
  <div class="node muted-node">Multi-Map Merging</div>
</div>
<figcaption><b>Fig. 1</b> — ORB-SLAM3 reuses all previous map information across stages, including place recognition and map merging when a lost track revisits a previously mapped area.</figcaption>
</figure>

Our experiments show that, in all sensor configurations, ORBSLAM3 is as robust as the best systems available in the literature, and significantly more accurate. Notably, our stereo-inertial SLAM achieves an average accuracy of 3.5 cm in the EuRoC drone and 9 mm under quick hand-held motions in the room of TUM-VI dataset, a setting representative of AR/VR scenarios. For the benefit of the community we make public the source code.

<div class="chart">
  <div class="bar-col">
    <div class="bar-value">3.5 cm</div>
    <div class="bar accent" style="height: 100%;"></div>
    <div class="bar-label">EuRoC drone</div>
  </div>
  <div class="bar-col">
    <div class="bar-value">9 mm</div>
    <div class="bar" style="height: 3%;"></div>
    <div class="bar-label">TUM-VI room</div>
  </div>
</div>
<figcaption><b>Fig. 2</b> — Stereo-inertial SLAM average accuracy reported for the EuRoC drone dataset vs. the TUM-VI room dataset under quick hand-held motion.</figcaption>

<div class="stat-row">
  <div class="stat"><div class="stat-num">2–10×</div><div class="stat-label">more accurate</div></div>
  <div class="stat"><div class="stat-num">3.5cm</div><div class="stat-label">avg. accuracy (EuRoC)</div></div>
  <div class="stat"><div class="stat-num">9mm</div><div class="stat-label">accuracy (TUM-VI)</div></div>
</div>

## Additional Resources
*   [Arxiv Paper](https://arxiv.org/pdf/2007.11898)
*   [GitHub Repository](https://github.com/UZ-SLAMLab/ORB_SLAM3)

## Presentation Slides
<iframe src="/pdfs/2024-05-31--Harshit--ORB-SLAM3.pdf" width="100%" height="600px" style="border: none; border-radius: 8px;"></iframe>
