/**
 * Series shown as horizontal journeys on the blog index.
 *
 * The "Building FamCare" series, in the order the work happened:
 * the core platform first, then the release and safety machinery,
 * then the AI and growth tools built on top.
 * Used by the blog index (animated series block) and /case-studies.
 */

export type SeriesPost = {
  /** Blog slug. Omit for a post that is not written yet (shown as "coming soon"). */
  slug?: string;
  title: string;
  summary: string;
  /** Emoji shown on the journey card. */
  icon: string;
  /** What the chibi engineer says when standing at this post. */
  quip: string;
};

export type SeriesStage = {
  id: string;
  label: string;
  title: string;
  blurb: string;
  posts: SeriesPost[];
};

export const FAMCARE_STAGES: SeriesStage[] = [
  {
    id: 'core',
    label: 'Stage 1',
    title: 'Build the core',
    blurb: 'One backend for four apps, and one honest answer to "who can take this booking?"',
    posts: [
      {
        slug: 'famcare-system-design',
        title: 'A Care Marketplace on One Boring Backend',
        icon: '🏗️',
        quip: 'One backend, four apps. Laying the foundation!',
        summary:
          'One backend, four apps, a booking state machine, real-time channels per role, a Terraform import of hand-built production, staging on a shared load balancer, and feature flags.',
      },
      {
        slug: 'famcare-slots-and-pricing',
        title: 'Honest Slots, Priced Idle Time',
        icon: '🗓️',
        quip: '270 test scenarios agree: this slot is real.',
        summary:
          'Making every screen agree on who can take a booking, proving it with 270 YAML scenarios on a real database, then pricing idle hours with price drops and evening flash sales.',
      },
    ],
  },
  {
    id: 'ship',
    label: 'Stage 2',
    title: 'Ship fast without breaking things',
    blurb: 'Pictures for every screen, fixes without the app store, and an owner for every alert.',
    posts: [
      {
        slug: 'famcare-golden-screens',
        title: 'A Golden Image for Every Screen',
        icon: '📸',
        quip: 'Say cheese! Every screen gets its photo.',
        summary:
          'Every customer-app screen rendered in CI from captured API data with a frozen clock, so UI review means comparing pictures.',
      },
      {
        slug: 'famcare-flutter-ota',
        title: 'Shipping a Flutter App Without the App Store',
        icon: '🚀',
        quip: 'Patch shipped. No app store queue!',
        summary:
          'Dart fixes over the air with Shorebird: release vs patch, why patches get refused on native diffs, which branch to patch from, and what macOS CI minutes cost.',
      },
      {
        slug: 'famcare-alert-ownership',
        title: 'Who Owns This Alert?',
        icon: '🚨',
        quip: 'Beep beep! Tagging whoever owns this.',
        summary:
          'A separate monitor checks business invariants every minute, debounces alerts and tags the engineer who owns the area in Slack.',
      },
    ],
  },
  {
    id: 'grow',
    label: 'Stage 3',
    title: 'Grow with AI and data',
    blurb: 'LLMs that only draft, live support tooling, demand we missed, and a CRM that calls the backend.',
    posts: [
      {
        slug: 'famcare-voice-agent',
        title: 'A Voice Agent That Only Drafts',
        icon: '🎙️',
        quip: 'Talk to me. I only write drafts!',
        summary:
          'Parents talk for three minutes instead of filling a form. The LLM proposes, the parent confirms, and nothing it says changes a record on its own.',
      },
      {
        slug: 'famcare-live-call-captions',
        title: 'Live Captions for Support Calls, Without a New Service',
        icon: '💬',
        quip: 'Live captions, rolling…',
        summary:
          'Support-call audio streamed through realtime speech-to-text into the admin panel, and why the AI-offers phase became plain rules.',
      },
      {
        slug: 'famcare-unserved-demand',
        title: "The Demand We Couldn't Serve",
        icon: '📉',
        quip: 'Counting the families we couldn\'t serve.',
        summary:
          'Joining app analytics to a server log of every slot grid shown, to count families who found no slot and left.',
      },
      {
        slug: 'famcare-crm-as-api',
        title: 'CRM as an API',
        icon: '🎯',
        quip: 'CRM, meet API. Almost at 1!',
        summary:
          'Letting the CRM team grant coupons, free minutes and support calls from CleverTap journeys while the backend keeps every money rule.',
      },
    ],
  },
  {
    id: 'operate',
    label: 'Stage 4',
    title: 'Run it in production',
    blurb: 'Incidents, root-cause write-ups, and an AWS setup that grew up with them.',
    posts: [
      {
        slug: 'famcare-incidents-and-infra',
        icon: '🧯',
        quip: 'Root cause found. Postmortem filed.',
        title: 'Three Outages and the Infrastructure They Left Behind',
        summary:
          'Three production outages, the guardrails each one left behind, and how we write up root causes.',
      },
    ],
  },
];

