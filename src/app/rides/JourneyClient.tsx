'use client';

import dynamic from 'next/dynamic';
import type { Stop } from './RideMap';

const RideJourney = dynamic(() => import('./RideJourney'), {
  ssr: false,
  loading: () => <div className="journey journey--loading">loading the journey…</div>,
});

export default function JourneyClient(props: { stops: Stop[]; fit?: [[number, number], [number, number]] }) {
  return <RideJourney {...props} />;
}
