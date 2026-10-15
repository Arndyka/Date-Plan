import {
  House,
  Sparkles,
  CalendarDays,
  Heart,
  Bookmark,
  MapPin,
  Flower2,
  Settings,
  BookHeart,
  LogOut,
  ChevronDown,
  Check,
  CloudOff,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useSpace } from '../data/SpaceProvider';
const navigation = [
  { path: '/', label: 'Beranda', icon: House },
  { path: '/plans', label: 'Rencana date', icon: Heart },
  { path: '/calendar', label: 'Kalender', icon: CalendarDays },
  { path: '/inspiration', label: 'Inspirasi', icon: Bookmark },
  { path: '/ideas', label: 'Ide date', icon: Sparkles },
  { path: '/wishlist', label: 'Wishlist', icon: MapPin },
  { path: '/memories', label: 'Kenangan', icon: BookHeart },
];
export function AppShell({
  path,
  children,
  onLogout,
}: {
  path: string;
  children: ReactNode;
  onLogout: () => void;
}) {
  const { snapshot, demo, status, online } = useSpace();
  const [more, setMore] = useState(false);
  const active = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Lewati ke konten
      </a>
      <aside className="sidebar">
        <a className="brand" href="#/">
          <Flower2 />
          <span>
            our little
            <br />
            <i>date.</i>
          </span>
        </a>
        <p className="nav-caption">A LITTLE SPACE FOR US</p>
        <nav aria-label="Navigasi utama">
          {navigation.map((n) => (
            <a key={n.path} className={active(n.path) ? 'active' : ''} href={`#${n.path}`}>
              <n.icon size={19} />
              {n.label}
              {active(n.path) && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Flower2 />
            <p>
              Good dates start
              <br />
              with a little plan.
            </p>
            <span>and a lot of love ♡</span>
          </div>
          <a
            className={active('/settings') ? 'settings-link active' : 'settings-link'}
            href="#/settings"
          >
            <Settings size={18} />
            Pengaturan
          </a>
          <button className="settings-link" onClick={onLogout}>
            <LogOut size={18} />
            {demo ? 'Keluar demo' : 'Keluar'}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <Heart size={14} />
            <span>{snapshot?.space.name}</span>
            <span className="breadcrumb-slash">/</span>
            <span>{navigation.find((n) => active(n.path))?.label ?? 'Ruang kita'}</span>
          </div>
          <div className="topbar-right">
            <span className={`sync-status ${!online ? 'offline' : ''}`}>
              {online ? <Check size={12} /> : <CloudOff size={12} />}
              <span>{status}</span>
            </span>
            <a className="couple" href="#/settings" aria-label="Pengaturan pasangan">
              <span>{snapshot?.members[0]?.nickname.slice(0, 1)}</span>
              <span>{snapshot?.members[1]?.nickname.slice(0, 1) ?? '♡'}</span>
              <ChevronDown size={14} />
            </a>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <b>Ruang demo</b> · Coba sesukamu, data hanya ada di browser ini.
            </span>
            <button onClick={onLogout}>
              Masuk bersama pasangan <span aria-hidden="true">↗</span>
            </button>
          </div>
        )}
        <main id="main-content" tabIndex={-1} className="content" key={path.split('?')[0]}>
          {children}
        </main>
        <footer className="app-footer">
          <span>a little plan, a lot of love.</span>
          <Flower2 size={14} />
          <span>our little date</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Navigasi mobile">
        {navigation.slice(0, 4).map((n) => (
          <a key={n.path} className={active(n.path) ? 'active' : ''} href={`#${n.path}`}>
            <n.icon size={20} />
            {n.label === 'Rencana date' ? 'Rencana' : n.label}
          </a>
        ))}
        <button
          className={more ? 'active' : ''}
          onClick={() => setMore(!more)}
          aria-expanded={more}
        >
          <Flower2 size={20} />
          Lainnya
        </button>
      </nav>
      {more && (
        <div className="mobile-more">
          {navigation.slice(4).map((n) => (
            <a key={n.path} href={`#${n.path}`} onClick={() => setMore(false)}>
              <n.icon size={18} />
              {n.label}
            </a>
          ))}
          <a href="#/settings" onClick={() => setMore(false)}>
            <Settings size={18} />
            Pengaturan
          </a>
          <button onClick={onLogout}>
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
