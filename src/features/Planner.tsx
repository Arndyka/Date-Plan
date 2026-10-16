import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Plus,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  MapPin,
  Clock,
  Heart,
  CloudRain,
  Check,
  Trash2,
  Pencil,
  Download,
  ExternalLink,
  Wallet,
  CheckCircle2,
  Coffee,
} from 'lucide-react';
import { useSpace } from '../data/SpaceProvider';
import { type Row, type PlanData, type ActivityData, categories } from '../domain/types';
import {
  today,
  prettyDate,
  rupiah,
  parseRupiah,
  summarizeBudget,
  mapsUrl,
  safeMapsUrl,
  calendarIcs,
  googleCalendarUrl,
} from '../domain/logic';
import {
  Heading,
  Empty,
  FormDialog,
  Confirm,
  External,
  Confetti,
  type FieldSpec,
} from '../components/UI';
import PicnicArt from '../components/PicnicArt';
import {
  activityDates,
  endDate,
  dateRangeLabel,
  scheduleLabel,
  schedulesOverlap,
  validateActivityDates,
  validatePlanDates,
} from '../domain/schedule';
const opts = (values: string[]) => values.map((x) => ({ value: x, label: x }));
const deletedDraftMessage =
  'Rencana ini sudah dihapus. Salin isian yang ingin kamu simpan sebelum menutup formulir.';
