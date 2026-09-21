import type { ReactNode } from 'react';
import './globals.css';

/**
 * The locale layout owns <html>/<body> so it can set lang and dir per request.
 * This root layout only exists because Next.js requires one.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
