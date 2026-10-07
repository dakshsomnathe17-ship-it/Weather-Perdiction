import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout({ children }: { children: ReactNode }) {
  const main = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    main.current?.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to weather
      </a>
      <Sidebar />
      <div className="app-body">
        <Header />
        <main id="main-content" ref={main} className="app-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