/** All series posts in journey order. */
export const FAMCARE_SERIES = FAMCARE_STAGES.flatMap((s) => s.posts) as (SeriesPost & { slug: string })[];

export type SeriesConfig = {
  id: string;
  /** Visual theme class: colours, type and the character's outfit. */
  theme: 'famcare' | 'shoppin' | 'niser' | 'cosq';
  title: string;
  role: string;
  /** Brand mark in the header. `tile` renders it as a rounded app icon. */
  wordmark: { src: string; alt: string; width: number; height: number; tile?: boolean } | { text: string };
  stages: SeriesStage[];
  greeting: string;
  finale: string;
  /** Small brand image used for reached road marks and confetti. */
  sprite?: string;
  /** Character accessory. */
  hat?: 'strawberry' | 'helmet' | 'catmask';
  /** Offer the brand's light and dark themes with a toggle (dark first). */
  modes?: boolean;
};

export const FAMCARE_JOURNEY: SeriesConfig = {
  id: 'famcare',
  theme: 'famcare',
  title: 'Building FamCare',
  role: 'Zero to one as Lead Engineer',
  wordmark: { src: '/assets/famcare/famcare-icon.webp', alt: 'FamCare', width: 160, height: 160, tile: true },
  stages: FAMCARE_STAGES,
  greeting: 'Hi! Walk with me from 0 to 1.',
  finale: 'Zero to one! 🎉',
};

/**
 * shoppin' (Dec 2024 to Nov 2025). Stops without a slug render as
 * "coming soon" until their post is written.
 */
export const SHOPPIN_JOURNEY: SeriesConfig = {
  id: 'shoppin',
  theme: 'shoppin',
  title: "Building shoppin'",
  role: 'Founding Engineer Intern',
  wordmark: { src: '/assets/shoppin/shoppin-logo.webp', alt: "shoppin'", width: 718, height: 195 },
  sprite: '/assets/shoppin/strawberry.webp',
  hat: 'strawberry',
  modes: true,
  greeting: 'Snap a fit. I\'ll find it.',
  finale: 'Found it, 10 sites compared! 🛍️',
  stages: [
    {
      id: 'interview',
      label: 'Stage 0',
      title: 'The interview',
      blurb: 'The assignment before the job: a Google Lens alternative, and a cosplay lens.',
      posts: [
        {
          slug: 'shoppin-lens-research',
          icon: '🔎',
          quip: 'Spoon in, wrenches out. Hmm.',
          title: 'A Google Lens Alternative for a Job Interview, Re-Audited',
          summary:
            'Five ways to do image similarity search, a scraped cosplay dataset, and an honest audit of my own metrics.',
        },
      ],
    },
    {
      id: 'vision',
      label: 'Stage 1',
      title: 'See the fit',
      blurb: 'Detection and segmentation models that find each garment in a photo.',
      posts: [
        {
          icon: '🔍',
          quip: 'Spotted: baggy jeans, two o\'clock.',
          title: 'Object detection for fashion photos',
          summary: 'Finding every garment in a street photo or screenshot.',
        },
        {
          icon: '✂️',
          quip: 'Snip snip. Just the jacket, please.',
          title: 'Segmentation models',
          summary: 'Cutting each garment out cleanly before it is searched.',
        },
      ],
    },
    {
      id: 'search',
      label: 'Stage 2',
      title: 'Find it',
      blurb: 'Embedding models that match a garment to products across stores.',
      posts: [
        {
          icon: '🧭',
          quip: 'Same vibe, different store.',
          title: 'Image search embedding models',
          summary: 'Turning garments into vectors that find look-alikes across stores.',
        },
      ],
    },
    {
      id: 'platform',
      label: 'Stage 3',
      title: 'Run it, feed it',
      blurb: 'Infrastructure as code, and scrapers that keep the catalogue fresh.',
      posts: [
        {
          icon: '🧱',
          quip: 'terraform apply… and breathe.',
          title: 'Infra and Terraform setup',
          summary: 'The cloud setup behind search, written as code.',
        },
        {
          icon: '🕸️',
          quip: 'Every store speaks a different API.',
          title: 'Scraper mechanics',
          summary: 'Scrapers that pull product data from the APIs of many kinds of shopping sites.',
        },
      ],
    },
  ],
};

