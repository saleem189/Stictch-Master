import { useEffect, useState, type FormEvent } from 'react';
import type React from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Ruler, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { useUser } from '../contexts/UserContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getInitialQuoteRequestForm, QuoteRequestFormData, QuoteRequestFormErrors, validateQuoteRequestForm } from '../lib/quoteRequests';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';
import LanguageToggle from '../components/LanguageToggle';
import { ModuleCard, PageShell } from '../components/layout/AppLayout';
import { AtelierButton, AtelierStepper, StitchDivider } from '../components/atelier/AtelierUI';

const DRAFT_KEY = 'stitchmaster-quote-draft';
const garments = [
  { name: 'Suit', texture: 'linear-gradient(135deg,#35211f,#825d51)' },
  { name: 'Sherwani', texture: 'linear-gradient(135deg,#384237,#819078)' },
  { name: 'Shalwar Kameez', texture: 'linear-gradient(135deg,#d1bfa3,#f5ead8)' },
  { name: 'Dress Shirt', texture: 'linear-gradient(135deg,#b8b9ae,#f2efe6)' },
  { name: 'Alteration', texture: 'linear-gradient(135deg,#7b5c51,#c28f72)' },
  { name: 'Other', texture: 'linear-gradient(135deg,#3b3431,#897b6e)' },
];

function readDraft(draftKey: string): QuoteRequestFormData {
  const initial = getInitialQuoteRequestForm();
  try {
    const saved = localStorage.getItem(draftKey);
    if (!saved) return initial;
    const parsed = JSON.parse(saved) as Partial<QuoteRequestFormData>;
    return {
      garmentType: typeof parsed.garmentType === 'string' ? parsed.garmentType : initial.garmentType,
      styleNotes: typeof parsed.styleNotes === 'string' ? parsed.styleNotes : initial.styleNotes,
      preferredDueDate: typeof parsed.preferredDueDate === 'string' ? parsed.preferredDueDate : initial.preferredDueDate,
      budgetRange: typeof parsed.budgetRange === 'string' ? parsed.budgetRange : initial.budgetRange,
      measurementSource: ['existing', 'book-measurement', 'enter-later'].includes(String(parsed.measurementSource)) ? parsed.measurementSource as QuoteRequestFormData['measurementSource'] : initial.measurementSource,
      inspirationNotes: typeof parsed.inspirationNotes === 'string' ? parsed.inspirationNotes : initial.inspirationNotes,
    };
  } catch { return initial; }
}

