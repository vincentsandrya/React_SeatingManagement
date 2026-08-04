import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./components/Login";
import { MainLayout, type NavigationTab } from "./components/MainLayout";
import DashboardPage from './pages/DashboardPage';
import CheckInPage from './pages/CheckInPage';
import MasterAttendancePage from './pages/MasterAttendancePage';
import MapPage from './pages/MapPage';

// const SeatingMapPage = () => (
//   <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
//     Content: Interactive Seating Map
//   </div>
// );

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>("dashboard");

  const eventName = "Grand Gala 2026";

  if (!user) {
    return <Login />;
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      eventName={eventName}
    >
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === "master" && <MasterAttendancePage />}
      {activeTab === "checkin" && <CheckInPage />}
      {activeTab === "map" && <MapPage />}
      {activeTab === "settings" && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          Settings Page
        </div>
      )}
      {activeTab === "support" && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          Support Page
        </div>
      )}
    </MainLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
