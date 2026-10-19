import { BarChart3, ExternalLink, Users } from 'lucide-react';

export default function PreviewMenu() {
  return (
    <nav className="fixed top-4 right-4 z-50 flex items-center gap-1 rounded-xl p-1.5" style={{ backgroundColor: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(13,27,42,0.18)' }} aria-label="Preview navigation">
      <a href="#admin" className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-dm text-xs font-semibold transition-colors hover:bg-white/10" style={{ color: '#FFFFFF' }}>
        <BarChart3 size={14} style={{ color: '#D7BA68' }} />
        Admin Dashboard
      </a>
      <a href="#client-login" className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-dm text-xs font-semibold transition-colors hover:bg-white/10" style={{ color: '#FFFFFF' }}>
        <Users size={14} style={{ color: '#91D1AF' }} />
        Client Dashboard
      </a>
      <a href="#" aria-label="Back to quiz preview" className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/10" style={{ color: '#AAB5C5' }}>
        <ExternalLink size={14} />
      </a>
    </nav>
  );
}
