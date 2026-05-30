import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { useUser } from '../contexts/UserContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getInitialQuoteRequestForm, QuoteRequestFormData, QuoteRequestFormErrors, validateQuoteRequestForm } from '../lib/quoteRequests';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';
import { ModuleCard, PageShell } from '../components/layout/AppLayout';

export default function RequestQuote() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useUser();
  const [formData, setFormData] = useState<QuoteRequestFormData>(getInitialQuoteRequestForm);
  const [errors, setErrors] = useState<QuoteRequestFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof QuoteRequestFormData>(field: K, value: QuoteRequestFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateQuoteRequestForm(formData);
    setErrors(result.errors);
    if (!result.valid || !user) return;

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'quoteRequests'), {
        clientId: user.uid,
        clientName: profile?.name || user.displayName || 'Client',
        clientEmail: profile?.email || user.email || '',
        garmentType: formData.garmentType.trim(),
        styleNotes: formData.styleNotes.trim(),
        preferredDueDate: formData.preferredDueDate,
        budgetRange: formData.budgetRange.trim(),
        measurementSource: formData.measurementSource,
        inspirationNotes: formData.inspirationNotes.trim(),
        status: 'submitted',
        createdAt: now,
        updatedAt: now,
      });

      toast.success(t('Quote request submitted'));
      navigate('/client');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quoteRequests');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-900">
      <PageShell maxWidthClassName="max-w-3xl" className="py-8 sm:py-10">
      <section>
        <Link to="/client" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
          <ArrowLeft size={14} />
          Back to portal
        </Link>

        <ModuleCard className="mt-6 overflow-hidden">
          <div className="border-b border-slate-100 p-8">
            <BrandLogo showText={false} markClassName="h-14 w-14" />
            <h1 className="mt-6 text-4xl font-black uppercase italic tracking-tight">{t('Request Bespoke Quote')}</h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
              Tell us what you want made. Our workshop will review measurements, fabric, and timing before creating a final order.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-8">
            <FieldError error={errors.garmentType}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Garment Type')}</label>
              <select
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                value={formData.garmentType}
                onChange={event => updateField('garmentType', event.target.value)}
              >
                <option value="">Select garment...</option>
                <option value="Shalwar Kameez">Shalwar Kameez</option>
                <option value="Suit">Suit</option>
                <option value="Sherwani">Sherwani</option>
                <option value="Dress Shirt">Dress Shirt</option>
                <option value="Alteration">Alteration</option>
                <option value="Other">Other</option>
              </select>
            </FieldError>

            <FieldError error={errors.styleNotes}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Style Notes')}</label>
              <textarea
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                placeholder="Describe fabric, occasion, fit, color, and any style direction..."
                value={formData.styleNotes}
                onChange={event => updateField('styleNotes', event.target.value)}
              />
            </FieldError>

            <div className="grid gap-6 sm:grid-cols-2">
              <FieldError error={errors.preferredDueDate}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Preferred Due Date')}</label>
                <input
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  value={formData.preferredDueDate}
                  onChange={event => updateField('preferredDueDate', event.target.value)}
                />
              </FieldError>

              <FieldError error={errors.budgetRange}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Budget Range')}</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  value={formData.budgetRange}
                  onChange={event => updateField('budgetRange', event.target.value)}
                >
                  <option value="">Select range...</option>
                  <option value="Under 10000">Under Rs. 10,000</option>
                  <option value="10000-25000">Rs. 10,000 - 25,000</option>
                  <option value="25000-50000">Rs. 25,000 - 50,000</option>
                  <option value="50000-100000">Rs. 50,000 - 100,000</option>
                  <option value="100000+">Rs. 100,000+</option>
                </select>
              </FieldError>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Measurement Source')}</label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  { value: 'existing', label: 'Use Existing' },
                  { value: 'book-measurement', label: 'Book Measurement' },
                  { value: 'enter-later', label: 'Enter Later' },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('measurementSource', option.value as QuoteRequestFormData['measurementSource'])}
                    className={`rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                      formData.measurementSource === option.value
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Inspiration Notes')}</label>
              <textarea
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                placeholder="Optional references, links, or additional details..."
                value={formData.inspirationNotes}
                onChange={event => updateField('inspirationNotes', event.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50"
            >
              <Save size={18} />
              {submitting ? 'Submitting...' : t('Submit Quote Request')}
            </button>
          </form>
        </ModuleCard>
      </section>
      </PageShell>
    </main>
  );
}

function FieldError({ children, error }: { children: React.ReactNode; error?: string }) {
  return (
    <div>
      {children}
      {error && (
        <p className="mt-2 flex items-center gap-2 text-xs font-bold text-red-600">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
