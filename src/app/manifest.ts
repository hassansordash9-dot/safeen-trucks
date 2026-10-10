import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Safeen Trucks',
    short_name: 'Safeen',
    description: 'Everything for Trucks. One Marketplace.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#0B0B0B',
    theme_color: '#0B0B0B',
    icons: [
      { src: '/safeen-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/safeen-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
