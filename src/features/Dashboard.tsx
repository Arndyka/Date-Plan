import { useEffect, useState } from 'react';
import {
  Plus,
  ArrowUpRight,
  Heart,
  CalendarDays,
  MapPin,
  Sparkles,
  Bookmark,
  Wallet,
  Flower2,
  Check,
} from 'lucide-react';
import { useSpace } from '../data/SpaceProvider';
import { rupiah, prettyDate, jakartaInstant, today } from '../domain/logic';
import { Heading, TextLink, Empty } from '../components/UI';
import PicnicArt from '../components/PicnicArt';
import { PlanEditor } from './Planner';
export default function Dashboard() {
  const { snapshot, save, act } = useSpace();
  const [editing, setEditing] = useState(false),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const { tables, space, members } = snapshot!;
  const planned = tables.plans
    .filter(
      (x) =>
        x.data.status === 'terjadwal' &&
        new Date(jakartaInstant(x.data.date, x.data.end)).getTime() > now,
    )
    .sort((a, b) => `${a.data.date}${a.data.start}`.localeCompare(`${b.data.date}${b.data.start}`));
  const next = planned[0];
  const activities = next
    ? tables.activities
        .filter((x) => x.plan_id === next.id)
        .sort((a, b) => a.data.position - b.data.position)
    : [];
  const checks = next ? tables.checklist_items.filter((x) => x.plan_id === next.id) : [];
  const seconds = next
    ? Math.max(
        0,
        Math.floor(
          (new Date(jakartaInstant(next.data.date, next.data.start)).getTime() - now) / 1000,
        ),
      )
    : 0;
  const times = [
    { n: Math.floor(seconds / 86400), label: 'HARI' },
    { n: Math.floor(seconds / 3600) % 24, label: 'JAM' },
    { n: Math.floor(seconds / 60) % 60, label: 'MENIT' },
  ];
  return (
    <>
      <Heading
        eyebrow="A LITTLE PLAN, A LOT OF LOVE"
        title="Waktu berdua, dibuat istimewa."
        description="Karena momen terbaik dimulai dari, “ayo kita…”"
        action={
          <button className="btn" onClick={() => setEditing(true)}>
            <Plus size={17} />
            Buat date baru
          </button>
        }
      />
      <section className="hero-card">
        <div className="hero-copy">
          <span className="pill">
            <span className="live-dot" />
            OUR NEXT DATE
          </span>
          <h2>
            {next ? (
              <>
                A little escape,
                <br />
                just <em>you & me.</em>
              </>
            ) : (
              <>
                Let's make
                <br />
                <em>a little memory.</em>
              </>
            )}
          </h2>
          <p>{next ? next.data.title : 'Satu rencana kecil untuk seseorang yang berarti.'}</p>
          {next && (
            <div className="hero-meta">
              <span>
                <CalendarDays size={14} />
                {prettyDate(next.data.date)}
              </span>
              <span>
                <MapPin size={14} />
                {next.data.location || 'Lokasi menyusul'}
              </span>
            </div>
          )}
          <div className="hero-actions">
            {next ? (
              <a className="btn" href={`#/plans/${next.id}`}>
                Lihat rencana kita <ArrowUpRight size={17} />
              </a>
            ) : (
              <button className="btn" onClick={() => setEditing(true)}>
                Buat date baru <Plus size={17} />
              </button>
            )}
            <span className="handwriting">can't wait ♡</span>
          </div>
        </div>
        <div className="hero-picture">
          <div className="tape" />
          <PicnicArt />
          <span className="picture-caption">a date with my favorite person</span>
          <span className="flower-sticker">✿</span>
        </div>
        <span className="hero-doodle" aria-hidden="true">
          ♡
        </span>
      </section>
      <div className="dashboard-stats">
        <section className="countdown-card">
          <div>
            <p className="eyebrow">
              {seconds ? 'COUNTING THE LITTLE MOMENTS' : 'MAKE TIME FOR US'}
            </p>
            <h3>
              {next
                ? seconds
                  ? 'Menuju waktu kita'
                  : 'Waktunya quality time ♡'
                : 'Cerita kita berikutnya'}
            </h3>
          </div>
          <div className="countdown">
            {times.map((t, i) => (
              <div key={t.label}>
                {i > 0 && <span className="colon">:</span>}
                <strong>{String(t.n).padStart(2, '0')}</strong>
                <small>{t.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="mini-stat">
          <span className="stat-icon">
            <Heart size={20} />
          </span>
          <div>
            <strong>
              {tables.plans
                .filter((x) => x.data.status === 'selesai')
                .length.toString()
                .padStart(2, '0')}
            </strong>
            <p>date jadi kenangan</p>
          </div>
          <Flower2 className="stat-decoration" />
        </section>
        <section className="mini-stat">
          <span className="stat-icon sage">
            <MapPin size={20} />
          </span>
          <div>
            <strong>{tables.wishlist_items.length.toString().padStart(2, '0')}</strong>
            <p>ide di wishlist kita</p>
          </div>
        </section>
      </div>
      <div className="dashboard-columns">
        <section className="panel agenda-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">LITTLE THINGS, BIG MEMORIES</p>
              <h2>Agenda date berikutnya</h2>
            </div>
            {next && <TextLink to={`#/plans/${next.id}`}>Lihat semua</TextLink>}
          </div>
          {activities.length ? (
            <div className="mini-timeline">
              {activities.slice(0, 3).map((a, i) => (
                <a href={`#/plans/${next.id}`} key={a.id}>
                  <span className="agenda-time">
                    {a.data.start}
                    <small>WIB</small>
                  </span>
                  <span className={`agenda-icon agenda-${i}`}>
                    <span>{['☕', '✿', '♡'][i]}</span>
                  </span>
                  <div>
                    <h3>{a.data.title}</h3>
                    <p>
                      <MapPin size={12} />
                      {a.data.place || 'Tempat menyusul'}
                    </p>
                  </div>
                  <span className="agenda-cost">{rupiah(a.data.estimate)}</span>
                  <ArrowUpRight size={16} />
                </a>
              ))}
            </div>
          ) : (
            <Empty title="Belum ada agenda kecil.">Tambahkan kegiatan di rencana date kamu.</Empty>
          )}
          {next && (
            <div className="agenda-budget">
              <span>
                <Wallet size={15} />
                Budget date kita
              </span>
              <strong>{rupiah(next.data.budget)}</strong>
            </div>
          )}
        </section>
        <aside className="dashboard-aside">
          <section className="love-note">
            <span className="tape" />
            <p className="eyebrow">A LITTLE REMINDER</p>
            <p className="love-note-copy">“{space.sweet_note}”</p>
            <span className="handwriting">from us, to us ♡</span>
            <Flower2 />
          </section>
          <section className="panel dashboard-check">
            <div className="section-head">
              <h3>Sudah siap?</h3>
              <span className="badge sage">
                {checks.filter((c) => c.data.done).length}/{checks.length}
              </span>
            </div>
            {checks.slice(0, 2).map((c) => (
              <label className="check-row" key={c.id}>
                <input
                  type="checkbox"
                  checked={c.data.done}
                  onChange={() =>
                    act(() => save('checklist_items', { ...c.data, done: !c.data.done }, c))
                  }
                />
                <span className={c.data.done ? 'strike' : ''}>{c.data.title}</span>
              </label>
            ))}
            {!checks.length && <p className="muted">Kamera, snack, dan mood yang baik.</p>}
            {next && <TextLink to={`#/plans/${next.id}`}>Buka checklist</TextLink>}
          </section>
        </aside>
      </div>
      <section className="ideas-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">SOMEDAY, WITH YOU</p>
            <h2>Ide kecil untuk kita</h2>
          </div>
          <TextLink to="#/wishlist">Semua wishlist</TextLink>
        </div>
        <div className="idea-grid">
          {tables.wishlist_items.slice(0, 3).map((w, i) => (
            <a className={`idea-card idea-${i}`} key={w.id} href="#/wishlist">
              <div className="idea-illustration">
                <span>{['✿', '▤', '♡'][i]}</span>
                <i />
                <b>{['make something together', 'a chapter of us', 'sweet little moments'][i]}</b>
              </div>
              <div className="idea-info">
                <div>
                  <span className="tiny-label">{w.data.category}</span>
                  <h3>{w.data.title}</h3>
                </div>
                <ArrowUpRight size={20} />
              </div>
            </a>
          ))}
          {!tables.wishlist_items.length && (
            <a className="idea-card empty-idea" href="#/wishlist">
              <Sparkles />
              <h3>Mau mencoba apa?</h3>
              <p>Simpan ide date pertama kalian.</p>
            </a>
          )}
        </div>
      </section>
      <div className="tiny-bottom">
        <Heart size={13} />
        <span>{members.map((m) => m.nickname).join(' & ')} · one little memory at a time</span>
      </div>
      {editing && (
        <PlanEditor
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            window.location.hash = `/plans/${p.id}`;
          }}
        />
      )}
    </>
  );
}
