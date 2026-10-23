// App.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiPost } from './api'; // ✅ FIX: axios installed nahi tha, isliye existing fetch-based helper use kiya
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import PageLoader from './components/PageLoader';
import './App.css';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Earnings from './pages/Earnings ';
import Dashboard from './pages/Dashboard';
import MyDeliveries from './pages/Mydeliveries';
import DeliveryMap from './pages/DeliveryMap';
import TermsPage from './pages/terms';
import PrivacyPage from './pages/Privacy';
import WarehouseMap from './pages/WarehouseMap';
import { useFCM, syncPendingFcmToken, setFcmNavigateHandler } from './hooks/useFCM';
import { useIncomingOrder } from './hooks/useIncomingOrder'; // ✅ FIX: missing import — incomingOrder/dismiss yahin se aate hain
import { setupIonicReact } from '@ionic/react';
import HelpSupport from './pages/Helpsupport';
import IncomingOrderModal from './components/IncomingOrderModal';
import OrderDetail from './pages/Orderdetail ';

export type Page =
  | 'dashboard'
  | 'orders'
  | 'orderDetail'
  | 'deliverymap'
  | 'warehousemap'
  | 'vendors'
  | 'areas'
  | 'users'
  | 'earnings'
  | 'profile'
  | 'notifications'
  | 'terms'
  | 'help'
  | 'settings'
  | 'privacy';

const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  orderDetail: 'Order Detail',
  deliverymap: 'Live Delivery',
  warehousemap: 'Warehouse Map',
  vendors: 'Vendors',
  areas: 'Areas',
  users: 'Users',
  earnings: 'Earnings',
  profile: 'Profile',
  notifications: 'Notifications',
  terms: 'Terms & Conditions',
  help: 'Help & Support',
  privacy: 'Privacy Policy',
  settings: 'Settings', // ← was missing

};

const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

// ✅ FIX: auth_user key se read karo (Login.tsx jo save karta hai)
const getLoggedInUser = (): { name: string; email: string } => {
  try {
    const userStr = localStorage.getItem('auth_user'); // ✅ auth_user — Login saves this
    if (userStr) {
      const parsed = JSON.parse(userStr);
      return { name: parsed.name || 'User', email: parsed.email || '' };
    }
  } catch { /* empty */ }
  return { name: 'User', email: '' };
};

// ✅ FIX: auth_token check karo login state ke liye
const checkIsLoggedIn = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

