type P = { className?: string };
const base = 'h-5 w-5';

function Svg({ className, children }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? base}
    >
      {children}
    </svg>
  );
}

export const IconTruck = (p: P) => (
  <Svg {...p}>
    <path d="M3 17V7a1 1 0 0 1 1-1h9v11" />
    <path d="M13 9h4l4 4v4h-2" />
    <circle cx="7.5" cy="17.5" r="2" />
    <circle cx="17" cy="17.5" r="2" />
    <path d="M9.5 17.5h5.5" />
  </Svg>
);

export const IconGear = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
  </Svg>
);

export const IconSearch = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);

export const IconHome = (p: P) => (
  <Svg {...p}>
    <path d="m3 10.5 9-7 9 7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);

export const IconHeart = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
    aria-hidden="true"
    className={p.className ?? base}
  >
    <path d="M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3.2C19 15.6 12 20 12 20Z" />
  </svg>
);

export const IconUser = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconPhone = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
  </Svg>
);

export const IconWhatsapp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={p.className ?? base}>
    <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.86.5 3.64 1.42 5.2L2 22l5.1-1.58a9.8 9.8 0 0 0 4.94 1.3h.01c5.42 0 9.83-4.4 9.83-9.84C21.88 6.4 17.47 2 12.04 2Zm0 17.9h-.01a8.1 8.1 0 0 1-4.15-1.14l-.3-.18-3.02.94.96-2.95-.2-.31a8.07 8.07 0 0 1-1.24-4.32c0-4.51 3.67-8.18 8.18-8.18 2.18 0 4.23.85 5.78 2.4a8.13 8.13 0 0 1 2.39 5.79c0 4.51-3.67 8.17-8.18 8.17Zm4.49-6.12c-.25-.13-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.13-.16.24-.64.79-.78.96-.15.16-.29.18-.53.06-.25-.13-1.04-.39-1.98-1.23-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.17 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
  </svg>
);

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);

export const IconShield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 5 5.8v5.3c0 4.2 2.9 8 7 9.4 4.1-1.4 7-5.2 7-9.4V5.8Z" />
    <path d="m9 12 2 2 4-4.5" />
  </Svg>
);

export const IconChevron = (p: P) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);

export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconFilter = (p: P) => (
  <Svg {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);

export const IconGlobe = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.4 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.4-3.3-8.5S9.8 5.9 12 3.5Z" />
  </Svg>
);

export const IconStore = (p: P) => (
  <Svg {...p}>
    <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
    <path d="M9.5 20v-5.5h5V20" />
  </Svg>
);

export const IconFlag = (p: P) => (
  <Svg {...p}>
    <path d="M5 21V4h9l-1 3h6l-1.5 4.5L19 16h-7l-1-3H5" />
  </Svg>
);

export const IconEye = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);
