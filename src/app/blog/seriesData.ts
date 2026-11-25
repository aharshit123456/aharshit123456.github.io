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
];

/** All series posts in journey order. */
export const FAMCARE_SERIES = FAMCARE_STAGES.flatMap((s) => s.posts) as (SeriesPost & { slug: string })[];

export type SeriesConfig = {
  id: string;
  /** Visual theme class: colours, type and the character's outfit. */
  theme: 'famcare' | 'shoppin';
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
  hat?: 'strawberry';
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

export const JOURNEYS: SeriesConfig[] = [FAMCARE_JOURNEY, SHOPPIN_JOURNEY];
