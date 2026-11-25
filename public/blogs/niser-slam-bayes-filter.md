# SLAM from the Bayes Filter Up

*By Harshit Agarwal*

After my ORB-SLAM3 talk at SMLab in May 2024, my next task on Swayansaasita, the lab's autonomous two-wheeler project, was to find the state of the art in SLAM on lidar and IMU data. Reading system papers is much easier once you know *why* the problem is set up the way it is: why everything is a probability, why there is a prediction step and a correction step, why some systems are "filters" and others are "graphs". So in June and early July I went back to the foundations and worked through Cyrill Stachniss's *Robot Mapping* lecture series, keeping notes in Logseq as I went.

This post is those notes, cleaned up and corrected. It goes from the definition of the SLAM problem, through Bayes' rule and the Markov assumption, to a derivation of the recursive Bayes filter, then to its implementations (Kalman, extended Kalman, particle filters), occupancy grids, pose graphs, the taxonomy of SLAM approaches, and finally what the lidar-plus-IMU corner of the field looked like when I surveyed it. The coordinate-frame material comes first, because every equation after it silently depends on it.

> [!NOTE]
> The site renders equations as plain text, so they are written in code blocks using a simple notation: `x_t` is x at time t, `z_1:t` is the sequence z_1 ... z_t, and `p(a | b)` is the probability of a given b.

## The SLAM problem, stated as a probability

A robot (or a camera on a motorcycle) moves through an unknown environment. It gives itself controls, or measures its own motion with odometry or an IMU, and it observes the world with sensors. Those are the **inputs**. The **outputs** we want are a map of the environment and the path the robot took through it.

Neither the controls nor the observations are exact. Wheels slip, IMUs drift, lidar returns are noisy, a camera mistakes one corner for another. Probabilistic robotics deals with this by representing uncertainty explicitly: instead of computing *the* path and *the* map, we compute a distribution over all possible paths and maps given the data. In my notes I wrote it as "basically P(out | in)":

```text
p( x_0:t , m | z_1:t , u_1:t )

x_0:t  : the path, the sequence of robot poses from time 0 to t
m      : the map
z_1:t  : the observations (sensor measurements) up to time t
u_1:t  : the controls (or odometry readings) up to time t
```

The Springer Handbook of Robotics, which the lecture series points to, separates two versions of this problem:

- **Full SLAM** estimates the posterior over the *entire* path and the map, `p(x_0:t, m | z_1:t, u_1:t)`.
- **Online SLAM** estimates only the *current* pose and the map, `p(x_t, m | z_1:t, u_1:t)`.

The difference is only how much of the path you keep. Online SLAM is full SLAM with the past poses integrated out, one at a time, as they become past:

```text
p( x_t, m | z_1:t, u_1:t ) = ∫ ∫ ... ∫ p( x_0:t, m | z_1:t, u_1:t ) dx_0 dx_1 ... dx_t-1
```

That integral is why the two families of SLAM algorithms look so different. Filters solve the online problem: they keep a belief over the present and fold each past state into it. Smoothers (pose-graph and bundle-adjustment methods) solve the full problem: they keep the past around so that new information, like a loop closure, can correct it.

## Coordinate frames come first

Before any probability, there is geometry. A pose is a position and an orientation, and every measurement is taken in some sensor's own frame. A lidar point is in the lidar frame, an IMU acceleration is in the IMU frame, a GPS fix is in a global frame. Nothing can be fused until it is all in one frame.

The transformations involved are **affine**: maps that preserve straight lines and parallelism. Translation, rotation, scaling, reflection and shear are all affine. The ones that matter for robots are rotations and translations (rigid motions). A rotation about the x-axis by angle θ is:

```text
R_x(θ) = | 1     0        0     |
         | 0   cos θ   -sin θ   |
         | 0   sin θ    cos θ   |
```

The awkward part is that rotation is a matrix product but translation is an addition, so chaining several transforms (world to body, body to camera, camera to pixel) becomes a mess of mixed operations. **Homogeneous coordinates** fix this by adding one extra coordinate *w*:

