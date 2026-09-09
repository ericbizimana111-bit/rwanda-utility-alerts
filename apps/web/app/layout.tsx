import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rwanda Utility Alerts | Operations',
  description: 'Protected administration workspace for utility alerts.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
