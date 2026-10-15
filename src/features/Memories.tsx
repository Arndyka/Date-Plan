import { useState } from 'react';
import { Heart, Star, Plus } from 'lucide-react';
import { useSpace } from '../data/SpaceProvider';
import { type Row } from '../domain/types';
import { prettyDate } from '../domain/logic';
import { Heading, Empty, FormDialog, Confirm, EditButtons } from '../components/UI';
export default function Memories() {
  const { snapshot, userId, save, remove } = useSpace();
  const [planId, setPlanId] = useState(''),
    [edit, setEdit] = useState<Row<'memories'> | true | null>(null),
    [deleting, setDeleting] = useState<Row<'memories'> | null>(null);
  const completed = snapshot!.tables.plans.filter((p) => p.data.status === 'selesai');
  return (
    <>
      <Heading
        eyebrow="THE DATES BECOME THE STORIES"
        title="Potongan cerita kita."
        description="Bukan seberapa jauh kita pergi, tapi dengan siapa kita berbagi."
      />
      {completed.length ? (
        <div className="memories-list">
          {completed.map((p) => {
            const notes = snapshot!.tables.memories.filter((n) => n.plan_id === p.id),
              own = notes.find((n) => n.author_id === userId);
            return (
              <section className="panel memory-group" key={p.id}>
                <p className="eyebrow">{prettyDate(p.data.date)}</p>
                <h2>{p.data.title}</h2>
                <div className="memory-notes">
                  {notes.map((n) => (
                    <article className="memory-paper" key={n.id}>
                      <div className="row-between">
                        <span className="tiny-label">
                          DARI{' '}
                          {snapshot!.members.find((m) => m.user_id === n.author_id)?.nickname ??
                            'pasangan'}
                        </span>
                        {n.author_id === userId && (
                          <EditButtons
                            onEdit={() => {
                              setPlanId(p.id);
                              setEdit(n);
                            }}
                            onDelete={() => setDeleting(n)}
                          />
                        )}
                      </div>
                      <div className="stars" aria-label={`${n.data.rating} dari 5 bintang`}>
                        {Array.from({ length: n.data.rating }, (_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <p className="preserve-lines">{n.data.content}</p>
                      {n.data.favorite && (
                        <small>
                          <Heart size={12} />
                          Momen favorit: {n.data.favorite}
                        </small>
                      )}
                    </article>
                  ))}
                </div>
                {!own && (
                  <button
                    className="btn secondary small"
                    onClick={() => {
                      setPlanId(p.id);
                      setEdit(true);
                    }}
                  >
                    <Plus size={15} />
                    Tulis kenanganmu
                  </button>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <Empty
          title="Kenangan manis sedang menunggu."
          action={
            <a className="btn secondary" href="#/plans">
              Lihat rencana kita
            </a>
          }
        >
          Tandai date sebagai selesai, lalu simpan momen favorit kalian di sini.
        </Empty>
      )}
      {edit && (
        <FormDialog
          title="Biar momen ini tidak hilang"
          fields={[
            {
              name: 'content',
              label: 'Cerita hari itu',
              type: 'textarea',
              required: true,
              wide: true,
            },
            { name: 'favorite', label: 'Momen paling favorit', wide: true },
            {
              name: 'rating',
              label: 'Seberapa menyenangkan?',
              options: [1, 2, 3, 4, 5].map((n) => ({
                value: String(n),
                label: `${n} ${'★'.repeat(n)}`,
              })),
              wide: true,
            },
          ]}
          initial={edit === true ? { content: '', favorite: '', rating: 5 } : { ...edit.data }}
          submit="Simpan kenangan"
          onClose={() => setEdit(null)}
          onSubmit={async (v) => {
            await save(
              'memories',
              {
                content: String(v.content),
                favorite: String(v.favorite),
                rating: Number(v.rating),
              },
              edit === true ? undefined : edit,
              { plan_id: planId },
            );
          }}
        />
      )}
      {deleting && (
        <Confirm
          title="Catatan kenangan ini"
          onClose={() => setDeleting(null)}
          onConfirm={() => remove('memories', deleting)}
        />
      )}
    </>
  );
}
