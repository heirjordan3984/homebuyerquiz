import { useState } from 'react';
import { Users, PhoneCall, Network, BarChart3 } from 'lucide-react';
import AdminLeads from './AdminLeads';
import AdminAICaller from './AdminAICaller';
import AdminPartners from './AdminPartners';
import AdminDashboard from './AdminDashboard';

type Tab = 'dashboard' | 'leads' | 'ai-caller' | 'partners';

export default function AdminShell() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="w-full h-1" style={{ backgroundColor: '#C9A84C' }} />
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 mb-2">
          <TabButton
            active={tab === 'dashboard'}
            onClick={() => setTab('dashboard')}
            icon={<BarChart3 size={14} />}
            label="Dashboard"
          />
          <TabButton
            active={tab === 'leads'}
            onClick={() => setTab('leads')}
            icon={<Users size={14} />}
            label="Leads"
          />
          <TabButton
            active={tab === 'ai-caller'}
            onClick={() => setTab('ai-caller')}
            icon={<PhoneCall size={14} />}
            label="AI Caller"
          />
          <TabButton
            active={tab === 'partners'}
            onClick={() => setTab('partners')}
            icon={<Network size={14} />}
            label="Partners"
          />
        </nav>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'leads' && <AdminLeads embedded />}
        {tab === 'ai-caller' && <AdminAICaller />}
        {tab === 'partners' && <AdminPartners />}
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
