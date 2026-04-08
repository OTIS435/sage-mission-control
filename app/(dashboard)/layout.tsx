"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  FolderOpen,
  Brain,
  FileText,
  Users,
  Shield,
  Sun,
  Moon,
  Menu,
  LogOut,
  Wallet,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Task Board", icon: KanbanSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/finances", label: "Finances", icon: Wallet },
  { href: "/memories", label: "Memories", icon: Brain },
  { href: "/docs", label: "Docs", icon: FileText },
  { href: "/team", label: "Team", icon: Users },
  { href: "/security", label: "Security", icon: Shield },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/lock");
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 text-zinc-950 text-sm font-black flex items-center justify-center flex-shrink-0">
            MC
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Mission Control</p>
            <p className="text-zinc-500 text-xs">Dr. Steve Chase</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 font-medium"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 w-full transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-zinc-900 border-r border-zinc-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 h-full flex flex-col bg-zinc-900 border-r border-zinc-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-white font-semibold text-sm hidden sm:block">
              {navItems.find((n) => n.href === "/" ? pathname === "/" : pathname.startsWith(n.href))?.label || "Mission Control"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              {theme === "dark" || theme === undefined ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
              SC
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
