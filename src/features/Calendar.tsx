import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Heart, StickyNote } from 'lucide-react';
import { useSpace } from '../data/SpaceProvider';
import { today, prettyDate, jakartaInstant } from '../domain/logic';
import { type Row } from '../domain/types';
import { Heading, FormDialog, Confirm, EditButtons, Empty } from '../components/UI';
export default function Calendar() {
  const { snapshot, save, remove } = useSpace();
  const [selected, setSelected] = useState(today()),
    [month, setMonth] = useState(today().slice(0, 7)),
    [edit, setEdit] = useState<Row<'calendar_notes'> | true | null>(null),
    [deleting, setDeleting] = useState<Row<'calendar_notes'> | null>(null);
  const [year, mon] = month.split('-').map(Number),
    startDay = (new Date(Date.UTC(year, mon - 1, 1)).getUTCDay() + 6) % 7,
    days = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const plans = snapshot!.tables.plans.filter((p) => p.data.status !== 'dibatalkan'),
    notes = snapshot!.tables.calendar_notes;
  const selectedPlans = plans.filter((x) => x.data.date === selected),
    selectedNotes = notes.filter((x) => x.data.date === selected);
  function shift(offset: number) {
    const d = new Date(Date.UTC(year, mon - 1 + offset, 1));
    const m = d.toISOString().slice(0, 7);
    setMonth(m);
    setSelected(`${m}-01`);
  }
  return (
    <>
      <Heading
        eyebrow="SAVE A LITTLE TIME FOR US"
        title="Kalender kita."
        description="Hari biasa, hari spesial, dan semua rencana di antaranya."
        action={
          <button className="btn" onClick={() => setEdit(true)}>
            <Plus size={17} />
            Tambah catatan
          </button>
        }
      />
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-heading">
            <h2>
              {new Intl.DateTimeFormat('id-ID', {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              }).format(new Date(Date.UTC(year, mon - 1, 1)))}
            </h2>
            <div className="actions">
              <button
                className="btn small secondary"
                onClick={() => {
                  setSelected(today());
                  setMonth(today().slice(0, 7));
                }}
              >
                Hari ini
              </button>
              <button className="icon-btn" aria-label="Bulan sebelumnya" onClick={() => shift(-1)}>
                <ChevronLeft />
              </button>
              <button className="icon-btn" aria-label="Bulan berikutnya" onClick={() => shift(1)}>
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className="calendar-weekdays">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: startDay }, (_, i) => (
              <div className="blank-day" key={`b${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, '0')}`,
                dayPlans = plans.filter((p) => p.data.date === date),
                dayNotes = notes.filter((n) => n.data.date === date);
              return (
                <button
                  key={date}
                  className={`calendar-day ${selected === date ? 'selected' : ''} ${date === today() ? 'today' : ''}`}
                  onClick={() => setSelected(date)}
                  aria-label={`${prettyDate(date)}, ${dayPlans.length} date, ${dayNotes.length} catatan`}
                  aria-pressed={selected === date}
                >
                  <span className="day-number">{i + 1}</span>
                  <div className="day-events">
                    {dayPlans.slice(0, 2).map((p) => (
                      <span className="calendar-event" key={p.id}>
                        <Heart size={10} />
                        <span>{p.data.title}</span>
                      </span>
                    ))}
                    {dayNotes.slice(0, 1).map((n) => (
                      <span className="calendar-event note-event" key={n.id}>
                        <StickyNote size={10} />
                        <span>{n.data.title}</span>
                      </span>
                    ))}
                    {dayPlans.length + dayNotes.length > 3 && <small>+ lainnya</small>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span>
              <i />
              Rencana date
            </span>
            <span>
              <i />
              Catatan kecil
            </span>
            <small>Semua jadwal dalam WIB</small>
          </div>
        </section>
        <aside className="panel day-detail">
          <p className="eyebrow">A DAY IN OUR STORY</p>
          <h2>{prettyDate(selected)}</h2>
          {!selectedPlans.length && !selectedNotes.length && (
            <Empty title="Masih bisa diisi kenangan.">
              Tambahkan catatan atau rencanakan date di hari ini.
            </Empty>
          )}
          {selectedPlans.map((p) => (
            <a className="day-item" href={`#/plans/${p.id}`} key={p.id}>
              <Heart size={17} />
              <div>
                <h3>{p.data.title}</h3>
                <p>
                  {p.data.start}–{p.data.end} WIB
                </p>
              </div>
            </a>
          ))}
          {selectedNotes.map((n) => (
            <article className="note-item" key={n.id}>
              <div className="row-between">
                <StickyNote size={17} />
                <EditButtons onEdit={() => setEdit(n)} onDelete={() => setDeleting(n)} />
              </div>
              <h3>{n.data.title}</h3>
              <p className="preserve-lines">{n.data.note}</p>
            </article>
          ))}
          <button className="btn secondary full" onClick={() => setEdit(true)}>
            <Plus size={16} />
            Catatan untuk hari ini
          </button>
        </aside>
      </div>
      {edit && (
        <FormDialog
          title={edit === true ? 'Catatan untuk kita' : 'Edit catatan'}
          fields={[
            { name: 'title', label: 'Judul catatan', required: true, wide: true },
            { name: 'date', label: 'Tanggal', type: 'date', required: true, wide: true },
            { name: 'note', label: 'Isi catatan', type: 'textarea', wide: true },
          ]}
          initial={edit === true ? { title: '', date: selected, note: '' } : { ...edit.data }}
          submit="Simpan catatan"
          onClose={() => setEdit(null)}
          onSubmit={async (v) => {
            jakartaInstant(String(v.date), '12:00');
            await save('calendar_notes', v as never, edit === true ? undefined : edit);
            setSelected(String(v.date));
            setMonth(String(v.date).slice(0, 7));
          }}
        />
      )}
      {deleting && (
        <Confirm
          title={deleting.data.title}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove('calendar_notes', deleting)}
        />
      )}
    </>
  );
}