export default function RequestQuote() {
  const { t } = useTranslation();
  const { user, profile } = useUser();
  const draftKey = user ? `${DRAFT_KEY}:${user.uid}` : DRAFT_KEY;
  const [formData, setFormData] = useState<QuoteRequestFormData>(() => readDraft(draftKey));
  const [errors, setErrors] = useState<QuoteRequestFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) {
      try { localStorage.setItem(draftKey, JSON.stringify(formData)); } catch { /* Draft saving is best effort when storage is unavailable. */ }
    }
  }, [draftKey, formData, submitted]);

  const updateField = <K extends keyof QuoteRequestFormData>(field: K, value: QuoteRequestFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const advance = () => {
    if (step === 0 && !formData.garmentType.trim()) {
      setErrors({ garmentType: t('Garment type is required') });
      return;
    }
    if (step === 1) {
      const validation = validateQuoteRequestForm(formData);
      const nextErrors = { styleNotes: validation.errors.styleNotes, preferredDueDate: validation.errors.preferredDueDate, budgetRange: validation.errors.budgetRange };
      setErrors(nextErrors);
      if (Object.values(nextErrors).some(Boolean)) return;
    }
    setErrors({});
    setStep(current => Math.min(2, current + 1));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = validateQuoteRequestForm(formData);
    setErrors(result.errors);
    if (!result.valid || !user) {
      setStep(result.errors.garmentType ? 0 : 1);
      return;
    }
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
      try { localStorage.removeItem(draftKey); } catch { /* No action needed when storage is unavailable. */ }
      toast.success(t('Quote request submitted'));
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'quoteRequests');
    } finally { setSubmitting(false); }
  };

  const stepNames = [t('Your piece'), t('The details'), t('Fitting & review')];

  return <main className="min-h-[100dvh] bg-atelier-ivory text-slate-900">
    <PageShell maxWidthClassName="max-w-5xl" className="py-6 sm:py-10">
      <header className="mb-8 flex items-center justify-between border-b border-atelier-brass/25 pb-5"><Link to="/client" aria-label={t('Back to portal')}><BrandLogo markClassName="h-10 w-10 rounded-xl" textClassName="font-display text-xl" /></Link><LanguageToggle /></header>
      {submitted ? <motion.section role="status" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl py-12 text-center sm:py-20"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-atelier-brass/45 bg-white text-atelier-oxblood"><Scissors size={28} /></span><p className="atelier-eyebrow mt-8">{t('Request received')}</p><h1 className="font-display mt-3 text-4xl leading-tight sm:text-6xl">{t('Your request is on the cutting table.')}</h1><p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-600">{t('The atelier will review your notes and follow up about the next fitting.')}</p><Link to="/client" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-atelier-oxblood px-6 text-sm font-bold text-white">{t('Return to your portal')} <ArrowRight size={16} /></Link></motion.section> : <>
        <div className="mx-auto max-w-4xl"><div className="mb-7 max-w-3xl"><p className="atelier-eyebrow">{t('A considered beginning')}</p><h1 className="font-display mt-2 text-4xl leading-tight sm:text-6xl">{t('Request Bespoke Quote')}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{t('Tell us what you would like made. Your notes stay saved on this device while you work.')}</p></div>
          <ModuleCard className="overflow-hidden">
            <div className="border-b border-slate-200 bg-atelier-paper p-5 sm:p-8"><AtelierStepper steps={stepNames} current={step} /></div>
            <form onSubmit={handleSubmit} className="p-5 sm:p-8 lg:p-10">
              {step === 0 && <section aria-labelledby="quote-garment-heading"><p className="text-xs font-bold uppercase tracking-widest text-atelier-brass">{t('Step 1 of 3')}</p><h2 id="quote-garment-heading" className="font-display mt-2 text-3xl">{t('What would you like made?')}</h2><p className="mt-2 text-sm text-slate-500">{t('Choose the piece that brings your idea to life.')}</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{garments.map((garment, index) => <button key={garment.name} type="button" aria-pressed={formData.garmentType === garment.name} onClick={() => updateField('garmentType', garment.name)} className={`group min-h-36 overflow-hidden rounded-xl border text-start transition ${formData.garmentType === garment.name ? 'border-atelier-oxblood ring-2 ring-atelier-oxblood/15' : 'border-slate-200 hover:border-atelier-brass'}`}><span className="block h-20 transition group-hover:h-[5.25rem]" style={{ background: garment.texture }} /><span className="block p-3"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">0{index + 1}</span><span className="mt-1 block text-sm font-bold">{t(garment.name)}</span></span></button>)}</div>{errors.garmentType && <p role="alert" className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-700"><AlertCircle size={16} />{t(errors.garmentType)}</p>}</section>}

              {step === 1 && <section aria-labelledby="quote-details-heading"><p className="text-xs font-bold uppercase tracking-widest text-atelier-brass">{t('Step 2 of 3')}</p><h2 id="quote-details-heading" className="font-display mt-2 text-3xl">{t('The details that make it yours.')}</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><FieldError id="quote-style" label={t('Style Notes')} error={errors.styleNotes}><textarea id="quote-style" rows={5} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-atelier-brass focus:ring-2 focus:ring-atelier-brass/20" placeholder={t('Describe fabric, occasion, fit, colour, and the feeling you are after.')} value={formData.styleNotes} onChange={event => updateField('styleNotes', event.target.value)} /></FieldError><div className="space-y-5"><FieldError id="quote-date" label={t('Preferred Due Date')} error={errors.preferredDueDate}><input id="quote-date" type="date" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-atelier-brass focus:ring-2 focus:ring-atelier-brass/20" value={formData.preferredDueDate} onChange={event => updateField('preferredDueDate', event.target.value)} /></FieldError><FieldError id="quote-budget" label={t('Budget Range')} error={errors.budgetRange}><select id="quote-budget" className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-atelier-brass focus:ring-2 focus:ring-atelier-brass/20" value={formData.budgetRange} onChange={event => updateField('budgetRange', event.target.value)}><option value="">{t('Select a range')}</option><option value="Under 10000">{t('Under Rs. 10,000')}</option><option value="10000-25000">{t('Rs. 10,000 - 25,000')}</option><option value="25000-50000">{t('Rs. 25,000 - 50,000')}</option><option value="50000-100000">{t('Rs. 50,000 - 100,000')}</option><option value="100000+">{t('Rs. 100,000+')}</option></select></FieldError></div></div></section>}

              {step === 2 && <section aria-labelledby="quote-fitting-heading"><p className="text-xs font-bold uppercase tracking-widest text-atelier-brass">{t('Step 3 of 3')}</p><h2 id="quote-fitting-heading" className="font-display mt-2 text-3xl">{t('Fitting & review')}</h2><p className="mt-2 text-sm text-slate-500">{t('Choose how we should begin with measurements, then review your request.')}</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[{ value: 'existing', label: 'Use Existing', icon: Check }, { value: 'book-measurement', label: 'Book Measurement', icon: Ruler }, { value: 'enter-later', label: 'Enter Later', icon: ArrowRight }].map(option => { const Icon = option.icon; const selected = formData.measurementSource === option.value; return <button key={option.value} type="button" aria-pressed={selected} onClick={() => updateField('measurementSource', option.value as QuoteRequestFormData['measurementSource'])} className={`min-h-24 rounded-xl border p-4 text-start transition ${selected ? 'border-atelier-oxblood bg-atelier-oxblood/5' : 'border-slate-200 hover:border-atelier-brass'}`}><Icon size={18} className={selected ? 'text-atelier-oxblood' : 'text-slate-400'} /><span className="mt-3 block text-xs font-bold">{t(option.label)}</span></button>; })}</div><label htmlFor="quote-inspiration" className="mt-6 block text-xs font-bold text-slate-700">{t('Inspiration Notes')} <span className="font-normal text-slate-400">({t('Optional')})</span></label><textarea id="quote-inspiration" rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-atelier-brass focus:ring-2 focus:ring-atelier-brass/20" placeholder={t('Add a reference, link, or note for your fitting.')} value={formData.inspirationNotes} onChange={event => updateField('inspirationNotes', event.target.value)} /><div className="mt-6 rounded-xl bg-atelier-ivory p-5"><p className="text-[10px] font-extrabold uppercase tracking-widest text-atelier-brass">{t('Your request')}</p><p className="font-display mt-2 text-2xl">{t(formData.garmentType)}</p><p className="mt-2 text-sm leading-6 text-slate-600">{formData.styleNotes}</p><p className="mt-3 text-xs font-semibold text-slate-500">{t('Preferred Due Date')}: {formData.preferredDueDate} · {t(formData.measurementSource)}</p></div></section>}

              <StitchDivider className="my-7" /><div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">{step > 0 ? <AtelierButton type="button" variant="secondary" onClick={() => setStep(current => current - 1)}><ArrowLeft size={15} className="rtl-flip" />{t('Back')}</AtelierButton> : <span className="self-center text-[10px] text-slate-400">{t('Draft saved on this device')}</span>}{step < 2 ? <AtelierButton type="button" onClick={advance}>{t('Continue')} <ArrowRight size={15} className="rtl-flip" /></AtelierButton> : <AtelierButton type="submit" disabled={submitting}>{submitting ? t('Submitting...') : t('Send request to the atelier')} <ArrowRight size={15} className="rtl-flip" /></AtelierButton>}</div>
            </form>
          </ModuleCard>
        </div>
      </>}
    </PageShell>
  </main>;
}

function FieldError({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="text-xs font-bold text-slate-700">{label}</label>{children}{error && <p role="alert" className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-700"><AlertCircle size={14} />{error}</p>}</div>;
}
