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
  WifiOff
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
import { canAccessAdminRoutes, canAccessClientRoutes, getRoleLandingPath } from './lib/roleRouting';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SidebarItem = ({ to, icon: Icon, label, active, key }: { to: string, icon: any, label: string, active: boolean, key?: string }) => (
  <Link 
    to={to} 
    key={key}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
      active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm font-medium">{label}</span>
    {active && <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
  </Link>
);

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, profile, isAdmin } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const { t, i18n } = useTranslation();

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

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: t('Dashboard'), adminOnly: false },
    { to: "/admin/orders", icon: ShoppingBag, label: t('Work Orders'), adminOnly: false },
    { to: "/admin/clients", icon: Users, label: t('Clients'), adminOnly: false },
    { to: "/admin/appointments", icon: Calendar, label: t('Appointments'), adminOnly: false },
    { to: "/admin/inventory", icon: Package, label: t('Inventory'), adminOnly: false },
    { to: "/admin/vendors", icon: Truck, label: t('Vendors'), adminOnly: true },
    { to: "/admin/accounting", icon: BookOpen, label: t('General Ledger'), adminOnly: true },
    { to: "/admin/employees", icon: UserCircle, label: t('Employees'), adminOnly: true },
    { to: "/admin/branches", icon: MapPin, label: t('Branches'), adminOnly: true },
    { to: "/admin/profile", icon: UserCircle, label: t('My Profile'), adminOnly: false },
  ];

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
        <BrandLogo dark markClassName="h-9 w-9 rounded-xl" textClassName="text-lg italic" />
      </div>
      
      <div className="p-4 flex-1 space-y-6 overflow-y-auto">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-3 px-3 tracking-widest opacity-60">Main Menu</div>
          <nav className="space-y-1">
            {visibleNavItems.map((item) => (
              <div key={item.to} onClick={() => setIsSidebarOpen(false)}>
                <SidebarItem 
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname === item.to} 
                />
              </div>
            ))}
          </nav>
        </div>
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
    <div id="admin-layout" className="flex h-[100dvh] bg-slate-50 overflow-hidden font-sans text-slate-900 border-t-2 border-indigo-600">
      {/* Sidebar - Desktop */}
      <aside id="sidebar-desktop" className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200">
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

      {/* Main Content */}
      <div id="main-content-wrapper" className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header id="main-header" className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <Link to="/admin" className="text-slate-800 font-bold lg:hidden flex items-center gap-2">
              <BrandLogo markClassName="h-8 w-8 rounded-xl" textClassName="text-base italic" />
            </Link>
            <div className="hidden lg:flex items-center gap-2 text-slate-400">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80">{location.pathname.split('/').slice(-1)[0] || 'Dashboard'}</span>
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
  const role = profile?.role;
  const landingPath = getRoleLandingPath(role);
  const state = location.state as { from?: string } | null;
  const requestedPath = state?.from;
  const postLoginPath = role === 'client' && requestedPath?.startsWith('/client') ? requestedPath : landingPath;

  if (loading) return (
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

