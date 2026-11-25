# A Browser Dashboard for a ROS 2 Sensor Rig

*By Harshit Agarwal*

From May to October 2024 I was a research intern at SMLab, NISER, on **Swayansaasita**, the lab's project to collect a multimodal driving dataset for autonomous two-wheelers. The sensors ran on Jetson boards under ROS 2, and bringing them up, checking every stream and starting a recording all meant SSH sessions and terminal commands. My job was a web page that did those things: start the sensors, show which topics were publishing and how fast, start and stop a recording, show disk space, list past recordings, and preview a stream. This post explains how it works, from rosbridge and compressed images to the two backends I wrote, and which parts were still placeholders when I stopped.

<div class="stat-row">
  <div class="stat"><div class="stat-num">12 of 13</div><div class="stat-label">commits in the lab's dashboard repo are mine</div></div>
  <div class="stat"><div class="stat-num">114</div><div class="stat-label">topics in one <code>ros2 topic list</code> capture from the rig</div></div>
  <div class="stat"><div class="stat-num">14.7 MB</div><div class="stat-label">one ZED point cloud message, before base64</div></div>
  <div class="stat"><div class="stat-num">2</div><div class="stat-label">backends: Express over SSH, then FastAPI on the rig</div></div>
</div>

> [!NOTE]
> Sources: the lab's dashboard repo (Vue app, Express server, FastAPI server; commits from 12 June to 25 August 2024), my earlier `ros-webinterface` repo (29 May), a small Vue prototype (11 June), and my work notes from the internship. Network addresses, usernames and passwords in the code are left out of every excerpt.

## The rig and what it publishes

I didn't build the rig, so I'll describe it only as far as the code shows. The launch script started drivers for a **ZED stereo camera**, a **CS20 time-of-flight depth camera** (the kill endpoint matches its processes as `synexens`), a **u-blox GPS receiver** (matched as `ublox`), plus a topic-rate monitor, a disk monitor and rosbridge. Topic names carry the board and camera, such as `/Jetson1/camera1/zed_node/imu/data`, and my June notes describe calling the recording service "in both the nodes (jetsons)".

On 27 May I saved the output of `ros2 topic list` and a few `ros2 topic echo` dumps into the first repo so I could design against real messages. That one capture had 114 topics, 95 of them from the ZED wrapper:

| What it is | Example topic | ROS message type | What the dashboard did with it |
|---|---|---|---|
| Rectified colour image | `/zed/zed_node/left/image_rect_color` | `sensor_msgs/Image` | Too big to send raw (see below) |
| Same image, JPEG | `.../image_rect_color/compressed` | `sensor_msgs/CompressedImage` | Shown in an `<img>` tag |
| Point cloud | `/zed/zed_node/point_cloud/cloud_registered` | `sensor_msgs/PointCloud2` | Decoded, never rendered |
| IMU | `/zed/zed_node/imu/data` | `sensor_msgs/Imu` | Live D3 line charts |
| Pose, odometry | `/zed/zed_node/pose`, `/zed/zed_node/odom` | `geometry_msgs/PoseStamped`, `nav_msgs/Odometry` | Not used |
| Depth and IR (depth camera) | `/camera1/depth_raw`, `/camera1/ir_raw` | `sensor_msgs/Image` | IR JPEG used as the image preview |

## ROS 2 in a few paragraphs

If you haven't used ROS, here is the vocabulary the rest of this post needs.

