import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NotificationToast } from '@/components/NotificationToast';
import { DevToolsGuard } from '@/components/DevToolsGuard';

export const metadata = {
  title: 'District RP | Store',
  description: 'Support District RP and unlock community perks.',
};

const THEME_INIT_SCRIPT = `
(function () {
  var saved = localStorage.getItem('drp-theme');
  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <DevToolsGuard />
          <Header />
          <main>{children}</main>
          <Footer />
          <NotificationToast />
        </Providers>
      </body>
    </html>
  );
}
