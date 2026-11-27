'use client';

import dynamic from 'next/dynamic';
import type { Stop } from './RideMap';

const RideMap = dynamic(() => import('./RideMap'), {
  ssr: false,
  loading: () => <div className="ride-map ride-map--loading">loading the route…</div>,
});

export default function MapHero(props: { stops: Stop[]; fit?: [[number, number], [number, number]] }) {
  return <RideMap {...props} />;
}
