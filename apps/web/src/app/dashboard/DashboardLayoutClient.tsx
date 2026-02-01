'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
 LayoutGrid,
 Bot,
 MessageSquare,
 BarChart3,
 Users,
 Calendar,
 CalendarCheck,
 Globe,
 Puzzle,
 Settings,
 Menu,
 X,
 LogOut,
 Languages,
 Star,
 ChevronDown,
 Zap,
 Megaphone,
 CreditCard,
} from 'lucide-react';
import { useTranslation, LANGUAGES, type Language } from '@/lib/i18n';
import { useSessionActivity } from '@/hooks/useSessionActivity';
import { PearlBackground } from '@/components/dashboard/ui';
import { Bell } from 'lucide-react';
import { logout } from '@/lib/authHeaders';
import { ensureClientUser } from '@/lib/ensureClientUser';

interface NavItem {
 nameKey: string;
 href: string;
 icon: React.ElementType;
}

interface NavGroup {
 label: string;
 icon: React.ElementType;
 items: NavItem[];
 defaultOpen?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 const router = useRouter();
 const { t, currentLang, setLanguage } = useTranslation();

 // Monitora l'attività dell'utente per mantenere la sessione attiva
 useSessionActivity();

 // Grouped navigation
 const navGroups: NavGroup[] = [
  {
   label: 'Chatbot',
   icon: Bot,
   defaultOpen: true,
   items: [
    { nameKey: 'nav.bots', href: '/dashboard/bots', icon: Bot },
    { nameKey: 'nav.conversations', href: '/dashboard/conversations', icon: MessageSquare },
    { nameKey: 'nav.reviewBot', href: '/dashboard/review-bot', icon: Star },
   ]
  },
  {
   label: 'Marketing',
   icon: Megaphone,
   defaultOpen: true,
   items: [
    { nameKey: 'nav.analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { nameKey: 'nav.leads', href: '/dashboard/leads', icon: Users },
   ]
  },
  {
   label: 'Scheduling',
   icon: Calendar,
   items: [
    { nameKey: 'nav.calendar', href: '/dashboard/calendar', icon: Calendar },
    { nameKey: 'nav.bookings', href: '/dashboard/bookings', icon: CalendarCheck },
   ]
  },
  {
   label: 'Tools',
   icon: Zap,
   items: [
    { nameKey: 'nav.scraping', href: '/dashboard/scraping', icon: Globe },
    { nameKey: 'nav.integrations', href: '/dashboard/integrations', icon: Puzzle },
   ]
  },
 ];

 const [userEmail, setUserEmail] = useState('');
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [loading, setLoading] = useState(true);
 const [showLangMenu, setShowLangMenu] = useState(false);
 const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
  const initial: Record<string, boolean> = {};
  navGroups.forEach(group => {
   initial[group.label] = group.defaultOpen ?? false;
  });
  return initial;
 });

 // Auto-open group containing current page
 useEffect(() => {
  navGroups.forEach(group => {
   const hasActiveItem = group.items.some(item =>
    item.href === '/dashboard'
     ? pathname === '/dashboard'
     : pathname === item.href || pathname.startsWith(item.href + '/')
   );
   if (hasActiveItem) {
    setOpenGroups(prev => ({ ...prev, [group.label]: true }));
   }
  });
 }, [pathname]);

 const toggleGroup = (label: string) => {
  setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
 };

 useEffect(() => {
  const checkAuth = async () => {
   const user = await ensureClientUser();
   if (!user) {
    document.cookie = 'auth_session=; path=/; max-age=0';
    router.replace('/auth/login');
    return;
   }

   setUserEmail(user.email || 'user@example.com');
   setIsAuthenticated(true);
   setLoading(false);
  };

  void checkAuth();
 }, [router]);

 const handleLogout = () => {
  logout();
 };

 if (loading || !isAuthenticated) {
  return (
   <div className="min-h-screen bg-pearl-50 flex items-center justify-center">
    <div className="text-silver-700">Loading...</div>
   </div>
  );
 }

 const renderNavItem = (item: NavItem, onClick?: () => void) => {
  const Icon = item.icon;
  const isActive = item.href === '/dashboard'
   ? pathname === '/dashboard'
   : pathname === item.href || pathname.startsWith(item.href + '/');
  return (
   <Link
    key={item.nameKey}
    href={item.href}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
     isActive
      ? 'bg-pearl-100 border-l-2 border-emerald text-charcoal'
      : 'text-silver-700 hover:text-charcoal hover:bg-pearl-100/60'
    }`}
   >
    <Icon size={16} />
    <span>{t(item.nameKey)}</span>
   </Link>
  );
 };

 const renderSidebar = (isMobile = false) => (
  <nav className="space-y-1">
   {/* Dashboard - always visible */}
   <Link
    href="/dashboard"
    onClick={isMobile ? () => setSidebarOpen(false) : undefined}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
     pathname === '/dashboard'
      ? 'bg-pearl-100 border-l-2 border-emerald text-charcoal'
      : 'text-silver-700 hover:text-charcoal hover:bg-pearl-100/60'
    }`}
   >
    <LayoutGrid size={18} />
    <span>{t('nav.dashboard')}</span>
   </Link>

   {/* Grouped navigation */}
   {navGroups.map(group => {
    const GroupIcon = group.icon;
    const isOpen = openGroups[group.label];
    const hasActiveItem = group.items.some(item =>
     pathname === item.href || pathname.startsWith(item.href + '/')
    );

    return (
     <div key={group.label} className="pt-2">
      <button
       onClick={() => toggleGroup(group.label)}
       className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
        hasActiveItem ? 'text-charcoal' : 'text-silver-600 hover:text-charcoal'
       }`}
      >
       <div className="flex items-center gap-3">
        <GroupIcon size={16} />
        <span>{group.label}</span>
       </div>
       <ChevronDown
        size={14}
        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
       />
      </button>

      {isOpen && (
       <div className="mt-1 ml-3 pl-3 border-l border-silver-200 space-y-0.5">
        {group.items.map(item => renderNavItem(item, isMobile ? () => setSidebarOpen(false) : undefined))}
       </div>
      )}
     </div>
    );
   })}

   {/* Billing & Settings - always visible at bottom */}
   <div className="pt-4 mt-4 border-t border-silver-200">
    <Link
     href="/dashboard/billing"
     onClick={isMobile ? () => setSidebarOpen(false) : undefined}
     className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
      pathname === '/dashboard/billing'
       ? 'bg-pearl-100 border-l-2 border-emerald text-charcoal'
       : 'text-silver-700 hover:text-charcoal hover:bg-pearl-100/60'
     }`}
    >
     <CreditCard size={16} />
     <span>{t('nav.billing')}</span>
    </Link>
    <Link
     href="/dashboard/settings"
     onClick={isMobile ? () => setSidebarOpen(false) : undefined}
     className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
      pathname === '/dashboard/settings'
       ? 'bg-pearl-100 border-l-2 border-emerald text-charcoal'
       : 'text-silver-700 hover:text-charcoal hover:bg-pearl-100/60'
     }`}
    >
     <Settings size={16} />
     <span>{t('nav.settings')}</span>
    </Link>
   </div>
  </nav>
 );

 return (
  <div className="relative min-h-screen overflow-x-hidden">
   {/* Dashboard Background */}
   <PearlBackground />

   {/* Header */}
   <header className="relative z-40 glass-effect sticky top-0">
    <div className="container mx-auto px-4 py-4">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
       {/* Mobile menu button */}
       <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden p-2 rounded-lg hover:bg-pearl-100/60 text-silver-600"
       >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
       </button>
       <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.svg"
          alt="Omnical Studio"
          width={40}
          height={40}
          className="w-10 h-10 rounded-lg shadow-lg"
          priority
          unoptimized
        />
        <span className="font-serif font-bold text-lg tracking-wide text-charcoal">Studio</span>
       </Link>
      </div>
      <div className="flex items-center gap-4">
       <div className="p-2 rounded-full cursor-pointer hover:bg-pearl-100/60">
        <Bell size={20} className="text-silver-700" />
       </div>
       <span className="text-sm text-silver-600 font-medium hidden sm:block">
        {userEmail}
       </span>

       {/* Language Selector */}
       <div className="relative">
        <button
         onClick={() => setShowLangMenu(!showLangMenu)}
         className="flex items-center gap-2 text-sm text-silver-600 hover:text-charcoal font-medium p-2 rounded-lg hover:bg-pearl-100/60"
         aria-label="Select Language"
        >
         <Languages size={16} />
         <span className="hidden sm:inline">{currentLang ? currentLang.toUpperCase() : 'EN'}</span>
        </button>

        {showLangMenu && (
         <>
          <div
           className="fixed inset-0 z-10"
           onClick={() => setShowLangMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 glass-effect rounded-lg shadow-lg py-2 z-20 max-h-96 overflow-y-auto">
           {Object.entries(LANGUAGES).map(([code, name]) => (
            <button
             key={code}
             onClick={() => {
              setLanguage(code as Language);
              setShowLangMenu(false);
             }}
             className={`w-full text-left px-4 py-2 text-sm hover:bg-pearl-100/60 transition-colors ${
              currentLang === code ? 'bg-pearl-100 text-charcoal font-medium' : 'text-silver-700'
             }`}
            >
             {name}
            </button>
           ))}
          </div>
         </>
        )}
       </div>

       <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-silver-600 hover:text-red-600 hover:bg-red-500/10 font-medium p-2 rounded-lg transition-colors"
       >
        <LogOut size={16} />
        <span className="hidden sm:inline">{t('auth.logout')}</span>
       </button>
      </div>
     </div>
    </div>
   </header>

   <div className="relative z-10 container mx-auto px-4 py-8">
    <div className="flex flex-col lg:flex-row gap-8">
     {/* Sidebar - Desktop */}
     <aside className="hidden lg:block w-56 flex-shrink-0">
      <div className="glass-effect rounded-xl p-3 sticky top-24">
       {renderSidebar()}
      </div>
     </aside>

     {/* Sidebar - Mobile */}
     {sidebarOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
       <div
        className="absolute inset-0 bg-charcoal/30"
        onClick={() => setSidebarOpen(false)}
       />
       <aside className="absolute left-0 top-0 bottom-0 w-64 glass-effect shadow-xl">
        <div className="p-4 border-b border-silver-200/70">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Omnical Studio"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg shadow-lg"
            priority
            unoptimized
          />
           <span className="font-serif font-bold text-lg tracking-wide text-charcoal">Studio</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-pearl-100/60 rounded-lg text-silver-700">
           <X size={20} />
          </button>
         </div>
        </div>
        <div className="p-4">
         {renderSidebar(true)}
        </div>
       </aside>
      </div>
     )}

     {/* Main Content */}
     <main className="flex-1 min-w-0">{children}</main>
    </div>
   </div>
  </div>
 );
}





