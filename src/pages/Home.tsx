import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Clock3, Menu, Ruler, Scissors, Search, ShieldCheck, X } from 'lucide-react';
import { db } from '../lib/firebase';
import type { PublicOrderTracking } from '../types';
import { useTranslation } from 'react-i18next';
import BrandLogo from '../components/BrandLogo';
import LanguageToggle from '../components/LanguageToggle';
import { normalizePublicOrderTracking } from '../lib/publicOrderTracking';
import AtelierImage from '../components/atelier/AtelierImage';
import { AtelierButton, AtelierNavbar, StitchDivider, SwatchCard } from '../components/atelier/AtelierUI';

// Unsplash search references: "bespoke tailoring atelier suit jacket", "fashion tailoring fabric drape", "sewing thread textile close-up", "tailor hands fabric workshop".
const image = {
  hero: 'https://images.unsplash.com/photo-1594932224828-b4b059b6f6f9?q=85&w=1800&auto=format&fit=crop',
  cutting: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=85&w=1000&auto=format&fit=crop',
  cloth: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=900&auto=format&fit=crop',
  thread: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=85&w=900&auto=format&fit=crop',
  craft: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?q=85&w=1400&auto=format&fit=crop',
};

const services = [
  { name: 'Suits', img: image.hero, number: '01' },
  { name: 'Sherwani', img: image.cloth, number: '02' },
  { name: 'Shalwar Kameez', img: image.cutting, number: '03' },
  { name: 'Wedding wear', img: image.craft, number: '04' },
  { name: 'Alterations', img: image.thread, number: '05' },
  { name: 'Ladies’ tailoring', img: image.cloth, number: '06' },
];

const swatches = [
  { name: 'Oxblood wool', color: 'linear-gradient(135deg,#421d27,#7e4148)' },
  { name: 'Warm ivory', color: 'linear-gradient(135deg,#e5d8c4,#faf5e9)' },
  { name: 'Bottle green', color: 'linear-gradient(135deg,#25372f,#526a59)' },
  { name: 'Soft sage', color: 'linear-gradient(135deg,#879283,#c0c5b7)' },
  { name: 'Clay linen', color: 'linear-gradient(135deg,#98644f,#d2a38a)' },
  { name: 'Midnight ink', color: 'linear-gradient(135deg,#171b1c,#414849)' },
];

