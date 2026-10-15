import { useEffect, useState } from 'react';
import { Sparkles, MapPin, Clock, Heart, ArrowUpRight, Bookmark, Search } from 'lucide-react';
import { useSpace } from '../data/SpaceProvider';
import { dateIdeas, type DateIdea } from '../domain/dateIdeas';
import {
  normalizeCity,
  weekStart,
  weeklyIdeas,
  ideasForCity,
  filterIdeas,
  ideaToWishlist,
} from '../domain/recommendations';
import { mapsUrl, prettyDate, rupiah } from '../domain/logic';
import { categories, type Space, type WishlistData } from '../domain/types';
import { Heading, External, Empty, message } from '../components/UI';
import { PlanEditor } from './Planner';

function useCurrentWeek() {
  const [week, setWeek] = useState(() => weekStart());
  useEffect(() => {
    const update = () => setWeek(weekStart());
    const timer = setInterval(update, 60000);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return week;
}

export function WeeklyPreview() {
  const { snapshot } = useSpace();
  const week = useCurrentWeek();
  const city = normalizeCity(snapshot!.space.recommendation_city ?? 'Bandung');
  return (
    <section className="ideas-section weekly-preview">
      <div className="section-head">
        <div>
          <p className="eyebrow">A NEW WEEK, A LITTLE ADVENTURE</p>
          <h2>Minggu ini, mau ke mana?</h2>
          <p className="muted">
            Pilihan untuk {city} · mulai {prettyDate(week, true)}
          </p>
        </div>
        <a className="text-link" href="#/ideas">
          Jelajahi ide date <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="idea-grid">
        {weeklyIdeas(city, week)
          .slice(0, 3)
          .map((idea, i) => (
            <a className={`idea-card idea-${i}`} href="#/ideas" key={idea.id}>
              <div className="idea-illustration">
                <span>{['✿', '♡', '☕'][i]}</span>
                <i />
                <b>
                  {idea.setting} · {idea.duration} menit
                </b>
              </div>
              <div className="idea-info">
                <div>
                  <span className="tiny-label">{idea.category}</span>
                  <h3>{idea.title}</h3>
                  <small>{rupiah(idea.estimate)} · perkiraan berdua</small>
                </div>
                <ArrowUpRight size={20} />
              </div>
            </a>
          ))}
      </div>
    </section>
  );
}

export default function Recommendations() {
  const { snapshot, updateSpace, save, toast } = useSpace();
  const { space, tables } = snapshot!;
  const city = normalizeCity(space.recommendation_city ?? 'Bandung');
  const week = useCurrentWeek();
  const [cityDraft, setCityDraft] = useState(city);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [cityBusy, setCityBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [setting, setSetting] = useState('');
  const [ceiling, setCeiling] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [planIdea, setPlanIdea] = useState<WishlistData | null>(null);
  const [savingId, setSavingId] = useState('');
  useEffect(() => {
    if (!editingSpace) setCityDraft(city);
  }, [city, editingSpace]);
  useEffect(() => {
    setVisibleCount(12);
  }, [search, category, setting, ceiling, city]);
  const items = filterIdeas(ideasForCity(city), {
    search,
    category,
    setting,
    ceiling: ceiling === '' ? null : Number(ceiling),
  });
  const weekly = weeklyIdeas(city, week);

  function card(idea: DateIdea, index: number) {
    const data = ideaToWishlist(idea, city);
    const saved = tables.wishlist_items.some(
      (x) => x.data.title === data.title && x.data.place === data.place,
    );
    return (
      <article className={`recommendation-card wish-${index % 3}`} key={idea.id}>
        <div className="recommendation-top">
          <span className="recommendation-symbol" aria-hidden="true">
            {['✿', '♡', '☕'][index % 3]}
          </span>
          <span className="badge">{idea.city ? 'Pilihan Bandung' : idea.setting}</span>
        </div>
        <span className="tiny-label">{idea.category}</span>
        <h3>{idea.title}</h3>
        <p>{idea.description}</p>
        <div className="recommendation-meta">
          <span>
            <Clock size={14} /> ±{idea.duration} menit
          </span>
          <span>Est. {rupiah(idea.estimate)} / berdua</span>
        </div>
        <details>
          <summary>Persiapan kecil</summary>
          <p>{idea.preparation}</p>
          {idea.setting === 'Outdoor' && (
            <p>Kalau hujan, pilih ide di rumah atau indoor dari koleksi di bawah.</p>
          )}
        </details>
        <div className="recommendation-links">
          {idea.setting !== 'Di rumah' && (
            <External href={mapsUrl(data.place)}>
              <MapPin size={14} /> Lihat di Maps
            </External>
          )}
          {idea.source && (
            <External href={idea.source.url}>
              Referensi tempat <ArrowUpRight size={14} />
            </External>
          )}
        </div>
        <div className="recommendation-actions">
          <button className="btn small" onClick={() => setPlanIdea(data)}>
            <Heart size={15} /> Jadikan rencana
          </button>
          <button
            className="link-button"
            disabled={saved || !!savingId}
            onClick={async () => {
              setSavingId(idea.id);
              setError('');
              try {
                await save('wishlist_items', data);
                toast('Ide manis masuk ke wishlist kalian.');
              } catch (e) {
                setError(message(e));
              } finally {
                setSavingId('');
              }
            }}
          >
            <Bookmark size={14} />{' '}
            {saved ? 'Sudah di wishlist' : savingId === idea.id ? 'Menyimpan…' : 'Simpan wishlist'}
          </button>
        </div>
      </article>
    );
  }

  return (
    <>
      <Heading
        eyebrow="SIX LITTLE REASONS TO MAKE TIME"
        title="Untuk minggu yang lebih manis."
        description="Dari waktu luang menjadi cerita baru. Pilih yang paling terasa seperti kalian."
      />
      <div className="recommendation-hero">
        <div>
          <Sparkles size={28} />
          <h2>Petualangan dimulai dari sini.</h2>
          <p>
            Lokasi ini dipakai bersama di kedua HP. Ide baru hadir setiap Senin, mengikuti waktu
            Jakarta.
          </p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            const value = cityDraft.trim().replace(/\s+/g, ' ');
            if (!value || value.length > 80) {
              setError('Isi nama kota, maksimal 80 karakter.');
              return;
            }
            setCityBusy(true);
            try {
              await updateSpace(editingSpace ?? space, { recommendation_city: value });
              setEditingSpace(null);
              toast('Lokasi rekomendasi disimpan.');
            } catch (e) {
              setError(message(e));
            } finally {
              setCityBusy(false);
            }
          }}
        >
          <label>
            Kota rekomendasi
            <input
              required
              maxLength={80}
              value={cityDraft}
              disabled={cityBusy}
              placeholder="Bandung"
              onChange={(e) => {
                setEditingSpace((old) => old ?? space);
                setCityDraft(e.target.value);
              }}
            />
          </label>
          <div className="city-actions">
            <button className="btn" disabled={cityBusy}>
              {cityBusy ? 'Menyimpan…' : 'Simpan lokasi'}
            </button>
            {editingSpace && (
              <button
                type="button"
                className="link-button"
                disabled={cityBusy}
                onClick={() => {
                  setEditingSpace(null);
                  setError('');
                }}
              >
                Batal perubahan
              </button>
            )}
          </div>
        </form>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section className="recommendation-section" aria-labelledby="weekly-heading">
        <div className="section-head">
          <div>
            <p className="eyebrow">MULAI {prettyDate(week).toLocaleUpperCase('id')}</p>
            <h2 id="weekly-heading">Date minggu ini</h2>
            <p className="muted">Pilihan bersama untuk {city}</p>
          </div>
          <span className="handwriting">a little us time ♡</span>
        </div>
        <div className="recommendation-grid">{weekly.map(card)}</div>
        <p className="recommendation-disclaimer">
          Pilihan berganti dari koleksi ide kami, bukan daftar acara atau ketersediaan langsung.
          Anggaran adalah perkiraan total untuk berdua, bukan harga resmi; sesuaikan transportasi
          dan cek tempat sebelum berangkat.
        </p>
        {city.toLowerCase() !== 'bandung' && (
          <p className="info-note">
            Untuk {city}, kami siapkan ide umum dan pencarian tempat di Maps. Koleksi tempat khusus
            saat ini tersedia untuk Bandung.
          </p>
        )}
      </section>
      <section className="recommendation-section" aria-labelledby="library-heading">
        <div className="section-head">
          <div>
            <p className="eyebrow">A LITTLE LIBRARY OF US</p>
            <h2 id="library-heading">Pustaka ide date</h2>
            <p className="muted">
              {dateIdeas.length} ide untuk dicoba pelan-pelan, satu cerita setiap kali.
            </p>
          </div>
          <Search size={22} />
        </div>
        <div className="idea-filters">
          <label>
            Cari ide
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Museum, masak, surat kecil…"
            />
          </label>
          <label>
            Suasana date
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Semua suasana</option>
              {categories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Suasana tempat
            <select value={setting} onChange={(e) => setSetting(e.target.value)}>
              <option value="">Di mana saja</option>
              {['Indoor', 'Outdoor', 'Di rumah'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Batas anggaran berdua (Rp)
            <input
              type="number"
              min="0"
              step="1"
              max="1000000000000"
              value={ceiling}
              onChange={(e) => setCeiling(e.target.value)}
              placeholder="Bebas"
            />
          </label>
        </div>
        <p className="muted" aria-live="polite">
          {items.length} ide cocok di {city}
        </p>
        {items.length ? (
          <div className="recommendation-grid">{items.slice(0, visibleCount).map(card)}</div>
        ) : (
          <Empty title="Belum ada ide yang cocok.">
            Coba kata pencarian, suasana, atau budget yang berbeda.
          </Empty>
        )}
        {items.length > visibleCount && (
          <div className="more-ideas">
            <button className="btn secondary" onClick={() => setVisibleCount((x) => x + 12)}>
              Tampilkan lebih banyak
            </button>
          </div>
        )}
      </section>
      <details className="panel idea-knowledge">
        <summary>Resep kecil untuk date yang terasa dekat</summary>
        <p>
          Pilih aktivitas yang kalian sama-sama nyaman mencoba, sisakan waktu untuk mengobrol, dan
          siapkan pilihan indoor. Pengalaman baru bisa sesederhana mencoba resep atau mengenalkan
          hobi masing-masing.
        </p>
        <p>
          Ide aktivitas ditulis khusus untuk planner ini. Informasi tempat Bandung merujuk sumber
          resmi pada kartu, diperiksa 15 Oktober 2026. Ini koleksi awal yang beragam, bukan daftar
          seluruh ide yang mungkin.
        </p>
        <External href="https://greatergood.berkeley.edu/podcasts/item/how_to_reconnect_with_your_partner">
          Bacaan: pengalaman baru bersama · Greater Good, UC Berkeley <ArrowUpRight size={14} />
        </External>
      </details>
      {planIdea && (
        <PlanEditor
          initial={{
            title: planIdea.title,
            location: planIdea.place,
            budget: planIdea.estimate,
            note: planIdea.note,
            status: 'draft',
          }}
          onClose={() => setPlanIdea(null)}
          onSaved={(p) => {
            window.location.hash = `/plans/${p.id}`;
          }}
        />
      )}
    </>
  );
}
