import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConferenceManager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif', background: '#f8fafc', color: '#1a1a1a' }}>
        {children}
      </body>
    </html>
  );
}
