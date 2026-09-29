import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rwanda Utility Alerts | Operations console',
  description: 'Administration console for Rwanda Utility Alerts: outages from REG and WASAC, community reports, subscriptions and notifications.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