export function PlanEditor({
  row,
  initial = {},
  onClose,
  onSaved,
}: {
  row?: Row<'plans'>;
  initial?: Partial<PlanData>;
  onClose: () => void;
  onSaved?: (p: Row<'plans'>) => void;
}) {
  const { save, snapshot } = useSpace();
  // Keep the edit-start version even when a background refresh replaces the live row.
  const [editingRow] = useState(row);
  const deleted = !!editingRow && !snapshot!.tables.plans.some((p) => p.id === editingRow.id);
  const defaults: PlanData = {
    title: '',
    date: today(),
    start: '15:00',
    end: '18:00',
    location: snapshot!.space.recommendation_city || 'Bandung',
    budget: 0,
    share: 50,
    status: 'terjadwal',
    note: '',
    rain: '',
    ...initial,
    ...editingRow?.data,
  };
  defaults.endDate = defaults.endDate === defaults.date ? '' : defaults.endDate || '';
  const fields: FieldSpec[] = [
    { name: 'title', label: 'Judul date', required: true, wide: true },
    { name: 'date', label: 'Tanggal mulai', type: 'date', required: true },
    {
      name: 'endDate',
      label: 'Tanggal selesai',
      type: 'date',
      minField: 'date',
      hint: 'Kosongkan jika selesai di hari yang sama.',
    },
    { name: 'location', label: 'Area / kota' },
    { name: 'start', label: 'Jam mulai (WIB)', type: 'time', required: true },
    { name: 'end', label: 'Jam selesai (WIB)', type: 'time', required: true },
    { name: 'budget', label: 'Batas budget (Rp)', type: 'number', required: true },
    {
      name: 'status',
      label: 'Status',
      options: opts(['draft', 'terjadwal', 'selesai', 'dibatalkan']),
      wide: true,
    },
    { name: 'note', label: 'Catatan kecil', type: 'textarea', wide: true },
    { name: 'rain', label: 'Kalau hujan, kita…', type: 'textarea', wide: true },
  ];
  return (
    <FormDialog
      title={row ? 'Rapikan rencana kita' : 'Satu date baru, satu cerita baru'}
      fields={fields}
      initial={defaults as unknown as Record<string, unknown>}
      submit="Simpan rencana"
      onClose={onClose}
      onSubmit={async (v) => {
        if (deleted) throw new Error(deletedDraftMessage);
        const data = { ...defaults, ...v } as PlanData;
        parseRupiah(String(data.budget));
        data.endDate = data.endDate || data.date;
        validatePlanDates(
          data,
          editingRow
            ? snapshot!.tables.activities
                .filter((a) => a.plan_id === editingRow.id)
                .map((a) => a.data)
            : [],
          editingRow?.data,
        );
        const saved = await save('plans', data, editingRow);
        onSaved?.(saved);
      }}
    >
      {deleted && <p className="info-note">{deletedDraftMessage}</p>}
    </FormDialog>
  );
}
export function PlanCard({ plan }: { plan: Row<'plans'> }) {
  const { snapshot } = useSpace();
  const count = snapshot!.tables.activities.filter((x) => x.plan_id === plan.id).length;
  return (
    <a className="plan-card" href={`#/plans/${plan.id}`}>
      <div className="plan-card-art">
        <PicnicArt />
        <span className={`badge ${plan.data.status === 'selesai' ? 'sage' : ''}`}>
          {plan.data.status === 'terjadwal' ? 'Coming soon' : plan.data.status}
        </span>
      </div>
      <div className="plan-card-body">
        <p className="eyebrow">
          {dateRangeLabel(plan.data)} · {plan.data.start} WIB
        </p>
        <h3>{plan.data.title}</h3>
        <p>
          <MapPin size={14} />
          {plan.data.location || 'Tempatnya kita tentukan nanti'}
        </p>
        <div className="card-foot">
          <span>{count} kegiatan</span>
          <span>
            {rupiah(plan.data.budget)} <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </a>
  );
}
export function PlanList() {
  const { snapshot } = useSpace();
  const [edit, setEdit] = useState(false),
    [filter, setFilter] = useState('Semua');
  const plans = [...snapshot!.tables.plans]
    .sort((a, b) => a.data.date.localeCompare(b.data.date))
    .filter((p) => filter === 'Semua' || p.data.status === filter);
  return (
    <>
      <Heading
        eyebrow="OUR NEXT LITTLE ADVENTURES"
        title="Rencana berdua."
        description="Hal-hal kecil yang ingin kita lakukan, bersama."
        action={
          <button className="btn" onClick={() => setEdit(true)}>
            <Plus size={17} />
            Buat date baru
          </button>
        }
      />
      <div className="tabs">
        {['Semua', 'terjadwal', 'draft', 'selesai', 'dibatalkan'].map((x) => (
          <button key={x} className={filter === x ? 'active' : ''} onClick={() => setFilter(x)}>
            {x}
          </button>
        ))}
      </div>
      {plans.length ? (
        <div className="plan-grid">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      ) : (
        <Empty
          title="Cerita berikutnya masih kosong."
          action={
            <button className="btn secondary" onClick={() => setEdit(true)}>
              Rencanakan date pertama
            </button>
          }
        >
          Tidak harus sempurna. Mulai dari satu ide kecil.
        </Empty>
      )}
      {edit && (
        <PlanEditor
          onClose={() => setEdit(false)}
          onSaved={(p) => {
            window.location.hash = `/plans/${p.id}`;
          }}
        />
      )}
    </>
  );
}
function ActivityEditor({
  plan,
  row,
  onClose,
}: {
  plan: Row<'plans'>;
  row?: Row<'activities'>;
  onClose: () => void;
}) {
  const { save, snapshot } = useSpace();
  const deleted = !snapshot!.tables.plans.some((p) => p.id === plan.id);
  const count = snapshot!.tables.activities.filter((x) => x.plan_id === plan.id).length;
  const initial: ActivityData = {
    title: '',
    date: plan.data.date,
    start: '09:00',
    end: '10:00',
    place: '',
    address: '',
    maps: '',
    category: 'Kuliner',
    estimate: 0,
    actual: 0,
    paidFirst: 0,
    position: count,
    done: false,
    note: '',
    ...row?.data,
  };
  initial.date ||= plan.data.date;
  initial.endDate = initial.endDate === initial.date ? '' : initial.endDate || '';
  const fields: FieldSpec[] = [
    { name: 'title', label: 'Nama kegiatan', required: true, wide: true },
    {
      name: 'date',
      label: 'Tanggal kegiatan',
      type: 'date',
      required: true,
      min: plan.data.date,
      max: endDate(plan.data),
    },
    {
      name: 'endDate',
      label: 'Tanggal selesai kegiatan',
      type: 'date',
      min: plan.data.date,
      minField: 'date',
      max: endDate(plan.data),
      hint: 'Isi jika kegiatan melewati tengah malam.',
    },
    { name: 'start', label: 'Mulai (WIB)', type: 'time', required: true },
    { name: 'end', label: 'Selesai (WIB)', type: 'time', required: true },
    { name: 'place', label: 'Nama tempat' },
    { name: 'address', label: 'Alamat / area' },
    { name: 'maps', label: 'Tautan Google Maps', type: 'url', wide: true },
    { name: 'category', label: 'Kategori', options: opts(categories) },
    { name: 'estimate', label: 'Estimasi (Rp)', type: 'number', required: true },
    { name: 'actual', label: 'Aktual (Rp)', type: 'number', required: true },
    { name: 'note', label: 'Catatan kegiatan', type: 'textarea', wide: true },
  ];
  return (
    <FormDialog
      title={row ? 'Edit momen kecil' : 'Tambah kegiatan'}
      fields={fields}
      initial={initial as unknown as Record<string, unknown>}
      submit="Simpan kegiatan"
      onClose={onClose}
      onSubmit={async (v) => {
        if (deleted) throw new Error(deletedDraftMessage);
        const data = { ...initial, ...v } as ActivityData;
        data.endDate = data.endDate || data.date;
        validateActivityDates(data, plan.data);
        // Legacy payload field remains for older server/client compatibility.
        data.paidFirst = 0;
        summarizeBudget([data], plan.data.budget);
        if (data.maps && !safeMapsUrl(data.maps))
          throw new Error('Gunakan tautan Google Maps HTTPS yang valid.');
        await save('activities', data, row, { plan_id: plan.id });
      }}
    >
      <p className="info-note">
        Pilih tanggal dalam rentang {dateRangeLabel(plan.data)}. Jam menggunakan WIB.
      </p>
      {deleted && <p className="info-note">{deletedDraftMessage}</p>}
    </FormDialog>
  );
}
export function PlanDetail({ id }: { id: string }) {
  const { snapshot, save, remove, act, toast } = useSpace();
  const livePlan = snapshot!.tables.plans.find((x) => x.id === id);
  const lastPlan = useRef(livePlan);
  const [edit, setEdit] = useState(false),
    [activity, setActivity] = useState<Row<'activities'> | true | null>(null),
    [deleting, setDeleting] = useState<{
      kind: 'plans' | 'activities' | 'checklist_items';
      row: Row;
    } | null>(null),
    [celebrate, setCelebrate] = useState(false),
    [checkText, setCheckText] = useState(''),
    [checkEdit, setCheckEdit] = useState<Row<'checklist_items'> | null>(null);
  useEffect(() => {
    if (livePlan) lastPlan.current = livePlan;
  }, [livePlan]);
  const plan = livePlan ?? (edit || activity || checkEdit ? lastPlan.current : undefined);
  useEffect(() => {
    if (celebrate) {
      const timer = setTimeout(() => setCelebrate(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [celebrate]);
  if (!plan)
    return (
      <Empty
        title="Rencana tidak ditemukan."
        action={
          <a className="btn" href="#/plans">
            Kembali ke rencana
          </a>
        }
      >
        Rencana mungkin telah dihapus oleh pasanganmu.
      </Empty>
    );
  const p = plan.data,
    activities = snapshot!.tables.activities
      .filter((x) => x.plan_id === id)
      .sort(
        (a, b) =>
          (a.data.date || p.date).localeCompare(b.data.date || p.date) ||
          a.data.position - b.data.position ||
          a.created_at.localeCompare(b.created_at),
      ),
    checks = snapshot!.tables.checklist_items.filter((x) => x.plan_id === id),
    money = summarizeBudget(
      activities.map((x) => x.data),
      p.budget,
    ),
    cal = { ...p, id };
  const overlap = activities.some((a, i) =>
    activities.some((b, j) => i < j && schedulesOverlap(a.data, b.data, p)),
  );
  function download() {
    const url = URL.createObjectURL(
      new Blob([calendarIcs(cal)], { type: 'text/calendar;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'our-little-date.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function reorder(i: number, direction: -1 | 1) {
    const row = activities[i];
    const dayItems = activities.filter(
      (a) => (a.data.date || p.date) === (row.data.date || p.date),
    );
    const index = dayItems.findIndex((a) => a.id === row.id);
    if (!dayItems[index + direction]) return;
    let position: number;
    if (direction < 0)
      position =
        index === 1
          ? dayItems[0].data.position - 1
          : (dayItems[index - 2].data.position + dayItems[index - 1].data.position) / 2;
    else
      position =
        index === dayItems.length - 2
          ? dayItems[index + 1].data.position + 1
          : (dayItems[index + 1].data.position + dayItems[index + 2].data.position) / 2;
    act(() => save('activities', { ...row.data, position }, row));
  }
  return (
    <>
      <div hidden={!livePlan}>
        <a className="back-link" href="#/plans">
          <ArrowLeft size={16} />
          Semua rencana
        </a>
        <Heading
          eyebrow="OUR LITTLE ITINERARY"
          title={p.title}
          description={scheduleLabel(p)}
          action={
            <div className="actions">
              <button className="btn secondary" onClick={() => setEdit(true)}>
                <Pencil size={15} />
                Edit rencana
              </button>
              <button
                className="icon-btn"
                aria-label="Hapus rencana"
                onClick={() => setDeleting({ kind: 'plans', row: plan })}
              >
                <Trash2 size={18} />
              </button>
            </div>
          }
        />
        <div className="detail-intro">
          <div>
            <span className={`badge ${p.status === 'selesai' ? 'sage' : ''}`}>{p.status}</span>
            <span className="muted">
              <MapPin size={14} />
              {p.location || 'Lokasi menyusul'}
            </span>
          </div>
          <p>{p.note || 'Sedikit rencana untuk waktu yang berarti.'}</p>
          <div className="actions wrap">
            <External className="btn small secondary" href={googleCalendarUrl(cal)}>
              <CalendarDays size={15} />
              Save to Google Calendar
            </External>
            <button className="btn small secondary" onClick={download}>
              <Download size={15} />
              Unduh kalender
            </button>
          </div>
          <small className="muted">
            Salinan kalender eksternal perlu disimpan ulang jika jadwal berubah.
          </small>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span>
              <Wallet size={16} />
              Batas budget
            </span>
            <strong>{rupiah(p.budget)}</strong>
            <small>untuk semua momen</small>
          </div>
          <div className="stat-card">
            <span>Estimasi kegiatan</span>
            <strong>{rupiah(money.estimated)}</strong>
            <small>
              {money.estimated > p.budget ? 'Estimasi melebihi budget' : 'rencana pengeluaran kita'}
            </small>
          </div>
          <div className="stat-card">
            <span>Sudah terpakai</span>
            <strong data-testid="actual-total">{rupiah(money.actual)}</strong>
            <small className={money.remaining < 0 ? 'over-budget' : ''}>
              {money.remaining < 0 ? 'Lebih budget' : 'Sisa'} {rupiah(Math.abs(money.remaining))}
            </small>
          </div>
        </div>
        <div className="detail-grid">
          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ONE MOMENT AT A TIME</p>
                <h2>Rundown kita</h2>
              </div>
              <button className="btn small" onClick={() => setActivity(true)}>
                <Plus size={15} />
                Tambah kegiatan
              </button>
            </div>
            {overlap && (
              <p className="info-note">
                Ada jam kegiatan yang tumpang tindih. Cek lagi supaya tidak terburu-buru, ya.
              </p>
            )}
            {activities.length ? (
              <div className="timeline">
                {activities.map((a, i) => (
                  <Fragment key={a.id}>
                    {(i === 0 ||
                      (activities[i - 1].data.date || p.date) !== (a.data.date || p.date)) && (
                      <h3 className="rundown-day">
                        <CalendarDays size={17} />
                        {prettyDate(a.data.date || p.date)}
                      </h3>
                    )}
                    <article className={`timeline-item ${a.data.done ? 'done' : ''}`} key={a.id}>
                      <div className="timeline-time">
                        {a.data.start}
                        <small>{a.data.end}</small>
                        {endDate(activityDates(a.data, p)) !== (a.data.date || p.date) && (
                          <small>
                            sampai {prettyDate(endDate(activityDates(a.data, p)), true)}
                          </small>
                        )}
                      </div>
                      <div className="timeline-mark">
                        <Coffee size={17} />
                      </div>
                      <div className="timeline-body">
                        <div className="row-between">
                          <span className="tiny-label">{a.data.category}</span>
                          <div className="actions">
                            <button
                              className="icon-btn"
                              disabled={
                                i === 0 ||
                                (activities[i - 1].data.date || p.date) !== (a.data.date || p.date)
                              }
                              aria-label={`Naikkan ${a.data.title}`}
                              onClick={() => reorder(i, -1)}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              className="icon-btn"
                              disabled={
                                i === activities.length - 1 ||
                                (activities[i + 1].data.date || p.date) !== (a.data.date || p.date)
                              }
                              aria-label={`Turunkan ${a.data.title}`}
                              onClick={() => reorder(i, 1)}
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button
                              className="icon-btn"
                              aria-label={`Edit ${a.data.title}`}
                              onClick={() => setActivity(a)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="icon-btn"
                              aria-label={`Hapus ${a.data.title}`}
                              onClick={() => setDeleting({ kind: 'activities', row: a })}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h3>{a.data.title}</h3>
                        {(a.data.place || a.data.address) && (
                          <External
                            className="place-link"
                            href={
                              safeMapsUrl(a.data.maps) ??
                              mapsUrl(`${a.data.place} ${a.data.address}`)
                            }
                          >
                            <MapPin size={13} />
                            {a.data.place || a.data.address}
                            <ExternalLink size={12} />
                          </External>
                        )}
                        <p>{a.data.note}</p>
                        <div className="row-between">
                          <span className="cost">
                            {rupiah(a.data.estimate)} <small>estimasi</small>
                          </span>
                          <button
                            className={`check-pill ${a.data.done ? 'checked' : ''}`}
                            onClick={() =>
                              act(() => save('activities', { ...a.data, done: !a.data.done }, a))
                            }
                          >
                            <Check size={13} />
                            {a.data.done ? 'Selesai' : 'Tandai selesai'}
                          </button>
                        </div>
                        {(a.data.place || a.data.address) && (
                          <External
                            className="tiny-link"
                            href={mapsUrl(`${a.data.place} ${a.data.address}`, true)}
                          >
                            Buka rute →
                          </External>
                        )}
                      </div>
                    </article>
                  </Fragment>
                ))}
              </div>
            ) : (
              <Empty title="Mulai dengan satu kegiatan.">
                Ngopi, jalan sore, atau sesuatu yang baru?
              </Empty>
            )}
          </section>
          <aside className="detail-aside">
            <section className="panel">
              <div className="section-head">
                <h2>Bawa apa, ya?</h2>
                <CheckCircle2 size={19} />
              </div>
              <p className="muted small-copy">
                {checks.filter((x) => x.data.done).length} dari {checks.length} sudah siap
              </p>
              <div className="checklist">
                {checks.map((c) => (
                  <div key={c.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={c.data.done}
                        onChange={() =>
                          act(() => save('checklist_items', { ...c.data, done: !c.data.done }, c))
                        }
                      />
                      <span className={c.data.done ? 'strike' : ''}>
                        {c.data.title}
                        {c.data.assignee && (
                          <small className="assignee-name">
                            {snapshot!.members.find((m) => m.user_id === c.data.assignee)?.nickname}
                          </small>
                        )}
                      </span>
                    </label>
                    <button
                      className="icon-btn"
                      aria-label={`Edit ${c.data.title}`}
                      onClick={() => setCheckEdit(c)}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`Hapus ${c.data.title}`}
                      onClick={() => setDeleting({ kind: 'checklist_items', row: c })}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (checkText.trim())
                    act(async () => {
                      await save(
                        'checklist_items',
                        { title: checkText.trim(), done: false, assignee: '' },
                        undefined,
                        { plan_id: id },
                      );
                      setCheckText('');
                    });
                }}
              >
                <input
                  aria-label="Barang atau tugas baru"
                  placeholder="Tambah barang kecil…"
                  value={checkText}
                  maxLength={160}
                  onChange={(e) => setCheckText(e.target.value)}
                  required
                />
                <button className="icon-btn filled" aria-label="Tambah checklist">
                  <Plus size={18} />
                </button>
              </form>
            </section>
            <section className="panel rain-panel">
              <CloudRain size={23} />
              <h3>Kalau langit berubah pikiran…</h3>
              <p>{p.rain || 'Siapkan rencana indoor lewat Edit rencana.'}</p>
            </section>
          </aside>
        </div>
      </div>
      {edit && (
        <PlanEditor
          row={plan}
          onClose={() => setEdit(false)}
          onSaved={(r) => {
            if (r.data.status === 'selesai' && p.status !== 'selesai') {
              setCelebrate(true);
              toast('Date selesai, kenangan bertambah!');
            }
          }}
        />
      )}
      {activity && (
        <ActivityEditor
          plan={plan}
          row={activity === true ? undefined : activity}
          onClose={() => setActivity(null)}
        />
      )}
      {deleting && (
        <Confirm
          title={'title' in deleting.row.data ? deleting.row.data.title : 'Item'}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await remove(deleting.kind, deleting.row as never);
            if (deleting.kind === 'plans') window.location.hash = '/plans';
          }}
        />
      )}
      {checkEdit && (
        <FormDialog
          title="Rapikan checklist"
          fields={[
            { name: 'title', label: 'Barang / tugas', required: true, wide: true },
            {
              name: 'assignee',
              label: 'Penanggung jawab',
              options: [
                { value: '', label: 'Berdua' },
                ...snapshot!.members.map((m) => ({ value: m.user_id, label: m.nickname })),
              ],
              wide: true,
            },
          ]}
          initial={{ ...checkEdit.data }}
          submit="Simpan checklist"
          onClose={() => setCheckEdit(null)}
          onSubmit={async (v) => {
            if (!livePlan) throw new Error(deletedDraftMessage);
            await save(
              'checklist_items',
              { ...checkEdit.data, title: String(v.title), assignee: String(v.assignee) },
              checkEdit,
            );
          }}
        >
          {!livePlan && <p className="info-note">{deletedDraftMessage}</p>}
        </FormDialog>
      )}
      {celebrate && <Confetti />}
    </>
  );
}
