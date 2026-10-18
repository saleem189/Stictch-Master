import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { 
  Users, 
  Package, 
  Truck, 
  BookOpen, 
  UserCircle, 
  LayoutDashboard,
  Menu,
  LogOut,
  Scissors,
  ShoppingBag,
  Calendar,
  MapPin,
  Wifi,
  WifiOff,
  FileText,
  MoreHorizontal,
  Sun,
  Moon,
  Search,
  X,
  PanelLeft
} from 'lucide-react';
import React, { Suspense, useEffect } from 'react';
import { auth } from './lib/firebase';
import { createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { UserProvider, useUser } from './contexts/UserContext';
import NotificationBell from './components/NotificationBell';
import LanguageToggle from './components/LanguageToggle';
import BrandLogo from './components/BrandLogo';
import { toast, Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { canAccessAdminRoutes, canAccessClientRoutes, getRoleLandingPath } from './lib/roleRouting';
import { canRenderBeforeAuthReady } from './lib/publicRoutes';
import { adminNavItems, getAdminNavGroups, getPrimaryMobileAdminNavItems, type AdminNavItemConfig } from './lib/adminNavigation';
import { adminPageLoaders, publicPageLoaders } from './lib/routeModules';
import AtelierImage from './components/atelier/AtelierImage';

const Home = React.lazy(publicPageLoaders.home);
const ClientDashboard = React.lazy(publicPageLoaders.clientDashboard);
const RequestQuote = React.lazy(publicPageLoaders.requestQuote);
const Dashboard = React.lazy(adminPageLoaders.dashboard);
const Clients = React.lazy(adminPageLoaders.clients);
const Orders = React.lazy(adminPageLoaders.orders);
const Inventory = React.lazy(adminPageLoaders.inventory);
const Vendors = React.lazy(adminPageLoaders.vendors);
const Accounting = React.lazy(adminPageLoaders.accounting);
const Employees = React.lazy(adminPageLoaders.employees);
const Profile = React.lazy(adminPageLoaders.profile);
const Appointments = React.lazy(adminPageLoaders.appointments);
const Branches = React.lazy(adminPageLoaders.branches);
const QuoteRequests = React.lazy(adminPageLoaders.quoteRequests);

const navIcons: Record<string, React.ElementType> = {
  '/admin': LayoutDashboard,
  '/admin/orders': ShoppingBag,
  '/admin/quotes': FileText,
  '/admin/clients': Users,
  '/admin/appointments': Calendar,
  '/admin/inventory': Package,
  '/admin/vendors': Truck,
  '/admin/accounting': BookOpen,
  '/admin/employees': UserCircle,
  '/admin/branches': MapPin,
  '/admin/profile': UserCircle,
};

const getNavIcon = (item: Pick<AdminNavItemConfig, 'to'>) => navIcons[item.to] || LayoutDashboard;
const getInitialAdminTheme = () => {
  try { return localStorage.getItem('stitchmaster-admin-theme') !== 'light'; }
  catch { return true; }
};

const isRouteActive = (pathname: string, to: string) => (
  to === '/admin' ? pathname === '/admin' : pathname === to || pathname.startsWith(`${to}/`)
);

const RouteFallback = () => (
  <div className="flex min-h-[50dvh] items-center justify-center bg-slate-50">
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
      <Scissors size={40} className="text-indigo-600" />
    </motion.div>
  </div>
);

const SidebarItem = ({ to, icon: Icon, label, active, collapsed = false }: { to: string, icon: React.ElementType, label: string, active: boolean; collapsed?: boolean }) => (
  <Link 
    to={to} 
    className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
      active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
    aria-label={collapsed ? label : undefined}
    title={collapsed ? label : undefined}
  >
    <Icon size={18} />
    {!collapsed && <span className="text-sm font-black">{label}</span>}
    {active && !collapsed && <motion.div layoutId="active" className="ms-auto w-1.5 h-1.5 rounded-full bg-white" />}
  </Link>
);

const NavSection = ({
  title,
  items,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  title: string;
  items: AdminNavItemConfig[];
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <div>
      {!collapsed && <div className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500/80">{title}</div>}
      <nav className="space-y-1">
        {items.map((item) => (
          <div key={item.to} onClick={onNavigate}>
            <SidebarItem
              to={item.to}
              icon={getNavIcon(item)}
              label={t(item.labelKey)}
              active={isRouteActive(pathname, item.to)}
              collapsed={collapsed}
            />
          </div>
        ))}
      </nav>
    </div>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, profile, isAdmin } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const [isCommandOpen, setIsCommandOpen] = React.useState(false);
  const [commandQuery, setCommandQuery] = React.useState('');
  const [isDarkMode, setIsDarkMode] = React.useState(getInitialAdminTheme);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    try { localStorage.setItem('stitchmaster-admin-theme', isDarkMode ? 'dark' : 'light'); }
    catch { /* The appearance still works for this session if storage is unavailable. */ }
  }, [isDarkMode]);

  useEffect(() => {
    const handlePaletteKeys = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandOpen(open => !open);
      }
      if (event.key === 'Escape') {
        setIsCommandOpen(false);
        setIsMoreOpen(false);
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handlePaletteKeys);
    return () => window.removeEventListener('keydown', handlePaletteKeys);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navGroups = React.useMemo(() => getAdminNavGroups(isAdmin), [isAdmin]);
  const isRtl = i18n.language.startsWith('ur');
  const mobilePrimaryItems = React.useMemo(() => getPrimaryMobileAdminNavItems(navGroups), [navGroups]);
  const moreItems = React.useMemo(
    () => adminNavItems.filter(item => !mobilePrimaryItems.some(primary => primary.to === item.to) && (!item.adminOnly || isAdmin)),
    [isAdmin, mobilePrimaryItems]
  );
  const currentItem = React.useMemo(
    () => adminNavItems.find(item => isRouteActive(location.pathname, item.to)),
    [location.pathname]
  );
  const commandItems = adminNavItems.filter(item => (!item.adminOnly || isAdmin) && t(item.labelKey).toLowerCase().includes(commandQuery.trim().toLowerCase()));

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className={`flex min-h-20 items-center gap-3 border-b border-white/5 ${collapsed ? 'justify-center px-2' : 'px-6'}`}>
        <BrandLogo dark showText={!collapsed} markClassName="h-9 w-9 rounded-xl" textClassName="text-lg italic" />
      </div>
      
      <div className="flex-1 space-y-8 overflow-y-auto p-4">
        <NavSection title={t('Operations')} items={navGroups.primary} pathname={location.pathname} onNavigate={() => setIsSidebarOpen(false)} collapsed={collapsed} />
        <NavSection title={t('Administration')} items={navGroups.admin} pathname={location.pathname} onNavigate={() => setIsSidebarOpen(false)} collapsed={collapsed} />
        <NavSection title={t('Account')} items={navGroups.account} pathname={location.pathname} onNavigate={() => setIsSidebarOpen(false)} collapsed={collapsed} />
      </div>

      <div className="border-t border-white/5 bg-slate-950/50 p-3">
        {!collapsed && <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/5 bg-slate-800/50 px-4 py-3">
           <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
              {user?.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <UserCircle size={18} />}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.displayName || t('User')}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{profile?.role}</p>
           </div>
        </div>}
        <button 
          type="button"
          aria-label={t('Sign Out')}
          onClick={() => { signOut(auth); setIsSidebarOpen(false); }}
          className={`flex min-h-11 w-full items-center gap-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:bg-white/5 hover:text-white group ${collapsed ? 'justify-center px-2' : 'px-4 py-2.5'}`}
        >
          <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
          {!collapsed && <span>{t('Sign Out')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div id="admin-layout" className={`flex h-[100dvh] overflow-hidden font-sans text-slate-900 ${isDarkMode ? 'admin-theme' : 'bg-slate-50'}`}>
      {/* Sidebar - Desktop */}
      <aside id="sidebar-desktop" className={`hidden shrink-0 flex-col border-r border-slate-200 transition-[width] duration-200 lg:flex ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <SidebarContent collapsed={isSidebarCollapsed} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              id="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside 
              id="sidebar-mobile"
              initial={{ x: isRtl ? 280 : -280 }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? 280 : -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 start-0 z-50 w-72 shadow-2xl lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t('More modules')}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[78dvh] overflow-y-auto rounded-t-[2rem] border border-slate-200 bg-white p-4 shadow-2xl lg:hidden"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
              <div className="mb-4 flex items-start justify-between px-2">
                <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('More Modules')}</p>
                <h2 className="font-display text-xl text-slate-900">{t('Workshop Menu')}</h2></div>
                <button type="button" onClick={() => setIsMoreOpen(false)} aria-label={t('Close menu')} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"><X size={17} /></button>
              </div>
              <div className="grid gap-2">
                {moreItems.map((item) => {
                  const Icon = getNavIcon(item);
                  const active = isRouteActive(location.pathname, item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black ${
                        active ? 'border-indigo-100 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Icon size={18} />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCommandOpen && <motion.div className="fixed inset-0 z-[80] flex items-start justify-center bg-atelier-ink/55 px-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) setIsCommandOpen(false); }}>
          <motion.section role="dialog" aria-modal="true" aria-label={t('Command palette')} className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <div className="flex items-center gap-3 border-b border-slate-200 px-5"><Search size={18} className="text-atelier-brass" /><input autoFocus type="search" value={commandQuery} onChange={event => setCommandQuery(event.target.value)} placeholder={t('Find a page or module')} aria-label={t('Find a page or module')} className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none" /><button type="button" onClick={() => setIsCommandOpen(false)} aria-label={t('Close command palette')} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={17} /></button></div>
            <nav aria-label={t('Quick navigation')} className="max-h-[55dvh] overflow-y-auto p-2">{commandItems.length ? commandItems.map(item => { const Icon = getNavIcon(item); return <Link key={item.to} to={item.to} onClick={() => { setIsCommandOpen(false); setCommandQuery(''); }} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-atelier-ivory hover:text-atelier-oxblood focus-visible:outline focus-visible:outline-2 focus-visible:outline-atelier-brass"><Icon size={17} />{t(item.labelKey)}<span className="ms-auto text-[10px] text-slate-400">↵</span></Link>; }) : <p className="p-5 text-center text-sm text-slate-500">{t('No matching modules')}</p>}</nav>
            <p className="border-t border-slate-200 px-5 py-3 text-[10px] font-semibold text-slate-400">{t('Use Ctrl or Command and K to open quick navigation')}</p>
          </motion.section>
        </motion.div>}
      </AnimatePresence>

      {/* Main Content */}
      <div id="main-content-wrapper" className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header id="main-header" className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:h-20 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              aria-label={t('Open navigation')}
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(true)}
              className="min-h-11 min-w-11 rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-atelier-brass lg:hidden"
            >
              <Menu size={24} />
            </button>
            <Link to="/admin" className="text-slate-800 font-bold lg:hidden flex items-center gap-2">
              <BrandLogo markClassName="h-8 w-8 rounded-xl" textClassName="text-base italic" />
            </Link>
            <div className="hidden lg:flex items-center gap-3 text-slate-400">
               <button type="button" aria-label={isSidebarCollapsed ? t('Expand sidebar') : t('Collapse sidebar')} title={isSidebarCollapsed ? t('Expand sidebar') : t('Collapse sidebar')} onClick={() => setIsSidebarCollapsed(value => !value)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><PanelLeft size={17} /></button>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80">{t(currentItem?.labelKey || 'Dashboard')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 animate-pulse">
                <WifiOff size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('Offline Mode')}</span>
              </div>
            )}
            {isOnline && (
               <div className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                 <Wifi size={10} className="text-green-500" />
                 {t('Synced')}
               </div>
            )}
            <LanguageToggle />
            <button type="button" onClick={() => { setCommandQuery(''); setIsCommandOpen(true); }} aria-label={t('Open command palette')} title={t('Open command palette')} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-atelier-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-atelier-brass"><Search size={16} /></button>
            <button type="button" onClick={() => setIsDarkMode(value => !value)} aria-label={isDarkMode ? t('Switch to light appearance') : t('Switch to dark appearance')} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-atelier-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-atelier-brass" title={isDarkMode ? t('Switch to light appearance') : t('Switch to dark appearance')}>
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-bold text-slate-900 leading-tight">{user?.displayName || t('Admin')}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{profile?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden lg:hidden">
               {user?.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full p-1.5 text-slate-400" />}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.99, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -5 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full min-h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-30 rounded-[1.5rem] border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-6 gap-1">
            {mobilePrimaryItems.map((item) => {
              const Icon = getNavIcon(item);
              const active = isRouteActive(location.pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-black uppercase tracking-tight transition-all ${
                    active ? 'bg-slate-950 text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  <span className="max-w-full truncate">{t(item.labelKey)}</span>
                </Link>
              );
            })}
            <button
              type="button"
              aria-label={t('More modules')}
              onClick={() => setIsMoreOpen(true)}
              className="flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-black uppercase tracking-tight text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700"
            >
              <MoreHorizontal size={18} />
              <span>{t('More')}</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isCreatingClient, setIsCreatingClient] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const isDemoMode = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setAuthError('');
    try {
      if (isCreatingClient) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      const errorCode = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      if (errorCode === 'auth/operation-not-allowed') {
        setAuthError(t('Email/password sign-in is not enabled for this Firebase project.'));
      } else if (errorCode === 'auth/weak-password') {
        setAuthError(t('Choose a password with at least 8 characters.'));
      } else if (errorCode === 'auth/invalid-email') {
        setAuthError(t('Enter a valid email address.'));
      } else if (errorCode === 'auth/email-already-in-use') {
        setAuthError(t('Unable to create this account. Try signing in instead.'));
      } else {
        setAuthError(t('Email or password is incorrect.'));
      }
      console.error('Email authentication failed:', errorCode || 'unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const errorCode = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      if (errorCode === 'auth/unauthorized-domain') {
        toast.error(t('Login domain unauthorized'));
        return;
      }
      toast.error(t('Login failed'));
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-atelier-ivory px-4 pb-10 text-slate-900 sm:px-6">
      <nav className="mx-auto flex max-w-6xl items-center justify-between py-6 sm:py-8">
        <Link to="/" aria-label={t('Home')}><BrandLogo dark markClassName="h-10 w-10 rounded-xl" textClassName="text-lg sm:text-xl" /></Link>
        <LanguageToggle />
      </nav>
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(36,25,17,.16)] md:grid-cols-[.9fr_1.1fr]">
          <div className="relative flex min-h-48 flex-col justify-between overflow-hidden bg-atelier-ink text-white md:min-h-[620px] md:p-10">
            <AtelierImage src="https://images.unsplash.com/photo-1594932224828-b4b059b6f6f9?q=85&w=1200&auto=format&fit=crop" alt={t('A tailor carefully shaping a bespoke jacket')} aspect="absolute inset-0" priority imageClassName="[filter:sepia(.18)_saturate(.78)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-atelier-ink/90 via-atelier-ink/15 to-atelier-ink/35" />
            <div className="relative z-10 hidden md:block"><p className="atelier-eyebrow">{t('The atelier, digitised')}</p><h1 className="font-display mt-7 max-w-sm text-5xl italic leading-tight">{t('A fit that feels')}<br />{t('like you.')}</h1></div>
            <div className="relative z-10 p-6 md:p-0"><p className="max-w-sm text-sm leading-7 text-white/80">{t('Thoughtful tailoring, made around your measurements, your style, and the way you want to feel.')}</p><p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-atelier-brass">{t('Private client access')}</p></div>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mb-8 space-y-2">
              <p className="atelier-eyebrow">{t('Welcome')}</p>
              <h2 className="font-display text-3xl tracking-tight text-slate-950">{isCreatingClient ? t('Create your client account') : t('Sign in to your account')}</h2>
              <p className="text-sm leading-6 text-slate-500">{isCreatingClient ? t('Create an account to manage your quotes and orders.') : t('Access your tailoring workspace and client portal.')}</p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs font-bold text-slate-700">{t('Email address')}</label>
                <input id="login-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-atelier-brass focus:ring-2 focus:ring-atelier-brass/20" placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-700">{t('Password')}</label>
                <input id="login-password" type="password" autoComplete={isCreatingClient ? 'new-password' : 'current-password'} minLength={isCreatingClient ? 8 : undefined} required value={password} onChange={event => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-atelier-brass focus:ring-2 focus:ring-atelier-brass/20" placeholder={t('Enter your password')} />
              </div>

              {authError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{authError}</p>}

              <button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60">
                {isSubmitting ? t('Please wait…') : isCreatingClient ? t('Create client account') : t('Sign in with email')}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-slate-200" />{t('or continue with')}<span className="h-px flex-1 bg-slate-200" /></div>
            <button type="button" onClick={handleLogin} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              <UserCircle size={19} aria-hidden="true" /> {t('Sign in with Google')}
            </button>

            <p className="mt-5 text-center text-sm text-slate-500">
              {isCreatingClient ? t('Already have an account?') : t('New to the client portal?')}{' '}
              <button type="button" onClick={() => { setIsCreatingClient(value => !value); setAuthError(''); }} className="font-bold text-indigo-700 underline-offset-4 hover:underline">{isCreatingClient ? t('Sign in') : t('Create a client account')}</button>
            </p>
            {isCreatingClient && <p className="mt-3 text-center text-xs leading-5 text-slate-400">{t('New accounts receive client access. Staff access is assigned by an administrator.')}</p>}

            {isDemoMode && (
              <aside className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-label={t('Local demo credentials')}>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-800">{t('Local demo admin')}</p>
                <p className="mt-2 text-xs leading-5 text-emerald-900">{t('Use these credentials only with the local Firebase emulators.')}</p>
                <dl className="mt-3 grid gap-4 text-xs text-emerald-950">
                  <div className="space-y-1"><dt className="font-bold">{t('Admin')}</dt><dd className="font-mono">demo.admin@tailoringerp.test</dd><dd className="font-mono">TailorDemo!2026</dd></div>
                  <div className="space-y-1 border-t border-emerald-200 pt-3"><dt className="font-bold">{t('Client')}</dt><dd className="font-mono">demo.client@tailoringerp.test</dd><dd className="font-mono">TailorClient!2026</dd></div>
                </dl>
              </aside>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

function AppContent() {
  const { user, profile, loading, isAdmin } = useUser();
  const location = useLocation();
  const { i18n } = useTranslation();
  const role = profile?.role;
  const landingPath = getRoleLandingPath(role);
  const state = location.state as { from?: string } | null;
  const requestedPath = state?.from;
  const postLoginPath = role === 'client' && requestedPath?.startsWith('/client') ? requestedPath : landingPath;

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  if (loading && !canRenderBeforeAuthReady(location.pathname)) return (
    <div className="h-[100dvh] flex items-center justify-center bg-slate-50">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <Scissors size={48} className="text-indigo-600" />
      </motion.div>
    </div>
  );

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={postLoginPath} />} />

      <Route path="/client" element={
        user && canAccessClientRoutes(role) ? (
          <ClientDashboard />
        ) : user ? (
          <Navigate to={landingPath} />
        ) : (
          <Navigate to="/login" state={{ from: location.pathname }} />
        )
      } />

      <Route path="/client/request-quote" element={
        user && canAccessClientRoutes(role) ? (
          <RequestQuote />
        ) : user ? (
          <Navigate to={landingPath} />
        ) : (
          <Navigate to="/login" state={{ from: location.pathname }} />
        )
      } />
      
      {/* Protected Admin Routes */}
      <Route path="/admin/*" element={
        user && canAccessAdminRoutes(role) ? (
          <AdminLayout>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="quotes" element={<QuoteRequests />} />
                <Route path="clients" element={<Clients />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="inventory" element={<Inventory />} />

                {/* Restricted Admin only routes */}
                <Route path="vendors" element={isAdmin ? <Vendors /> : <Navigate to="/admin" />} />
                <Route path="accounting" element={isAdmin ? <Accounting /> : <Navigate to="/admin" />} />
                <Route path="employees" element={isAdmin ? <Employees /> : <Navigate to="/admin" />} />
                <Route path="branches" element={isAdmin ? <Branches /> : <Navigate to="/admin" />} />
                <Route path="profile" element={<Profile />} />

                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Suspense>
          </AdminLayout>
        ) : user ? (
          <Navigate to="/" />
        ) : (
          <Navigate to="/login" state={{ from: location.pathname }} />
        )
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <UserProvider>
          <Toaster position="bottom-right" />
          <AppContent />
        </UserProvider>
      </Router>
    </MotionConfig>
  );
}

