import { blobPath } from '../opening/sceneEngine';
import './BlobArt.css';

/*
  The blob drawing, shared by every scene after the opening, so Violet and Mango
  always look the same: same body shape, shading, faces, colors and nub hands.

  <BlobArt who="violet" />            props: who ('violet' | 'mango'), hands (optional)

  Things an engine can change while it plays (found with querySelector):
    [data-shape]   the 4 body paths   -> setAttribute('d', blobPath(hands, lifts)) to move the hands
    [data-eyes]    both eyes          -> style.transform = 'scaleY(0.1)' to blink
    [data-look]    the open eyes      -> style.transform = 'translate(3px, -2px)' to look around
    [data-blush]   the cheeks         -> style.opacity = 1.6 for extra blushy
  and these classes on the wrapper change the face:
    is-happy (^ ^ eyes)  is-laugh (open mouth)  is-surprised (big eyes, o mouth)  is-unsure (flat mouth)
    is-annoyed (angry brows, half-lidded eyes, flat mouth)  is-sad (worried brows, frown)
    is-tired (dark circles under the eyes, droopy lids; combine with any other face)
*/

export const CAST = {
  violet: { color: '#bf95b1', name: 'Violet' },   // GOOD blob (mauve): the player
  mango:  { color: '#f49a80', name: 'Mango' },    // BAD blob (coral): the partner
};

// a 3/4 face that looks to the RIGHT (flip the blob with scaleX(-1) to face left)
const FACE = { eyes: [[124, 100], [162, 97]], mouth: [145, 118], blush: [[106, 116], [178, 112]] };

export const DEFAULT_HANDS = [
  { x: 14, y: 156, angle: 145, len: 22, w: 22, side: 'l' },   // back hand
  { x: 226, y: 150, angle: 30, len: 24, w: 22, side: 'r' },   // front hand
];

function shade(hex, k) {   // k > 0 lighter, k < 0 darker
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  const t = k > 0 ? 255 : 40;
  return `rgb(${c.map(v => Math.round(v + (t - v) * Math.abs(k))).join(',')})`;
}

let uid = 0;