- A **node** is a process that does one job: a camera driver, a GPS driver, a recorder.
- A **topic** is a named channel. Nodes **publish** messages to a topic and other nodes **subscribe** to it. Publishers don't know who is listening. `/zed/zed_node/imu/data` is a topic.
- A **message** is a typed struct defined in a `.msg` file. `sensor_msgs/Imu` has an orientation quaternion, an angular velocity, a linear acceleration and covariance matrices. Every sensor message starts with a `header` holding a timestamp and a coordinate frame name.
- A **service** is request and response, like a function call between nodes. `std_srvs/Trigger` takes no arguments and returns `success` (a bool) and `message` (a string). The rig's start and stop recording were Trigger services.
- A **launch file** starts a set of nodes with their parameters in one command (`ros2 launch <package> <file>`).
- A **bag** is a recording: `ros2 bag record` writes every message on chosen topics, with timestamps, to disk, and `ros2 bag play` republishes them later as if the sensors were live.
- The ZED camera also has its own recording format, **SVO**, which stores the stereo video and the camera's sensor data and can be replayed through the ZED SDK. The rig recorded both bags and SVO files.

One more ROS tool matters here: **`image_transport`**. A camera driver that uses it publishes each image topic several times: raw, `/compressed` (JPEG or PNG), `/compressedDepth` (PNG for depth images) and `/theora` (a video codec). In my capture, 17 topics each had those three suffixes. So I could choose an encoding without touching the drivers.

## Why a browser

My notes list three goals for the interface: show left and right camera, point cloud, GPS and IMU data; keep latency minimal with a live feed; and give control over the rig. A web page fits that: any laptop on the lab network can open it with nothing installed, and buttons replace commands that otherwise get typed from memory in a terminal.

## Getting ROS into a browser: rosbridge

A browser can't join a ROS 2 network directly. **rosbridge** is a ROS node that runs a WebSocket server (port 9090 by default) and translates between ROS and JSON. The browser sends `{"op": "subscribe", "topic": "/imu", "type": "sensor_msgs/msg/Imu"}`; rosbridge subscribes on its behalf and forwards every message as `{"op": "publish", "topic": ..., "msg": {...}}`. Service calls go the same way with `call_service`. **roslibjs** is the JavaScript client that wraps that protocol in `Ros`, `Topic` and `Service` objects.

<figure>
  <div class="diagram">
    <div class="node muted-node">Sensor drivers<br>on the Jetsons</div>
    <span class="arrow">→</span>
    <div class="node">ROS 2 topics<br>and services</div>
    <span class="arrow">→</span>
    <div class="node accent">rosbridge<br>ROS ↔ JSON over WebSocket</div>
    <span class="arrow">→</span>
    <div class="node muted-node">roslibjs<br>in the browser</div>
  </div>
  <figcaption><b>Fig. 1</b> — the data path for everything the dashboard reads. Binary fields such as image bytes arrive as base64 strings inside the JSON.</figcaption>
</figure>

The detail that shaped every decision later: rosbridge sends `uint8[]` fields, which is where images and point clouds keep their bytes, as **base64 text inside JSON**. Base64 makes data a third bigger, and the browser then has to parse it on the main thread.

## Version one: one HTML page per sensor (May)

The first repo, `ros-webinterface`, is plain HTML. `index.html` stacks three iframes in 16:9 boxes, one per sensor page, and each page opens its own rosbridge connection.

**Images took three attempts.** My notes from 27 May record them:

1. **Raw `sensor_msgs/Image`.** My notes say each message was about 5 MB, and I dropped it. That fits the arithmetic if the camera ran at the same 1280×720 as its point cloud: a 720p frame in 4-byte BGRA is 3.7 MB, and base64 makes it about 4.9 MB, per frame, per viewer. A web worker that swaps BGR to RGBA for a `<canvas>` is still in the repo from that attempt.
2. **Theora video** through ogv.js, a JavaScript video decoder. I couldn't get its decoder object to initialise.
3. **`CompressedImage` (JPEG).** At first I couldn't find a library to decode it. The next day I realised I didn't need one: the browser already decodes JPEG, and the base64 string rosbridge sends is exactly what a `data:` URL wants.

```js
const listener = new ROSLIB.Topic({
  ros,
  name: "/zed/zed_node/stereo_raw/image_raw_color/compressed",
  messageType: "sensor_msgs/msg/CompressedImage",
});

listener.subscribe((message) => {
  // message.data is already base64 JPEG bytes
  document.getElementById("imageDisplay")
    .setAttribute("src", "data:image/jpeg;base64," + message.data);
});
```

