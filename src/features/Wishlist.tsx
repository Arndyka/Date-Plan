import { useState } from 'react';
import { Plus, Heart, MapPin, Sparkles, Shuffle, ArrowUpRight } from 'lucide-react';
import { useSpace } from '../data/SpaceProvider';
import { categories, type Row, type WishlistData } from '../domain/types';
import { eligibleIdeas, rupiah, mapsUrl, parseRupiah } from '../domain/logic';
import {
  Heading,
  FormDialog,
  Confirm,
  EditButtons,
  Empty,
  External,
  Dialog,
} from '../components/UI';
import { PlanEditor } from './Planner';
const builtIn: WishlistData[] = [
  {
    title: 'Piknik kecil di taman',
    category: 'Outdoor',
    estimate: 100000,
    place: '',
    note: 'Bawa bekal, alas duduk, dan playlist favorit.',
  },
  {
    title: 'Masak resep baru bareng',
    category: 'Santai',
    estimate: 80000,
    place: 'Di rumah',
    note: 'Pilih resep yang belum pernah dicoba.',
  },
  {
    title: 'Jalan sore & es krim',
    category: 'Kuliner',
    estimate: 50000,
    place: '',
    note: 'Tidak terburu-buru, hanya kita.',
  },
  {
    title: 'Jelajah museum',
    category: 'Seni',
    estimate: 100000,
    place: '',
    note: 'Pilih satu karya favorit untuk diceritakan.',
  },
  {
    title: 'Jalan kaki tanpa tujuan',
    category: 'Petualangan',
    estimate: 0,
    place: '',
    note: 'Temukan sudut baru dekat rumah.',
  },
];
export default function Wishlist() {
  const { snapshot, save, remove, userId, act } = useSpace();
  const [edit, setEdit] = useState<Row<'wishlist_items'> | true | null>(null),
    [deleting, setDeleting] = useState<Row<'wishlist_items'> | null>(null),
    [roulette, setRoulette] = useState(false),
    [category, setCategory] = useState(''),
    [ceiling, setCeiling] = useState(''),
    [pick, setPick] = useState<WishlistData | null>(null),
    [noMatch, setNoMatch] = useState(false),
    [planIdea, setPlanIdea] = useState<WishlistData | null>(null);
  const { wishlist_items: items, wishlist_votes: votes } = snapshot!.tables;
  return (
    <>
      <Heading
        eyebrow="A BUCKET LIST FOR TWO"
        title="Suatu hari, sama kamu."
        description="Tempat baru, hal seru, dan ide yang ingin kita wujudkan."
        action={
          <button className="btn" onClick={() => setEdit(true)}>
            <Plus size={17} />
            Tambah wishlist
          </button>
        }
      />
      <div className="roulette-banner">
        <div className="roulette-icon">
          <Shuffle />
        </div>
        <div>
          <h2>“Terserah” bukan nama tempat.</h2>
          <p>Bingung mau ke mana? Biar semesta kecil kita yang pilih.</p>
        </div>
        <button
          className="btn secondary"
          onClick={() => {
            setRoulette(true);
            setPick(null);
            setNoMatch(false);
          }}
        >
          <Sparkles size={17} />
          Pilihkan ide date
        </button>
      </div>
      {items.length ? (
        <div className="wishlist-grid">
          {items.map((w, i) => {
            const own = votes.find((x) => x.item_id === w.id && x.author_id === userId),
              count = votes.filter((x) => x.item_id === w.id).length;
            return (
              <article className={`wishlist-card wish-${i % 3}`} key={w.id}>
                <div className="row-between">
                  <span className="wish-symbol">{['✿', '♡', '☕'][i % 3]}</span>
                  <EditButtons onEdit={() => setEdit(w)} onDelete={() => setDeleting(w)} />
                </div>
                <span className="tiny-label">{w.data.category}</span>
                <h2>{w.data.title}</h2>
                <p className="preserve-lines">{w.data.note}</p>
                {w.data.place && (
                  <External className="place-link" href={mapsUrl(w.data.place)}>
                    <MapPin size={13} />
                    {w.data.place}
                  </External>
                )}
                <div className="card-foot">
                  <span>
                    {rupiah(w.data.estimate)} <small>estimasi</small>
                  </span>
                  <button
                    className={`vote-button ${own ? 'voted' : ''}`}
                    aria-label={own ? 'Batalkan suka' : 'Suka ide ini'}
                    onClick={() =>
                      act(() =>
                        own
                          ? remove('wishlist_votes', own)
                          : save('wishlist_votes', {}, undefined, { item_id: w.id }),
                      )
                    }
                  >
                    <Heart size={16} fill={own ? 'currentColor' : 'none'} />
                    {count}
                  </button>
                </div>
                <button className="text-link link-button" onClick={() => setPlanIdea(w.data)}>
                  Jadikan rencana <ArrowUpRight size={15} />
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty title="Masih banyak hal untuk dicoba.">
          Mulai dengan tempat atau ide yang selalu ingin kalian datangi.
        </Empty>
      )}
      {edit && (
        <FormDialog
          title="Tambahkan ke someday list"
          fields={[
            { name: 'title', label: 'Nama tempat / ide', required: true, wide: true },
            {
              name: 'category',
              label: 'Kategori',
              options: categories.map((x) => ({ label: x, value: x })),
            },
            { name: 'estimate', label: 'Kisaran budget (Rp)', type: 'number', required: true },
            { name: 'place', label: 'Alamat / area', wide: true },
            { name: 'note', label: 'Catatan wishlist', type: 'textarea', wide: true },
          ]}
          initial={
            edit === true
              ? { title: '', category: 'Outdoor', estimate: 0, place: '', note: '' }
              : { ...edit.data }
          }
          submit="Simpan wishlist"
          onClose={() => setEdit(null)}
          onSubmit={async (v) => {
            parseRupiah(String(v.estimate));
            await save(
              'wishlist_items',
              v as unknown as WishlistData,
              edit === true ? undefined : edit,
            );
          }}
        />
      )}
      {deleting && (
        <Confirm
          title={deleting.data.title}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove('wishlist_items', deleting)}
        />
      )}
      {roulette && (
        <Dialog title="A little date roulette ✿" onClose={() => setRoulette(false)}>
          <p className="muted">
            Pilih dari wishlist kalian dan ide sederhana yang sudah kami siapkan. Estimasi bisa
            disesuaikan.
          </p>
          <div className="form-grid">
            <label>
              Suasana hati
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Apa saja</option>
                {categories.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Maksimal budget (Rp)
              <input
                type="number"
                min="0"
                step="1"
                value={ceiling}
                onChange={(e) => setCeiling(e.target.value)}
                placeholder="Bebas"
              />
            </label>
          </div>
          {pick && (
            <div className="roulette-result">
              <Sparkles />
              <h2>{pick.title}</h2>
              <p>{pick.note}</p>
              <strong>{rupiah(pick.estimate)}</strong>
            </div>
          )}
          {noMatch && (
            <p className="info-note">Belum ada ide yang cocok. Coba suasana atau budget lain.</p>
          )}
          <div className="form-actions">
            <button
              className="btn secondary"
              onClick={() => {
                const candidates = eligibleIdeas(
                  [...items.map((x) => x.data), ...builtIn],
                  category || null,
                  ceiling === '' ? null : Math.max(0, Number(ceiling)),
                );
                setNoMatch(!candidates.length);
                setPick(
                  candidates.length
                    ? candidates[Math.floor(Math.random() * candidates.length)]
                    : null,
                );
              }}
            >
              <Shuffle size={17} />
              Acak ide
            </button>
            {pick && (
              <button
                className="btn"
                onClick={() => {
                  setPlanIdea(pick);
                  setRoulette(false);
                }}
              >
                Yuk, rencanakan <Heart size={17} />
              </button>
            )}
          </div>
        </Dialog>
      )}
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
