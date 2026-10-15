import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { CloudRepository, DemoRepository, type Repository } from './repository';
import { supabase } from './client';
import { makeDemo } from '../demo/demoData';
import { entities, type Snapshot, type Space } from '../domain/types';
import { message } from '../components/UI';
interface ContextValue {
  snapshot: Snapshot | null;
  loading: boolean;
  error: string;
  status: string;
  online: boolean;
  demo: boolean;
  userId: string;
  save: Repository['save'];
  remove: Repository['remove'];
  updateSpace: (old: Space, patch: Pick<Space, 'name' | 'sweet_note'>) => Promise<void>;
  nickname: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
  toast: (text: string) => void;
  act: (action: () => Promise<unknown>) => void;
}
const Context = createContext<ContextValue | null>(null);
export const useSpace = () => {
  const c = useContext(Context);
  if (!c) throw new Error('Space context missing');
  return c;
};
export function SpaceProvider({
  demo,
  userId,
  children,
}: {
  demo: boolean;
  userId: string;
  children: ReactNode;
}) {
  const repo = useMemo(
    () =>
      demo
        ? new DemoRepository(localStorage, makeDemo(), userId)
        : new CloudRepository(supabase!, userId),
    [demo, userId],
  );
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [status, setStatus] = useState('Memuat'),
    [online, setOnline] = useState(navigator.onLine),
    [notice, setNotice] = useState('');
  const active = useRef(true),
    request = useRef(0),
    toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = useCallback((text: string) => {
    setNotice(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(''), 5000);
  }, []);
  const refresh = useCallback(async () => {
    const seq = ++request.current;
    try {
      const next = await repo.load();
      if (active.current && seq === request.current) {
        setSnapshot(next);
        setError('');
      }
    } catch (e) {
      if (active.current) setError(message(e));
      throw e;
    } finally {
      if (active.current) setLoading(false);
    }
  }, [repo]);
  useEffect(() => {
    active.current = true;
    void refresh().catch(() => {});
    const wake = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void refresh().catch(() => {});
    };
    const visible = () => {
      if (document.visibilityState === 'visible') wake();
    };
    window.addEventListener('online', wake);
    window.addEventListener('offline', wake);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('storage', wake);
    const timer = setInterval(() => {
      if (!demo && navigator.onLine && document.visibilityState === 'visible')
        void refresh().catch(() => {});
    }, 20000);
    return () => {
      active.current = false;
      clearInterval(timer);
      clearTimeout(toastTimer.current);
      window.removeEventListener('online', wake);
      window.removeEventListener('offline', wake);
      window.removeEventListener('storage', wake);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh, demo]);
  useEffect(() => {
    if (demo) {
      setStatus('Tersimpan di browser');
      return;
    }
    if (!snapshot || !supabase) return;
    const channel = supabase.channel(`space:${snapshot.space.id}`);
    for (const table of ['spaces', 'space_members', ...entities])
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter:
            table === 'spaces' ? `id=eq.${snapshot.space.id}` : `space_id=eq.${snapshot.space.id}`,
        },
        () => {
          void refresh().catch(() => {});
        },
      );
    channel.subscribe((state) =>
      setStatus(state === 'SUBSCRIBED' ? 'Terhubung langsung' : 'Pembaruan berkala'),
    );
    return () => {
      void supabase!.removeChannel(channel);
    };
  }, [demo, snapshot?.space.id, refresh]);
  async function mutate<T>(fn: () => Promise<T>): Promise<T> {
    if (!demo && !navigator.onLine)
      throw new Error('Sedang offline. Isianmu tetap ada; coba simpan saat tersambung.');
    setStatus('Menyimpan…');
    try {
      const result = await fn();
      try {
        await refresh();
      } catch {
        toast('Tersimpan, tetapi tampilan belum diperbarui. Muat ulang saat tersambung.');
      }
      setStatus(demo ? 'Tersimpan di browser' : 'Tersimpan');
      return result;
    } catch (e) {
      setStatus('Belum tersimpan');
      throw e;
    }
  }
  const save: Repository['save'] = (...args) => mutate(() => repo.save(...args));
  const remove: Repository['remove'] = (...args) => mutate(() => repo.remove(...args));
  const value: ContextValue = {
    snapshot,
    loading,
    error,
    status: online ? status : 'Offline',
    online,
    demo,
    userId,
    save,
    remove,
    refresh,
    toast,
    act: (fn) => {
      void fn().catch((e) => toast(message(e)));
    },
    updateSpace: (old, p) => mutate(() => repo.updateSpace(old, p)),
    nickname: (n) => mutate(() => repo.nickname(n)),
  };
  return (
    <Context.Provider value={value}>
      {children}
      {notice && (
        <div role="status" className="toast">
          {notice}
        </div>
      )}
    </Context.Provider>
  );
}
