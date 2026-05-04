import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Grid3X3, Server, Layers, AlertTriangle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useOverview } from '@/hooks/use-api';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/heatmap', label: 'Heatmap', icon: Grid3X3 },
  { path: '/sistemas', label: 'Sistemas', icon: Server },
  { path: '/clusters', label: 'Clusters', icon: Layers },
  { path: '/problemas', label: 'Problemas', icon: AlertTriangle },
];

export function AppSidebar() {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const { data: kpis } = useOverview('24h');
  const criticalOpen = kpis?.criticalOpen ?? 0;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ${
        expanded ? 'w-60' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <img src="/logo.png" alt="Prisma" className="w-8 h-8 object-contain shrink-0" />
        {expanded && (
          <div className="overflow-hidden">
            <span className="font-bold text-sidebar-foreground text-lg tracking-tight">Prisma</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(item => {
          const active = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {expanded && <span>{item.label}</span>}
              {item.path === '/dashboard' && criticalOpen > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-critical text-critical-light text-xs font-mono px-1.5 py-0.5 rounded-full animate-pulse-critical">
                  {criticalOpen}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        {expanded && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Grupo Mateus · TI</p>
            <p>v1.0 · Hackathon 2026</p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {expanded ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </aside>
  );
}