/** Research internship at SMLab, NISER (May–Oct 2024), plus the IISER Bhopal quantum workshop. */
export const NISER_JOURNEY: SeriesConfig = {
  id: 'niser',
  theme: 'niser',
  title: 'Research at NISER & IISER Bhopal',
  role: 'Research Intern, SMLab NISER · May–Oct 2024',
  wordmark: { src: '/assets/niser/niser-iiserb-marks.webp', alt: 'NISER and IISER Bhopal', width: 422, height: 200 },
  hat: 'helmet',
  greeting: 'Sensors on. Let\'s map this place.',
  finale: 'Loop closed! 🎉',
  stages: [
    {
      id: 'learn',
      label: 'Stage 1',
      title: 'Learn the field',
      blurb: 'Feature matching, SLAM and the probability underneath it.',
      posts: [
        {
          slug: 'orb-slam3',
          icon: '🗺️',
          quip: 'FAST corners, rotated BRIEF. Matched!',
          title: 'From ORB Features to ORB-SLAM3',
          summary: 'How ORB features work, and how ORB-SLAM3 builds maps from them. From my SMLab talk.',
        },
        {
          slug: 'niser-slam-bayes-filter',
          icon: '🎲',
          quip: 'Predict, update, repeat.',
          title: 'SLAM from the Bayes Filter Up',
          summary: 'The probability behind localisation and mapping, from Bayes rule to pose graphs.',
        },
      ],
    },
    {
      id: 'build',
      label: 'Stage 2',
      title: 'Build the rig',
      blurb: 'Getting camera, LiDAR, GPS and IMU data off the sensors and onto a screen.',
      posts: [
        {
          slug: 'niser-iphone-sensor-rig',
          icon: '📱',
          quip: 'My phone has LiDAR. Who knew?',
          title: 'Turning an iPhone into a LiDAR, IMU and GPS Sensor',
          summary: 'Swift apps that stream ARKit depth, motion and location over TCP.',
        },
        {
          slug: 'niser-ros-dashboard',
          icon: '🖥️',
          quip: 'rosbridge up, every topic live.',
          title: 'A Browser Dashboard for a ROS 2 Sensor Rig',
          summary: 'Live camera, point cloud and sensor feeds, recording and playback in the browser.',
        },
      ],
    },
    {
      id: 'quantum',
      label: 'Side quest',
      title: 'IISER Bhopal',
      blurb: 'A hands-on quantum programming workshop.',
      posts: [
        {
          slug: 'iiser-bhopal-quantum-workshop',
          icon: '⚛️',
          quip: 'Superposition: here and there.',
          title: 'Hands-on Quantum Programming at IISER Bhopal',
          summary: 'Qubits, Bell states and Deutsch–Jozsa worked through from scratch.',
        },
      ],
    },
    {
      id: 'wrap',
      label: 'Stage 3',
      title: 'Write it up',
      blurb: 'Perception notes for the project site, and looking back.',
      posts: [
        {
          slug: 'niser-perception-notes',
          icon: '🛵',
          quip: 'Point clouds everywhere.',
          title: 'Field Notes on Perception for Two-Wheeler Autonomy',
          summary: 'Computer vision, point clouds and prediction, written for the Swayansaasita project.',
        },
        {
          slug: 'niser-internship-retrospective',
          icon: '🌙',
          quip: 'Night canteen, then the lab.',
          title: 'NISER Internship Retrospective',
          summary: 'What NISER taught me outside the lab.',
        },
      ],
    },
  ],
};

