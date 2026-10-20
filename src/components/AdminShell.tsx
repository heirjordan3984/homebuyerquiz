import { useState } from 'react';
import { Users, BarChart3, ArrowLeft, Plug } from 'lucide-react';
import AdminLeads from './AdminLeads';
import AdminDashboard from './AdminDashboard';
import AdminIntegrations from './AdminIntegrations';

type Tab = 'analytics' | 'leads' | 'integrations';

export default function AdminShell() {
  const [tab, setTab] = useState<Tab>('analytics');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <a
          href="#"
          className="inline-flex items-center gap-2 mb-4 text-sm font-semibold transition-colors"
          style={{ color: '#0D1B2A' }}
        >
          <ArrowLeft size={16} />
          Back to Quiz
        </a>
        <nav className="flex items-center gap-2 mb-2">
          <TabButton
            active={tab === 'analytics'}
            onClick={() => setTab('analytics')}
            icon={<BarChart3 size={14} />}
            label="Admin"
          />
          <TabButton
            active={tab === 'leads'}
            onClick={() => setTab('leads')}
            icon={<Users size={14} />}
            label="Leads"
          />
          <TabButton
            active={tab === 'integrations'}
            onClick={() => setTab('integrations')}
            icon={<Plug size={14} />}
            label="Integrations"
          />
        </nav>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'analytics' && <AdminDashboard />}
        {tab === 'leads' && <AdminLeads embedded />}
        {tab === 'integrations' && <AdminIntegrations />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
      style={{
        backgroundColor: active ? '#0D1B2A' : 'transparent',
        color: active ? 'white' : '#0D1B2A',
        border: `1px solid ${active ? '#0D1B2A' : '#E0DAD0'}`,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
