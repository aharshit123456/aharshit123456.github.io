'use client';

import React from 'react';

type Props = {
  walking: boolean;
  /** 1 faces right, -1 faces left. */
  facing: 1 | -1;
  /** Open, happy mouth. */
  cheer: boolean;
  hat?: 'strawberry' | 'helmet';
};

/**
 * A small chibi engineer. Outfit colours come from the journey theme
 * (.c-hoodie, .c-dark, .c-badge, .c-trim, .c-laptop in series-journey.css).
 * Limbs, blinking and bobbing are CSS animations (see famcare-journey.css),
 * switched on by the `is-walking` class.
 */
export default function ChibiEngineer({ walking, facing, cheer, hat }: Props) {
  return (
    <svg
      className={`chibi${walking ? ' is-walking' : ''}`}
      viewBox="0 0 64 84"
      width="62"
      height="82"
      style={{ transform: `scaleX(${facing})` }}
      aria-hidden="true"
    >
      <ellipse className="chibi-shadow" cx="32" cy="81.5" rx="14" ry="2.6" />

      <g className="chibi-bob">
        {/* legs */}
        <g className="chibi-leg chibi-leg-l">
          <rect x="24" y="60" width="7.5" height="17" rx="3.75" className="c-dark" />
          <ellipse cx="27" cy="77.5" rx="5.2" ry="3" fill="#ffffff" />
          <rect x="22" y="78.6" width="10.5" height="1.8" rx="0.9" className="c-badge" />
        </g>
        <g className="chibi-leg chibi-leg-r">
          <rect x="32.5" y="60" width="7.5" height="17" rx="3.75" className="c-dark" />
          <ellipse cx="37" cy="77.5" rx="5.2" ry="3" fill="#ffffff" />
          <rect x="31.5" y="78.6" width="10.5" height="1.8" rx="0.9" className="c-badge" />
        </g>

        {/* back arm */}
        <g className="chibi-arm chibi-arm-r">
          <rect x="43" y="44" width="7.5" height="15" rx="3.75" className="c-dark" />
          <circle cx="46.75" cy="59" r="3.4" fill="#f6d2b5" />
        </g>

        {/* hoodie */}
        <rect x="18" y="41" width="28" height="23" rx="10" className="c-hoodie" />
        <path d="M25 41.5 L32 50 L39 41.5" fill="none" className="c-trim" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="35.5" y="49" width="7" height="9" rx="1.6" className="c-badge" />
        <rect x="37" y="51" width="4" height="1.4" rx="0.7" className="c-hoodie" />
        <rect x="37" y="53.6" width="2.6" height="1.2" rx="0.6" className="c-hoodie" opacity="0.6" />
        <rect x="22" y="57" width="15" height="4.5" rx="2.25" className="c-dark" opacity="0.55" />

        {/* front arm holding a tiny laptop */}
        <g className="chibi-arm chibi-arm-l">
          <rect x="13.5" y="44" width="7.5" height="15" rx="3.75" className="c-hoodie" />
          <rect x="7" y="54" width="13" height="9" rx="1.6" className="c-laptop" transform="rotate(-12 13.5 58.5)" />
          <rect x="9" y="56" width="9" height="5" rx="1" className="c-hoodie" transform="rotate(-12 13.5 58.5)" />
          <circle cx="17.25" cy="59" r="3.4" fill="#f6d2b5" />
        </g>

        {/* head */}
        <g className="chibi-head">
          <circle cx="14.5" cy="28" r="3.6" fill="#f0c3a2" />
          <circle cx="49.5" cy="28" r="3.6" fill="#f0c3a2" />
          <circle cx="32" cy="25" r="18.5" fill="#f6d2b5" />
          <path
            d="M13.6 25.5 C12.5 11 22 4.5 32 4.5 C43 4.5 52.5 11.5 50.4 25.5 C47.5 18.5 42 15.5 35.5 15.6 C33 19.5 25 21.5 18.5 20.6 C16.4 21.8 14.8 23.4 13.6 25.5 Z"
            fill="#2b2420"
          />
          <path d="M31 5.2 C30 1.5 34.5 0.5 35.8 2.8" fill="none" stroke="#2b2420" strokeWidth="2.2" strokeLinecap="round" />
          <g className="chibi-eyes">
            <ellipse cx="25" cy="28" rx="2.7" ry="3.4" fill="#1d1a19" />
            <ellipse cx="39" cy="28" rx="2.7" ry="3.4" fill="#1d1a19" />
            <circle cx="26" cy="26.6" r="1" fill="#ffffff" />
            <circle cx="40" cy="26.6" r="1" fill="#ffffff" />
          </g>
          <ellipse cx="20.5" cy="33.5" rx="3.2" ry="1.9" fill="#fa746f" opacity="0.38" />
          <ellipse cx="43.5" cy="33.5" rx="3.2" ry="1.9" fill="#fa746f" opacity="0.38" />
          {cheer ? (
            <path d="M28.6 33.6 Q32 34.4 35.4 33.6 Q34.8 38.4 32 38.4 Q29.2 38.4 28.6 33.6 Z" fill="#7a2e2b" />
          ) : (
            <path d="M29 34 Q32 36.8 35 34" fill="none" stroke="#1d1a19" strokeWidth="1.6" strokeLinecap="round" />
          )}
          {hat === 'helmet' && (
            <g className="chibi-hat">
              <path
                d="M11.5 27 C10 10 20.5 2.6 32 2.6 C43.5 2.6 54 10 52.5 27 L49 27 C47.5 19.5 41 16.5 32 16.5 C23 16.5 16.5 19.5 15 27 Z"
                className="c-hoodie"
              />
              <path d="M32 2.8 L32 16.4" stroke="#ffffff" strokeWidth="3" opacity="0.9" />
              <path d="M15.2 22.5 C20 18.6 26 17.4 32 17.4 C38 17.4 44 18.6 48.8 22.5" fill="none" className="c-trim" strokeWidth="2.4" />
              <rect x="10" y="25" width="7" height="5" rx="2.4" className="c-dark" />
              <rect x="47" y="25" width="7" height="5" rx="2.4" className="c-dark" />
            </g>
          )}
          {hat === 'strawberry' && (
            <g className="chibi-hat">
              <path
                d="M12.6 23.5 C11.5 9.5 21 3.2 32 3.2 C43 3.2 52.5 9.5 51.4 23.5 C45 19.6 39 18.4 32 18.4 C25 18.4 19 19.6 12.6 23.5 Z"
                fill="#ff444f"
              />
              <path d="M12.6 23.5 C19 19.6 25 18.4 32 18.4 C39 18.4 45 19.6 51.4 23.5" fill="none" stroke="#d92f3a" strokeWidth="2" />
              {[
                [20, 14],
                [27, 9.5],
                [36, 9.5],
                [43.5, 14],
                [31.5, 14.5],
                [24, 17.5],
                [39.5, 17.5],
              ].map(([cx, cy]) => (
                <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx="1.1" ry="1.6" fill="#fff1d6" />
              ))}
              <path
                d="M32 4.5 L26 0.8 L29.5 5.2 L23.5 5.6 L30 7 L32 9.5 L34 7 L40.5 5.6 L34.5 5.2 L38 0.8 Z"
                fill="#3c9a4b"
                stroke="#2e7d3c"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              <path d="M32 4.6 C32 1.8 33.2 0 35 -1" fill="none" stroke="#2e7d3c" strokeWidth="1.6" strokeLinecap="round" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
