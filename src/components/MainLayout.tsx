import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  QrCode,
  MapPin,
  Settings,
  HelpCircle,
  Search,
  Bell,
  User as UserIcon,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import NetworkStatus from "./NetworkStatus";

export type NavigationTab =
  | "dashboard"
  | "master"
  | "checkin"
  | "map"
  | "settings"
  | "support";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  eventName?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  eventName = "Grand Gala 2024",
}) => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "master", label: "Master Attendance", icon: Users },
    { id: "checkin", label: "Check-In", icon: QrCode },
    { id: "map", label: "Map", icon: MapPin },
  ];

  const bottomNavItems = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "support", label: "Support", icon: HelpCircle },
  ];

  const getBreadcrumbTitle = (tab: NavigationTab) => {
    switch (tab) {
      case "dashboard":
        return "Dashboard";
      case "master":
        return "Master Attendance";
      case "checkin":
        return "Check-In Scanner";
      case "map":
        return "Interactive Seating Map";
      case "settings":
        return "System Settings";
      case "support":
        return "Support & Help";
      default:
        return "";
    }
  };

  const handleTabClick = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Otomatis tutup sidebar di mobile
  };

  return (
    <div className="min-h-screen bg-[#f3f5f9] flex font-sans text-slate-800">
      {/* Overlay Backdrop untuk Mobile Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-52 bg-black text-white flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Header App / Brand */}
          <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
            <div>
              <p className="text-base font-bold tracking-tight text-white">
                Event Manager
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                Premium Account
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation Items */}
          <nav className="p-3 space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id as NavigationTab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-mono transition-colors ${
                    isActive
                      ? "bg-zinc-800/80 text-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Navigation & Profile */}
        <div className="p-3 border-t border-zinc-900 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as NavigationTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-mono transition-colors ${
                  isActive
                    ? "bg-zinc-800/80 text-white font-semibold"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
          {/* Left: Breadcrumbs & Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="hidden md:block font-bold text-slate-900 truncate">
                {eventName} /
              </span>
              <span className="text-slate-500 font-medium truncate">
                {getBreadcrumbTitle(activeTab)}
              </span>
            </div>
          </div>

          {/* Right: Search Input & Profile Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Input Box */}
            <div className="relative hidden md:block w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search report..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition"
              />
            </div>

            {/* Notification Bell */}
            <button className="hidden md:block p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
            </button>

            <NetworkStatus />

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-9 h-9 bg-slate-100 border border-slate-300 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200 transition"
              >
                <UserIcon className="w-5 h-5" />
              </button>

              {/* Dropdown Logout */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      Usher Account
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user?.email || "usher@event.com"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-mono"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
