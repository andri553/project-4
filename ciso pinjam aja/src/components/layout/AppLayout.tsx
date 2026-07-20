import Sidebar from './Sidebar';
import Header from './Header';
import WorkflowDrawer from '../common/WorkflowDrawer';

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: '260px' }}>
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <WorkflowDrawer />
    </div>
  );
}
