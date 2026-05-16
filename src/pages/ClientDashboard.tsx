import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Ruler, ShoppingBag } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, QuoteRequest } from '../types';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';

const statusClassNames: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  'in-progress': 'bg-indigo-50 text-indigo-600 border-indigo-100',
  ready: 'bg-amber-50 text-amber-700 border-amber-100',
  delivered: 'bg-green-50 text-green-700 border-green-100',
  submitted: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  reviewed: 'bg-amber-50 text-amber-700 border-amber-100',
  converted: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
};

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { user, profile } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientData() {
      if (!user) return;

      try {
        const [ordersSnap, quoteSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), where('clientId', '==', user.uid))),
          getDocs(query(collection(db, 'quoteRequests'), where('clientId', '==', user.uid))),
        ]);

        setOrders(ordersSnap.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Order))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setQuoteRequests(quoteSnap.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as QuoteRequest))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'client-dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [user]);

  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo markClassName="h-11 w-11" textClassName="text-xl" />
          </Link>
          <Link to="/client/request-quote" className="rounded-2xl bg-slate-950 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white">
            {t('Request Bespoke Quote')}
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Client Portal')}</p>
            <h1 className="mt-3 text-4xl font-black uppercase italic tracking-tight text-slate-900">
              Welcome, {profile?.name || user?.displayName || 'Client'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Track your bespoke work, manage quote requests, and keep measurements ready for your next garment.
            </p>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Next Step</p>
            <h2 className="mt-3 text-2xl font-black uppercase italic tracking-tight">Start a new piece</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-400">
              Share your garment idea and our workshop will review measurements, fabric, and timing.
            </p>
            <Link to="/client/request-quote" className="mt-6 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white">
              {t('Request Bespoke Quote')}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-400 shadow-sm">
            Syncing your tailoring account...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Active Orders')}</p>
                  <h2 className="mt-1 text-2xl font-black uppercase italic tracking-tight">Bespoke Work</h2>
                </div>
                <ShoppingBag className="text-slate-300" size={28} />
              </div>

              <div className="space-y-3">
                {orders.length === 0 ? (
                  <EmptyState title="No orders yet" text="Approved quotes will appear here once the workshop creates your order." />
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">#{order.id.slice(0, 8)}</p>
                          <h3 className="mt-1 text-sm font-black text-slate-900">{order.items.length} item bespoke order</h3>
                        </div>
                        <span className={`self-start rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClassNames[order.status] || statusClassNames.pending}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 text-xs font-bold text-slate-500 sm:grid-cols-3">
                        <span>Due: {order.dueDate || 'Pending'}</span>
                        <span>Total: Rs. {order.totalAmount.toLocaleString()}</span>
                        <span>Paid: Rs. {(order.paidAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Quote Requests')}</p>
                  <h2 className="mt-1 text-2xl font-black uppercase italic tracking-tight">In Review</h2>
                </div>
                <FileText className="text-slate-300" size={28} />
              </div>

              <div className="space-y-3">
                {quoteRequests.length === 0 ? (
                  <EmptyState title="No quote requests" text="Start with a bespoke quote before the workshop creates an order." />
                ) : (
                  quoteRequests.map(request => (
                    <div key={request.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{request.garmentType}</h3>
                          <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">{request.styleNotes}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${statusClassNames[request.status] || statusClassNames.submitted}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Calendar size={12} />
                        {request.preferredDueDate}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Ruler size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Measurements')}</p>
              <h2 className="text-lg font-black text-slate-900">Measurement profile will be confirmed during quote review.</h2>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6">
      <h3 className="text-sm font-black text-slate-700">{title}</h3>
      <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{text}</p>
    </div>
  );
}