/** CosQ (Full-Stack & AI Product Lead), centred on Kurukuru, a college ride-sharing game. */
export const COSQ_JOURNEY: SeriesConfig = {
  id: 'cosq',
  theme: 'cosq',
  title: 'Building at CosQ',
  role: 'Full-Stack & AI Product Lead · Kurukuru, Go + Flutter',
  wordmark: { src: '/assets/cosq/cosq-kurukuru-marks.webp', alt: 'CosQ and Kurukuru', width: 491, height: 200 },
  hat: 'catmask',
  greeting: 'Hop on. Let\'s clear some fog.',
  finale: 'Map explored! 🎉',
  stages: [
    {
      id: 'engine',
      label: 'Stage 1',
      title: 'The engine',
      blurb: 'One Go binary: auth, trips, live matching and the explorable map.',
      posts: [
        {
          slug: 'kurukuru-architecture',
          icon: '🧱',
          quip: 'One binary. Every feature.',
          title: 'Kurukuru: A Ride-Sharing Game on One Go Binary',
          summary: 'The architecture of a college-only ride-sharing game, in one Go monolith.',
        },
        {
          slug: 'kurukuru-realtime-matching',
          icon: '🛵',
          quip: 'Rider found. Pilot on the way!',
          title: 'Matching Riders in Real Time over WebSockets',
          summary: 'Live and scheduled ride matching over a Go socket hub.',
        },
        {
          slug: 'kurukuru-fog-of-war',
          icon: '🌫️',
          quip: 'New tile uncovered!',
          title: 'Fog of War on a Real Map with PostGIS',
          summary: 'Turning GPS trails into an explorable, game-like map.',
        },
      ],
    },
    {
      id: 'app',
      label: 'Stage 2',
      title: 'The app',
      blurb: 'A pixel-art Flutter app, quests, and road safety reports.',
      posts: [
        {
          slug: 'kurukuru-pixel-map-app',
          icon: '🗺️',
          quip: 'Real streets, pixel grass.',
          title: 'Turning a Real Map into a Pixel World',
          summary: 'The map, the world screen and the parchment pixel UI.',
        },
        {
          slug: 'kurukuru-quests-and-road-watch',
          icon: '📜',
          quip: 'Quest accepted. Pothole reported.',
          title: 'Quest Books, an In-App Editor and Road Watch',
          summary: 'Game content you can edit in the app, and road safety reports.',
        },
      ],
    },
    {
      id: 'studio',
      label: 'Stage 3',
      title: 'The rest of the studio',
      blurb: 'Streaming, AI transcription, discovery, games and more.',
      posts: [
        {
          slug: 'cosq-ecosystem',
          icon: '🎬',
          quip: 'WHAM! Next project!',
          title: 'Everything Else I Built at CosQ',
          summary: 'WHAM! OTT, MemoChan, PreviouslyOn and the rest of the CosQ ecosystem.',
        },
      ],
    },
  ],
};

export const JOURNEYS: SeriesConfig[] = [FAMCARE_JOURNEY, SHOPPIN_JOURNEY, NISER_JOURNEY, COSQ_JOURNEY];
