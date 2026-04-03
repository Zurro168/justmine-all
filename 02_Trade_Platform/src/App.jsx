import React, { lazy, Suspense } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { useStore } from './store/useStore';

// Lazy load all pages so module-level errors (e.g. leaflet init) don't crash the whole app
const HomePage       = lazy(() => import('./pages/Home'));
const MarketPage     = lazy(() => import('./pages/Market'));
const CorporatePage  = lazy(() => import('./pages/Corporate'));
const DashboardPage  = lazy(() => import('./pages/Dashboard'));
const LogisticsPage  = lazy(() => import('./pages/Logistics'));
const KnowledgeBase  = lazy(() => import('./pages/KnowledgeBase'));
const FinancePage    = lazy(() => import('./pages/Finance'));
const DocumentsPage  = lazy(() => import('./pages/Documents'));
const RiskControlPage = lazy(() => import('./pages/RiskControl'));
const OrgChartPage   = lazy(() => import('./pages/OrgChart'));
const AIConsole      = lazy(() => import('./pages/AIConsole'));
const SandboxPage    = lazy(() => import('./pages/Sandbox'));

// Error Boundary to catch and display any runtime crashes visibly
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'monospace', padding: 40, background: '#fee2e2', minHeight: '100vh' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 16 }}>🔴 页面运行错误（已捕获）</h2>
          <pre style={{ background: '#fff', padding: 20, borderRadius: 8, overflow: 'auto', fontSize: 12, border: '1px solid #fca5a5' }}>
            {this.state.error.toString()}{'\n\n'}{this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '8px 24px', cursor: 'pointer', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8 }}>
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Loader = () => (
  <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mr-3" />
    <span className="text-sm">加载中…</span>
  </div>
);

const App = () => {
  const { activeTab, setActiveTab } = useStore();

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, setActiveTab]);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-blue-200">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12 min-h-[calc(100vh-400px)]">
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            {activeTab === 'home'        && <HomePage />}
            {activeTab === 'market'      && <MarketPage mode="prices" />}
            {activeTab === 'corporate'   && <CorporatePage />}
            {activeTab === 'dashboard'   && <DashboardPage />}
            {activeTab === 'logistics'   && <LogisticsPage />}
            {activeTab === 'knowledge'   && <KnowledgeBase />}
            {activeTab === 'finance'     && <FinancePage />}
            {activeTab === 'documents'   && <DocumentsPage />}
            {activeTab === 'riskcontrol' && <RiskControlPage />}
            {activeTab === 'history'     && <CorporatePage />}
            {activeTab === 'party'       && <CorporatePage />}
            {activeTab === 'orgchart'    && <OrgChartPage />}
            {activeTab === 'careers'     && <CorporatePage />}
            {activeTab === 'supplywatch' && <MarketPage mode="supply" />}
            {activeTab === 'settlement'  && <DashboardPage />}
            {activeTab === 'aiconsole'   && <AIConsole />}
            {activeTab === 'sandbox'     && <SandboxPage />}
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
};

export default App;
