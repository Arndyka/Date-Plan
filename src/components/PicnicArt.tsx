export default function PicnicArt({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 560 410"
      role="img"
      aria-label="Ilustrasi piknik berdua dengan bunga, kopi, dan keranjang di taman"
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#f5dfcc" />
          <stop offset="1" stopColor="#faeee0" />
        </linearGradient>
        <pattern id="gingham" width="36" height="36" patternUnits="userSpaceOnUse">
          <rect width="36" height="36" fill="#fff7eb" />
          <path d="M0 0h18v36H0zM0 0h36v18H0z" fill="#d69295" opacity=".42" />
        </pattern>
        <filter id="shadow">
          <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#594c3f" floodOpacity=".15" />
        </filter>
      </defs>
      <rect width="560" height="410" rx="10" fill="url(#sky)" />
      <circle cx="410" cy="85" r="42" fill="#fff5d8" />
      <path d="M0 185Q85 130 160 186T350 166T560 176V410H0Z" fill="#c2c6a6" />
      <path d="M0 238Q100 165 244 230T560 206V410H0Z" fill="#a3b495" />
      <path
        d="M43 252Q84 172 65 68M62 135Q24 107 9 112M67 172Q109 131 137 133"
        stroke="#7c8b69"
        strokeWidth="7"
        fill="none"
      />
      <g fill="#819672">
        <ellipse cx="43" cy="98" rx="40" ry="24" transform="rotate(32 43 98)" />
        <ellipse cx="92" cy="121" rx="44" ry="24" transform="rotate(-35 92 121)" />
        <ellipse cx="22" cy="152" rx="37" ry="22" transform="rotate(24 22 152)" />
      </g>
      <path d="M100 273L387 241L481 354L146 389Z" fill="url(#gingham)" filter="url(#shadow)" />
      <g transform="rotate(-7 324 285)" filter="url(#shadow)">
        <rect x="284" y="233" width="121" height="69" rx="16" fill="#b48859" />
        <path d="M303 237V217Q344 171 388 217V237" fill="none" stroke="#967046" strokeWidth="9" />
        <path
          d="M287 250H402M286 269H404M298 234V299M321 233V300M345 233V301M369 233V300M393 234V299"
          stroke="#d1ad7e"
          strokeWidth="4"
        />
        <path d="M310 232Q321 208 331 239T359 238T390 236" fill="#f6e6c9" />
      </g>
      <ellipse cx="240" cy="309" rx="53" ry="29" fill="#fffaf1" stroke="#d2c9b2" strokeWidth="3" />
      <path d="M206 311L240 279L270 315Z" fill="#bd8059" />
      <path d="M210 309L241 285L265 313Z" fill="#ebbd70" />
      <circle cx="236" cy="300" r="4" fill="#c4595b" />
      <circle cx="248" cy="307" r="4" fill="#c4595b" />
      <g transform="rotate(-8 168 282)">
        <rect x="148" y="253" width="40" height="53" rx="10" fill="#fff6ed" />
        <ellipse cx="168" cy="255" rx="20" ry="7" fill="#8b5c40" />
        <path d="M188 264Q214 273 188 289" fill="none" stroke="#fff6ed" strokeWidth="8" />
      </g>
      <g transform="rotate(9 312 334)">
        <rect x="294" y="309" width="37" height="47" rx="9" fill="#f8e3db" />
        <ellipse cx="312" cy="311" rx="18" ry="6" fill="#8b5c40" />
        <path d="M331 320Q353 328 331 341" fill="none" stroke="#f8e3db" strokeWidth="7" />
      </g>
      <g transform="rotate(17 424 298)">
        <path
          d="M415 331L414 268M417 326L440 277M414 320L397 271"
          stroke="#6b815f"
          strokeWidth="3"
        />
        <path
          d="M411 314Q391 296 396 303M420 304Q443 295 431 297"
          stroke="#6b815f"
          strokeWidth="6"
        />
        {[
          { x: 413, y: 263 },
          { x: 441, y: 272 },
          { x: 396, y: 265 },
        ].map(({ x, y }, i) => (
          <g key={i} fill={i === 1 ? '#f5eee2' : '#e4b2b7'}>
            {Array.from({ length: 5 }, (_, j) => (
              <ellipse
                key={j}
                cx={x}
                cy={y - 10}
                rx="7"
                ry="11"
                transform={`rotate(${j * 72} ${x} ${y})`}
              />
            ))}
            <circle cx={x} cy={y} r="5" fill="#d0a66b" />
          </g>
        ))}
      </g>
      <g fill="#f5eee2">
        <circle cx="97" cy="311" r="3" />
        <circle cx="489" cy="270" r="3" />
        <circle cx="449" cy="218" r="3" />
      </g>
      <path d="M200 95q7-14 14 0q7-14 14 0q0 9-14 18q-14-9-14-18" fill="#bc7f82" opacity=".6" />
    </svg>
  );
}
