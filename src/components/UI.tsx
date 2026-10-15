import { useEffect, useId, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { X, Flower2, Heart, ArrowRight, LoaderCircle, Trash2, Pencil } from 'lucide-react';
export function Flower({ className = '' }: { className?: string }) {
  return <Flower2 className={`flower ${className}`} aria-hidden="true" />;
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Flower />
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function External({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    previous = useRef<HTMLElement | null>(null),
    id = useId();
  useEffect(() => {
    previous.current ??= document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = old;
      previous.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-inner">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">A little detail, a little love</p>
            <h2 id={id}>{title}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Tutup dialog" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export interface FieldSpec {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
  max?: number;
  min?: number;
  wide?: boolean;
}
export function FormDialog({
  title,
  fields,
  initial,
  submit = 'Simpan',
  onSubmit,
  onClose,
  children,
}: {
  title: string;
  fields: FieldSpec[];
  initial: Record<string, unknown>;
  submit?: string;
  onSubmit: (values: Record<string, string | number>) => Promise<unknown>;
  onClose: () => void;
  children?: ReactNode;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const form = new FormData(e.currentTarget),
        out: Record<string, string | number> = {};
      for (const field of fields) {
        const raw = String(form.get(field.name) ?? '').trim();
        if (field.required && raw === '') throw new Error(`${field.label} wajib diisi.`);
        out[field.name] = field.type === 'number' ? Number(raw) : raw;
      }
      await onSubmit(out);
      onClose();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={title}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={save}>
        <div className="form-grid">
          {fields.map((f) => (
            <label key={f.name} className={f.wide ? 'span-2' : ''}>
              {f.label}
              {f.type === 'textarea' ? (
                <textarea
                  name={f.name}
                  rows={3}
                  maxLength={4000}
                  required={f.required}
                  defaultValue={String(initial[f.name] ?? '')}
                />
              ) : f.options ? (
                <select name={f.name} defaultValue={String(initial[f.name] ?? '')}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={f.name}
                  type={f.type ?? 'text'}
                  required={f.required}
                  min={f.type === 'number' ? (f.min ?? 0) : undefined}
                  max={f.max ?? (f.type === 'number' ? 1000000000000 : undefined)}
                  step={f.type === 'number' ? 1 : undefined}
                  maxLength={f.type === 'url' ? 2000 : 160}
                  defaultValue={String(initial[f.name] ?? '')}
                />
              )}{' '}
              {f.hint && <small className="muted">{f.hint}</small>}
            </label>
          ))}
        </div>
        {children}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="btn secondary" disabled={busy} onClick={onClose}>
            Batal
          </button>
          <button className="btn" disabled={busy}>
            {busy ? <LoaderCircle className="spin" /> : <Heart size={16} />}{' '}
            {busy ? 'Menyimpan…' : submit}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function Confirm({
  title,
  onConfirm,
  onClose,
}: {
  title: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Dialog
      title="Hapus dari cerita kita?"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p>“{title}” akan dihapus beserta detail terkait. Tindakan ini tidak dapat dibatalkan.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn secondary" disabled={busy} onClick={onClose}>
          Simpan dulu
        </button>
        <button
          className="btn danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(message(e));
              setBusy(false);
            }
          }}
        >
          <Trash2 size={16} /> Hapus
        </button>
      </div>
    </Dialog>
  );
}
export function EditButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="actions">
      <button className="icon-btn" aria-label="Edit" onClick={onEdit}>
        <Pencil size={16} />
      </button>
      <button className="icon-btn" aria-label="Hapus" onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}
export function message(e: unknown) {
  return e instanceof Error
    ? e.message
    : typeof e === 'object' && e !== null && 'message' in e
      ? String(e.message)
      : 'Ada kendala. Coba lagi sebentar, ya.';
}
export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${i * 4.7}%`,
            animationDelay: `${(i % 5) * 0.1}s`,
            background: ['#aa3f68', '#f2a5ba', '#a4b394', '#edc777'][i % 4],
          }}
        />
      ))}
    </div>
  );
}
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a className="text-link" href={to}>
      {children}
      <ArrowRight size={15} />
    </a>
  );
}
