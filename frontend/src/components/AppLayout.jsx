import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Activity, GitFork, Map, MessageSquareText, Video,
  Target, Mic, BarChart3, Settings, UserRound, Menu, Moon, Sun, LogOut,
  Flame, Zap, RotateCcw, Sparkles, BookMarked, FileText,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useStudent } from "@/context/StudentContext";
import { api } from "@/lib/api";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const NAV = [
  { section: "Learning", items: [
    { name: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard },
    { name: "Subjects", to: "/app/subjects", icon: BookMarked },
    { name: "Notes to Path", to: "/app/notes", icon: FileText },
    { name: "Diagnostic", to: "/app/diagnostic", icon: Activity },
  ]},
  { section: "Engine", items: [
    { name: "Knowledge Graph", to: "/app/knowledge-graph", icon: GitFork },
    { name: "Learning Path", to: "/app/path", icon: Map },
  ]},
  { section: "Practice", items: [
    { name: "AI Tutor Chat", to: "/app/tutor-chat", icon: MessageSquareText },
    { name: "Voice Tutor", to: "/app/voice-tutor", icon: Video },
    { name: "Adaptive Quiz", to: "/app/quiz", icon: Target },
    { name: "Teach-Back", to: "/app/teach-back", icon: Mic },
  ]},
  { section: "Account", items: [
    { name: "Analytics", to: "/app/analytics", icon: BarChart3 },
    { name: "Learning Profile", to: "/app/profile", icon: UserRound },
    { name: "Settings", to: "/app/settings", icon: Settings },
  ]},
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-[15px] font-bold tracking-tight">LearnTwin AI</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Adaptive Engine</p>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col gap-6 py-5">
      <BrandMark />
      <nav className="flex-1 space-y-5 overflow-y-auto px-3">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  data-testid={`nav-item-${item.name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "")}`}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default function AppLayout() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { profile, refresh } = useStudent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    try {
      await api.resetDemo();
      await refresh();
      toast.success("Demo reset to Sachin's initial state.");
    } catch {
      toast.error("Reset failed.");
    }
  };

  const initials = (profile?.name || user?.name || "S")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card/50 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  data-testid="sidebar-toggle-btn"
                  className="grid h-9 w-9 place-items-center rounded-lg border text-muted-foreground hover:bg-muted lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="lg:hidden">
              <BrandMark />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              data-testid="streak-badge"
              className="hidden items-center gap-1.5 rounded-full border bg-orange-500/10 px-3 py-1.5 text-sm font-semibold text-orange-500 sm:flex"
            >
              <Flame className="h-4 w-4" /> {profile?.streak ?? 0}
            </div>
            <div
              data-testid="xp-badge"
              className="hidden items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary sm:flex"
            >
              <Zap className="h-4 w-4" /> {(profile?.xp ?? 0).toLocaleString()} XP
            </div>
            <button
              onClick={handleReset}
              data-testid="reset-demo-btn"
              title="Reset Demo"
              className="grid h-9 w-9 place-items-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={toggle}
              data-testid="theme-toggle-btn"
              className="grid h-9 w-9 place-items-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-btn" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{profile?.name || user?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/profile")} data-testid="menu-profile">
                  <UserRound className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/settings")} data-testid="menu-settings">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate("/"); }} data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