That became the image preview for the rest of the project.

**The IMU page** draws `linear_acceleration` with D3, keeping a sliding one-second window. The first version had a copy-paste bug: the third chart, meant for z, plotted y a second time. The later version fixes it and averages samples into 50 ms bins before drawing, so each redraw plots about 20 averaged points for the one-second window instead of every raw sample.

**The point cloud page** set up a Three.js scene with orbit controls and subscribed to a `PointCloud2` topic, but its `convertPointCloud2ToVertices` function returned an empty array. The parsing was the hard part, and it wasn't written yet.

The same day I scaffolded an Angular app around those pages and left it there; my July report says I tried React, Angular and Next before choosing Vue with Vite.

## Latency and size

The table below is the reasoning I wish I had written down at the start. Sizes come from the message dumps I saved on 27 May.

| Stream | One message on the wire | Decision |
|---|---|---|
| Raw colour image | About 5 MB (my notes) | Dropped |
| JPEG `CompressedImage` | Far smaller; varies with the scene | Used: `data:` URL, browser decodes |
| Theora video | Not measured | Dropped: decoder wouldn't initialise |
| ZED point cloud, 1280×720, 16 bytes per point | 14.7 MB raw, ~19.7 MB as base64 | Decoded only, never drawn |
| IMU | Small: a header, three vectors, three covariance matrices | Charted, averaged into 50 ms bins |

The point cloud row explains most of the trouble. The ZED wrapper publishes one point per pixel: 921,600 points with four float32 fields each (x, y, z and colour packed into a float), so a single message is 14.7 MB before rosbridge turns it into text. No browser tab keeps up with that at camera rate. The real fixes are upstream: publish a downsampled cloud, lower the wrapper's point cloud rate, or decode in a worker from a binary transport. My notes mark "configure the PointCloud streaming and make it lighter weight" as done in late June, but that change lived in the rig's configuration, not in either repo, so I can't show what it was.

Two other ideas never reached these repos: a server-side compression step between rosbridge and the browser (2 June), and streaming ZED frames from the ZED SDK directly, outside ROS. For the second, the README logs my changes to the SDK's SVO recording sample on the rig to turn on its streaming mode; my July report marks it "integration pending".

## The Vue app (June to August)

The dashboard proper is a Vue 3 app built with Vite, in the lab's repo. I made 12 of its 13 commits; the remaining one is the lab account's initial commit. The final screen has a header row of buttons (Start ROS, Reboot System, Kill System, Start Frequency), a table of topics in the middle, and a black footer with the recording controls, disk usage and the current file.

<figure>
  <div class="diagram">
    <div class="node muted-node">Browser<br>Vue app</div>
    <span class="arrow">→</span>
    <div class="node">rosbridge WebSocket<br>topics + record services</div>
    <span class="arrow">→</span>
    <div class="node accent">ROS 2 on the rig</div>
  </div>
  <div class="diagram">
    <div class="node muted-node">Browser<br>Vue app</div>
    <span class="arrow">→</span>
    <div class="node">Local API server :3000<br>start, kill, reboot, logs</div>
    <span class="arrow">→</span>
    <div class="node accent">SSH, later a child process</div>
  </div>
  <figcaption><b>Fig. 2</b> — two paths. ROS data and recording go through rosbridge. Anything rosbridge can't do, such as launching ROS itself, goes through a small HTTP server.</figcaption>
</figure>

The second path exists because of a chicken-and-egg problem: rosbridge is one of the things the launch file starts, so the browser can't use rosbridge to start ROS. Process control needs something outside ROS.

### Topic health: the frequency table

The rig ran a monitor node that published every topic's rate as one JSON string on `/topic_status`. The browser subscribes once and fills a reactive dictionary that the table renders:

