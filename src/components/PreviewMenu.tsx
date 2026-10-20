import { BarChart3, ExternalLink, LogIn, Users } from 'lucide-react';

export default function PreviewMenu() {
  return (
    <nav className="fixed top-4 right-4 z-50 flex items-center gap-1 rounded-xl p-1.5" style={{ backgroundColor: 'rgba(7,17,27,0.96)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 30px rgba(7,17,27,0.24)', border: '1px solid rgba(255,159,67,0.28)' }} aria-label="Preview navigation">
      <a href="#admin" className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-dm text-xs font-semibold transition-colors hover:bg-white/10" style={{ color: '#FFFFFF' }}>
        <BarChart3 size={14} style={{ color: '#FF9F43' }} />
        Admin
      </a>
      <a href="#client-login" className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-dm text-xs font-semibold transition-colors hover:bg-white/10" style={{ color: '#FFFFFF' }}>
        <LogIn size={14} style={{ color: '#FF9F43' }} />
        Lead Portal Login
      </a>
      <a href="#client-dashboard" className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-dm text-xs font-semibold transition-colors hover:bg-white/10" style={{ color: '#FFFFFF' }}>
        <Users size={14} style={{ color: '#FF9F43' }} />
        Lead Portal
      </a>
      <a href="#" aria-label="Back to quiz preview" className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-white/10" style={{ color: '#AAB5C5' }}>
        <ExternalLink size={14} />
      </a>
    </nav>
  );
}
