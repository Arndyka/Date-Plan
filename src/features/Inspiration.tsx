import { useState } from 'react';
import { Plus, Play, Music2, Bookmark, ExternalLink } from 'lucide-react';
import { useSpace } from '../data/SpaceProvider';
import { categories, type Row } from '../domain/types';
import { safeTikTokUrl } from '../domain/logic';
import { Heading, FormDialog, Confirm, EditButtons, Empty, External } from '../components/UI';
function TikTokCard({
  row,
  onEdit,
  onDelete,
}: {
  row: Row<'inspirations'>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { snapshot } = useSpace();
  const linked = snapshot!.tables.plans.find((p) => p.id === row.plan_id);
  const [loaded, setLoaded] = useState(false);
  const url = safeTikTokUrl(row.data.url),
    id = url?.pathname.match(/\/video\/(\d+)/)?.[1];
  return (
    <article className="inspiration-card">
      <div className="video-preview">
        {loaded && id ? (
          <iframe
            title={`TikTok: ${row.data.title}`}
            src={`https://www.tiktok.com/player/v1/${id}?autoplay=0`}
            allow="fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <>
            <Music2 className="video-music" />
            <span className="tiny-label">A LITTLE INSPIRATION</span>
            <h3>{row.data.title}</h3>
            {id && (
              <button
                className="play-button"
                onClick={() => setLoaded(true)}
                aria-label={`Putar ${row.data.title}`}
              >
                <Play fill="currentColor" size={22} />
              </button>
            )}
            <span className="video-caption">saved for our next adventure ♡</span>
          </>
        )}
      </div>
      <div className="inspiration-info">
        <div className="row-between">
          <span className="badge sage">{row.data.category}</span>
          <EditButtons onEdit={onEdit} onDelete={onDelete} />
        </div>
        <h3>{row.data.title}</h3>
        {linked && (
          <a className="linked-plan" href={`#/plans/${linked.id}`}>
            {linked.data.title}
          </a>
        )}
        <p className="preserve-lines">{row.data.note || 'Satu ide untuk date berikutnya.'}</p>
        {url && (
          <External className="text-link" href={url.href}>
            Buka di TikTok <ExternalLink size={14} />
          </External>
        )}
        <small className="muted">
          {id
            ? 'Jika pemutar tidak tersedia, buka langsung di TikTok.'
            : 'Tautan pendek atau video privat dibuka langsung di TikTok.'}
        </small>
      </div>
    </article>
  );
}
export default function Inspiration() {
  const { snapshot, save, remove } = useSpace();
  const [editing, setEditing] = useState<Row<'inspirations'> | true | null>(null),
    [deleting, setDeleting] = useState<Row<'inspirations'> | null>(null),
    [filter, setFilter] = useState('Semua'),
    [search, setSearch] = useState('');
  const items = snapshot!.tables.inspirations.filter(
    (x) =>
      (filter === 'Semua' || x.data.category === filter) &&
      `${x.data.title} ${x.data.note}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="SAW THIS & THOUGHT OF US"
        title="Simpan dulu, date kemudian."
        description="Semua TikTok yang bikin kita bilang, “kita harus ke sini!”"
        action={
          <button className="btn" onClick={() => setEditing(true)}>
            <Plus size={17} />
            Simpan inspirasi
          </button>
        }
      />
      <div className="toolbar">
        <div className="tabs">
          {['Semua', ...categories].map((c) => (
            <button key={c} className={filter === c ? 'active' : ''} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
        <input
          className="search-input"
          aria-label="Cari inspirasi"
          placeholder="Cari ide manis…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {items.length ? (
        <div className="inspiration-grid">
          {items.map((x) => (
            <TikTokCard
              key={x.id}
              row={x}
              onEdit={() => setEditing(x)}
              onDelete={() => setDeleting(x)}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="Tempat untuk semua “nanti kita ke sini”."
          action={
            <button className="btn secondary" onClick={() => setEditing(true)}>
              <Bookmark size={16} />
              Simpan TikTok pertama
            </button>
          }
        >
          Salin tautan TikTok favoritmu, lalu tambahkan catatan kecil. Video tetap milik kreatornya.
        </Empty>
      )}
      {editing && (
        <FormDialog
          title="Satu inspirasi untuk kita"
          fields={[
            { name: 'title', label: 'Judul inspirasi', required: true, wide: true },
            { name: 'url', label: 'Tautan TikTok', type: 'url', required: true, wide: true },
            {
              name: 'category',
              label: 'Kategori',
              options: categories.map((x) => ({ label: x, value: x })),
              wide: true,
            },
            {
              name: 'planLink',
              label: 'Untuk rencana',
              options: [
                { value: '', label: 'Simpan untuk nanti' },
                ...snapshot!.tables.plans.map((p) => ({ value: p.id, label: p.data.title })),
              ],
              wide: true,
            },
            { name: 'note', label: 'Kenapa ingin ke sini?', type: 'textarea', wide: true },
          ]}
          initial={
            editing === true
              ? { title: '', url: '', category: 'Kuliner', note: '', planLink: '' }
              : { ...editing.data, planLink: editing.plan_id ?? '' }
          }
          submit="Simpan referensi"
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            const url = safeTikTokUrl(String(v.url));
            if (!url) throw new Error('Gunakan tautan TikTok HTTPS yang valid.');
            await save(
              'inspirations',
              {
                title: String(v.title),
                url: url.href,
                category: String(v.category),
                note: String(v.note),
              },
              editing === true ? undefined : editing,
              { plan_id: String(v.planLink) || null },
            );
          }}
        />
      )}
      {deleting && (
        <Confirm
          title={deleting.data.title}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove('inspirations', deleting)}
        />
      )}
    </>
  );
}