```text
2D point (x, y)  →  (x, y, 1)  ≡  (w·x, w·y, w)   for any w ≠ 0

rigid transform in 3D, as one 4 × 4 matrix:

T = | R   t |        R : 3 × 3 rotation
    | 0   1 |        t : 3 × 1 translation  (t_x, t_y, t_z)

p_world = T_world_body · T_body_sensor · p_sensor
```

A 2D transform becomes a 3 × 3 matrix and a 3D transform a 4 × 4 matrix, and chaining frames is plain matrix multiplication. Homogeneous coordinates also let you write a point at infinity, with *w* = 0. My notes have a question I asked myself, "why do we need a point at infinity?", and the robotics answer I wrote down: a sensor only knows the world up to some range, and directions beyond that range behave like points at infinity. In a camera, the vanishing point of parallel road edges is exactly such a point.

Every sensor on a rig needs its own `T_body_sensor`, its **extrinsic calibration**. If that transform is off by a degree, every measurement from that sensor is wrong in a consistent way, and no filter downstream can tell. That is why calibration came up so often on the project.

## Bayes' rule and the Markov assumption

Two tools do almost all of the work in SLAM.

**Bayes' rule** turns a question we cannot answer directly ("where am I, given this measurement?") into one we can model ("what measurement would I expect, if I were here?"):

```text
p(x | z) = p(z | x) · p(x) / p(z)  =  η · p(z | x) · p(x)

p(z | x)  : likelihood, from a sensor model
p(x)      : prior, what we believed before the measurement
η         : 1 / p(z), a normaliser that makes the result sum to 1
```

The normaliser does not depend on *x*, so in practice we compute `p(z | x) · p(x)` for every candidate *x* and rescale at the end.

**The Markov assumption** says the state is a complete summary of the past. Two forms are used:

```text
observation:  p( z_t | x_0:t, z_1:t-1, u_1:t ) = p( z_t | x_t )
motion:       p( x_t | x_0:t-1, z_1:t-1, u_1:t ) = p( x_t | x_t-1, u_t )
```

The first says that if you know where the robot is now, older measurements and controls tell you nothing more about what it will measure now. The second says that if you know the previous pose and the latest control, nothing older helps predict the current pose. Both are approximations (unmodelled dynamics, people walking through the scene and correlated sensor errors all break them), but without them the computation grows with the length of the history.

## Deriving the recursive Bayes filter

The **belief** is the posterior over the current state given everything so far:

```text
bel(x_t) = p( x_t | z_1:t, u_1:t )
```

The goal is to compute `bel(x_t)` from `bel(x_t-1)`, the latest control and the latest measurement, without touching the rest of the history. Each line below uses exactly one rule:

```text
bel(x_t) = p( x_t | z_1:t, u_1:t )

  (Bayes' rule on z_t)
         = η · p( z_t | x_t, z_1:t-1, u_1:t ) · p( x_t | z_1:t-1, u_1:t )

  (Markov, observation)
         = η · p( z_t | x_t ) · p( x_t | z_1:t-1, u_1:t )

  (total probability over the previous state x_t-1)
         = η · p( z_t | x_t ) · ∫ p( x_t | x_t-1, z_1:t-1, u_1:t ) · p( x_t-1 | z_1:t-1, u_1:t ) dx_t-1

  (Markov, motion)
         = η · p( z_t | x_t ) · ∫ p( x_t | x_t-1, u_t ) · p( x_t-1 | z_1:t-1, u_1:t ) dx_t-1

  (u_t is chosen after x_t-1, so it says nothing about x_t-1)
         = η · p( z_t | x_t ) · ∫ p( x_t | x_t-1, u_t ) · p( x_t-1 | z_1:t-1, u_1:t-1 ) dx_t-1

  (that last factor is the previous belief)
         = η · p( z_t | x_t ) · ∫ p( x_t | x_t-1, u_t ) · bel(x_t-1) dx_t-1
```

