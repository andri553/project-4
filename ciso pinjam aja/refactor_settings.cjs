const fs = require('fs');
let content = fs.readFileSync('src/pages/ModulePages.tsx', 'utf8');

// Replace the handleAction function inside SettingsPage
content = content.replace(
  /const handleAction = async \(action: 'archive' \| 'restore'\) => \{[\s\S]*?^\s*\};\n/m,
  `const handleAction = async (action: 'import' | 'archive' | 'restore' | 'clear') => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/security/demo-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token') || ''}\` },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        setSuccessMsg(\`Demo dataset successfully \${action}ed.\`);
        setTimeout(() => fetchStatus(), 1000);
      } else {
        setError(\`Failed to \${action} demo dataset.\`);
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };\n`
);

// Replace the Mock Presentation Controls UI with Demo Dataset Manager
const oldUI = `        {/* Mock Dataset Archiving & Restoring */}
        <div className="col-span-12 lg:col-span-6 rounded-xl p-5 border flex flex-col justify-between" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <div>
            <h3 className="text-sm font-semibold mb-3">Mock Presentation Controls</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
              Quickly archive or restore mock datasets for clean presentation. Archived mock records are kept in database but hidden from dashboards.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={loading}
                onClick={() => handleAction('archive')}
                className="p-4 rounded-lg border text-center hover:bg-red-500/10 hover:border-red-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-lg font-bold text-red-400">ARCHIVE</span>
                <span className="block text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Hide mock records from CISO dashboards</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleAction('restore')}
                className="p-4 rounded-lg border text-center hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-lg font-bold text-emerald-400">RESTORE</span>
                <span className="block text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Bring back mock records for demonstration</span>
              </button>
            </div>
          </div>
        </div>`;

const newUI = `        {/* Demo Dataset Manager */}
        <div className="col-span-12 lg:col-span-6 rounded-xl p-5 border flex flex-col justify-between" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
          <div>
            <h3 className="text-sm font-semibold mb-3">Demo Dataset Manager</h3>
            <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
              Manage dummy operational records (Users, Incidents, Loans) for presentations without affecting master Governance Data.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={loading}
                onClick={() => handleAction('import')}
                className="p-3 rounded-lg border text-center hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-md font-bold text-blue-400">IMPORT</span>
                <span className="block text-[9px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Seed dummy operational data</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleAction('archive')}
                className="p-3 rounded-lg border text-center hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-md font-bold text-amber-400">ARCHIVE</span>
                <span className="block text-[9px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Soft delete dummy data</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleAction('restore')}
                className="p-3 rounded-lg border text-center hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-md font-bold text-emerald-400">RESTORE</span>
                <span className="block text-[9px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Bring back archived dummy data</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleAction('clear')}
                className="p-3 rounded-lg border text-center hover:bg-red-500/10 hover:border-red-500/30 transition-colors group cursor-pointer"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
                <span className="block text-md font-bold text-red-400">CLEAR</span>
                <span className="block text-[9px] mt-1" style={{ color: 'var(--color-text-muted)' }}>Hard delete all dummy data</span>
              </button>
            </div>
          </div>
        </div>`;

content = content.replace(oldUI, newUI);

fs.writeFileSync('src/pages/ModulePages.tsx', content);
