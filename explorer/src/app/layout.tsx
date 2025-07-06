import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VindexScan - Block Explorer',
  description: 'Explore the VindexChain blockchain - transactions, blocks, validators, and more',
  keywords: ['blockchain', 'explorer', 'vindexchain', 'cryptocurrency', 'defi'],
  authors: [{ name: 'VindexChain Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#DC2626',
  openGraph: {
    title: 'VindexScan - Block Explorer',
    description: 'Explore the VindexChain blockchain',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}