The last line is the whole filter. It is recursive: the new belief needs only the old belief, one motion model and one observation model.

> [!NOTE]
> My first written version of this derivation had a mistake in the total-probability step: I wrote the joint `p(x_t, x_t-1 | ...)` inside the integral where the conditional `p(x_t | x_t-1, ...)` belongs. The joint integrated over `x_t-1` already gives the left-hand side, so multiplying it by the previous belief counts that belief twice. Writing one rule per line, as above, makes that kind of slip easy to spot.

## Prediction and correction

The same equation is usually split into two steps:

```text
prediction:   bel_bar(x_t) = ∫ p( x_t | x_t-1, u_t ) · bel(x_t-1) dx_t-1
correction:   bel(x_t)     = η · p( z_t | x_t ) · bel_bar(x_t)
```

- **Prediction** pushes the old belief through the **motion model** `p(x_t | x_t-1, u_t)`. Because motion is noisy, the belief spreads out: you are less sure where you are after moving. The lectures distinguish odometry-based motion models (for robots with wheel encoders) from velocity-based ones (when there are none). On a motorcycle the IMU plays this role.
- **Correction** multiplies the predicted belief by the **observation model** `p(z_t | x_t)`, which scores how well each candidate state explains what the sensor just saw. Because a measurement is information, the belief sharpens.

<figure>
  <div class="diagram">
    <div class="node muted-node">bel(x_t-1)</div>
    <span class="arrow">→</span>
    <div class="node">Predict<br>motion model, control u_t</div>
    <span class="arrow">→</span>
    <div class="node muted-node">bel_bar(x_t)<br>wider</div>
    <span class="arrow">→</span>
    <div class="node">Correct<br>observation model, z_t</div>
    <span class="arrow">→</span>
    <div class="node accent">bel(x_t)<br>sharper</div>
  </div>
  <figcaption><b>Fig. 1</b> — one cycle of the recursive Bayes filter. The output becomes the input for the next time step; nothing older is kept.</figcaption>
</figure>

The Bayes filter is a framework, not an algorithm. It does not say how to represent a distribution over a continuous state, and the integral has no closed form in general. Every practical filter is a choice about that: which models are allowed (linear or not), and which distributions (Gaussian only, or anything).

## The Kalman filter: linear models, Gaussian noise

If the motion and observation models are linear and all noise is Gaussian, the belief stays Gaussian forever, and the integral becomes matrix algebra. That special case is the **Kalman filter**. The models are:

```text
x_t = A_t · x_t-1 + B_t · u_t + ε_t       ε_t ~ N(0, R_t)   motion noise
z_t = C_t · x_t + δ_t                     δ_t ~ N(0, Q_t)   measurement noise
```

