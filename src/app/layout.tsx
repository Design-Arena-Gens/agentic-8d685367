import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cricket DRS Hawk-Eye Visualizer',
  description: 'Analyze cricket bowling footage and translate deliveries into a Hawk-Eye inspired trajectory visual.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