```js
const frequencyTopic = new ROSLIB.Topic({
  ros, name: '/topic_status', messageType: 'std_msgs/msg/String'
});

frequencyTopic.subscribe(message => {
  const data = JSON.parse(message.data);   // { "/topic": hz, ... }
  for (let topic in data) {
    if (!topicFrequencyDict[topic]) topicFrequencyDict[topic] = { frequency: data[topic] };
    else topicFrequencyDict[topic].frequency = data[topic];
  }
});
```

JSON inside a `std_msgs/String` is a shortcut, but a useful one: a custom message type would have to be defined, built and installed on every machine that touches it, while a string works everywhere. Each row shows the topic, its rate, Active or Inactive, and a Preview/Debug button. This table is the part I'd keep unchanged: one glance tells you whether every sensor is up before you press record.

### Start, kill and reboot

The first backend was an Express server using the `ssh2` library. **Start ROS** opened an SSH session to the Jetson and ran `bash start_ros.sh`. **Kill System** ran `kill_ros.sh`. **Reboot** ran `sudo reboot`. The README warns users to refresh the page after Start ROS, and the code does `window.location.reload()` itself. The reason is that the page opens its rosbridge connection when it loads, which is before rosbridge exists, and roslibjs doesn't reconnect on its own.

### Recording

The 11 June prototype called the ZED wrapper's own SVO service directly, with a fixed filename and an automatic stop:

```js
const service = new ROSLIB.Service({
  ros, name: '/Jetson1/camera1/zed_node/start_svo_rec',
  serviceType: 'zed_interfaces/srv/StartSvoRec'
});
service.callService(new ROSLIB.ServiceRequest({ svo_filename: 'file5.svo' }), ...);
setTimeout(() => { /* call stop_svo_rec */ }, 5000);
```

By late July the rig had `/start_recording` and `/stop_recording` services of type `std_srvs/Trigger`. The recorder node behind them isn't in this repo. It returned the session's path in the `message` field, which the dashboard displays as the file name. On success the button turns red and disabled and a one-second timer starts:

```js
service.callService(request, result => {
  if (result.success) {
    const startTime = Date.now();
    timerInterval = setInterval(() => {
      elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
    fileName = result.message;      // e.g. ".../CS2303DATA/CS2303-019"
    getFileSize(fileName);
  }
});
```

<figure>
  <img src="/assets/niser/niser-ros-dashboard/recording-console.webp" alt="Browser console during a test recording: the start service returns success with a session path ending in CS2303-019, file size shows Static size, elapsed time counts from 1 to 8, then two stop service results both say recording stopped" style="width:100%; border-radius: 6px;" />
  <figcaption><b>Fig. 3</b> — the console during a test recording on 31 July, with the home directory blacked out. The session path comes back in the Trigger response. File size is a placeholder, and the stop service answered twice.</figcaption>
</figure>

That screenshot is from the day I wrote "seems to be working fine I guess" in my notes, and it shows what wasn't:

- **File size was static.** `getFileSize` exists, but its own comment says "TODO Currently of no use". Size was never polled while recording.
- **The footer didn't update by itself.** `fileName`, `fileSize` and `elapsedTime` are plain variables, not Vue refs, so the template only shows new values when something else triggers a re-render, such as the next frequency update. The console shows the timer working; the screen didn't reliably show it.
- **Stop was glitchy.** My notes list it as high priority with "sometimes not working", and the screenshot ends with two stop responses for one session. Making the button wait until the file was actually closed needed the recorder to report it, which was server-side.
- My notes also mark "only enable start recording if all topic frequencies are non-zero" as done, but I can't find that check in the committed code.

### The playback list

Each session was appended to a `log.csv` on the rig: session id, date, start time, stop time, duration and file size. The server reads it and returns JSON. (The header in the data really is spelled `Sesion-id`, so the Vue code has to spell it that way too.) **Playback Recordings** shows the rows in a table with a Play button on each.