A Gaussian belief is just a mean μ and a covariance Σ, and one step of the filter is seven lines (this is the form in Thrun, Burgard and Fox's *Probabilistic Robotics*, which the lecture follows):

```text
Kalman_filter(μ_t-1, Σ_t-1, u_t, z_t):

  μ_bar = A_t · μ_t-1 + B_t · u_t                       # predict the mean
  Σ_bar = A_t · Σ_t-1 · A_tᵀ + R_t                      # predict the covariance (grows by R_t)

  K_t   = Σ_bar · C_tᵀ · ( C_t · Σ_bar · C_tᵀ + Q_t )⁻¹  # Kalman gain
  μ_t   = μ_bar + K_t · ( z_t − C_t · μ_bar )           # correct with the innovation
  Σ_t   = ( I − K_t · C_t ) · Σ_bar                     # covariance shrinks

  return μ_t, Σ_t
```

The **Kalman gain** *K* is the interesting line. It weighs how uncertain the prediction is (Σ_bar) against how noisy the measurement is (Q). If the sensor is very precise, *K* is large and the estimate jumps toward what the sensor says. If the prediction is already confident, *K* is small and the measurement barely moves it. The term `z_t − C_t · μ_bar`, the **innovation**, is the difference between what you measured and what you expected to measure.

When I wrote the prediction article for the project website, this algorithm was the figure. Writing it out as code here makes the structure clearer: the first two lines are the prediction step and the last three are the correction step of the Bayes filter.

## When the world is not linear: EKF, UKF and information filters

Robots turn, and turning involves sines and cosines, so real motion and observation models are non-linear: `x_t = g(u_t, x_t-1) + ε_t` and `z_t = h(x_t) + δ_t`. A Gaussian pushed through a non-linear function is no longer Gaussian. The common fixes:

- **Extended Kalman filter (EKF).** Linearise *g* and *h* around the current mean using their Jacobians, `G_t` and `H_t`, and use those in place of *A* and *C*. It works well when the functions are close to linear over the spread of the belief, and fails quietly when they are not.
- **EKF SLAM.** Put the robot pose *and* every landmark position into one big state vector, and run an EKF over it. The covariance matrix holds every pose-landmark and landmark-landmark correlation, so it grows with the square of the number of landmarks, and every update touches all of it.
- **Unscented Kalman filter (UKF).** Instead of linearising, pick a small set of "sigma points" that capture the mean and covariance, push each point through the real non-linear function, and fit a new Gaussian to the results. No Jacobians, and usually a better approximation.
- **Extended information filter (EIF) and its sparse version (SEIF).** Represent the Gaussian by the inverse covariance (the information matrix) instead. In SLAM that matrix is close to sparse, and the sparse extended information filter exploits this to keep updates cheap.

## Particle filters: when one Gaussian is not enough

A Gaussian has one peak. If the robot could be in one of two corridors that look identical, the true belief has two peaks, and any Kalman-style filter will average them into one wrong answer. A **particle filter** gives up on a parametric form and represents the belief by a set of samples:

```text
for each particle i:
    x_t[i] ~ p( x_t | x_t-1[i], u_t )      # prediction: sample from the motion model
    w_t[i] = p( z_t | x_t[i] )             # correction: weight by the observation model
resample particles in proportion to w_t   # drop unlikely ones, duplicate likely ones
```

It handles arbitrary non-linear models and multi-modal beliefs, at the price of needing enough particles to cover the state space, which grows quickly with dimension. For SLAM, the Rao-Blackwellised version gives each particle its own path and its own map, so the map can be estimated cheaply given the path; the grid-mapping work by Grisetti, Stachniss and Burgard, which I cited on the project site, builds on this.

| Filter | Belief | Models | Main cost or weakness |
|---|---|---|---|
| Kalman | One Gaussian | Linear only | Wrong as soon as models bend |
| EKF | One Gaussian | Linearised with Jacobians | Linearisation error; EKF SLAM is quadratic in landmarks |
| UKF | One Gaussian | Non-linear, via sigma points | Still unimodal |
| Information filter / SEIF | Gaussian in information form | Linearised | Recovering the mean needs extra work |
| Particle | Weighted samples | Anything you can sample | Particle count grows with state dimension |

## Occupancy grid maps

So far the map has been a set of landmarks. Lidar and depth sensors do not produce landmarks; they produce rays that either hit something or pass through free space. An **occupancy grid** represents the map as a grid of cells, each with a probability of being occupied, and makes two simplifying assumptions: cells are independent of each other, and the world is static.

With those assumptions, each cell can be updated on its own with a binary Bayes filter. It is done in log-odds, so the update is a sum instead of a product:

```text
l(m_i) = log( p(m_i) / (1 − p(m_i)) )

l_t(m_i) = l_t-1(m_i) + log( p(m_i | z_t, x_t) / (1 − p(m_i | z_t, x_t)) ) − l_0

p(m_i | z_t, x_t) : the inverse sensor model. For a lidar beam, cells the beam
                    passed through are likely free; the cell where it ended is
                    likely occupied; cells beyond it are unknown.
```

Log-odds also avoid the numerical problem of probabilities saturating near 0 or 1. Occupancy grid mapping assumes the poses are known, which is exactly the "mapping" half of SLAM. In a full system it is paired with a localisation method, for example a particle per path as above.

## From filtering to smoothing: pose graphs

A filter forgets. Once a pose is folded into the belief, it can never be revisited, even when a later observation shows that it was wrong. **Graph-based SLAM** keeps the past around and turns SLAM into an optimisation problem:

- **Nodes** are robot poses (and, in some formulations, landmark positions).
- **Edges** are constraints between nodes, each a relative transform with an uncertainty: from odometry between consecutive poses, from landmark observations, or from matching two lidar scans.
- **Loop closures** are edges between nodes that are far apart in time but close in space, found when the robot recognises a place it has been before. They are what correct accumulated drift.

<figure>
  <div class="diagram">
    <div class="node">x_0</div>
    <span class="arrow">→</span>
    <div class="node">x_1</div>
    <span class="arrow">→</span>
    <div class="node">x_2</div>
    <span class="arrow">→</span>
    <div class="node">x_3</div>
    <span class="arrow">→</span>
    <div class="node accent">x_4<br>sees x_0's place again</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">odometry edges: x_i → x_i+1</div>
    <div class="node accent">loop-closure edge: x_4 ↔ x_0</div>
  </div>
  <figcaption><b>Fig. 2</b> — a pose graph. Odometry edges chain consecutive poses and accumulate drift; one loop-closure edge ties the end of the path back to its start and lets the optimiser spread the correction over every pose in between.</figcaption>
</figure>

Each edge says "the measured transform between node *i* and node *j* is *z_ij*, with information matrix Ω_ij". The optimiser finds the poses that disagree least with all edges at once:

```text
e_ij(x)  = z_ij  ⊖  ( x_i⁻¹ ⊕ x_j )            # measured vs predicted relative pose
x*       = argmin_x  Σ_(i,j)  e_ij(x)ᵀ · Ω_ij · e_ij(x)
```

This is non-linear least squares, solved iteratively with Gauss-Newton or Levenberg-Marquardt: linearise the errors around the current guess, solve a sparse linear system, update, repeat. The system stays sparse because each edge touches only two nodes, which is what makes graphs with thousands of poses practical.

The weak point is **data association**. A wrong loop-closure edge is a confident, wrong constraint, and least squares will bend the whole map to satisfy it. My talk notes put it as: incorrect associations are hard to recover from, so associations should be made probabilistically and conservatively. That is why ORB-SLAM3 runs several geometric checks before accepting a loop.

Bundle adjustment, which I covered in the ORB-SLAM3 post, is the same idea with camera poses and 3D points as nodes and reprojection errors as edges.

## A taxonomy of SLAM approaches

The lecture series opens with a list of the axes along which SLAM systems differ. The first seven rows are from my notes on that lecture; the last two are the distinctions this post has been building up to:

| Axis | Options | What it decides |
|---|---|---|
| Map representation | Volumetric vs feature-based | Grids and voxels vs a sparse set of landmarks |
| Map type | Topological vs geometric | A graph of places vs metric coordinates |
| Correspondence | Known vs unknown | Whether data association is given or must be solved |
| Environment | Static vs dynamic | Whether moving objects are modelled or ignored |
| Uncertainty | Small vs large | Local tracking vs global relocalisation and big loops |
| Control | Active vs passive | Whether the robot chooses where to go to map better |
| Resources | Anytime and any-space | Whether the algorithm adapts to the compute and memory available |
| Estimation | Filtering vs smoothing | Online belief over now vs optimisation over the whole path |
| Problem | Online vs full SLAM | Current pose only, or the entire trajectory |

The last two rows are related but not identical. Filters solve online SLAM. Smoothing solves full SLAM, but sliding-window smoothers (like ORB-SLAM3's local bundle adjustment) sit in between: they optimise a recent window of the past and marginalise or freeze the rest.

## What lidar and IMU SLAM looked like in mid-2024

My other task in June was to plan a survey of the state of the art in SLAM using lidar and IMU data, the sensors the project's rig was built around. The plan classified methods two ways:

- **By sensor:** visual SLAM (monocular, stereo, RGB-D), lidar SLAM, and multi-sensor SLAM that combines them.
- **By method:** feature-based (detect and match features), direct (use raw sensor data without explicit features) and graph-based (pose-graph optimisation as the back end).

The comparison was to use the standard benchmarks: KITTI for driving, TUM RGB-D for indoor depth cameras, and EuRoC for drones with stereo cameras and an IMU. I also set up a structured review form so each paper's metadata, sensors and approach could be compared statistically rather than from memory.

One paper from that reading shows where things were heading. LIV-GaussMap (Hong et al., RA-L 2024) fuses lidar, IMU and camera. A lidar-inertial odometry front end, using adaptive voxels that store plane features such as normals and covariances, gives the poses and the scene structure. That structure initialises a map of 3D Gaussians, which are then refined with photometric gradients from the camera so the map can be rendered photorealistically. The probabilistic foundations in this post are all still there: the lidar-inertial part is a state estimator with motion and observation models, and the map refinement is an optimisation over many measurements at once. What changed is the map representation.

By the time of my July internship report the survey was still at the stage of drafting sub-sections, so I can't point to a finished paper. What it left me with is the habit of reading any new SLAM system by asking three questions: what is the state, what are the motion and observation models, and is it filtering or smoothing?

## References

1. C. Stachniss. *Robot Mapping* lecture course (University of Freiburg), including "A Short Introduction to the Bayes Filter and Related Models".
2. S. Thrun, W. Burgard, D. Fox. *Probabilistic Robotics*. MIT Press, 2005.
3. B. Siciliano, O. Khatib (eds.). *Springer Handbook of Robotics*, chapter on Simultaneous Localization and Mapping.
4. G. Grisetti, C. Stachniss, W. Burgard. *Improved Techniques for Grid Mapping With Rao-Blackwellized Particle Filters*. IEEE Transactions on Robotics 23(1), 2007.
5. G. Grisetti, R. Kümmerle, C. Stachniss, W. Burgard. *A Tutorial on Graph-Based SLAM*. IEEE Intelligent Transportation Systems Magazine, 2010.
6. S. Hong, J. He, X. Zheng, C. Zheng, S. Shen. *LIV-GaussMap: LiDAR-Inertial-Visual Fusion for Real-time 3D Radiance Field Map Rendering*. IEEE Robotics and Automation Letters, 2024. [arXiv:2401.14857](https://arxiv.org/abs/2401.14857)
7. A. Geiger, P. Lenz, R. Urtasun. *Are we ready for Autonomous Driving? The KITTI Vision Benchmark Suite*. CVPR 2012.
8. J. Sturm, N. Engelhard, F. Endres, W. Burgard, D. Cremers. *A Benchmark for the Evaluation of RGB-D SLAM Systems*. IROS 2012.
9. M. Burri et al. *The EuRoC micro aerial vehicle datasets*. International Journal of Robotics Research, 2016.

## More from Research at NISER & IISER Bhopal

- [NISER Internship Retrospective](/blog/niser-internship-retrospective): going back to the lab, and what the internship gave me.
- [From ORB Features to ORB-SLAM3](/blog/orb-slam3): FAST, rotated BRIEF and binary matching, then every thread of ORB-SLAM3.
- [A Browser Dashboard for a ROS 2 Sensor Rig](/blog/niser-ros-dashboard): live camera, point cloud, IMU and GPS previews in a web app.
- [Turning an iPhone into a LiDAR, IMU and GPS Sensor](/blog/niser-iphone-sensor-rig): phone sensors streamed to a server for mapping.
- [Field Notes on Perception for Two-Wheeler Autonomy](/blog/niser-perception-notes): computer vision, point clouds and prediction for autonomous two-wheelers, written for the Swayansaasita project site.
- [Hands-on Quantum Programming at IISER Bhopal](/blog/iiser-bhopal-quantum-workshop): qubits, Bell states and Deutsch–Jozsa worked through from scratch at the QuCIS workshop.
