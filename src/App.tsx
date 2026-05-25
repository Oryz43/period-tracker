import { useState, useEffect } from "react";
import { 
  Home, 
  Calendar as CalIcon, 
  Plus, 
  TrendingUp, 
  User as UserIcon, 
  BookOpen, 
  Sparkles,
  Heart,
  Smartphone,
  LogOut,
  Info
} from "lucide-react";
import AuthView from "./components/AuthView";
import HomeView from "./components/HomeView";
import CalendarView from "./components/CalendarView";
import RecordView from "./components/RecordView";
import InsightsView from "./components/InsightsView";
import ArticlesView from "./components/ArticlesView";
import ProfileView from "./components/ProfileView";
import { CycleRecord, Article, ThemeType } from "./types";
import { formatDateString } from "./utils";

declare global {
  interface Window {
    __USER_EMAIL__?: string;
  }
}

export default function App() {
  // Session details stored locally
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem("pt_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [records, setRecords] = useState<CycleRecord[]>([]);
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [appTheme, setAppTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("pt_theme");
    return (saved as ThemeType) || "blossom";
  });

  // Date preselected state from Calendar click
  const [preselectedRecordDate, setPreselectedRecordDate] = useState<string | null>(null);

  // Today's date baseline
  const todayStr = formatDateString(new Date());

  // Dynamic status/toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | null }>({ message: "", type: null });

  // Trigger easy notifications
  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => {
      setToast({ message: "", type: null });
    }, 4500);
  };

  // Synchronize user and logs from Express APIs
  const fetchUserDataAndRecords = async (userId: string) => {
    try {
      // 1. Fetch user detailed updates
      const userRes = await fetch(`/api/user/${userId}`);
      const userData = await userRes.json();
      if (userData.success) {
        setUser(userData.user);
        localStorage.setItem("pt_user", JSON.stringify(userData.user));
      }

      // 2. Fetch cycle records
      const recordsRes = await fetch(`/api/records/${userId}`);
      const recordsData = await recordsRes.json();
      if (recordsData.success) {
        setRecords(recordsData.records);
      }

      // 3. Fetch user bookmarks
      const bRes = await fetch(`/api/bookmarks/${userId}`);
      const bData = await bRes.json();
      if (bData.success) {
        setBookmarks(bData.bookmarks);
      }
    } catch (err) {
      console.error("Critical: Failed to sync database items:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserDataAndRecords(user.id);
    }
  }, [user?.id]);

  const handleLoginSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    localStorage.setItem("pt_user", JSON.stringify(authenticatedUser));
    triggerToast(`Selamat datang kembali, ${authenticatedUser.name}!`);
    setActiveTab("Home");
  };

  const handleLogout = () => {
    localStorage.removeItem("pt_user");
    setUser(null);
    setRecords([]);
    setBookmarks([]);
    triggerToast("Anda telah keluar dari aplikasi.", "info");
  };

  // Create or Update a Cycle Record
  const handleSaveRecord = async (payload: any): Promise<boolean> => {
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(payload.id ? "Catatan harian diperbarui!" : "Siklus baru berhasil disimpan!");
        if (user) {
          fetchUserDataAndRecords(user.id);
        }
        return true;
      }
    } catch (err) {
      console.error("Save error:", err);
    }
    return false;
  };

  // Delete a Cycle Record
  const handleDeleteRecord = async (recordId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/records/${recordId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Catatan menstruasi berhasil dihapus.");
        if (user) {
          fetchUserDataAndRecords(user.id);
        }
        return true;
      }
    } catch (err) {
      console.error("Delete record fail:", err);
    }
    return false;
  };

  // Toggle bookmarked status
  const handleToggleBookmark = async (articleId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, articleId })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.isBookmarked ? "Artikel disimpan ke bookmark." : "Artikel dihapus dari bookmark.");
        fetchUserDataAndRecords(user.id);
        return true;
      }
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
    return false;
  };

  // Update Profiles Stats and notification criteria
  const handleUpdateProfile = async (payload: any): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(`/api/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Preferensi siklus diperbarui.");
        fetchUserDataAndRecords(user.id);
        return true;
      }
    } catch (err) {
      console.error("Profile update err:", err);
    }
    return false;
  };

  // Safe delete count
  const handleDeleteAccount = async () => {
    if (!user) return;
    if (window.confirm("PERINGATAN: Menghapus akun akan memusnahkan seluruh riwayat sirkulasi dan catatan menstruasi Anda secara permanen. Lanjutkan?")) {
      try {
        const res = await fetch(`/api/user/${user.id}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
          handleLogout();
          triggerToast("Akun Anda telah dinonaktifkan secara permanen.", "info");
        }
      } catch (err) {
        console.error("Failure processing deletion account:", err);
      }
    }
  };

  const handleToggleTheme = (theme: ThemeType) => {
    setAppTheme(theme);
    localStorage.setItem("pt_theme", theme);
    triggerToast(`Tema visual diubah menjadi ${theme === 'blossom' ? 'Blossom Pink' : theme === 'monochrome' ? 'Minimal Wireframe' : 'Midnight Stealth'}`);
  };

  // Redirect to Record with preselected date on click
  const handleAddNoteFromDate = (dateStr: string) => {
    setPreselectedRecordDate(dateStr);
    setActiveTab("Record");
  };

  const handleSelectQuickAction = (actionId: string) => {
    if (actionId === "add_symptom" || actionId === "record_mood") {
      setPreselectedRecordDate(todayStr);
      setActiveTab("Record");
    } else if (actionId === "export_pdf") {
      // Export current profile raw stats
      const backupStr = "data:text/json;charset=utf-8," + encodeURIComponent(
        JSON.stringify({ user, cycleRecords: records }, null, 2)
      );
      const tempDownload = document.createElement('a');
      tempDownload.setAttribute("href", backupStr);
      tempDownload.setAttribute("download", `period_report_${user.name}.json`);
      document.body.appendChild(tempDownload);
      tempDownload.click();
      tempDownload.remove();
      triggerToast("File laporan JSON diunduh.");
    } else if (actionId === "read_articles") {
      setActiveTab("Articles");
    }
  };

  // Guard routing system
  if (!user) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  // Determine current active navigation rendering
  const renderCurrentTabContent = () => {
    switch (activeTab) {
      case "Home":
        return (
          <HomeView 
            user={user} 
            records={records} 
            onNavigate={setActiveTab}
            onSelectAction={handleSelectQuickAction}
            todayStr={todayStr}
          />
        );
      case "Calendar":
        return (
          <CalendarView 
            user={user} 
            records={records} 
            onAddNote={handleAddNoteFromDate}
          />
        );
      case "Record":
        return (
          <RecordView 
            userId={user.id} 
            records={records} 
            onSaveRecord={handleSaveRecord}
            onDeleteRecord={handleDeleteRecord}
            preselectedDate={preselectedRecordDate}
            onClearPreselectedDate={() => setPreselectedRecordDate(null)}
          />
        );
      case "Insights":
        return (
          <InsightsView 
            userId={user.id} 
            records={records} 
            user={user} 
          />
        );
      case "Articles":
        return (
          <ArticlesView 
            userId={user.id} 
            bookmarks={bookmarks} 
            onToggleBookmark={handleToggleBookmark}
          />
        );
      case "Profile":
        return (
          <ProfileView 
            user={user} 
            records={records} 
            onUpdateProfile={handleUpdateProfile} 
            onDeleteAccount={handleDeleteAccount}
            onLogout={handleLogout}
            onToggleTheme={handleToggleTheme}
            currentTheme={appTheme}
          />
        );
      default:
        return <div className="text-center py-10">Tab tidak dikenal.</div>;
    }
  };

  // Build appropriate CSS theme rules
  let themeClass = "theme-blossom bg-rose-50/20";
  let deviceBorder = "border-slate-100";
  let textThemeColor = "text-rose-500";
  
  if (appTheme === 'monochrome') {
    themeClass = "theme-monochrome bg-slate-50/10";
    deviceBorder = "border-slate-300";
    textThemeColor = "text-slate-800";
  } else if (appTheme === 'stealth') {
    themeClass = "theme-stealth bg-slate-900/90 text-slate-100";
    deviceBorder = "border-slate-800";
    textThemeColor = "text-emerald-400";
  }

  return (
    <div className={`min-h-screen ${themeClass} font-sans transition-all duration-300`}>
      
      {/* Toast Notification block */}
      {toast.message && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 text-white py-3 px-6 rounded-2xl shadow-xl text-center text-xs font-bold leading-relaxed max-w-sm w-11/12 animate-in fade-in slide-in-from-top-4 duration-150 flex items-center justify-center gap-2">
          {toast.type === 'success' ? <Sparkles className="w-4 h-4 text-amber-400 shrink-0" /> : <Info className="w-4 h-4 text-sky-400 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Main Container Wrapper */}
      {/* If desktop mode: Show gorgeous preview device layout casing. If mobile: show full-screen */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12 flex flex-col lg:flex-row items-center justify-center gap-10 min-h-screen">
        
        {/* Left column desktop side banner presenting real-estate showcase of the health application */}
        <div className="hidden lg:flex flex-col max-w-sm space-y-5 flex-1 select-none">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 btn rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-red-300" />
            </div>
            <span className="text-md font-extrabold text-slate-800 tracking-tight">Menstrual Tracker Suite</span>
          </div>
          
          <div className="space-y-3.5">
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight leading-10">
              Clean. Elegant. <br/>
              <span className="text-rose-500 font-black">Monochrome Layout</span>
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Selamat datang di simulator aplikasi cycle tracking premium. Kami merekayasa visualisasi hand-drawn wireframe ke dalam responsive front-end fungsional bertenaga AI Gemini.
            </p>
          </div>

          {/* Bullet metrics features */}
          <div className="space-y-2.5 pt-3 divide-y divide-slate-100 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2 py-0.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Fully Interactive May 2025 Calendar Prediction</span>
            </div>
            <div className="flex items-center gap-2 pt-2 pb-0.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Live Server-side Google Gemini AI Health Insights</span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>Multilayered Themes Switcher support included</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Tested User Session</span>
            <div className="p-3 border border-slate-200 bg-white rounded-2xl mt-1 text-[11px] font-semibold text-slate-500">
              Logged in: <strong className="text-slate-800">{user.name} ({user.email})</strong>
            </div>
          </div>
        </div>

        {/* Right column / Center component: High-fidelity iPhone Frame Preview */}
        <div className="relative w-full max-w-[390px] mx-auto shrink-0 animate-in fade-in duration-300">
          
          {/* Mock Speaker/Camera status bar space inside iPhone top bezel */}
          <div className={`hidden md:block w-32 h-5 bg-slate-950 absolute left-1/2 transform -translate-x-1/2 -top-1.5 z-40 rounded-b-2xl shadow-inner border border-slate-900`}></div>
          
          {/* Interactive Mobile Device simulator Frame casing */}
          <div className={`w-full bg-white md:border-[12px] ${deviceBorder} md:rounded-[48px] overflow-hidden md:shadow-2xl relative min-h-[100vh] md:min-h-[760px] md:h-[760px] flex flex-col justify-between transition-colors duration-300 ${
            appTheme === 'stealth' ? "bg-slate-950" : "bg-white"
          }`}>
            
            {/* Simulator Mobile Header details */}
            <div className={`shrink-0 px-6 pt-3 pb-2.5 flex justify-between items-center text-xs font-mono select-none tracking-tight border-b ${
              appTheme === 'stealth' ? "border-slate-900 bg-slate-950 text-slate-400" : "border-slate-100 bg-slate-50 text-slate-500"
            }`}>
              <span className="font-bold">10:00</span>
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[9px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded">ONLINE</span>
              </div>
            </div>

            {/* Simulated scrollable container stage content viewport */}
            <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">
              {renderCurrentTabContent()}
            </div>

            {/* Bottom Nav bar fixed replication directly from wireframes */}
            <div className={`shrink-0 border-t flex justify-around items-center py-2.5 px-2 relative z-30 shadow-md ${
              appTheme === 'stealth' ? "border-slate-900 bg-slate-950" : "border-slate-100 bg-white/95"
            }`}>
              {/* Tab 1 */}
              <button 
                onClick={() => setActiveTab("Home")}
                className={`flex flex-col items-center justify-center p-1.5 cursor-pointer rounded-xl transition-all group ${
                  activeTab === "Home" ? textThemeColor + " font-extrabold scale-105" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Home className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] tracking-tight">Home</span>
              </button>

              {/* Tab 2 */}
              <button 
                onClick={() => setActiveTab("Calendar")}
                className={`flex flex-col items-center justify-center p-1.5 cursor-pointer rounded-xl transition-all group ${
                  activeTab === "Calendar" ? textThemeColor + " font-extrabold scale-105" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <CalIcon className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] tracking-tight">Calendar</span>
              </button>

              {/* Tab 3 */}
              <button 
                onClick={() => {
                  setPreselectedRecordDate(null);
                  setActiveTab("Record");
                }}
                className={`flex flex-col items-center justify-center p-1.5 cursor-pointer rounded-xl transition-all group ${
                  activeTab === "Record" ? textThemeColor + " font-extrabold scale-105" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Plus className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] tracking-tight">Record</span>
              </button>

              {/* Tab 4 */}
              <button 
                onClick={() => setActiveTab("Insights")}
                className={`flex flex-col items-center justify-center p-1.5 cursor-pointer rounded-xl transition-all group ${
                  activeTab === "Insights" ? textThemeColor + " font-extrabold scale-105" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <TrendingUp className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] tracking-tight">Insights</span>
              </button>

              {/* Tab 5 */}
              <button 
                onClick={() => setActiveTab("Articles")}
                className={`flex flex-col items-center justify-center p-1.5 cursor-pointer rounded-xl transition-all group ${
                  activeTab === "Articles" ? textThemeColor + " font-extrabold scale-105" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <BookOpen className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] tracking-tight">Library</span>
              </button>

              {/* Tab 6 */}
              <button 
                onClick={() => setActiveTab("Profile")}
                className={`flex flex-col items-center justify-center p-1.5 cursor-pointer rounded-xl transition-all group ${
                  activeTab === "Profile" ? textThemeColor + " font-extrabold scale-105" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <UserIcon className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] tracking-tight">Profile</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
