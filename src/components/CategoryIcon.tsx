type Props = { slug: string | null | undefined; kind: 'truck' | 'part'; className?: string };

/** Shared backdrop so every category visual reads like a product tile in both themes. */
export const CATEGORY_BACKDROP = 'bg-[#efebe3]';

/** Illustration palette: brushed steel tones with a single gold accent. */
const C = {
  dark: '#2f3134',
  steel: '#5a5f65',
  mid: '#7b8189',
  light: '#a8aeb6',
  pale: '#d3d8de',
  glass: '#b7c6d4',
  gold: '#d4af37',
  goldDark: '#a57c00',
};

/** Truck tiles use a clean white plate, like a vehicle marketplace category strip. */
export const TRUCK_BACKDROP = 'bg-white';

const truckStroke = {
  fill: 'none',
  stroke: '#2563eb',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/*
 * Truck categories: thin-stroke side elevations, all facing right, sharing one
 * baseline (body bottom y 52, wheels cy 56 r 7) so the row lines up. viewBox
 * 0 0 120 72 keeps the stroke visually thin at tile size.
 */
const TRUCK_ART: Record<string, React.ReactNode> = {
  // Sleeper cab on a bare chassis with a fifth-wheel plate.
  'tractor-unit': (
    <>
      <path d="M16 52h74" />
      <path d="M62 52V22h20l10 13v17" />
      <path d="M66 26h14l7 9H66z" />
      <path d="M30 47h26v5H30z" />
      <circle cx="34" cy="56" r="7" />
      <circle cx="50" cy="56" r="7" />
      <circle cx="80" cy="56" r="7" />
    </>
  ),
  // Dump body tilted up towards the cab.
  tipper: (
    <>
      <path d="M60 52V24h20l10 13v15" />
      <path d="M64 28h14l7 9H64z" />
      <path d="M12 48 17 29 57 15l3 27z" />
      <path d="M12 48h48" />
      <circle cx="26" cy="56" r="7" />
      <circle cx="44" cy="56" r="7" />
      <circle cx="78" cy="56" r="7" />
    </>
  ),
  // Cylindrical tank with banding rings.
  tanker: (
    <>
      <path d="M60 52V26h18l10 12v14" />
      <path d="M64 30h12l7 8H64z" />
      <rect x="10" y="24" width="48" height="26" rx="13" />
      <path d="M24 24v26M38 24v26" />
      <circle cx="20" cy="56" r="7" />
      <circle cx="38" cy="56" r="7" />
      <circle cx="78" cy="56" r="7" />
    </>
  ),
  // Insulated box with a roof-mounted chiller and a snowflake.
  refrigerated: (
    <>
      <rect x="10" y="18" width="48" height="34" rx="2" />
      <rect x="42" y="10" width="14" height="8" rx="2" />
      <path d="M30 27v16M23 31l14 8M37 31l-14 8" />
      <path d="M58 52V28h18l10 12v12" />
      <path d="M62 32h12l7 8H62z" />
      <circle cx="22" cy="56" r="7" />
      <circle cx="44" cy="56" r="7" />
      <circle cx="76" cy="56" r="7" />
    </>
  ),
  // Open platform with a headboard and stake pockets.
  flatbed: (
    <>
      <path d="M10 42h48v6H10z" />
      <path d="M58 42V22" />
      <path d="M18 42v-6M30 42v-6M42 42v-6" />
      <path d="M58 52V28h18l10 12v12" />
      <path d="M62 32h12l7 8H62z" />
      <circle cx="22" cy="56" r="7" />
      <circle cx="76" cy="56" r="7" />
    </>
  ),
  // Rigid box body, two axles.
  'box-truck': (
    <>
      <rect x="10" y="18" width="50" height="34" rx="2" />
      <path d="M60 52V30h16l10 10v12" />
      <path d="M64 34h10l7 6H64z" />
      <path d="M16 24h20" />
      <circle cx="24" cy="56" r="7" />
      <circle cx="74" cy="56" r="7" />
    </>
  ),
  // Small one-box van with a sloped nose.
  'light-commercial': (
    <>
      <path d="M18 50V30a4 4 0 0 1 4-4h32l16 13v11z" />
      <path d="M46 30h7l12 9H46z" />
      <path d="M30 30v9h10v-9" />
      <circle cx="34" cy="54" r="6" />
      <circle cx="64" cy="54" r="6" />
    </>
  ),
  // Chassis truck with a boom raised over the deck.
  crane: (
    <>
      <path d="M14 52h74" />
      <path d="M58 52V26h18l10 12v14" />
      <path d="M62 30h12l7 8H62z" />
      <path d="M40 50V34h14v16" />
      <path d="M46 36 12 14" />
      <path d="M12 14v14" />
      <path d="M9 28h6" />
      <circle cx="30" cy="56" r="7" />
      <circle cx="78" cy="56" r="7" />
    </>
  ),
  // Level dump body with a sloped front, heavy axle layout.
  construction: (
    <>
      <path d="M58 52V22h20l10 14v16" />
      <path d="M62 26h14l7 10H62z" />
      <path d="M10 28v22h46V28l-8-6H10z" />
      <path d="M10 34h38" />
      <circle cx="22" cy="56" r="7" />
      <circle cx="40" cy="56" r="7" />
      <circle cx="78" cy="56" r="7" />
    </>
  ),
  // Refuse body with a sloped rear loader.
  municipal: (
    <>
      <path d="M62 52V26h16l10 12v14" />
      <path d="M66 30h10l7 8H66z" />
      <path d="M22 52V20h40v32z" />
      <path d="M22 20 8 34v18h14" />
      <path d="M28 28h28" />
      <circle cx="32" cy="56" r="7" />
      <circle cx="50" cy="56" r="7" />
      <circle cx="78" cy="56" r="7" />
    </>
  ),
  // Drawbar trailer: box, two axles, towing eye at the front.
  trailer: (
    <>
      <rect x="14" y="20" width="70" height="28" rx="2" />
      <path d="M84 40h14" />
      <path d="M98 40v-5" />
      <circle cx="36" cy="54" r="6" />
      <circle cx="54" cy="54" r="6" />
    </>
  ),
  // Semi-trailer: long box, landing legs, kingpin, rear bogie.
  'semi-trailer': (
    <>
      <rect x="8" y="16" width="94" height="30" rx="2" />
      <path d="M92 46v8M86 54h12" />
      <path d="M80 46v4" />
      <circle cx="26" cy="54" r="7" />
      <circle cx="44" cy="54" r="7" />
    </>
  ),
  // Long body, window band, front door.
  bus: (
    <>
      <rect x="8" y="16" width="102" height="36" rx="6" />
      <path d="M14 22h54v13H14z" />
      <path d="M28 22v13M42 22v13M56 22v13" />
      <path d="M82 22h22v13H82z" />
      <path d="M74 22v25" />
      <circle cx="30" cy="54" r="7" />
      <circle cx="90" cy="54" r="7" />
    </>
  ),
  // Generic rigid truck: short body over a visible chassis.
  other: (
    <>
      <path d="M14 52h74" />
      <path d="M62 52V28h16l10 11v13" />
      <path d="M66 32h10l7 7H66z" />
      <rect x="14" y="26" width="44" height="22" rx="2" />
      <circle cx="28" cy="56" r="7" />
      <circle cx="78" cy="56" r="7" />
    </>
  ),
};

/* -------------------------------------------------------- part categories */
/* Layered, shaded product illustrations. viewBox 0 0 64 64. */
const PART_ART: Record<string, React.ReactNode> = {
  engine: (
    <>
      <rect x="18" y="12" width="28" height="10" rx="2.5" fill={C.dark} />
      <rect x="18" y="12" width="28" height="3.5" rx="1.8" fill={C.light} opacity="0.4" />
      <circle cx="24" cy="17" r="1.2" fill={C.pale} />
      <circle cx="40" cy="17" r="1.2" fill={C.pale} />
      <rect x="14" y="22" width="36" height="22" rx="2" fill={C.steel} />
      <rect x="20" y="24" width="2.5" height="18" fill={C.mid} />
      <rect x="28" y="24" width="2.5" height="18" fill={C.mid} />
      <rect x="36" y="24" width="2.5" height="18" fill={C.mid} />
      <rect x="50" y="26" width="5" height="14" rx="2" fill={C.mid} />
      <path d="M18 44h28l-3 8H21z" fill={C.dark} />
      <circle cx="14" cy="34" r="6.5" fill={C.dark} />
      <circle cx="14" cy="34" r="2.6" fill={C.gold} />
    </>
  ),
  gearbox: (
    <>
      <circle cx="22" cy="32" r="15" fill={C.steel} />
      <circle cx="22" cy="32" r="15" fill="none" stroke={C.mid} strokeWidth="2" />
      <circle cx="22" cy="20" r="1.5" fill={C.pale} />
      <circle cx="22" cy="44" r="1.5" fill={C.pale} />
      <circle cx="11" cy="32" r="1.5" fill={C.pale} />
      <path d="M22 21h20l4 5v12l-4 5H22z" fill={C.mid} />
      <path d="M30 22v20M36 22v20" stroke={C.steel} strokeWidth="2.5" />
      <rect x="46" y="29" width="12" height="6" rx="2.5" fill={C.light} />
      <circle cx="22" cy="32" r="5.5" fill={C.dark} />
      <circle cx="22" cy="32" r="2.4" fill={C.gold} />
    </>
  ),
  turbo: (
    <>
      <circle cx="23" cy="35" r="16" fill={C.steel} />
      <circle cx="45" cy="34" r="13" fill={C.mid} />
      <rect x="28" y="27" width="14" height="15" fill={C.dark} />
      <rect x="4" y="28" width="12" height="13" rx="3.5" fill={C.light} />
      <rect x="39" y="10" width="12" height="13" rx="3.5" fill={C.light} />
      <circle cx="23" cy="35" r="9" fill={C.dark} />
      <path
        d="M23 35 26 26 30 32zM23 35 32 38 27 43zM23 35 14 32 19 27zM23 35 17 42 15 35z"
        fill={C.gold}
      />
      <circle cx="23" cy="35" r="2" fill={C.pale} />
      <circle cx="45" cy="34" r="4" fill={C.steel} />
    </>
  ),
  axle: (
    <>
      <rect x="6" y="28" width="52" height="8" rx="4" fill={C.steel} />
      <rect x="6" y="28" width="52" height="3" rx="1.5" fill={C.light} opacity="0.5" />
      <rect x="3" y="20" width="8" height="24" rx="2.5" fill={C.dark} />
      <rect x="53" y="20" width="8" height="24" rx="2.5" fill={C.dark} />
      <circle cx="7" cy="26" r="1.4" fill={C.gold} />
      <circle cx="7" cy="38" r="1.4" fill={C.gold} />
      <circle cx="57" cy="26" r="1.4" fill={C.gold} />
      <circle cx="57" cy="38" r="1.4" fill={C.gold} />
      <circle cx="32" cy="32" r="13" fill={C.mid} />
      <circle cx="32" cy="32" r="8" fill={C.dark} />
      <circle cx="32" cy="32" r="3" fill={C.gold} />
    </>
  ),
  lights: (
    <>
      <path d="M8 18h38l6 6v16l-6 6H8a2 2 0 0 1-2-2V20a2 2 0 0 1 2-2z" fill={C.dark} />
      <path d="M10 21h35l4 4v14l-4 4H10z" fill={C.glass} />
      <circle cx="22" cy="32" r="8.5" fill={C.pale} />
      <circle cx="22" cy="32" r="4" fill={C.gold} />
      <circle cx="40" cy="32" r="6" fill={C.pale} />
      <circle cx="40" cy="32" r="2.6" fill={C.goldDark} />
      <path d="M54 26h7M54 32h9M54 38h7" stroke={C.gold} strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  tyres: (
    <>
      <circle cx="32" cy="32" r="25" fill={C.dark} />
      <circle
        cx="32"
        cy="32"
        r="21.5"
        fill="none"
        stroke={C.steel}
        strokeWidth="5"
        strokeDasharray="5 4.5"
      />
      <circle cx="32" cy="32" r="16" fill={C.dark} />
      <circle cx="32" cy="32" r="11.5" fill={C.pale} />
      <circle cx="32" cy="32" r="4.5" fill={C.mid} />
      <circle cx="32" cy="24" r="1.7" fill={C.goldDark} />
      <circle cx="39" cy="29.5" r="1.7" fill={C.goldDark} />
      <circle cx="36.5" cy="38" r="1.7" fill={C.goldDark} />
      <circle cx="27.5" cy="38" r="1.7" fill={C.goldDark} />
      <circle cx="25" cy="29.5" r="1.7" fill={C.goldDark} />
    </>
  ),
  electronics: (
    <>
      <rect x="7" y="16" width="50" height="32" rx="3" fill={C.steel} />
      <rect x="7" y="16" width="50" height="8" rx="3" fill={C.mid} />
      <rect x="10" y="27" width="15" height="17" rx="1.5" fill={C.dark} />
      <rect x="12" y="30" width="2.5" height="11" fill={C.gold} />
      <rect x="16.5" y="30" width="2.5" height="11" fill={C.gold} />
      <rect x="21" y="30" width="2.5" height="11" fill={C.gold} />
      <rect x="29" y="27" width="25" height="17" rx="1.5" fill={C.dark} />
      <rect x="33" y="31" width="8" height="6" rx="1" fill={C.pale} />
      <rect x="45" y="31" width="5" height="5" rx="1" fill={C.light} />
      <path d="M33 41h17M45 37v4" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  cabin: (
    <>
      <path d="M13 48V24a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v24z" fill={C.steel} />
      <path d="M16 23h28v3H16z" fill={C.mid} />
      <path d="M17 27h22a2 2 0 0 1 2 2v9H17z" fill={C.glass} />
      <path d="M17 27 41 38" stroke={C.pale} strokeWidth="1.5" opacity="0.6" />
      <rect x="17" y="41" width="24" height="5" rx="1.5" fill={C.dark} />
      <path d="M19 43.5h20" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="47" y="22" width="5" height="11" rx="2" fill={C.dark} />
      <path d="M44 27h3" stroke={C.dark} strokeWidth="2" strokeLinecap="round" />
      <rect x="13" y="48" width="32" height="4" rx="1.5" fill={C.dark} />
    </>
  ),
  'brake-system': (
    <>
      <circle cx="28" cy="32" r="21" fill={C.steel} />
      <circle
        cx="28"
        cy="32"
        r="15"
        fill="none"
        stroke={C.mid}
        strokeWidth="6"
        strokeDasharray="4 5"
      />
      <circle cx="28" cy="32" r="8" fill={C.dark} />
      <circle cx="28" cy="26.5" r="1.6" fill={C.gold} />
      <circle cx="33" cy="34" r="1.6" fill={C.gold} />
      <circle cx="23" cy="34" r="1.6" fill={C.gold} />
      <path d="M40 16h9a5 5 0 0 1 5 5v22a5 5 0 0 1-5 5h-9z" fill={C.goldDark} />
      <rect x="43" y="22" width="8" height="20" rx="2" fill={C.dark} />
    </>
  ),
  suspension: (
    <>
      <rect x="17" y="8" width="30" height="6" rx="2.5" fill={C.dark} />
      <rect x="17" y="50" width="30" height="6" rx="2.5" fill={C.dark} />
      <circle cx="24" cy="11" r="1.5" fill={C.gold} />
      <circle cx="40" cy="11" r="1.5" fill={C.gold} />
      <rect x="29" y="14" width="6" height="12" fill={C.pale} />
      <rect x="25" y="26" width="14" height="24" rx="3.5" fill={C.steel} />
      <rect x="25" y="26" width="5" height="24" rx="2.5" fill={C.mid} />
      <path
        d="M20 17 44 23 20 29 44 35 20 41 44 47"
        fill="none"
        stroke={C.goldDark}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  cooling: (
    <>
      <rect x="9" y="10" width="46" height="7" rx="2.5" fill={C.dark} />
      <rect x="9" y="47" width="46" height="7" rx="2.5" fill={C.dark} />
      <rect x="11" y="17" width="42" height="30" fill={C.steel} />
      <path
        d="M16 17v30M21 17v30M26 17v30M31 17v30M36 17v30M41 17v30M46 17v30"
        stroke={C.mid}
        strokeWidth="2.4"
      />
      <rect x="11" y="17" width="42" height="30" fill="none" stroke={C.dark} strokeWidth="2" />
      <circle cx="45" cy="13.5" r="4.5" fill={C.gold} />
      <path
        d="M9 50H5a3 3 0 0 1-3-3v-8"
        fill="none"
        stroke={C.dark}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </>
  ),
  'body-parts': (
    <>
      <path d="M5 25q6-7 27-7t27 7v13q-6 7-27 7T5 38z" fill={C.steel} />
      <path d="M5 25q6-7 27-7t27 7v4q-6-6-27-6T5 29z" fill={C.light} opacity="0.55" />
      <rect x="18" y="28" width="28" height="4" rx="1.5" fill={C.dark} />
      <rect x="18" y="35" width="28" height="4" rx="1.5" fill={C.dark} />
      <circle cx="11" cy="33" r="3.6" fill={C.gold} />
      <circle cx="53" cy="33" r="3.6" fill={C.gold} />
    </>
  ),
};

const OTHER_PART = (
  <>
    <circle cx="26" cy="36" r="16" fill={C.steel} />
    <path
      d="M26 18v5M26 49v5M10 36h5M37 36h5M15 25l3.5 3.5M33.5 43.5 37 47M37 25l-3.5 3.5M18.5 43.5 15 47"
      stroke={C.steel}
      strokeWidth="7"
      strokeLinecap="round"
    />
    <circle cx="26" cy="36" r="8.5" fill={C.dark} />
    <circle cx="26" cy="36" r="3.4" fill={C.gold} />
    <path d="M47 12l8 4.6v9.2l-8 4.6-8-4.6v-9.2z" fill={C.mid} />
    <circle cx="47" cy="21.2" r="3.4" fill={C.dark} />
  </>
);

export function CategoryIcon({ slug, kind, className }: Props) {
  if (kind === 'truck') {
    const art = (slug && TRUCK_ART[slug]) || TRUCK_ART.other;
    return (
      <svg viewBox="0 0 120 72" aria-hidden="true" className={className ?? 'h-8 w-8'} {...truckStroke}>
        {art}
      </svg>
    );
  }

  const art = (slug && PART_ART[slug]) || OTHER_PART;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className ?? 'h-8 w-8'}>
      {art}
    </svg>
  );
}