Play is where the browser part stops. It opens a `GridLayout` component meant to show the session's streams in movable panes; it renders three hard-coded tiles labelled "Item 1" to "Item 3". My notes say I wrote rosbag and SVO playback scripts for the rig, but they aren't in this repo and the browser was never connected to them.

### The disk monitor

A disk monitor node published `df` output as JSON on `/disk_space`. `df` reports `Used` and `1K-blocks` in kibibytes, so dividing by 1024² gives GiB, and the footer shows used over total. Two cosmetic bugs survived: before the first message arrives it shows `NaN GB`, and the template appends "GB" twice ("... GB / ... GB GB Used"). Disk space matters on a recording rig: sensor sessions are large, and running out mid-ride loses the session.

### The preview button

This feature changed the most. On 25 June I tried a **batch preview**: an inline D3 chart or canvas inside every topic tile, fed by IMU samples pushed into a reactive array that every tile watched. The commit is honestly titled "batch preview feature failed to integrate", and it also checked in a Chrome performance trace from that afternoon. The next two days I switched to a **popup per topic**: the button opens a window and adds an iframe for the right viewer, with a close button underneath.

```js
const deviceType = topic.toLowerCase();
if (deviceType.includes('point'))      iframe.src = "../src/assets/pointcloud3.html";
else if (deviceType.includes('raw'))   iframe.src = "../src/assets/home.html";
else if (deviceType.includes('imu'))   iframe.src = "../src/assets/graph.html";
else if (deviceType.includes('fix'))   iframe.src = "../src/assets/map.html";
else { window.alert(`Invalid Topic`); return; }
```

Moving each viewer into its own iframe gave every stream its own connection and its own page lifecycle: closing the iframe ends its subscription, so a forgotten preview can't keep pulling a heavy topic. That was the point of the "linear lifecycle" commit.

The honest state of the viewers at the end:

- **The image viewer works**, but it always subscribes to one hard-coded IR image topic from the depth camera, whichever image topic you clicked.
- **The IMU charts work**, with a leak: the sample arrays only ever grow, and every new message filters the whole history, so a preview left open slows down over time.
- **The point cloud viewer** decodes x, y and z from the base64 buffer (16-byte stride, three float32 offsets) and logs them to the console. It draws nothing. My July report says a Three.js version worked; the committed file isn't that version.
- **The GPS map** is a stub page with a heading. It reads `topic` and `type` from its URL query, which shows the plan: pass the clicked topic into the viewer. The line in the app that would do that is commented out.

## FireAPI: moving the backend onto the rig

In August I wrote a second backend, `API_server.py`. The commit calls it "FireAPI"; it is a **FastAPI** app with the same endpoints as the Express server (`/start-ros`, `/kill-ros`, `/reboot-system`, `/log-file`, `/get-file-size`) plus `/stop-ros`, `/ros-status` and a WebSocket at `/ws/logs`. Because the paths match, the Vue app didn't need to change. The main difference is where it runs: on the ROS machine itself, starting the launch file as a child process instead of over SSH.

```python
@app.post("/start-ros")
async def start_ros():
    if ros_process["process"] is not None:
        return {"message": "ROS2 launch file is already running", ...}
    process = await asyncio.create_subprocess_exec(
        'ros2', 'launch', 'daemon', 'init.launch.py',
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    ros_process["process"] = process
    ...
```

| | Express + ssh2 (June) | FastAPI (August) |
|---|---|---|
| Runs on | Wherever it's started; reaches the Jetson over SSH | The ROS machine |
| Starts ROS | `bash start_ros.sh` over SSH | `ros2 launch` as a child process it keeps a handle to |
| Knows if ROS is running | No | Stores the process; refuses a second start |
| Credentials | Hard-coded SSH password in source | None needed |
| Shell commands | `du -sh ${fileName}` built as a string: command injection | Argument lists, no shell |
| Live logs | No | `/ws/logs` streams the launch's output |

