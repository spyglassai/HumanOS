import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Home, Compass, Briefcase, Sparkles, Layers, FileText, PenLine,
  Target, MessageSquare, Globe, FolderOpen, Settings, Shield,
  Menu, X, LogOut, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Home", path: "/", icon: Home },
      { label: "Career Discovery", path: "/discovery", icon: Compass },
    ]
  },
  {
    label: "My Career",
    items: [
      { label: "My Career", path: "/career", icon: Briefcase },
      { label: "Insights", path: "/insights", icon: Sparkles },
      { label: "Career Archetypes", path: "/archetypes", icon: Layers },
    ]
  },
  {
    label: "Outputs",
    items: [
      { label: "Master Resume", path: "/master-resume", icon: FileText },
      { label: "Resume Studio", path: "/resume-studio", icon: PenLine },
      { label: "Opportunities", path: "/opportunities", icon: Target },
      { label: "Interview Studio", path: "/interview-studio", icon: MessageSquare },
    ]
  },
  {
    label: "Public & Library",
    items: [
      { label: "Portfolio", path: "/portfolio", icon: Globe },
      { label: "Public Profile", path: "/public-profile", icon: Globe },
      { label: "Documents", path: "/documents", icon: FolderOpen },
    ]
  },
  {
    label: "System",
    items: [
      { label: "Settings", path: "/settings", icon: Settings },
      { label: "Admin", path: "/admin", icon: Shield },
    ]
  }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.href = "/login";
  };

  const isActive = (path) => path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="px-6 pt-7 pb-6 border-b border-border/60">
        <Link to="/" className="block" onClick={() => setMobileOpen(false)}>
          <div className="font-heading text-xl font-semibold tracking-tight text-foreground leading-none">
            The Human OS
          </div>
          <div className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Understand · Own · Build
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="truncate">{item.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-accent" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/60 px-4 py-4">
        {user && (
          <div className="mb-3 px-2">
            <div className="text-sm font-medium text-foreground truncate">{user.full_name || user.email}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border/60 bg-sidebar/50 backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur px-4 h-14">
        <Link to="/" className="font-heading text-lg font-semibold">The Human OS</Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[80%] bg-background shadow-xl animate-fade-in-fast">
            <Button variant="ghost" size="icon" className="absolute top-3 right-3 z-10" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}