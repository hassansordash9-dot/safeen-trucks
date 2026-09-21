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
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/safeen-logo.jpg', sizes: '1254x1254', type: 'image/jpeg' },
    ],
  };
}
