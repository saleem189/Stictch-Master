import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  MoreHorizontal
} from 'lucide-react';
import React from 'react';
import { auth } from './lib/firebase';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { UserProvider, useUser } from './contexts/UserContext';
import NotificationBell from './components/NotificationBell';
import LanguageToggle from './components/LanguageToggle';
import BrandLogo from './components/BrandLogo';
import { toast, Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Vendors from './pages/Vendors';
import Accounting from './pages/Accounting';
import Employees from './pages/Employees';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';
import Branches from './pages/Branches';
import ClientDashboard from './pages/ClientDashboard';
import RequestQuote from './pages/RequestQuote';
import QuoteRequests from './pages/QuoteRequests';
import { canAccessAdminRoutes, canAccessClientRoutes, getRoleLandingPath } from './lib/roleRouting';
import { canRenderBeforeAuthReady } from './lib/publicRoutes';
import { adminNavItems, getAdminNavGroups, getPrimaryMobileAdminNavItems, type AdminNavItemConfig } from './lib/adminNavigation';

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

const isRouteActive = (pathname: string, to: string) => (
  to === '/admin' ? pathname === '/admin' : pathname === to || pathname.startsWith(`${to}/`)
);

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: React.ElementType, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
      active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm font-black">{label}</span>
    {active && <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
  </Link>
);

const NavSection = ({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: AdminNavItemConfig[];
  pathname: string;
  onNavigate?: () => void;
}) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-3 px-3 text-[10px] font-black uppercase tracking-widest text-slate-500/80">{title}</div>
      <nav className="space-y-1">
        {items.map((item) => (
          <div key={item.to} onClick={onNavigate}>
            <SidebarItem
              to={item.to}
              icon={getNavIcon(item)}
              label={t(item.labelKey)}
              active={isRouteActive(pathname, item.to)}
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
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const { t } = useTranslation();

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
  const mobilePrimaryItems = React.useMemo(() => getPrimaryMobileAdminNavItems(navGroups), [navGroups]);
  const moreItems = React.useMemo(
    () => adminNavItems.filter(item => !mobilePrimaryItems.some(primary => primary.to === item.to) && (!item.adminOnly || isAdmin)),
    [isAdmin, mobilePrimaryItems]
  );
  const currentItem = React.useMemo(
    () => adminNavItems.find(item => isRouteActive(location.pathname, item.to)),
    [location.pathname]
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="flex min-h-20 items-center gap-3 border-b border-white/5 px-6">
        <BrandLogo dark markClassName="h-9 w-9 rounded-xl" textClassName="text-lg italic" />
      </div>
      
      <div className="flex-1 space-y-8 overflow-y-auto p-4">
        <NavSection title={t('Operations')} items={navGroups.primary} pathname={location.pathname} onNavigate={() => setIsSidebarOpen(false)} />
        <NavSection title={t('Administration')} items={navGroups.admin} pathname={location.pathname} onNavigate={() => setIsSidebarOpen(false)} />
        <NavSection title={t('Account')} items={navGroups.account} pathname={location.pathname} onNavigate={() => setIsSidebarOpen(false)} />
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-950/50">
        <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-slate-800/50 rounded-xl border border-white/5">
           <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
              {user?.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <UserCircle size={18} />}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.displayName || 'User'}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{profile?.role}</p>
           </div>
        </div>
        <button 
          onClick={() => { signOut(auth); setIsSidebarOpen(false); }}
          className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-white transition-colors w-full text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/5 group"
        >
          <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div id="admin-layout" className="flex h-[100dvh] bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar - Desktop */}
      <aside id="sidebar-desktop" className="hidden w-72 shrink-0 flex-col border-r border-slate-200 lg:flex">
        <SidebarContent />
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
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden shadow-2xl"
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
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[78dvh] overflow-y-auto rounded-t-[2rem] border border-slate-200 bg-white p-4 shadow-2xl lg:hidden"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
              <div className="mb-4 px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('More Modules')}</p>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900">{t('Workshop Menu')}</h2>
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

      {/* Main Content */}
      <div id="main-content-wrapper" className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header id="main-header" className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:h-20 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <Link to="/admin" className="text-slate-800 font-bold lg:hidden flex items-center gap-2">
              <BrandLogo markClassName="h-8 w-8 rounded-xl" textClassName="text-base italic" />
            </Link>
            <div className="hidden lg:flex items-center gap-2 text-slate-400">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80">{t(currentItem?.labelKey || 'Dashboard')}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 animate-pulse">
                <WifiOff size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Offline Mode</span>
              </div>
            )}
            {isOnline && (
               <div className="hidden sm:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-300">
                 <Wifi size={10} className="text-green-500" />
                 Synced
               </div>
            )}
            <LanguageToggle />
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-bold text-slate-900 leading-tight">{user?.displayName || 'Admin'}</span>
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
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
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
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col">
      <nav className="p-8">
        <Link to="/" className="flex items-center gap-2">
          <BrandLogo dark markClassName="h-11 w-11 rounded-2xl" textClassName="text-xl" />
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-3xl shadow-2xl">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{t('Admin Portal')}</h2>
            <p className="text-slate-500 font-medium">
              {t('Admin Portal Description')}
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
          >
            <UserCircle size={20} />
            {t('Sign in with Google')}
          </button>
        </div>
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
          </AdminLayout>
        ) : user ? (
          <Navigate to="/" />
        ) : (
          <Navigate to="/login" state={{ from: location.pathname }} />
        )
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <UserProvider>
        <Toaster position="bottom-right" />
        <AppContent />
      </UserProvider>
    </Router>
  );
}

