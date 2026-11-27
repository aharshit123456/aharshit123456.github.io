'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Stop = {
  name: string; kind: 'start' | 'toll' | 'via' | 'city' | 'dest' | 'detour' | 'offroad' | 'end' | 'food';
  lat: number; lng: number; treat?: string; note?: string; label?: string;
};

export const STOP_ICONS: Record<string, string> = {
  start: '🏠', end: '🏁', detour: '⚠️', toll: '🧾', via: '•', city: '🏙️', dest: '⛪', offroad: '🥾', food: '🍴',
};
const ICONS = STOP_ICONS;

export default function RideMap({ stops, fit }: { stops: Stop[]; fit?: [[number, number], [number, number]] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: 'abc', maxZoom: 19,
    }).addTo(map);

    if (fit) map.fitBounds(fit as L.LatLngBoundsExpression, { padding: [40, 40] });
    else map.setView([stops[0].lat, stops[0].lng], 9);

    // markers for every stop
    stops.filter((s) => s.kind !== 'via').forEach((s) => {
      const big = s.kind === 'dest' || s.kind === 'start' || s.kind === 'end';
      const icon = L.divIcon({
        className: 'map-pin',
        html: `<div class="map-pin-ball ${s.kind}">${ICONS[s.kind] || '•'}</div>`,
        iconSize: [big ? 38 : 30, big ? 38 : 30],
        iconAnchor: [big ? 19 : 15, big ? 19 : 15],
      });
      const m = L.marker([s.lat, s.lng], { icon }).addTo(map);
      const detail = s.treat
        ? `<span class="pop-treat">🍴 ${s.treat}</span>`
        : s.note ? `<span class="pop-note">${s.note}</span>` : '';
      const lbl = s.label ? `<span class="pop-label">${s.label}</span><br/>` : '';
      const maps = `<a class="pop-maps" href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}" target="_blank" rel="noopener">📍 Open in Maps</a>`;
      m.bindPopup(`${lbl}<b>${s.name}</b>${detail ? '<br/>' + detail : ''}<br/>${maps}`, { closeButton: false });
      if (s.treat || s.label) m.bindTooltip(s.treat || s.label || s.name, { direction: 'top', offset: [0, -14] });
    });

    // the riding bike
    const bikeIcon = L.divIcon({
      className: 'map-bike',
      html: `<img src="/assets/rides/cb350.gif" alt="" class="map-bike-img" style="width:70px;height:44px;image-rendering:pixelated;display:block;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.35));"/>`,
      iconSize: [70, 44], iconAnchor: [35, 38],
    });
    const bike = L.marker([stops[0].lat, stops[0].lng], { icon: bikeIcon, interactive: false, zIndexOffset: 1000 }).addTo(map);

    let raf = 0;
    let cancelled = false;

    const drawAndAnimate = (route: [number, number][]) => {
      if (cancelled || route.length < 2) return;
      L.polyline(route, { color: '#e7dcc0', weight: 9, opacity: 1 }).addTo(map);
      L.polyline(route, { color: '#b23a2a', weight: 4, opacity: 0.95, dashArray: '1 10', lineCap: 'round' }).addTo(map);

      // cumulative distances
      const seg: number[] = [0];
      for (let i = 1; i < route.length; i++) {
        const [a, b] = route[i - 1], [c, d] = route[i];
        const dx = (d - b) * Math.cos((a * Math.PI) / 180), dy = c - a;
        seg.push(seg[i - 1] + Math.hypot(dx, dy));
      }
      const total = seg[seg.length - 1] || 1;
      const DUR = 26000; // ms for one full pass
      let t0 = performance.now();
      const img = () => ref.current?.querySelector('.map-bike-img') as HTMLImageElement | null;

      const step = (now: number) => {
        if (cancelled) return;
        // travel homeward (west -> east) so the right-facing sprite rides forwards
        const dist = total - (((now - t0) % DUR) / DUR) * total;
        let i = 1;
        while (i < seg.length && seg[i] < dist) i++;
        if (i >= route.length) i = route.length - 1;
        const f = (dist - seg[i - 1]) / Math.max(1e-9, seg[i] - seg[i - 1]);
        const [a, b] = route[i - 1], [c, d] = route[i];
        const lat = a + (c - a) * f, lng = b + (d - b) * f;
        bike.setLatLng([lat, lng]);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    // real road geometry via OSRM; fall back to straight lines through the stops
    const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const g = j?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
        if (g && g.length > 2) drawAndAnimate(g.map(([lng, lat]) => [lat, lng] as [number, number]));
        else throw new Error('no route');
      })
      .catch(() => { if (!cancelled) drawAndAnimate(stops.map((s) => [s.lat, s.lng] as [number, number])); });

    return () => { cancelled = true; cancelAnimationFrame(raf); map.remove(); };
  }, [stops, fit]);

  return <div ref={ref} className="ride-map" />;
}