export default function Home() {
  const { t } = useTranslation();
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState<PublicOrderTracking | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedSwatch, setSelectedSwatch] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const checkStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trackingCode = orderQuery.trim();
    if (!trackingCode || searching) return;
    setSearching(true);
    setError('');
    setOrderStatus(null);
    try {
      const snapshot = await getDoc(doc(db, 'publicOrderTracking', trackingCode));
      if (snapshot.exists()) setOrderStatus(normalizePublicOrderTracking(snapshot.id, snapshot.data()));
      else setError(t('Tracking record not found. Please check your tracking code.'));
    } catch (cause) {
      console.error('Unable to retrieve public order status', cause);
      setError(t('Something went wrong. Please try again.'));
    } finally { setSearching(false); }
  };

  const closeMenu = () => setMenuOpen(false);
  const process = ['Consultation', 'Measurements', 'Fabric selection', 'Fittings', 'Delivery'];

  return <main className="min-h-screen overflow-x-hidden bg-atelier-paper text-atelier-ink">
    <AtelierNavbar className={scrolled ? 'shadow-sm' : 'bg-transparent'}>
      <div className={`mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 transition-all duration-300 sm:px-8 ${scrolled ? 'h-16' : 'h-[82px]'}`}>
        <Link to="/" aria-label={t('Home')} onClick={closeMenu}><BrandLogo markClassName="h-10 w-10 rounded-xl" textClassName="font-display text-xl" /></Link>
        <nav aria-label={t('Main navigation')} className="hidden items-center gap-8 md:flex">
          <a href="#services" className="text-xs font-semibold text-slate-600 transition hover:text-atelier-oxblood">{t('Our services')}</a>
          <a href="#process" className="text-xs font-semibold text-slate-600 transition hover:text-atelier-oxblood">{t('The process')}</a>
          <a href="#fabrics" className="text-xs font-semibold text-slate-600 transition hover:text-atelier-oxblood">{t('Fabrics')}</a>
          <a href="#tracking" className="text-xs font-semibold text-slate-600 transition hover:text-atelier-oxblood">{t('Order tracking')}</a>
          <Link to="/client" className="text-xs font-semibold text-slate-600 transition hover:text-atelier-oxblood">{t('Client portal')}</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex"><LanguageToggle /><Link to="/client/request-quote" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-atelier-oxblood px-4 text-xs font-bold text-white shadow-sm transition hover:bg-atelier-oxblood-dark">{t('Request a bespoke quote')} <ArrowUpRight size={15} /></Link></div>
        <button type="button" aria-label={menuOpen ? t('Close menu') : t('Open menu')} aria-expanded={menuOpen} aria-controls="atelier-mobile-menu" onClick={() => setMenuOpen(value => !value)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-atelier-paper text-slate-900 md:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {menuOpen && <motion.nav id="atelier-mobile-menu" aria-label={t('Main navigation')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex min-h-dvh flex-col bg-atelier-paper px-6 pb-8 pt-5 md:hidden">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4"><BrandLogo markClassName="h-10 w-10 rounded-xl" textClassName="font-display text-xl" /><button type="button" aria-label={t('Close menu')} onClick={closeMenu} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200"><X size={20} /></button></div>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-2 py-8">
          {['Our services', 'The process', 'Fabrics', 'Order tracking'].map((label, index) => <motion.a key={label} href={['#services', '#process', '#fabrics', '#tracking'][index]} onClick={closeMenu} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className="border-b border-slate-200 py-4 font-display text-3xl">{t(label)}</motion.a>)}
          <Link to="/client" onClick={closeMenu} className="border-b border-slate-200 py-4 font-display text-3xl">{t('Client portal')}</Link>
        </div>
        <div className="mx-auto flex w-full max-w-lg items-center justify-between"><LanguageToggle /><Link to="/client/request-quote" onClick={closeMenu} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-atelier-oxblood px-5 text-sm font-bold text-white">{t('Request a bespoke quote')} <ArrowUpRight size={16} /></Link></div>
      </motion.nav>}
    </AtelierNavbar>

    <section className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-16 lg:min-h-[690px] lg:grid-cols-12 lg:gap-8 lg:py-20">
      <div className="relative z-10 lg:col-span-6">
        <p className="atelier-eyebrow mb-6 flex items-center gap-3"><span className="h-px w-8 bg-atelier-brass" />{t('The atelier, digitised')}</p>
        <h1 className="font-display max-w-3xl text-[clamp(3.5rem,8.2vw,7.5rem)] leading-[.92] tracking-[-.055em] text-atelier-ink">{t('Cut to you.')}<br /><em className="font-normal text-atelier-oxblood">{t('Stitched by hand.')}</em></h1>
        <p className="mt-7 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{t('Thoughtful tailoring, shaped around your measurements, your point of view, and the way you want to feel.')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to="/client/request-quote" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-atelier-oxblood px-7 text-sm font-bold text-white shadow-sm transition hover:bg-atelier-oxblood-dark">{t('Request a bespoke quote')} <ArrowRight size={17} className="rtl-flip" /></Link>
          <a href="#tracking" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-slate-700 transition hover:bg-atelier-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-atelier-brass">{t('Track your order')} <ArrowDown size={16} /></a>
        </div>
        <div className="mt-12 flex items-center gap-4 text-xs font-semibold text-slate-500"><span className="grid h-9 w-9 place-items-center rounded-full border border-atelier-brass/35 text-atelier-brass"><Ruler size={17} /></span>{t('Made for your measurements. Refined in person.')}</div>
      </div>

      <motion.div className="relative lg:col-span-6 lg:col-start-7" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [.22, 1, .36, 1] }}>
        <div className="relative ms-auto w-[94%] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]">
          <AtelierImage src={image.hero} alt={t('A tailor carefully shaping a bespoke jacket')} aspect="aspect-[4/4.2]" priority imageClassName="[filter:sepia(.14)_saturate(.85)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-atelier-ink/65 via-transparent to-atelier-ink/5" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-8">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/70">{t('The details matter')}</p><p className="font-display mt-2 text-2xl sm:text-3xl">{t('Considered from first measure to final stitch.')}</p></div>
            <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-full border border-white/40 sm:grid"><Scissors size={20} /></span>
          </div>
        </div>
        <div className="absolute -start-1 top-[15%] hidden w-32 rounded-xl border border-white/70 bg-atelier-paper/95 p-3 shadow-xl sm:block lg:-start-4">
          <AtelierImage src={image.thread} alt={t('Tailoring thread and cloth detail')} aspect="aspect-square" className="rounded-lg" />
          <p className="mt-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-500">{t('A hand in every detail')}</p>
        </div>
        <svg aria-hidden="true" viewBox="0 0 540 120" className="pointer-events-none absolute -bottom-10 -start-8 hidden w-[90%] overflow-visible text-atelier-brass sm:block">
          <motion.path d="M4 84 C 110 4, 182 122, 284 58 S 420 15, 536 71" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, delay: .3, ease: 'easeInOut' }} />
        </svg>
      </motion.div>
    </section>

    <section className="border-y border-atelier-brass/20 bg-atelier-ivory">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 px-5 py-7 sm:px-8 md:grid-cols-4">
        {[['01', 'Made to measure'], ['02', 'One piece at a time'], ['03', 'Fit, refined in person'], ['04', 'Your workshop, in view']].map(([value, label]) => <div key={value} className="flex items-center gap-3 border-e border-atelier-brass/20 px-4 py-2 first:ps-0 last:border-0 md:px-7"><span className="font-display text-2xl text-atelier-oxblood">{value}</span><span className="max-w-28 text-[10px] font-bold uppercase leading-4 tracking-wider text-slate-600">{t(label)}</span></div>)}
      </div>
    </section>

    <section id="services" className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-5 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7"><p className="atelier-eyebrow">{t('Made around you')}</p><h2 className="font-display mt-3 max-w-2xl text-4xl leading-tight tracking-tight sm:text-6xl">{t('A wardrobe with your name in the seams.')}</h2></div>
          <p className="max-w-md text-sm leading-7 text-slate-600 md:col-span-4 md:col-start-9">{t('From a first fitting to the final press, every garment begins with a conversation—not a rack.')}</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(item => <Link key={item.name} to="/client/request-quote" className="group relative overflow-hidden rounded-2xl bg-atelier-ink text-white">
            <AtelierImage src={item.img} alt={t(item.name)} aspect="aspect-[1.2/1]" imageClassName="opacity-75 transition duration-700 group-hover:scale-105 group-hover:opacity-90 [filter:sepia(.2)_saturate(.8)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-atelier-ink/85 via-atelier-ink/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-6"><div><span className="text-[10px] font-bold tracking-[.2em] text-atelier-brass">{item.number}</span><h3 className="font-display mt-1 text-2xl sm:text-3xl">{t(item.name)}</h3><p className="mt-1 text-xs text-white/75">{t('Made to order · timing confirmed at consultation')}</p></div><span className="grid h-10 w-10 place-items-center rounded-full border border-white/40 transition group-hover:bg-white group-hover:text-atelier-ink"><ArrowUpRight size={17} /></span></div>
          </Link>)}
        </div>
      </div>
    </section>

    <section id="process" className="fabric-weave border-y border-slate-200 px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-2xl"><p className="atelier-eyebrow">{t('The process')}</p><h2 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">{t('Measured in moments. Made to last.')}</h2><p className="mt-4 text-sm leading-7 text-slate-600">{t('A clear, considered process from your first idea to the finished piece.')}</p></div>
        <div className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="absolute inset-x-0 top-5 hidden border-t border-dashed border-atelier-brass/50 lg:block" />
          {process.map((step, index) => <div key={step} className="relative"><span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-atelier-brass bg-atelier-paper font-display text-sm text-atelier-oxblood">{String(index + 1).padStart(2, '0')}</span><h3 className="font-display mt-5 text-xl">{t(step)}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{t(`Process ${index + 1} description`)}</p></div>)}
        </div>
      </div>
    </section>

    <section id="fabrics" className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4"><p className="atelier-eyebrow">{t('The cloth comes first')}</p><h2 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">{t('A touch, a drape, a point of view.')}</h2><p className="mt-5 text-sm leading-7 text-slate-600">{t('Choose a starting point. We will help you find the right weight, texture, and finish in person.')}</p><StitchDivider /><p className="text-xs font-semibold text-slate-500">{selectedSwatch ? `${t('Selected swatch')}: ${t(selectedSwatch)}` : t('Explore a few atelier tones')}</p><Link to="/client/request-quote" className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-atelier-oxblood">{t('Request this fabric')} <ArrowRight size={14} className="rtl-flip" /></Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">{swatches.map(item => <SwatchCard key={item.name} name={t(item.name)} color={item.color} selected={selectedSwatch === item.name} onClick={() => setSelectedSwatch(item.name)} />)}</div>
      </div>
    </section>

    <section className="px-5 pb-20 sm:px-8 sm:pb-28">
      <div className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[2rem] bg-atelier-ink text-white md:grid-cols-2">
        <AtelierImage src={image.craft} alt={t('A craftsperson working carefully with fabric')} aspect="aspect-[4/3]" imageClassName="[filter:sepia(.22)_saturate(.8)]" />
        <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16"><p className="atelier-eyebrow">{t('The signature')}</p><h2 className="font-display mt-4 text-4xl leading-tight sm:text-5xl">{t('The quiet confidence of a perfect fit.')}</h2><p className="mt-5 max-w-lg text-sm leading-7 text-white/70">{t('Care lives in the small things: a balanced shoulder, a clean finish, a seam that sits exactly where it should.')}</p><div className="mt-8 flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-full border border-atelier-brass/60 text-atelier-brass"><Scissors size={19} /></span><span className="font-display text-lg italic text-white/90">{t('Crafted with intention.')}</span></div></div>
      </div>
    </section>

    <section className="px-5 pb-20 sm:px-8 sm:pb-28"><div className="mx-auto grid max-w-[1440px] gap-8 border-y border-slate-200 py-10 md:grid-cols-12 md:items-center">
      <div className="md:col-span-3"><p className="atelier-eyebrow">{t('A note from the atelier')}</p></div><blockquote className="font-display text-3xl leading-snug text-slate-800 sm:text-4xl md:col-span-8 md:col-start-5">“{t('The best garment is the one that feels like it was always yours.')}”</blockquote>
    </div></section>

    <section id="tracking" className="bg-atelier-ink px-5 py-20 text-white sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5"><div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-atelier-brass/30 text-atelier-brass"><ShieldCheck size={21} /></div><p className="atelier-eyebrow">{t('Already have an order?')}</p><h2 className="font-display mt-3 text-4xl sm:text-5xl">{t('Your fitting, in progress.')}</h2><p className="mt-4 max-w-md text-sm leading-7 text-white/65">{t('Enter the tracking code shared with you to see the latest note from the workshop.')}</p></div>
        <div className="lg:col-span-6 lg:col-start-7"><form onSubmit={checkStatus} className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="tracking-code">{t('Order tracking code')}</label><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" /><input id="tracking-code" type="text" autoComplete="off" placeholder={t('Enter your tracking code')} className="min-h-14 w-full rounded-xl border border-white/15 bg-white/5 py-3 ps-12 pe-4 text-base text-white placeholder:text-white/40 outline-none transition focus:border-atelier-brass focus:ring-2 focus:ring-atelier-brass/30" value={orderQuery} onChange={event => { setOrderQuery(event.target.value); setError(''); }} aria-describedby={error ? 'tracking-error' : undefined} aria-invalid={Boolean(error)} required /></div><AtelierButton type="submit" disabled={searching || !orderQuery.trim()} size="lg">{searching ? <><Clock3 size={16} className="animate-pulse" />{t('Checking status…')}</> : <>{t('Track order')} <ArrowRight size={16} className="rtl-flip" /></>}</AtelierButton></form>
          {error && <p id="tracking-error" role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">{error}</p>}
          {orderStatus && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite" className="mt-5 rounded-2xl border border-white/10 bg-atelier-paper p-5 text-slate-900 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('Order update')}</p><h3 className="font-display mt-1 text-xl">{t('Order status')}</h3><p className="mt-1 font-mono text-xs text-slate-500">{t('Reference')}: {orderStatus.trackingCode}</p></div><span className="rounded-full bg-atelier-sage/15 px-3 py-1.5 text-xs font-bold capitalize text-atelier-sage">{t(orderStatus.status)}</span></div><div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3"><div><p className="text-xs text-slate-500">{t('Items')}</p><p className="mt-1 font-bold">{orderStatus.itemCount}</p></div><div><p className="text-xs text-slate-500">{t('Target date')}</p><p className="mt-1 font-bold">{orderStatus.dueDate ? new Date(orderStatus.dueDate).toLocaleDateString() : t('To be confirmed')}</p></div><div><p className="text-xs text-slate-500">{t('Last updated')}</p><p className="mt-1 font-bold">{orderStatus.updatedAt ? new Date(orderStatus.updatedAt).toLocaleDateString() : t('Not available')}</p></div></div><ol aria-label={t('Production progress')} className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-5">{[{ key: 'registered', label: t('Received'), done: orderStatus.steps.registered }, { key: 'cutting', label: t('Cutting'), done: orderStatus.steps.cutting }, { key: 'stitching', label: t('Stitching'), done: orderStatus.steps.stitching }, { key: 'finishing', label: t('Finishing'), done: orderStatus.steps.finishing }, { key: 'ready', label: t('Ready'), done: orderStatus.steps.ready }].map(step => <li key={step.key} className="flex items-center gap-2 text-xs font-semibold"><span className={`grid h-5 w-5 place-items-center rounded-full ${step.done ? 'bg-atelier-sage text-white' : 'bg-slate-200 text-slate-500'}`}>{step.done ? <Check size={12} /> : null}</span>{step.label}</li>)}</ol></motion.div>}
        </div>
      </div>
    </section>

    <section className="bg-atelier-ivory px-5 py-14 sm:px-8"><div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p className="atelier-eyebrow">{t('Come by the atelier')}</p><h2 className="font-display mt-2 text-3xl">{t('A fitting is where the story begins.')}</h2><p className="mt-2 text-sm text-slate-600">{t('Book a conversation about your next piece.')}</p></div><Link to="/client/request-quote" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-atelier-paper px-5 text-sm font-bold text-slate-800 hover:border-atelier-brass">{t('Arrange a consultation')} <ArrowUpRight size={16} /></Link></div></section>

    <footer className="border-t border-slate-200 bg-atelier-paper px-5 py-10 sm:px-8"><div className="mx-auto flex max-w-[1440px] flex-col gap-8 sm:flex-row sm:items-center sm:justify-between"><div><BrandLogo markClassName="h-10 w-10 rounded-xl" textClassName="font-display text-xl" /><p className="mt-3 text-xs text-slate-500">© {new Date().getFullYear()} {t('Tailoring ERP. Crafted with care.')}</p></div><div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-600"><Link to="/client" className="hover:text-atelier-oxblood">{t('Client portal')}</Link><Link to="/admin" className="hover:text-atelier-oxblood">{t('Staff sign in')}</Link><LanguageToggle /></div></div><div className="mx-auto mt-8 max-w-[1440px]"><StitchDivider className="my-0" /></div></footer>
  </main>;
}
