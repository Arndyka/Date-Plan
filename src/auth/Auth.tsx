import { useState, type FormEvent } from 'react';
import { Heart, ArrowRight, LockKeyhole, Flower2, Mail } from 'lucide-react';
import { supabase, appUrl } from '../data/client';
import { useSpace } from '../data/SpaceProvider';
import { message } from '../components/UI';
import PicnicArt from '../components/PicnicArt';
import { coupleName, coupleProfiles } from '../domain/couple';

export function AuthScreen({
  onDemo,
  recovery = false,
}: {
  onDemo: () => void;
  recovery?: boolean;
}) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'recovery'>(
      recovery ? 'recovery' : 'login',
    ),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    const f = new FormData(e.currentTarget);
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const email = String(f.get('email') ?? ''),
        password = String(f.get('password') ?? '');
      const result =
        mode === 'signup'
          ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: appUrl() } })
          : mode === 'reset'
            ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() })
            : mode === 'recovery'
              ? await supabase.auth.updateUser({ password })
              : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === 'signup') setNotice('Cek email kamu untuk konfirmasi akun, lalu masuk di sini.');
      if (mode === 'reset')
        setNotice('Jika email terdaftar, tautan pemulihan akan dikirim. Cek inbox dan spam.');
      if (mode === 'recovery') {
        await supabase.auth.signOut();
        window.location.hash = '';
        window.location.reload();
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="welcome">
      <div className="welcome-brand">
        <Flower2 />
        <span>
          our little <i>date.</i>
        </span>
      </div>
      <main className="welcome-grid">
        <section className="welcome-story">
          <p className="eyebrow">A LITTLE WORLD FOR {coupleName.toUpperCase()}</p>
          <h1>
            A little plan.
            <br />A lot of <em>love.</em>
          </h1>
          <p>
            Tempat kecil untuk merencanakan waktu berdua.
            <br />
            Dari “mau ke mana?” sampai “kapan lagi?”
          </p>
          <div className="welcome-art">
            <PicnicArt />
            <span className="handwriting">life is sweeter with you ♡</span>
          </div>
        </section>
        <section className="auth-card">
          <div className="stamp">
            <Heart />
          </div>
          <p className="eyebrow">YOUR LITTLE WORLD, TOGETHER</p>
          <h2>
            {mode === 'signup'
              ? 'Mulai cerita kalian'
              : mode === 'reset'
                ? 'Kembali ke cerita kita'
                : mode === 'recovery'
                  ? 'Password baru'
                  : 'Halo, lovebirds.'}
          </h2>
          <p className="muted">
            {mode === 'reset'
              ? 'Kami kirim tautan untuk mengganti password.'
              : 'Satu ruang untuk semua rencana manis kalian.'}
          </p>
          {!supabase && (
            <p className="info-note">
              Ruang bersama sedang disiapkan. Kamu sudah bisa mencoba semua fitur melalui demo di
              bawah.
            </p>
          )}
          <form onSubmit={submit}>
            {mode !== 'recovery' && (
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="kamu@email.com"
                  required
                  disabled={!supabase}
                />
              </label>
            )}
            {mode !== 'reset' && (
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Minimal 8 karakter"
                  required
                  disabled={!supabase}
                />
              </label>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="success" role="status">
                {notice}
              </p>
            )}
            <button className="btn full" disabled={busy || !supabase}>
              {busy
                ? 'Sebentar, ya…'
                : mode === 'signup'
                  ? 'Buat akun'
                  : mode === 'reset'
                    ? 'Kirim tautan'
                    : mode === 'recovery'
                      ? 'Simpan password'
                      : 'Masuk ke ruang kita'}
              <ArrowRight size={17} />
            </button>
          </form>
          {mode !== 'recovery' && (
            <>
              <div className="auth-options">
                <button
                  className="link-button"
                  onClick={() => {
                    setMode(mode === 'signup' ? 'login' : 'signup');
                    setError('');
                    setNotice('');
                  }}
                >
                  {mode === 'signup' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
                </button>
                <button
                  className="link-button"
                  onClick={() => {
                    setMode(mode === 'reset' ? 'login' : 'reset');
                    setError('');
                    setNotice('');
                  }}
                >
                  {mode === 'reset' ? 'Kembali masuk' : 'Lupa password?'}
                </button>
              </div>
              <div className="divider">
                <span>atau intip dulu</span>
              </div>
              <button className="btn secondary full" onClick={onDemo}>
                Jelajahi demo <Flower2 size={17} />
              </button>
              <small className="privacy">
                <LockKeyhole size={12} /> Data demo hanya tersimpan di browser ini.
              </small>
            </>
          )}
        </section>
      </main>
      <footer className="welcome-footer">
        made for two, with love <Heart size={12} />
      </footer>
    </div>
  );
}
export function SpaceSetup({ onLogout }: { onLogout: () => void }) {
  const { refresh, act } = useSpace();
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [token, setToken] = useState(() => sessionStorage.getItem('date-invite') ?? '');
  const [nickname, setNickname] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = token
        ? await supabase!.rpc('accept_invite', {
            token: token.trim(),
            nickname: String(f.get('nickname')).trim(),
          })
        : await supabase!.rpc('create_space', {
            room_name: String(f.get('name')).trim(),
            nickname: String(f.get('nickname')).trim(),
          });
      if (result.error) throw result.error;
      sessionStorage.removeItem('date-invite');
      window.location.hash = '/';
      await refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="setup-wrap">
      <section className="auth-card">
        <Flower2 className="flower" />
        <p className="eyebrow">A SPACE FOR JUST THE TWO OF YOU</p>
        <h1>{token ? 'Ada tempat untukmu.' : 'Buat ruang kecil kalian.'}</h1>
        <p>Rencana, ide, dan cerita yang hanya bisa dilihat kalian berdua.</p>
        <form onSubmit={submit}>
          <fieldset className="couple-picker">
            <legend>Hari ini, siapa yang merencanakan?</legend>
            {coupleProfiles.map((person) => (
              <button
                type="button"
                key={person.nickname}
                aria-pressed={nickname === person.nickname}
                onClick={() => setNickname(person.nickname)}
              >
                <Heart size={15} />
                <strong>{person.nickname}</strong>
                <small>{person.fullName}</small>
              </button>
            ))}
          </fieldset>
          <label>
            Nama panggilanmu
            <input
              name="nickname"
              maxLength={40}
              required
              placeholder="Panggil aku…"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
          {!token && (
            <label>
              Nama ruang
              <input name="name" maxLength={80} required defaultValue={coupleName} />
            </label>
          )}
          <label>
            Kode undangan (jika ada)
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Tempel kode dari pasangan"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn full" disabled={busy}>
            {busy ? 'Menyiapkan…' : token ? 'Gabung ruang pasangan' : 'Buat ruang kita'}
            <Heart size={17} />
          </button>
        </form>
        <button className="link-button" onClick={() => act(async () => onLogout())}>
          Keluar akun
        </button>
        <p className="privacy">
          <Mail size={14} /> Setelah ruang dibuat, undang pasangan melalui Pengaturan.
        </p>
      </section>
    </div>
  );
}
