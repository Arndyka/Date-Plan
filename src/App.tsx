import { useEffect, useState, Component, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { Flower2 } from 'lucide-react';
import { supabase } from './data/client';
import { SpaceProvider, useSpace } from './data/SpaceProvider';
import { DEMO_USER } from './demo/demoData';
import { AuthScreen, SpaceSetup } from './auth/Auth';
import { AppShell } from './components/AppShell';
import { message, Empty } from './components/UI';
import Dashboard from './features/Dashboard';
import { PlanList, PlanDetail } from './features/Planner';
import Calendar from './features/Calendar';
import Inspiration from './features/Inspiration';
import Wishlist from './features/Wishlist';
import Memories from './features/Memories';
import Settings from './features/Settings';
import Recommendations from './features/Recommendations';
import { AppUpdateNotice } from './components/InstallApp';

function Workspace({ onLogout }: { onLogout: () => void }) {
  const { loading, error, snapshot, refresh, act } = useSpace();
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/');
  useEffect(() => {
    const update = () => {
      const next = window.location.hash.slice(1) || '/';
      if (next === 'main-content') {
        document.getElementById('main-content')?.focus();
        return;
      }
      setPath(next);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  if (loading)
    return (
      <div className="loading-screen">
        <Flower2 className="flower" />
        <p>Menyiapkan ruang kecil kita…</p>
        <span>Sebentar, ya ♡</span>
      </div>
    );
  if (error && !snapshot)
    return (
      <div className="setup-wrap">
        <div className="auth-card">
          <h2>Ruang kita belum bisa dimuat.</h2>
          <p className="error" role="alert">
            {error}
          </p>
          <button className="btn" onClick={() => act(refresh)}>
            Coba lagi
          </button>
          <button className="link-button" onClick={onLogout}>
            Keluar akun
          </button>
        </div>
      </div>
    );
  if (!snapshot) return <SpaceSetup onLogout={onLogout} />;
  const page =
    path === '/' || path.startsWith('/join') ? (
      <Dashboard />
    ) : path === '/ideas' ? (
      <Recommendations />
    ) : path === '/plans' ? (
      <PlanList />
    ) : path.startsWith('/plans/') ? (
      <PlanDetail key={path.slice(7)} id={path.slice(7)} />
    ) : path === '/calendar' ? (
      <Calendar />
    ) : path === '/inspiration' ? (
      <Inspiration />
    ) : path === '/wishlist' ? (
      <Wishlist />
    ) : path === '/memories' ? (
      <Memories />
    ) : path === '/settings' ? (
      <Settings onLogout={onLogout} />
    ) : (
      <Empty
        title="Halaman ini belum ada."
        action={
          <a className="btn" href="#/">
            Pulang ke beranda
          </a>
        }
      />
    );
  return (
    <AppShell path={path} onLogout={onLogout}>
      {error && (
        <div className="error" role="alert">
          Pembaruan gagal. Data terakhir masih ditampilkan.{' '}
          <button className="link-button" onClick={() => act(refresh)}>
            Coba muat ulang
          </button>
        </div>
      )}
      {page}
    </AppShell>
  );
}
export default function App() {
  const [demo, setDemo] = useState(
      () => sessionStorage.getItem('our-little-date.demo.active') === 'yes',
    ),
    [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(!supabase),
    [recovery, setRecovery] = useState(false),
    [authError, setAuthError] = useState('');
  useEffect(() => {
    const match = window.location.hash.match(/^#\/join\?token=([a-f0-9]{64})$/);
    if (match) {
      sessionStorage.setItem('date-invite', match[1]);
      sessionStorage.removeItem('our-little-date.demo.active');
      setDemo(false);
      history.replaceState(null, '', window.location.pathname + window.location.search + '#/join');
    }
    if (!supabase) return;
    let alive = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      setReady(true);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      setUser(data.session?.user ?? null);
      if (error) setAuthError(error.message);
      setReady(true);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  async function logout() {
    try {
      if (demo) {
        sessionStorage.removeItem('our-little-date.demo.active');
        setDemo(false);
      } else if (supabase) {
        const r = await supabase.auth.signOut();
        if (r.error) throw r.error;
        setUser(null);
      }
      window.location.hash = '/';
    } catch (e) {
      setAuthError(message(e));
    }
  }
  if (!ready)
    return (
      <div className="loading-screen">
        <Flower2 className="flower" />
        <p>Menyiapkan ruang kecil kita…</p>
      </div>
    );
  return (
    <>
      {authError && (
        <p className="error auth-error" role="alert">
          {authError}
          <button className="link-button" onClick={() => setAuthError('')}>
            Tutup
          </button>
        </p>
      )}
      <AppUpdateNotice />
      {recovery ? (
        <AuthScreen recovery onDemo={() => {}} />
      ) : !demo && !user ? (
        <AuthScreen
          onDemo={() => {
            sessionStorage.setItem('our-little-date.demo.active', 'yes');
            setDemo(true);
            window.location.hash = '/';
          }}
        />
      ) : (
        <SpaceProvider
          key={demo ? 'demo' : user!.id}
          demo={demo}
          userId={demo ? DEMO_USER : user!.id}
        >
          <Workspace
            onLogout={() => {
              void logout();
            }}
          />
        </SpaceProvider>
      )}
    </>
  );
}
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="setup-wrap">
        <section className="auth-card">
          <Flower2 />
          <h1>Ada yang tersandung.</h1>
          <p>
            Ruang belum bisa dibuka. Coba muat ulang. Pastikan browser mengizinkan penyimpanan data
            situs.
          </p>
          <button className="btn" onClick={() => window.location.reload()}>
            Muat ulang
          </button>
        </section>
      </div>
    ) : (
      this.props.children
    );
  }
}