It was a clear improvement, and re-reading it now I can see four problems:

- **`/ros-status` crashes.** It calls `.poll()`, which exists on `subprocess.Popen` but not on the asyncio process object, so the endpoint raises an error.
- **`/kill-ros` is very broad.** It runs `ros2 daemon stop`, `pkill -f ros2`, kills the driver processes and rosbridge, then, if `ps aux` still mentions "ros" anywhere, runs `pkill -f ros`, which matches any process whose command line contains those three letters.
- **Undrained pipes can stall ROS.** stderr is piped and never read, and stdout is read only while the log terminal is open. Once a pipe's buffer fills, the launch process blocks on its next write.
- **No authentication, and CORS allows any origin**, on endpoints that reboot the machine. Acceptable on an isolated lab network, risky anywhere else.

## A terminal in the browser

The last feature was the in-browser terminal: an **xterm.js** terminal, sized with its fit addon, inside a modal. Opening it connects to `/ws/logs` and writes whatever arrives:

```js
socket.value = new WebSocket('ws://localhost:3000/ws/logs');
socket.value.onmessage = async (event) => {
  terminal.write(event.data instanceof Blob ? await event.data.text() : event.data);
};
```

On the server, the WebSocket handler reads the launch process's stdout line by line and forwards each line. So it's a **read-only log viewer**, not a shell: nothing typed goes back to the machine. For seeing why a driver failed to start, that's the right scope; a real shell on an unauthenticated server would be a remote-access hole.

## What was unfinished

By the last commit in August, these were the gaps:

- **Playback in the browser**: the grid is a placeholder.
- **Point cloud and GPS previews**: decode-only and stub.
- **Per-topic previews**: viewers are chosen by substring and subscribe to hard-coded topics.
- **Live file size** during a recording, and a stop button that waits for the recorder.
- **Start recording gated on every topic being live**: in my notes, not in the code.
- **Reconnection**: refreshing the page was the reconnect strategy.
- **Hard-coded addresses and credentials** in the Express server and the HTML viewers.

## What I'd do differently

- **One rosbridge connection with reconnection and a status banner**, instead of one per iframe and a page refresh.
- **Throttle at the source.** roslibjs can ask rosbridge for a `throttle_rate`, and a preview needs a few frames per second, not thirty. For point clouds, a downsampled preview topic on the rig.
- **Pass the topic and message type to every viewer** and make them generic: one image viewer for any `CompressedImage` topic, one chart for any `Imu`.
- **Let the recorder own state.** Publish a recording-status topic (file, size, duration, closed or not) and have the UI only display it.
- **Look at existing tools first.** My earliest page was built from Foxglove's rosbridge tutorial. Before writing viewers by hand again, I'd check how far an existing robotics visualiser gets, and build only the rig-specific controls.

The lesson that stuck: the hard parts weren't Vue or D3. They were bytes (what one message costs once it becomes JSON) and state (who knows whether ROS is running, or whether a recording really stopped). Both are easier to get right on the robot side than in the browser.

## More from Research at NISER & IISER Bhopal

- [NISER Internship Retrospective](/blog/niser-internship-retrospective): going back to the lab, and what the internship gave me.
- [From ORB Features to ORB-SLAM3](/blog/orb-slam3): the lab talk on feature extraction, matching and ORB-SLAM3.
- [SLAM from the Bayes Filter Up](/blog/niser-slam-bayes-filter): the probabilistic basics behind SLAM.
- [Turning an iPhone into a LiDAR, IMU and GPS Sensor](/blog/niser-iphone-sensor-rig): streaming phone sensors over TCP, and an ARKit scanner that exports meshes.
- [Field Notes on Perception for Two-Wheeler Autonomy](/blog/niser-perception-notes): notes on perception for an autonomous motorcycle.
- [Hands-on Quantum Programming at IISER Bhopal](/blog/iiser-bhopal-quantum-workshop): a hands-on quantum programming workshop.
