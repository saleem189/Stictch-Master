import { useEffect, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TableHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const join = (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' ');

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; size?: 'sm' | 'md' | 'lg' };
export function AtelierButton({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-atelier-oxblood text-white hover:bg-atelier-oxblood-dark shadow-sm',
    secondary: 'border border-slate-200 bg-white text-slate-800 hover:border-atelier-brass hover:bg-atelier-paper',
    quiet: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
    danger: 'bg-red-700 text-white hover:bg-red-800',
  };
  const sizes = { sm: 'min-h-10 px-3 text-xs', md: 'min-h-11 px-5 text-sm', lg: 'min-h-14 px-7 text-sm' };
  return <button className={join('inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-atelier-brass', variants[variant], sizes[size], className)} {...props} />;
}

type FieldProps = { label: string; hint?: string; error?: string; className?: string };
export function AtelierInput({ label, hint, error, className, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return <div className={join('grid gap-2', className)}>
    <label htmlFor={fieldId} className="text-xs font-bold text-slate-700">{label}</label>
    <input id={fieldId} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-atelier-brass focus:outline-none focus:ring-2 focus:ring-atelier-brass/20" {...props} />
    {hint && !error && <p id={`${fieldId}-hint`} className="text-xs leading-5 text-slate-500">{hint}</p>}
    {error && <p id={`${fieldId}-error`} role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
  </div>;
}

export function AtelierSelect({ label, hint, error, className, id, children, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return <div className={join('grid gap-2', className)}>
    <label htmlFor={fieldId} className="text-xs font-bold text-slate-700">{label}</label>
    <select id={fieldId} aria-invalid={Boolean(error)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-atelier-brass focus:outline-none focus:ring-2 focus:ring-atelier-brass/20" {...props}>{children}</select>
    {hint && !error && <p className="text-xs leading-5 text-slate-500">{hint}</p>}
    {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
  </div>;
}

export function AtelierCard({ children, className, ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLElement>) {
  return <section className={join('rounded-2xl border border-slate-200 bg-white shadow-sm', className)} {...props}>{children}</section>;
}

const statusTones: Record<string, string> = {
  ready: 'border-atelier-sage/30 bg-atelier-sage/10 text-atelier-sage', delivered: 'border-atelier-sage/30 bg-atelier-sage/10 text-atelier-sage',
  'in-progress': 'border-atelier-brass/40 bg-atelier-brass/10 text-amber-900', reviewed: 'border-atelier-brass/40 bg-atelier-brass/10 text-amber-900',
  pending: 'border-slate-300 bg-slate-100 text-slate-600', submitted: 'border-atelier-oxblood/20 bg-atelier-oxblood/5 text-atelier-oxblood',
  rejected: 'border-red-200 bg-red-50 text-red-700', cancelled: 'border-red-200 bg-red-50 text-red-700',
};
export function StatusBadge({ status, children, className }: { status: string; children?: ReactNode; className?: string }) {
  return <span className={join('inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider', statusTones[status] || statusTones.pending, className)}>{children || status.replace('-', ' ')}</span>;
}

function useDialogFocus(open: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const getFocusable = (): HTMLElement[] => {
      const elements = containerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      return elements ? Array.from(elements) : [];
    };
    getFocusable()[0]?.focus();
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeys);
    return () => { document.removeEventListener('keydown', handleKeys); previousFocus?.focus(); };
  }, [open, onClose]);
  return containerRef;
}

export function AtelierModal({ open, title, onClose, children, className }: { open: boolean; title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const { t } = useTranslation();
  const dialogRef = useDialogFocus(open, onClose);
  return <AnimatePresence>
    {open && <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-atelier-ink/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={join('max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8', className)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .25, ease: [.22, 1, .36, 1] }}>
        <div className="mb-6 flex items-start justify-between gap-4"><h2 className="font-display text-2xl text-slate-900">{title}</h2><AtelierButton variant="quiet" size="sm" onClick={onClose} aria-label={t('Close dialog')}><X size={18} /></AtelierButton></div>
        {children}
      </motion.section>
    </motion.div>}
  </AnimatePresence>;
}

export function AtelierDrawer(props: Parameters<typeof AtelierModal>[0]) {
  const { open, title, onClose, children, className } = props;
  const { t } = useTranslation();
  const dialogRef = useDialogFocus(open, onClose);
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[70] bg-atelier-ink/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.aside ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={join('ms-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto border-s border-slate-200 bg-white p-6 shadow-2xl sm:p-9', className)} initial={{ x: '8%', opacity: 0 }} animate={{ x: 0, y: 0 }} exit={{ x: '8%', opacity: 0 }} transition={{ duration: .3, ease: [.22, 1, .36, 1] }}>
      <div className="mb-6 flex items-start justify-between gap-4"><h2 className="font-display text-2xl text-slate-900">{title}</h2><AtelierButton variant="quiet" size="sm" onClick={onClose} aria-label={t('Close panel')}><X size={18} /></AtelierButton></div>{children}
    </motion.aside>
  </motion.div>}</AnimatePresence>;
}

export function AtelierTable({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className={join('w-full border-collapse text-start text-sm', className)} {...props} /></div>;
}

export function AtelierTabs({ tabs, value, onChange }: { tabs: Array<{ id: string; label: string }>; value: string; onChange: (value: string) => void }) {
  return <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-slate-200">
    {tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={value === tab.id} onClick={() => onChange(tab.id)} className={join('min-h-11 whitespace-nowrap border-b-2 px-4 text-xs font-bold transition-colors focus-visible:outline-atelier-brass', value === tab.id ? 'border-atelier-oxblood text-atelier-oxblood' : 'border-transparent text-slate-500 hover:text-slate-900')}>{tab.label}</button>)}
  </div>;
}

export function AtelierStepper({ steps, current }: { steps: string[]; current: number }) {
  const { t } = useTranslation();
  return <ol aria-label={t('Progress')} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {steps.map((step, index) => <li key={step} aria-current={index === current ? 'step' : undefined} className="flex items-center gap-2 text-xs font-semibold">
      <span className={join('grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[10px]', index < current ? 'border-atelier-sage bg-atelier-sage text-white' : index === current ? 'border-atelier-oxblood bg-atelier-oxblood text-white' : 'border-slate-300 text-slate-500')}>{index < current ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span><span className={index === current ? 'text-slate-900' : 'text-slate-500'}>{step}</span>
    </li>)}
  </ol>;
}

export function AtelierToast({ title, detail, tone = 'success' }: { title: string; detail?: string; tone?: 'success' | 'error' | 'info' }) {
  const toneClass = tone === 'error' ? 'border-red-200 bg-red-50 text-red-900' : tone === 'info' ? 'border-slate-200 bg-white text-slate-900' : 'border-atelier-sage/30 bg-atelier-sage/10 text-slate-900';
  return <div role={tone === 'error' ? 'alert' : 'status'} className={join('rounded-xl border p-4 shadow-lg', toneClass)}><p className="text-sm font-bold">{title}</p>{detail && <p className="mt-1 text-xs leading-5 opacity-75">{detail}</p>}</div>;
}

export function AtelierTooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="group/tooltip relative inline-flex" aria-label={label}>{children}<span role="tooltip" className="pointer-events-none absolute bottom-full start-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-atelier-ink px-2.5 py-1.5 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">{label}</span></span>;
}

export function AtelierSkeleton({ className }: { key?: string | number; className?: string }) {
  return <div aria-hidden="true" className={join('animate-pulse rounded-xl bg-slate-200/70', className)} />;
}

export function AtelierEmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-atelier-paper p-8 text-center"><div><span className="mx-auto mb-4 block h-px w-12 bg-atelier-brass" /><h3 className="font-display text-2xl text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{detail}</p>{action && <div className="mt-5">{action}</div>}</div></div>;
}

export function AtelierNavbar({ children, className }: { children: ReactNode; className?: string }) {
  return <header className={join('sticky top-0 z-40 border-b border-slate-200/80 bg-atelier-paper/90 backdrop-blur-xl', className)}>{children}</header>;
}

export function AtelierSidebar({ children, className }: { children: ReactNode; className?: string }) {
  return <aside className={join('flex h-full flex-col border-e border-white/10 bg-atelier-ink text-atelier-ivory', className)}>{children}</aside>;
}

export function StitchDivider({ className }: { className?: string }) {
  return <div aria-hidden="true" className={join('stitch-divider my-8', className)} />;
}

export function SwatchCard({ name, color, selected = false, onClick }: { key?: string; name: string; color: string; selected?: boolean; onClick?: () => void }) {
  const content = <><span className="block aspect-[1.35/1] rounded-lg border border-black/5" style={{ background: color }} /><span className="mt-2 block text-xs font-bold text-slate-700">{name}</span></>;
  return onClick ? <button type="button" aria-pressed={selected} onClick={onClick} className={join('rounded-xl border p-2 text-start transition hover:-translate-y-0.5 hover:shadow-md', selected ? 'border-atelier-oxblood ring-2 ring-atelier-oxblood/15' : 'border-slate-200')}>{content}</button> : <div className="rounded-xl border border-slate-200 p-2">{content}</div>;
}