const navItems: {
  id: Page;
  label: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
}[] = [
    {
      id: 'dashboard', label: 'Dashboard', iconBg: '#EEF2FF', iconColor: '#6366f1',
      icon: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
    },
    {
      id: 'earnings', label: 'Earnings', iconBg: '#ECFDF5', iconColor: '#10b981',
      icon: (<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
    },
    {
      id: 'profile', label: 'Profile', iconBg: '#EDE9FE', iconColor: '#8b5cf6',
      icon: (<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
    },
    {
      id: 'notifications', label: 'Notifications', iconBg: '#FEF3C7', iconColor: '#f59e0b',
      icon: (<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>),
    },
    {
      id: 'help', label: 'Help & Support', iconBg: '#F3F4F6', iconColor: '#6b7280',
      icon: (<><path d="M12 12h.01M12 16h.01M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></>),
    },

  ];

interface DropdownProps {
  userName: string;
  userEmail: string;
  isOnline: boolean;
  onToggleOnline: () => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const ProfileDropdown: React.FC<DropdownProps> = ({
  userName, userEmail, isOnline, onToggleOnline, onNavigate, onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f97316', border: 'none', borderRadius: 12, padding: '6px 10px', cursor: 'pointer' }}
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#a5b4fc,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
          {getInitials(userName)}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userName.split(' ')[0]}
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" style={{ transition: 'transform 0.22s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'white', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)', width: 240, zIndex: 9999, overflow: 'hidden', transformOrigin: 'top right', transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-8px)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.18s ease' }}>
        <div style={{ background: 'linear-gradient(135deg,#1A1714,#2D2520)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16, flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.45)' }}>
              {getInitials(userName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              {userEmail ? (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
              ) : (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Delivery rider</div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleOnline(); }}
            style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#4ade80' : 'rgba(255,255,255,0.35)', display: 'inline-block', flexShrink: 0 }} />
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>

        {navItems.map((item) => (
          <div key={item.id} onClick={() => { setOpen(false); onNavigate(item.id); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid #F5F3F0', transition: 'background 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF8F5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: item.iconBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={item.iconColor} strokeWidth="1.8">{item.icon}</svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1714' }}>{item.label}</span>
          </div>
        ))}

        <div onClick={() => { onLogout(); setOpen(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEE2E2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>Log Out</span>
        </div>
      </div>
    </div>
  );
};


setupIonicReact();
/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
const App: React.FC = () => {
  useFCM();
  const { incomingOrder, dismiss } = useIncomingOrder(); // ✅ FIX: hook se incomingOrder/dismiss lo
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const [selectedOrderId, setSelectedOrderId] = useState<number | string | undefined>(undefined);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string | undefined>(undefined);

  // ✅ FIX: auth_token se check karo, admin_auth nahi
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => checkIsLoggedIn());
  const [showRegister, setShowRegister] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(() => getLoggedInUser());
  const refreshUser = () => setLoggedInUser(getLoggedInUser());

  const [warehouseLat, setWarehouseLat] = useState<number>(0);
  const [warehouseLng, setWarehouseLng] = useState<number>(0);
  const [warehouseName, setWarehouseName] = useState<string>('');
  const [currentOrder, setCurrentOrder] = useState<{ id: number; status: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const navigateTo = useCallback(
    (page: Page) => {
      if (page === activePage) { setSidebarOpen(false); return; }
      setPageLoading(true);
      setSidebarOpen(false);
      setTimeout(() => {
        setActivePage(page);
        setPageLoading(false);
      }, 600);
    },
    [activePage]
  );

  const navigateToOrderDetail = useCallback(
    (orderId: number | string, status?: string) => {
      setSelectedOrderId(orderId);
      setSelectedOrderStatus(status);

      const s = String(status ?? '').toLowerCase();

      if (s === 'on_the_way' || s === 'picked') {
        setPageLoading(true);
        setSidebarOpen(false);
        setTimeout(() => {
          setActivePage('deliverymap');
          setPageLoading(false);
        }, 300);
      } else {
        navigateTo('orderDetail');
      }
    },
    [navigateTo]
  );

  // ✅ FIX: handleLogin — auth_token already save ho chuka hai OtpVerify mein
  // Bas state update karo aur user refresh karo
  const handleLogin = () => {
    setIsLoggedIn(true);
    refreshUser();
    syncPendingFcmToken();
  };

  useEffect(() => {
    setFcmNavigateHandler((data) => {
      if (data.type === 'delivery_assigned' && data.order_id) {
        navigateToOrderDetail(Number(data.order_id));
      } else if (data.type === 'order_status' && data.order_id) {
        navigateToOrderDetail(Number(data.order_id), data.status);
      }
    });
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    // ✅ FIX: sab relevant keys clear karo
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('userName');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const handleMapBack = useCallback(() => {
    setSelectedOrderStatus(undefined);
    navigateTo('dashboard');
  }, [navigateTo]);

  const handleMapDelivered = useCallback(() => {
    setSelectedOrderStatus(undefined);
    navigateTo('dashboard');
  }, [navigateTo]);

  const openWarehouseMap = (lat: number, lng: number, name?: string, orderId?: number) => {
    setWarehouseLat(lat);
    setWarehouseLng(lng);
    setWarehouseName(name ?? '');
    if (orderId) setCurrentOrder({ id: orderId, status: 'pending' });
    setActivePage('warehousemap');
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      // ✅ FIX: apiPost khud token attach karta hai (api.ts mein), alag se header dene ki zaroorat nahi
      await apiPost(`orders/${orderId}/accept-order`, {});
    } catch (e) {
      console.error('Accept failed', e);
    } finally {
      dismiss();
      navigateToOrderDetail(Number(orderId));
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await apiPost(`orders/${orderId}/reject-order`, {});
    } catch (e) {
      console.error('Reject failed', e);
    } finally {
      dismiss();
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={navigateTo}
            onOrderClick={navigateToOrderDetail}
            onWarehouseMap={openWarehouseMap}
          />
        );

      case 'orders':
        return <MyDeliveries />;

      case 'orderDetail':
        return (
          <OrderDetail
            onNavigate={navigateTo}
            orderId={selectedOrderId}
          />
        );

      case 'deliverymap':
        return selectedOrderId ? (
          <DeliveryMap
            orderId={selectedOrderId}
            initialStatus={selectedOrderStatus}
            onBack={handleMapBack}
            onDelivered={handleMapDelivered}
          />
        ) : null;

      case 'warehousemap':
        return (
          <WarehouseMap
            warehouseLat={warehouseLat}
            warehouseLng={warehouseLng}
            warehouseName={warehouseName}
            orderId={currentOrder?.id ?? 0}
            onBack={() => navigateTo('dashboard')}
          />
        );

      case 'earnings':
        return <Earnings />;
      case 'help':
        return <HelpSupport onBack={() => navigateTo('dashboard')} onNavigate={function (page: Page): void {
          throw new Error('Function not implemented.');
        }} />;
      case 'profile':
        return <Profile onLogout={handleLogout} />;

      case 'notifications':
        return <Notifications />;

      case 'terms':
        return <TermsPage onBack={() => navigateTo('dashboard')} />;

      case 'privacy':
        return <PrivacyPage onBack={() => navigateTo('dashboard')} />;

      default:
        return (
          <Dashboard
            onNavigate={navigateTo}
            onOrderClick={navigateToOrderDetail}
            onWarehouseMap={openWarehouseMap}
          />
        );
    }
  };

  if (loading) return <PageLoader message="Starting up…" />;

  if (!isLoggedIn && activePage === 'terms') {
    return <TermsPage onBack={() => setActivePage('dashboard')} />;
  }

  if (!isLoggedIn && activePage === 'privacy') {
    return <PrivacyPage onBack={() => setActivePage('dashboard')} />;
  }

  if (!isLoggedIn) {
    return showRegister ? (
      <Register onBack={() => setShowRegister(false)} />
    ) : (
      <Login
        onLogin={handleLogin}
        onRegisterClick={() => setShowRegister(true)}
        onTermsClick={() => setActivePage('terms')}
        onPrivacyClick={() => setActivePage('privacy')}
      />
    );
  }

  return (
    <div className="app-root">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        activePage={activePage}
        setActivePage={navigateTo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="main-content">
        {activePage !== 'deliverymap' && (
          <header className="top-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => navigateTo('dashboard')}
                aria-label="Go back"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid #E7E2DC',
                  background: '#fff',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h1 className="header-title">{PAGE_LABELS[activePage]}</h1>
            </div>
            <div className="header-actions">
              <ProfileDropdown
                userName={loggedInUser.name}
                userEmail={loggedInUser.email}
                isOnline={isOnline}
                onToggleOnline={() => setIsOnline((v) => !v)}
                onNavigate={navigateTo}
                onLogout={handleLogout}
              />
            </div>
          </header>
        )}
        <main className="page-wrapper">
          {pageLoading
            ? <PageLoader message={`Loading ${PAGE_LABELS[activePage]}…`} />
            : renderPage()
          }
        </main>
      </div>
      <IncomingOrderModal
        order={incomingOrder}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
      />
    </div>
  );
};

export default App;