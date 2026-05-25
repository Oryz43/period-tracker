import { useState, FormEvent } from "react";
import { 
  User, 
  Settings, 
  Bell, 
  Download, 
  Trash2, 
  ChevronRight, 
  Database, 
  Globe, 
  Code, 
  Check, 
  Copy,
  Terminal,
  LogOut
} from "lucide-react";
import { CycleRecord } from "../types";

interface ProfileViewProps {
  user: any;
  records: CycleRecord[];
  onUpdateProfile: (payload: any) => Promise<boolean>;
  onDeleteAccount: () => void;
  onLogout: () => void;
  onToggleTheme: (theme: 'blossom' | 'monochrome' | 'stealth') => void;
  currentTheme: 'blossom' | 'monochrome' | 'stealth';
}

export default function ProfileView({
  user,
  records,
  onUpdateProfile,
  onDeleteAccount,
  onLogout,
  onToggleTheme,
  currentTheme
}: ProfileViewProps) {
  const [name, setName] = useState<string>(user.name);
  const [cycleLength, setCycleLength] = useState<number>(user.cycleLength || 28);
  const [periodLength, setPeriodLength] = useState<number>(user.periodLength || 5);

  const [notifs, setNotifs] = useState({
    periodReminder: user.notificationSettings?.periodReminder ?? true,
    fertileReminder: user.notificationSettings?.fertileReminder ?? true,
    dailyTips: user.notificationSettings?.dailyTips ?? true
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // States to toggle dev logs drawers
  const [showPrismaGuide, setShowPrismaGuide] = useState(false);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    try {
      const success = await onUpdateProfile({
        name,
        cycleLength: Number(cycleLength),
        periodLength: Number(periodLength),
        notificationSettings: notifs
      });
      if (success) {
        setSaveStatus("Profil berhasil diperbarui!");
      } else {
        setSaveStatus("Gagal memperbarui profil.");
      }
    } catch (err) {
      setSaveStatus("Gagal menghubungkan ke server.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(identifier);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Export local JSON dataset
  const handleExportDataLocal = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ user, cycleRecords: records }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `period_tracker_backup_${user.name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Raw Schema String to present nicely
  const rawSchemaCode = `// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Neon PostgreSQL Link
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String         @id @default(uuid())
  name            String
  email           String         @unique
  cycleLength     Int            @default(28)
  periodLength    Int            @default(5)
  cycleRecords    CycleRecord[]
}`;

  const envSampleCode = `# .env file
DATABASE_URL="postgresql://username:password@ep-cool-butterfly.us-east-2.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="f63004bb1da8fc3bbf6ea61bd712a4db"
NEXTAUTH_URL="http://localhost:3000"`;

  const setupCommands = `# 1. Install dependencies
npm install prisma @prisma/client

# 2. Run database migration on Neon PostgreSQL
npx prisma migrate dev --name init

# 3. Populate database with dummy seeds
npx prisma db seed`;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Heading */}
      <div className="flex justify-between items-center bg-white p-1 pb-2">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block font-semibold">User Administration</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Profile</h1>
        </div>
        <div className="h-9 w-9 rounded-xl bg-purple-50 border border-purple-100/50 flex items-center justify-center">
          <Settings className="w-5 h-5 text-purple-500" />
        </div>
      </div>

      {/* User Card Layout (Phone 1 header details replica) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white text-xl font-black shadow-sm">
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="space-y-0.5 flex-1 p-1">
          <h2 className="text-lg font-bold text-slate-800 leading-tight">{user.name}</h2>
          <p className="text-xs text-slate-400 font-medium font-sans">{user.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 bg-rose-50 text-[10px] text-rose-500 font-bold rounded-md border border-rose-100">
              {user.cycleLength || 28} Days Cycle
            </span>
            <span className="px-2 py-0.5 bg-teal-50 text-[10px] text-teal-600 font-bold rounded-md border border-teal-100">
              {user.periodLength || 5} Days Period
            </span>
          </div>
        </div>
      </div>

      {/* Theme selector option */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Aesthetic Visual Theme</span>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'blossom', label: 'Blossom Pink', color: 'border-pink-300 bg-pink-50' },
            { id: 'monochrome', label: 'Wireframe Grey', color: 'border-slate-300 bg-slate-50' },
            { id: 'stealth', label: 'Midnight Stealth', color: 'border-slate-800 bg-slate-900 text-slate-300' }
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => onToggleTheme(theme.id as any)}
              className={`py-3.5 px-2 text-center rounded-2xl border text-[10px] uppercase font-bold cursor-pointer transition-all ${
                currentTheme === theme.id 
                  ? theme.color + " shadow-sm font-extrabold border-slate-600 scale-[1.03]" 
                  : "bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold text-xs font-sans">
          {saveStatus}
        </div>
      )}

      {/* Profiles Settings Edit Form */}
      <form onSubmit={handleUpdate} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Update Target Metrics</span>
        
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase font-sans">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-slate-800 text-xs font-semibold focus:border-rose-400 focus:outline-none bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase font-sans">Cycle Target length</label>
              <input
                type="number"
                required
                min={20}
                max={45}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-slate-800 text-xs font-bold focus:border-rose-400 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase font-sans">Bleeding period length</label>
              <input
                type="number"
                required
                min={2}
                max={15}
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-slate-800 text-xs font-bold focus:border-rose-400 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Reminder Settings Toggles */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
            <Bell className="w-3.5 h-3.5 text-slate-400" />
            Alert Notification reminders
          </span>
          
          <div className="divide-y divide-slate-100 text-xs">
            {/* Toggle 1 */}
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-600 font-medium">Period Reminder alerts</span>
              <input 
                type="checkbox"
                checked={notifs.periodReminder}
                onChange={(e) => setNotifs(prev => ({ ...prev, periodReminder: e.target.checked }))}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>
            {/* Toggle 2 */}
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-600 font-medium font-sans">Fertile window projections alerts</span>
              <input 
                type="checkbox"
                checked={notifs.fertileReminder}
                onChange={(e) => setNotifs(prev => ({ ...prev, fertileReminder: e.target.checked }))}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>
            {/* Toggle 3 */}
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-slate-600 font-medium">Daily educational tips notifications</span>
              <input 
                type="checkbox"
                checked={notifs.dailyTips}
                onChange={(e) => setNotifs(prev => ({ ...prev, dailyTips: e.target.checked }))}
                className="w-4 h-4 accent-rose-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-5 rounded-2xl font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all text-xs cursor-pointer flex items-center justify-center gap-1"
        >
          {saving ? "Menyimpan..." : "Update Preferences"}
        </button>
      </form>

      {/* PRISMA AND NEON PostgreSQL DEVELOPER DRAWER WORKSPACE */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <Database className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Production Setup</span>
              <h4 className="text-sm font-bold text-slate-800">Prisma + Neon PostgreSQL</h4>
            </div>
          </div>
          <button
            onClick={() => setShowPrismaGuide(!showPrismaGuide)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-extrabold text-slate-600 cursor-pointer flex items-center gap-1 transition-all"
          >
            <Code className="w-3.5 h-3.5" />
            {showPrismaGuide ? "Hide Code" : "Expand Docs"}
          </button>
        </div>

        {showPrismaGuide && (
          <div className="space-y-4 text-xs font-sans text-slate-700 leading-relaxed max-w-full animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2">
              <h5 className="font-bold text-slate-800 flex items-center gap-1">
                <Globe className="w-4 h-4 text-teal-500" />
                Langkah Setup di Neon & Vercel
              </h5>
              <ol className="list-decimal pl-4.5 space-y-1.5 text-slate-600 text-[11px]">
                <li>Buka akun gratis Anda di <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-rose-500 underline font-semibold">neon.tech</a>, ciptakan database PostgreSQL baru bernama `neondb`.</li>
                <li>Salin <strong>Connection String</strong> pooler database.</li>
                <li>Tempel url koneksi tersebut ke dalam variable <code className="font-mono bg-slate-100 p-0.5 rounded text-[10px] text-red-500">DATABASE_URL</code> pada project Anda.</li>
                <li>Gunakan skema ORM Prisma lengkap yang telah saya buat di <code className="font-mono bg-slate-100 p-0.5 rounded text-[10px] text-indigo-500">prisma/schema.prisma</code>.</li>
                <li>Saat mengunggah ke <strong>Vercel</strong>, tambahkan variable environment yang serupa di panel dashboard Settings &gt; Environment Variables.</li>
              </ol>
            </div>

            {/* Code Copy blocks */}
            <div className="space-y-3">
              {/* Target 1 */}
              <div className="space-y-1 bg-slate-100 rounded-2xl p-3 border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2 shrink-0">
                  <span className="font-mono text-[10px] text-slate-500 px-1 font-semibold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-500" />
                    prisma/schema.prisma
                  </span>
                  <button
                    onClick={() => handleCopyCode(rawSchemaCode, "prisma")}
                    className="p-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-500"
                  >
                    {copiedSection === "prisma" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-indigo-950 overflow-x-auto whitespace-pre p-1">
                  {rawSchemaCode}
                </pre>
              </div>

              {/* Target 2 */}
              <div className="space-y-1 bg-slate-100 rounded-2xl p-3 border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2 shrink-0">
                  <span className="font-mono text-[10px] text-slate-500 px-1 font-semibold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-teal-500" />
                    Setup Commands
                  </span>
                  <button
                    onClick={() => handleCopyCode(setupCommands, "commands")}
                    className="p-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-500"
                  >
                    {copiedSection === "commands" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-emerald-950 overflow-x-auto whitespace-pre p-1">
                  {setupCommands}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin actions (Export local backup & logout) */}
      <div className="space-y-2.5">
        <button
          onClick={handleExportDataLocal}
          className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Export JSON Backup Data
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onDeleteAccount}
            className="py-3 px-4 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
          
          <button
            type="button"
            onClick={onLogout}
            className="py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
