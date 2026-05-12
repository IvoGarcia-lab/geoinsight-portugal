import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeInit } from '@/components/providers/ThemeInit';

export const metadata: Metadata = {
  title: 'GeoInsight — Inteligência Geoestatística de Portugal',
  description:
    'Plataforma SIG interativa que transforma dados Eurostat em insights visuais sobre qualquer região de Portugal. Visualize população, PIB, desemprego e mais.',
  keywords: ['Portugal', 'estatísticas', 'SIG', 'GIS', 'Eurostat', 'mapa', 'NUTS', 'dados'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'light') {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeInit />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