export default function BlobArt({ who, hands = DEFAULT_HANDS, idSuffix }) {
  const color = CAST[who].color;
  const key = idSuffix ?? (uid++);
  const id = s => `blob-${who}-${key}-${s}`;
  const { eyes, mouth, blush } = FACE;
  const BODY = blobPath(hands);
  return (
    <svg className="blob-art" viewBox="0 0 240 200" width="100%" height="100%" overflow="visible">
      <defs>
        <radialGradient id={id('base')} gradientUnits="userSpaceOnUse" cx="91" cy="69" r="175">
          <stop offset="0" stopColor={shade(color, 0.32)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor={shade(color, -0.32)} />
        </radialGradient>
        <linearGradient id={id('ao')} gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="194">
          <stop offset="0.6" stopColor="#3a2433" stopOpacity="0" />
          <stop offset="1" stopColor="#3a2433" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={id('rim')} gradientUnits="userSpaceOnUse" x1="2" y1="0" x2="262" y2="0">
          <stop offset="0.66" stopColor="#ffd2a0" stopOpacity="0" />
          <stop offset="1" stopColor="#ffd2a0" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id={id('shine')}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('blush')}>
          <stop offset="0" stopColor="#ff7486" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff7486" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('mouth')}>
          <path d={`M${mouth[0] - 9} ${mouth[1] - 1} Q${mouth[0]} ${mouth[1] + 15} ${mouth[0] + 9} ${mouth[1] - 1} Z`} />
        </clipPath>
      </defs>

      {/* body + hands as one shape */}
      <path data-shape d={BODY} fill={`url(#${id('base')})`} />
      <path data-shape d={BODY} fill={`url(#${id('ao')})`} />
      <path data-shape d={BODY} fill={`url(#${id('rim')})`} />
      <ellipse cx="80" cy="56" rx="44" ry="26" fill={`url(#${id('shine')})`} transform="rotate(-22 80 56)" />

      <g data-blush>
        {blush.map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="17" ry="10" fill={`url(#${id('blush')})`} />
        ))}
      </g>

      <g className="blob-eyes" data-eyes>
        <g className="blob-eye-open" data-look>
          {eyes.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <ellipse className="blob-pupil" rx="7" ry="9.5" fill="#2c2230" />
              <circle cx="-2.4" cy="-3.6" r="2.6" fill="#fff" />
              <circle cx="2.2" cy="2.8" r="1.1" fill="#fff" opacity="0.8" />
            </g>
          ))}
        </g>
        <g className="blob-eye-happy">
          {eyes.map(([x, y], i) => (
            <path key={i} d={`M${x - 8} ${y + 2} Q${x} ${y - 7} ${x + 8} ${y + 2}`}
              fill="none" stroke="#2c2230" strokeWidth="3.2" strokeLinecap="round" />
          ))}
        </g>
      </g>

      {/* dark circles under the eyes (hidden unless tired) */}
      <g className="blob-bags" fill="none" stroke="#5a3a5a" strokeOpacity="0.38" strokeWidth="3.2" strokeLinecap="round">
        {eyes.map(([x, y], i) => <path key={i} d={`M${x - 8} ${y + 12} Q${x} ${y + 17} ${x + 8} ${y + 12}`} />)}
      </g>

      {/* eyebrows (hidden unless annoyed / sad) */}
      <g className="blob-brows-annoyed" fill="none" stroke="#2c2230" strokeWidth="3" strokeLinecap="round">
        <path d={`M${eyes[0][0] - 9} ${eyes[0][1] - 20} L${eyes[0][0] + 7} ${eyes[0][1] - 14}`} />
        <path d={`M${eyes[1][0] - 7} ${eyes[1][1] - 14} L${eyes[1][0] + 9} ${eyes[1][1] - 20}`} />
      </g>
      <g className="blob-brows-sad" fill="none" stroke="#2c2230" strokeWidth="3" strokeLinecap="round">
        <path d={`M${eyes[0][0] - 9} ${eyes[0][1] - 14} L${eyes[0][0] + 7} ${eyes[0][1] - 20}`} />
        <path d={`M${eyes[1][0] - 7} ${eyes[1][1] - 20} L${eyes[1][0] + 9} ${eyes[1][1] - 14}`} />
      </g>

      {/* mouths: smile / laugh / surprised "o" / unsure flat line / frown */}
      <path className="blob-mouth-smile" d={`M${mouth[0] - 7} ${mouth[1]} Q${mouth[0]} ${mouth[1] + 6} ${mouth[0] + 7} ${mouth[1]}`}
        fill="none" stroke="#2c2230" strokeWidth="2.6" strokeLinecap="round" />
      <g className="blob-mouth-laugh">
        <path d={`M${mouth[0] - 9} ${mouth[1] - 1} Q${mouth[0]} ${mouth[1] + 15} ${mouth[0] + 9} ${mouth[1] - 1} Z`} fill="#3a2232" />
        <ellipse cx={mouth[0]} cy={mouth[1] + 8} rx="5" ry="3" fill="#e57f8c" clipPath={`url(#${id('mouth')})`} />
      </g>
      <ellipse className="blob-mouth-o" cx={mouth[0]} cy={mouth[1] + 3} rx="4.5" ry="5.5" fill="#3a2232" />
      <path className="blob-mouth-flat" d={`M${mouth[0] - 6} ${mouth[1] + 3} Q${mouth[0]} ${mouth[1] + 1.5} ${mouth[0] + 6} ${mouth[1] + 3}`}
        fill="none" stroke="#2c2230" strokeWidth="2.4" strokeLinecap="round" />
      <path className="blob-mouth-frown" d={`M${mouth[0] - 7} ${mouth[1] + 5} Q${mouth[0]} ${mouth[1] - 1} ${mouth[0] + 7} ${mouth[1] + 5}`}
        fill="none" stroke="#2c2230" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
