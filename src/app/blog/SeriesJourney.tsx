'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import ChibiEngineer from './ChibiEngineer';
import type { SeriesConfig, SeriesPost } from './seriesData';
import './series-journey.css';

const STOP_W = 172; // width of one post stop on the road
const EDGE = 60; // room for the 0 and 1 flags at each end
const CHAR_W = 62;
const WALK_S = 0.8; // seconds per stop when strolling
const RUN_S = 0.16; // seconds per stop when running to a hovered post

type Props = {
  series: SeriesConfig;
  /** Reading time in minutes, keyed by slug. */
  readMinutes: Record<string, number>;
  fontClassName?: string;
};

type Stop = SeriesPost & { n: number };

const center = (i: number) => EDGE + i * STOP_W + STOP_W / 2;

export default function SeriesJourney({ series, readMinutes, fontClassName = '' }: Props) {
  const stops: Stop[] = useMemo(
    () => series.stages.flatMap((s) => s.posts).map((p, i) => ({ ...p, n: i + 1 })),
    [series],
  );
  // Index of each stage's first stop, for the stage bands under the road.
  const stageStarts = useMemo(
    () => series.stages.map((_, si) => series.stages.slice(0, si).reduce((n, s) => n + s.posts.length, 0)),
    [series],
  );
  const last = stops.length - 1;
  const trackW = EDGE * 2 + stops.length * STOP_W;
  const firstLive = stops.find((s) => s.slug);

  const reduce = useReducedMotion();
  const x = useMotionValue(center(0) - CHAR_W / 2);
  const trail = useTransform(x, (v) => v + CHAR_W / 2);

  const [at, setAt] = useState(0);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [bubble, setBubble] = useState<string | null>(series.greeting);
  const [jumpKey, setJumpKey] = useState(0);
  const [party, setParty] = useState(0);
  const [mode, setMode] = useState<'dark' | 'light'>('dark');

  const rootRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const runId = useRef(0);
  const motionCtl = useRef<{ stop: () => void } | null>(null);
  const lastUserScroll = useRef(0);
  const inView = useRef(false);
  const hovering = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greeted = useRef(false);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Keep the character in view inside the horizontal scroller, unless the reader is scrolling it. */
  const follow = useCallback(
    (i: number) => {
      const s = scrollerRef.current;
      if (!s || Date.now() - lastUserScroll.current < 6000) return;
      s.scrollTo({ left: Math.max(0, center(i) - s.clientWidth / 2), behavior: reduce ? 'auto' : 'smooth' });
    },
    [reduce],
  );

  const move = useCallback(
    (target: number, duration: number) =>
      new Promise<void>((resolve) => {
        motionCtl.current?.stop();
        const c = animate(x, target, { duration, ease: 'linear', onComplete: () => resolve() });
        motionCtl.current = {
          stop: () => {
            c.stop();
            resolve();
          },
        };
      }),
    [x],
  );

  /** Walk to stop i. Resolves false if another run took over. */
  const walkTo = useCallback(
    async (i: number, id: number, perStop: number, followScroll: boolean) => {
      const dist = Math.abs(i - pos.current);
      if (dist > 0) {
        setFacing(i > pos.current ? 1 : -1);
        setWalking(true);
        setBubble(null);
        if (followScroll) follow(i);
        await move(center(i) - CHAR_W / 2, reduce ? 0 : dist * perStop);
        if (runId.current !== id) return false;
        setWalking(false);
      }
      pos.current = i;
      setAt(i);
      return runId.current === id;
    },
    [follow, move, reduce],
  );

  const cancel = useCallback(() => {
    runId.current += 1;
    motionCtl.current?.stop();
    setWalking(false);
  }, []);

  /** The idle tour: stroll from 0 to 1, saying something at every post, celebrate, run back. */
  const tour = useCallback(async () => {
    if (reduce) return;
    const id = ++runId.current;
    if (!greeted.current) {
      greeted.current = true;
      await sleep(1800);
      if (runId.current !== id) return;
    }
    let i = pos.current;
    while (runId.current === id) {
      if (!(await walkTo(i, id, WALK_S, true))) return;
      if (i === last) {
        setJumpKey((k) => k + 1);
        setParty((p) => p + 1);
        setBubble(series.finale);
        await sleep(3400);
        if (runId.current !== id) return;
        setBubble('Again!');
        await sleep(700);
        if (runId.current !== id) return;
        if (!(await walkTo(0, id, 0.12, true))) return;
        i = 0;
        continue;
      }
      setBubble(stops[i].quip);
      await sleep(2600);
      if (runId.current !== id) return;
      i += 1;
    }
  }, [last, reduce, series.finale, stops, walkTo]);

  /** Reader points at a post: run there and hop. */
  const goTo = useCallback(
    async (i: number) => {
      hovering.current = true;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      cancel();
      const id = ++runId.current;
      if (!(await walkTo(i, id, RUN_S, false))) return;
      setBubble(stops[i].quip);
      setJumpKey((k) => k + 1);
    },
    [cancel, stops, walkTo],
  );

  const leave = useCallback(() => {
    hovering.current = false;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      if (!hovering.current && inView.current) tour();
    }, 2500);
  }, [tour]);

  // Only stroll while the strip is on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        if (entry.isIntersecting && !hovering.current) tour();
        if (!entry.isIntersecting) cancel();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancel();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [cancel, tour]);

  const markUserScroll = () => {
    lastUserScroll.current = Date.now();
  };

  const bubbleLeft = at >= last - 1;

  return (
    <section
      ref={rootRef}
      className={`sj sj--${series.theme}${series.modes && mode === 'light' ? ` sj--${series.theme}-light` : ''} ${fontClassName}`}
      aria-labelledby={`sj-${series.id}`}
    >
      <header className="sj-head">
        <div className="sj-brand">
          {'src' in series.wordmark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={series.wordmark.tile ? 'sj-tile' : 'sj-wordmark'}
              src={series.wordmark.src}
              alt={series.wordmark.alt}
              width={series.wordmark.width}
              height={series.wordmark.height}
            />
          ) : (
            <span className="sj-wordmark-text">{series.wordmark.text}</span>
          )}
          <div>
            <h2 id={`sj-${series.id}`} className="sj-title">
              {series.title}
            </h2>
            <p className="sj-role">
              {series.role} · {stops.length} posts
            </p>
          </div>
        </div>
        <div className="sj-actions">
          {series.modes && (
            <button
              type="button"
              className="sj-mode"
              onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
              aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
            >
              <span aria-hidden="true">{mode === 'dark' ? '☀︎' : '☾'}</span>
            </button>
          )}
          {firstLive?.slug ? (
            <Link href={`/blog/${firstLive.slug}`} className="sj-start">
              Start reading <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span className="sj-soon-pill">Posts coming soon</span>
          )}
        </div>
      </header>

      <div
        className="sj-scroller"
        ref={scrollerRef}
        onWheel={markUserScroll}
        onTouchStart={markUserScroll}
        onPointerDown={markUserScroll}
      >
        <div className="sj-track" style={{ width: trackW }}>
          {/* the walker */}
          <motion.div className="sj-walker" style={{ x }}>
            {bubble && !walking && (
              <motion.div
                key={`bubble-${at}-${bubble}`}
                className={`sj-bubble${bubbleLeft ? ' sj-bubble--left' : ''}`}
                initial={{ opacity: 0, scale: 0.6, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                aria-hidden="true"
              >
                {bubble}
              </motion.div>
            )}
            <motion.div
              key={`hop-${jumpKey}`}
              animate={jumpKey && !reduce ? { y: [0, -20, 0, -8, 0] } : { y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            >
              <ChibiEngineer walking={walking} facing={facing} cheer={!!bubble && !walking} hat={series.hat} />
            </motion.div>
            {party > 0 && !reduce && (
              <div className="sj-confetti" key={`party-${party}`} aria-hidden="true">
                {Array.from({ length: 16 }, (_, k) => {
                  const angle = (k / 16) * Math.PI * 2;
                  const r = 46 + (k % 4) * 12;
                  const berry = series.sprite && k % 2 === 0;
                  return (
                    <motion.span
                      key={k}
                      className={berry ? 'sj-confetto sj-confetto--sprite' : `sj-confetto sj-confetto--${k % 4}`}
                      style={berry ? { backgroundImage: `url(${series.sprite})` } : undefined}
                      initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                      animate={{ x: Math.cos(angle) * r, y: Math.sin(angle) * r - 24, opacity: 0, rotate: berry ? 90 : 240 }}
                      transition={{ duration: berry ? 1.6 : 1.3, ease: 'easeOut' }}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* the road */}
          <div className="sj-road" aria-hidden="true">
            <motion.div className="sj-road-trail" style={{ width: trail }} />
            <span className="sj-flag" style={{ left: EDGE / 2 }}>
              0
            </span>
            {stops.map((s, i) => (
              <span
                key={s.n}
                className={`sj-mark${i <= at ? ' is-reached' : ''}${series.sprite ? ' has-sprite' : ''}`}
                style={{
                  left: center(i),
                  ...(series.sprite && i <= at ? { backgroundImage: `url(${series.sprite})` } : {}),
                }}
              />
            ))}
            <span className="sj-flag" style={{ left: trackW - EDGE / 2 }}>
              1
            </span>
          </div>

          {/* stage bands */}
          <div className="sj-stages" aria-hidden="true">
            {series.stages.map((stage, si) => {
              const left = EDGE + stageStarts[si] * STOP_W + 6;
              return (
                <span key={stage.id} className="sj-stage" style={{ left, width: stage.posts.length * STOP_W - 12 }}>
                  <b>{stage.label}</b> {stage.title}
                </span>
              );
            })}
          </div>

          {/* the posts */}
          <ol className="sj-cards">
            {stops.map((s, i) => {
              const inner = (
                <>
                  <span className="sj-card-top">
                    <span className="sj-icon" aria-hidden="true">
                      {s.icon}
                    </span>
                    <span className="sj-step">{String(s.n).padStart(2, '0')}</span>
                  </span>
                  <span className="sj-card-title">{s.title}</span>
                  <span className="sj-card-meta">
                    {s.slug ? (readMinutes[s.slug] ? `${readMinutes[s.slug]} min read` : 'Read') : 'Coming soon'}
                  </span>
                </>
              );
              const handlers = {
                onMouseEnter: () => goTo(i),
                onFocus: () => goTo(i),
                onMouseLeave: leave,
                onBlur: leave,
              };
              return (
                <li key={s.n} className="sj-card-slot" style={{ left: center(i) - (STOP_W - 14) / 2 }}>
                  {s.slug ? (
                    <Link
                      href={`/blog/${s.slug}`}
                      className={`sj-card${i === at ? ' is-here' : ''}`}
                      title={s.summary}
                      {...handlers}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      className={`sj-card is-soon${i === at ? ' is-here' : ''}`}
                      title={s.summary}
                      tabIndex={0}
                      {...handlers}
                    >
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
