import { useState } from 'react';
import {
  Heart,
  Copy,
  UserPlus,
  LockKeyhole,
  Download,
  Flower2,
  LogOut,
  Pencil,
} from 'lucide-react';
import { useSpace } from '../data/SpaceProvider';
import { supabase, appUrl } from '../data/client';
import { Heading, FormDialog, Confirm } from '../components/UI';
import type { Space } from '../domain/types';
import { coupleProfiles } from '../domain/couple';
import { InstallApp } from '../components/InstallApp';
export default function Settings({ onLogout }: { onLogout: () => void }) {
  const { snapshot, demo, userId, updateSpace, nickname, toast, act } = useSpace();
  const [edit, setEdit] = useState<'space' | 'name' | null>(null),
    [editingSpace, setEditingSpace] = useState<Space | null>(null),
    [invite, setInvite] = useState(''),
    [busy, setBusy] = useState(false),
    [reset, setReset] = useState(false);
  const { space, members } = snapshot!,
    me = members.find((m) => m.user_id === userId)!;
  function backup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'our-little-date-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Cadangan diunduh. Simpan berkas ini secara pribadi.');
  }
  return (
    <>
      <Heading
        eyebrow="OUR OWN LITTLE WORLD"
        title="Dibuat untuk kita."
        description="Nama kecil, catatan manis, dan ruang untuk berdua."
      />
      <InstallApp />
      <div className="settings-grid">
        <section className="panel">
          <div className="section-head">
            <h2>Ruang kita</h2>
            <button
              className="icon-btn"
              aria-label="Edit ruang"
              onClick={() => {
                setEditingSpace(space);
                setEdit('space');
              }}
            >
              <Pencil size={16} />
            </button>
          </div>
          <div className="space-display">
            <Flower2 />
            <h3>{space.name}</h3>
            <p>“{space.sweet_note}”</p>
          </div>
          <div className="member-list">
            {members.map((m) => (
              <div key={m.user_id}>
                <span className="member-avatar">{m.nickname.slice(0, 1)}</span>
                <div>
                  <strong>{m.nickname}</strong>
                  <small>
                    {m.user_id === userId ? 'Ini kamu' : 'Partner in little adventures'}
                  </small>
                </div>
                {m.user_id === userId && (
                  <button
                    className="icon-btn"
                    aria-label="Edit nama panggilan"
                    onClick={() => setEdit('name')}
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <details className="profile-presets">
            <summary>Nama kecil Arnold & Angel</summary>
            <p>
              Pilih namamu untuk profil akun ini. Nama panggilan juga bisa kamu tulis sendiri lewat
              tombol edit.
            </p>
            <div className="couple-picker">
              {coupleProfiles.map((person) => (
                <button
                  type="button"
                  key={person.nickname}
                  aria-pressed={me.nickname === person.nickname}
                  onClick={() =>
                    act(async () => {
                      await nickname(person.nickname);
                      toast('Nama panggilanmu diperbarui.');
                    })
                  }
                >
                  <strong>{person.nickname}</strong>
                  <small>{person.fullName}</small>
                </button>
              ))}
            </div>
          </details>
        </section>
        <section className="panel">
          <UserPlus className="section-icon" />
          <h2>Berdua lebih seru.</h2>
          <p>
            Undang satu orang favoritmu ke ruang ini. Setelah masuk, kalian bisa menyusun rencana
            dari HP masing-masing.
          </p>
          {demo ? (
            <p className="info-note">
              Undangan tersedia di akun asli. Demo tidak terhubung ke ruang pasangan.
            </p>
          ) : members.length === 2 ? (
            <p className="success">
              <Heart size={16} />
              Ruang kalian sudah lengkap.
            </p>
          ) : (
            <>
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    setBusy(true);
                    try {
                      const r = await supabase!.rpc('create_invite', { target: space.id });
                      if (r.error) throw r.error;
                      setInvite(`${appUrl()}#/join?token=${r.data}`);
                    } finally {
                      setBusy(false);
                    }
                  })
                }
              >
                <UserPlus size={17} />
                {busy ? 'Membuat undangan…' : 'Buat tautan undangan'}
              </button>
              {invite && (
                <div className="invite-box">
                  <label>
                    Tautan undangan
                    <input readOnly value={invite} onFocus={(e) => e.target.select()} />
                  </label>
                  <button
                    className="btn secondary small"
                    onClick={() =>
                      act(async () => {
                        await navigator.clipboard.writeText(invite);
                        toast('Tautan undangan disalin.');
                      })
                    }
                  >
                    <Copy size={15} />
                    Salin tautan
                  </button>
                  <small>Berlaku 7 hari, sekali pakai. Bagikan hanya kepada pasanganmu.</small>
                </div>
              )}
              <button
                className="link-button"
                onClick={() =>
                  act(async () => {
                    const r = await supabase!
                      .from('space_invites')
                      .update({ revoked: true })
                      .eq('space_id', space.id)
                      .is('used_at', null);
                    if (r.error) throw r.error;
                    setInvite('');
                    toast('Undangan aktif telah dicabut.');
                  })
                }
              >
                Cabut undangan aktif
              </button>
            </>
          )}
        </section>
        <section className="panel">
          <LockKeyhole className="section-icon" />
          <h2>Cerita ini milik kalian.</h2>
          <p>
            {demo
              ? 'Data demo tersimpan di browser ini dan tidak sinkron antarperangkat.'
              : 'Hanya dua anggota ruang ini yang memiliki akses ke rencana dan catatannya.'}
          </p>
          <p>
            Kalender eksternal dan tautan TikTok dibuka hanya ketika kamu memilihnya. Data ekspor
            berisi catatan pribadi kalian.
          </p>
          <button className="btn secondary" onClick={backup}>
            <Download size={16} />
            Unduh cadangan data
          </button>
        </section>
        <section className="panel">
          <h2>Sampai date berikutnya.</h2>
          <p>Keluar dari perangkat ini tanpa menghapus rencana yang sudah disimpan.</p>
          <button className="btn secondary" onClick={onLogout}>
            <LogOut size={16} />
            {demo ? 'Keluar demo' : 'Keluar akun'}
          </button>
          {demo && (
            <button className="link-button reset-link" onClick={() => setReset(true)}>
              Reset data demo
            </button>
          )}
        </section>
      </div>
      {edit && (
        <FormDialog
          title={edit === 'space' ? 'Ruang kecil versi kalian' : 'Panggil aku…'}
          fields={
            edit === 'space'
              ? [
                  { name: 'name', label: 'Nama ruang', required: true, wide: true },
                  {
                    name: 'sweet_note',
                    label: 'Catatan manis di beranda',
                    type: 'textarea',
                    required: true,
                    wide: true,
                  },
                ]
              : [{ name: 'nickname', label: 'Nama panggilan', required: true, wide: true }]
          }
          initial={
            edit === 'space'
              ? { name: editingSpace!.name, sweet_note: editingSpace!.sweet_note }
              : { nickname: me.nickname }
          }
          onClose={() => setEdit(null)}
          onSubmit={async (v) => {
            if (edit === 'space') {
              if (String(v.name).length > 80 || String(v.sweet_note).length > 1000)
                throw new Error('Nama maksimal 80 karakter, catatan maksimal 1.000 karakter.');
              await updateSpace(editingSpace!, {
                name: String(v.name),
                sweet_note: String(v.sweet_note),
              });
            } else {
              if (String(v.nickname).length > 40)
                throw new Error('Nama panggilan maksimal 40 karakter.');
              await nickname(String(v.nickname));
            }
          }}
        />
      )}
      {reset && (
        <Confirm
          title="Semua perubahan data demo"
          onClose={() => setReset(false)}
          onConfirm={async () => {
            localStorage.removeItem('our-little-date.demo.v1');
            window.location.hash = '/';
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
