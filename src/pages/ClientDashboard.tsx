import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Ruler, ShoppingBag, ArrowUpRight, Scissors } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { db } from '../lib/firebase';
import { Order, QuoteRequest } from '../types';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';
import LanguageToggle from '../components/LanguageToggle';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { ModuleCard, PageShell } from '../components/layout/AppLayout';
import { AtelierButton, AtelierEmptyState, AtelierSkeleton, StatusBadge, StitchDivider } from '../components/atelier/AtelierUI';

const progressStages = ['pending', 'in-progress', 'finishing', 'ready'];

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { user, profile } = useUser();
  const ordersQuery = useMemo(() => user ? query(collection(db, 'orders'), where('clientId', '==', user.uid)) : null, [user]);
  const quoteRequestsQuery = useMemo(() => user ? query(collection(db, 'quoteRequests'), where('clientId', '==', user.uid)) : null, [user]);
  const mapOrder = useCallback((id: string, data: Record<string, unknown>) => ({ id, ...data } as Order), []);
  const mapQuoteRequest = useCallback((id: string, data: Record<string, unknown>) => ({ id, ...data } as QuoteRequest), []);
  const ordersState = useFirestoreQuery<Order>(ordersQuery, mapOrder);
  const quoteRequestsState = useFirestoreQuery<QuoteRequest>(quoteRequestsQuery, mapQuoteRequest);
  const orders = useMemo(() => [...ordersState.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [ordersState.data]);
  const quoteRequests = useMemo(() => [...quoteRequestsState.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [quoteRequestsState.data]);
  const loading = ordersState.loading || quoteRequestsState.loading;
  const dataError = ordersState.error || quoteRequestsState.error;
  const fromCache = ordersState.fromCache || quoteRequestsState.fromCache;
  const hasPendingWrites = ordersState.hasPendingWrites || quoteRequestsState.hasPendingWrites;
  const activeOrder = orders.find(order => !['delivered', 'cancelled'].includes(order.status));
  const progressIndex = activeOrder ? Math.max(0, progressStages.indexOf(activeOrder.status)) : -1;

  return <main className="min-h-[100dvh] bg-atelier-ivory text-slate-900">
    <PageShell maxWidthClassName="max-w-6xl" className="py-6 sm:py-9">
      <section className="space-y-7 sm:space-y-9">
        <header className="flex items-center justify-between gap-4 border-b border-atelier-brass/25 pb-5">
          <Link to="/" aria-label={t('Home')}><BrandLogo markClassName="h-10 w-10 rounded-xl" textClassName="font-display text-xl" /></Link>
          <div className="flex items-center gap-2"><LanguageToggle /><Link to="/client/request-quote" className="hidden sm:block"><AtelierButton>{t('Request Bespoke Quote')} <ArrowUpRight size={15} /></AtelierButton></Link></div>
        </header>

        <div className="grid gap-5 lg:grid-cols-12">
          <ModuleCard className="fabric-weave p-6 sm:p-9 lg:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="atelier-eyebrow">{t('Client Portal')}</p><h1 className="font-display mt-2 text-4xl leading-tight sm:text-5xl">{t('Welcome, {{name}}', { name: profile?.name || user?.displayName || t('Client') })}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{t('Your atelier, at a glance. Follow your pieces, keep your requests close, and plan what comes next.')}</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-atelier-brass/40 text-atelier-oxblood"><Scissors size={20} /></span></div>
            <div className="mt-6 flex flex-wrap gap-2" aria-live="polite">
              {fromCache && <span role="status" className="rounded-full border border-atelier-brass/35 bg-atelier-brass/10 px-3 py-1.5 text-[10px] font-bold text-amber-900">{t('Offline cache')}</span>}
              {hasPendingWrites && <span role="status" className="rounded-full border border-atelier-sage/30 bg-atelier-sage/10 px-3 py-1.5 text-[10px] font-bold text-atelier-sage">{t('Syncing changes')}</span>}
              {!fromCache && !hasPendingWrites && !loading && <span role="status" className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold text-slate-500">{t('Your account is up to date')}</span>}
            </div>
          </ModuleCard>
          <ModuleCard className="flex flex-col justify-between bg-atelier-ink p-6 text-white sm:p-8 lg:col-span-4">
            <div><p className="atelier-eyebrow">{t('Your next piece')}</p><h2 className="font-display mt-3 text-3xl leading-tight">{t('Start with an idea.')}</h2><p className="mt-3 text-sm leading-6 text-white/65">{t('Tell the atelier what you have in mind. We will take it from the first sketch to the final fitting.')}</p></div>
            <Link to="/client/request-quote" className="mt-6 inline-flex min-h-11 items-center justify-between gap-3 rounded-xl bg-atelier-oxblood px-4 text-sm font-bold text-white transition hover:bg-atelier-oxblood-dark">{t('Request Bespoke Quote')} <ArrowUpRight size={16} /></Link>
          </ModuleCard>
        </div>

        {dataError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{t('Your atelier information could not load. Please try again shortly.')}</div>}
        {loading ? <div className="grid gap-4 md:grid-cols-2"><AtelierSkeleton className="h-56" /><AtelierSkeleton className="h-56" /></div> : (
          <div className="grid gap-5 lg:grid-cols-12">
            <ModuleCard className="p-5 sm:p-7 lg:col-span-7">
              <div className="flex items-center justify-between gap-4"><div><p className="atelier-eyebrow">{t('Your pieces')}</p><h2 className="font-display mt-1 text-3xl">{t('In the workshop')}</h2></div><ShoppingBag className="text-atelier-brass" size={22} aria-hidden="true" /></div>
              <StitchDivider className="my-5" />
              {orders.length === 0 ? <AtelierEmptyState title={t('No orders yet')} detail={t('Your finished quote requests and workshop orders will be gathered here.')} action={<Link to="/client/request-quote" className="text-xs font-extrabold uppercase tracking-wider text-atelier-oxblood">{t('Begin a quote')}</Link>} /> : <div className="space-y-3">
                {activeOrder && <div className="rounded-xl bg-atelier-ink p-5 text-white sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-atelier-brass">{t('Currently being made')}</p><h3 className="font-display mt-1 text-2xl">{t('{{count}} piece order', { count: activeOrder.items.length })}</h3><p className="mt-1 font-mono text-[10px] text-white/55">#{activeOrder.id.slice(0, 8)}</p></div><StatusBadge status={activeOrder.status}>{t(activeOrder.status)}</StatusBadge></div><ol aria-label={t('Production progress')} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{progressStages.map((stage, index) => <li key={stage} className="flex items-center gap-2 text-[10px] font-bold text-white/70"><span className={`h-2.5 w-2.5 rounded-full ${index <= progressIndex ? 'bg-atelier-brass' : 'bg-white/20'}`} />{t(stage)}</li>)}</ol><div className="mt-5 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-xs text-white/65"><span>{t('Due')}: <strong className="tabular-nums text-white">{activeOrder.dueDate || t('To be confirmed')}</strong></span><span>{t('Balance')}: <strong className="tabular-nums text-white">Rs. {(activeOrder.totalAmount - activeOrder.paidAmount).toLocaleString()}</strong></span></div></div>}
                <div className="grid gap-3 sm:grid-cols-2">{orders.filter(order => order.id !== activeOrder?.id).map(order => <article key={order.id} className="rounded-xl border border-slate-200 bg-atelier-paper p-4"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-slate-500">#{order.id.slice(0, 8)}</span><StatusBadge status={order.status}>{t(order.status)}</StatusBadge></div><p className="mt-3 text-sm font-bold">{t('{{count}} piece order', { count: order.items.length })}</p><p className="mt-1 text-xs text-slate-500">{t('Due')}: {order.dueDate || t('To be confirmed')}</p></article>)}</div>
              </div>}
            </ModuleCard>

            <div className="space-y-5 lg:col-span-5">
              <ModuleCard className="p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="atelier-eyebrow">{t('Quote Requests')}</p><h2 className="font-display mt-1 text-2xl">{t('At the cutting table')}</h2></div><FileText className="text-atelier-brass" size={21} aria-hidden="true" /></div><StitchDivider className="my-4" />
                {quoteRequests.length === 0 ? <p className="text-sm leading-6 text-slate-500">{t('No quote requests yet')}</p> : <div className="space-y-3">{quoteRequests.map(request => <article key={request.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-900">{t(request.garmentType)}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{request.styleNotes}</p></div><StatusBadge status={request.status}>{t(request.status)}</StatusBadge></div><p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('Preferred fitting date')}: {request.preferredDueDate || t('To be confirmed')}</p></article>)}</div>}
              </ModuleCard>
              <ModuleCard className="p-5 sm:p-7"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-atelier-sage/10 text-atelier-sage"><Ruler size={20} /></span><div><p className="atelier-eyebrow">{t('Measurements')}</p><h2 className="font-display mt-1 text-xl">{t('Your fitting profile')}</h2><p className="mt-2 text-xs leading-5 text-slate-500">{t('Your measurement profile will be confirmed during quote review.')}</p><Link to="/client/request-quote" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-atelier-oxblood">{t('Book a fitting')} <ArrowUpRight size={14} /></Link></div></div></ModuleCard>
              <ModuleCard className="flex items-center justify-between gap-4 bg-atelier-ivory p-5"><div className="flex items-center gap-3"><Calendar size={18} className="text-atelier-brass" /><div><p className="text-xs font-bold text-slate-900">{t('Need a fitting?')}</p><p className="mt-1 text-[11px] text-slate-500">{t('Arrange a time with the workshop.')}</p></div></div><Link to="/client/request-quote" aria-label={t('Arrange a fitting')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-300"><ArrowUpRight size={16} /></Link></ModuleCard>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  </main>;
}
