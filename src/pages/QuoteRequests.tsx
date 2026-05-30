import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, FileText, Mail, Ruler, XCircle } from 'lucide-react';
import { collection, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useFirestoreQuery } from '../hooks/useFirestoreQuery';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { buildQuoteReviewUpdate, validateQuoteReview } from '../lib/quoteRequests';
import { QuoteRequest } from '../types';

const statusClassNames: Record<string, string> = {
  submitted: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  reviewed: 'bg-amber-50 text-amber-700 border-amber-100',
  converted: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
};

export default function QuoteRequests() {
  const { t } = useTranslation();
  const { user, profile } = useUser();
  const [reviewNotesById, setReviewNotesById] = useState<Record<string, string>>({});
  const [errorsById, setErrorsById] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const quoteRequestsQuery = useMemo(
    () => query(collection(db, 'quoteRequests'), orderBy('createdAt', 'desc')),
    []
  );
  const mapQuoteRequest = useCallback((id: string, data: Record<string, unknown>) => ({ id, ...data } as QuoteRequest), []);
  const { data: quoteRequests, loading, error, fromCache, hasPendingWrites } = useFirestoreQuery<QuoteRequest>(
    quoteRequestsQuery,
    mapQuoteRequest
  );

  const submittedCount = quoteRequests.filter(request => request.status === 'submitted').length;
  const reviewedCount = quoteRequests.filter(request => request.status === 'reviewed').length;
  const rejectedCount = quoteRequests.filter(request => request.status === 'rejected').length;

  const reviewQuote = async (request: QuoteRequest, status: 'reviewed' | 'rejected') => {
    const reviewNotes = reviewNotesById[request.id] ?? request.reviewNotes ?? '';
    const validation = validateQuoteReview({ status, reviewNotes });

    if (!validation.valid) {
      setErrorsById(current => ({ ...current, [request.id]: validation.errors.reviewNotes || t('Quote review invalid') }));
      return;
    }

    setUpdatingId(request.id);
    setErrorsById(current => ({ ...current, [request.id]: '' }));

    try {
      await updateDoc(doc(db, 'quoteRequests', request.id), buildQuoteReviewUpdate({
        status,
        reviewNotes,
        reviewedBy: profile?.name || user?.displayName || user?.uid || 'staff',
      }));
      toast.success(status === 'reviewed' ? t('Quote request reviewed') : t('Quote request rejected'));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'quoteRequests');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 pb-32 sm:p-8">
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tight text-slate-900 sm:text-3xl">{t('Quote Review')}</h1>
          <p className="text-sm font-medium text-slate-500">
            {t('Review client quote requests before creating orders.')}
            {fromCache && <span className="ml-2 text-[10px] font-black uppercase text-amber-600">{t('Offline cache')}</span>}
            {hasPendingWrites && <span className="ml-2 text-[10px] font-black uppercase text-indigo-600">{t('Syncing')}</span>}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
          <Metric label={t('Submitted')} value={submittedCount} />
          <Metric label={t('Reviewed')} value={reviewedCount} />
          <Metric label={t('Rejected')} value={rejectedCount} />
        </div>
      </header>

      {loading ? (
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-400 shadow-sm">
          {t('Loading quote requests...')}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-[2.5rem] border border-red-100 bg-red-50 p-8 text-sm font-bold text-red-600 shadow-sm">
          <AlertCircle size={18} />
          {t('Quote requests could not load.')}
        </div>
      ) : quoteRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-slate-200 bg-slate-50/50 p-20 text-center text-slate-400">
          <FileText size={48} className="mb-4 opacity-20" />
          <p className="text-xs font-black uppercase tracking-widest">{t('No quote requests yet')}</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {quoteRequests.map(request => {
            const isClosed = request.status === 'converted' || request.status === 'rejected';
            const pendingUpdate = updatingId === request.id;
            const notes = reviewNotesById[request.id] ?? request.reviewNotes ?? '';

            return (
              <article key={request.id} className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <div className="min-w-0 space-y-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">#{request.id.slice(0, 8)}</p>
                        <h2 className="mt-1 text-2xl font-black uppercase italic tracking-tight text-slate-900">{request.garmentType}</h2>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{request.styleNotes}</p>
                      </div>
                      <span className={`self-start rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClassNames[request.status] || statusClassNames.submitted}`}>
                        {request.status}
                      </span>
                    </div>

                    {request.inspirationNotes && (
                      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Inspiration Notes')}</p>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{request.inspirationNotes}</p>
                      </div>
                    )}

                    <div className="grid gap-3 text-xs font-bold text-slate-500 sm:grid-cols-3">
                      <InfoPill icon={<Calendar size={14} />} label={t('Preferred Due Date')} value={request.preferredDueDate} />
                      <InfoPill icon={<Ruler size={14} />} label={t('Measurement Source')} value={request.measurementSource} />
                      <InfoPill icon={<Mail size={14} />} label={t('Client')} value={request.clientName || request.clientEmail} />
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor={`review-notes-${request.id}`}>
                      {t('Review Notes')}
                    </label>
                    <textarea
                      id={`review-notes-${request.id}`}
                      value={notes}
                      onChange={event => {
                        setReviewNotesById(current => ({ ...current, [request.id]: event.target.value }));
                        setErrorsById(current => ({ ...current, [request.id]: '' }));
                      }}
                      disabled={isClosed || pendingUpdate}
                      rows={5}
                      className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder={t('Add staff notes for this quote request')}
                    />
                    {errorsById[request.id] && (
                      <p className="mt-3 flex items-center gap-2 text-xs font-bold text-red-600">
                        <AlertCircle size={14} />
                        {errorsById[request.id]}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => reviewQuote(request, 'reviewed')}
                        disabled={isClosed || pendingUpdate}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      >
                        <CheckCircle2 size={16} />
                        {t('Mark Reviewed')}
                      </button>
                      <button
                        onClick={() => reviewQuote(request, 'rejected')}
                        disabled={isClosed || pendingUpdate}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        <XCircle size={16} />
                        {t('Reject')}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-lg font-black text-slate-900">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <span className="text-indigo-500">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="block truncate text-xs font-black text-slate-700">{value || '-'}</span>
      </span>
    </div>
  );
}
