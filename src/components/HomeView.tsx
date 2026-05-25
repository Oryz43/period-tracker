import { motion } from "motion/react";
import { 
  Dribbble, 
  Calendar as CalendarIcon, 
  Heart, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  TrendingUp,
  Clock,
  Plus
} from "lucide-react";
import { CycleRecord } from "../types";
import { formatReadableDate, getCyclePhase } from "../utils";

interface HomeViewProps {
  user: any;
  records: CycleRecord[];
  onNavigate: (tab: string) => void;
  onSelectAction: (action: string) => void;
  todayStr: string;
}

export default function HomeView({ user, records, onNavigate, onSelectAction, todayStr }: HomeViewProps) {
  // If there are no records, default fallback startDate
  const latestRecord = records.length > 0 ? records[0] : null;
  const latestStart = latestRecord ? latestRecord.startDate : "2026-05-20"; // fallback

  const cycleLength = user.cycleLength || 28;
  const periodLength = user.periodLength || 5;

  const { phase, percentElapsed, daysLeft } = getCyclePhase(
    latestStart,
    todayStr,
    cycleLength,
    periodLength
  );

  // Daily Healthcare Tip Array
  const tips = [
    "Minum air hangat dapat membantu melancarkan sirkulasi panggul dan mengurangi kram otot rahim.",
    "Batas asupan kafein berlebihan selama menstruasi untuk mengurangi sensibilitas nyeri payudara.",
    "Lakukan olahraga kecil/stretching yoga ringan sore ini untuk merangsang produksi endorfin penenang tubuh.",
    "Zat besi aman (bayam, daging tanpa lemak) membantu pemulihan energi sel darah merah Anda.",
    "Kurangi garam berlebih hari ini untuk menghindari keluhan perut kembung atau bloated."
  ];
  // Stable tip based on elapsed days representation
  const tipIndex = (percentElapsed) % tips.length;
  const dailyTip = tips[tipIndex];

  // Map phase colors to responsive states
  const getPhaseTheme = (phaseStr: string) => {
    if (phaseStr.includes("Menstruasi")) {
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        tint: "text-red-500",
        stroke: "#f87171",
        label: "Menstruasi"
      };
    } else if (phaseStr.includes("Subur")) {
      return {
        bg: "bg-teal-50 text-teal-700 border-teal-200",
        tint: "text-teal-500",
        stroke: "#2dd4bf",
        label: "Fase Ovulasi"
      };
    } else if (phaseStr.includes("Folikular")) {
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        tint: "text-blue-500",
        stroke: "#60a5fa",
        label: "Fase Folikular"
      };
    } else {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        tint: "text-amber-500",
        stroke: "#fbbf24",
        label: "Fase Luteal (PMS)"
      };
    }
  };

  const themeVars = getPhaseTheme(phase);

  // Quick Action Array matching wireframe
  const actions = [
    { id: "add_symptom", label: "Add Symptoms", icon: Plus, color: "text-rose-500 bg-rose-50 border-rose-100" },
    { id: "record_mood", label: "Record Mood", icon: Heart, color: "text-pink-500 bg-pink-50 border-pink-100" },
    { id: "export_pdf", label: "Export Raw", icon: TrendingUp, color: "text-slate-600 bg-slate-50 border-slate-100" },
    { id: "read_articles", label: "Read Articles", icon: BookOpen, color: "text-indigo-500 bg-indigo-50 border-indigo-100" }
  ];

  // Extract all symptoms from recent logs
  const recentSymptoms = records
    .slice(0, 2)
    .reduce((acc: string[], curr) => [...acc, ...curr.symptoms], [])
    .filter((v, i, self) => self.indexOf(v) === i) // unique
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Greeting Layout */}
      <div className="flex justify-between items-center bg-white p-2 rounded-2xl">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block font-medium">Hello, Beautiful</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Good Evening, <span id="user-greeting-name" className="text-rose-500 font-extrabold">{user.name}</span>
          </h1>
        </div>
        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-xs">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
      </div>

      {/* Countdown Card (Circular countdown) matching Phone 1 wireframe */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left flex-1">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${themeVars.bg}`}>
              {phase}
            </span>
            <div className="space-y-1">
              <span className="text-slate-400 text-sm block">Perkiraan Menstruasi</span>
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {daysLeft === 0 ? "Hari ini!" : `${daysLeft} hari lagi`}
              </h2>
            </div>
            <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1">
              <Clock className="w-3.5 h-3.5" />
              Rata-rata siklus Anda adalah {cycleLength} hari
            </p>
          </div>

          {/* Circular SVG Countdown Meter */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="50"
                className="stroke-slate-100"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Highlight Circle */}
              <motion.circle
                cx="64"
                cy="64"
                r="50"
                stroke={themeVars.stroke}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 50}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 50) * (1 - percentElapsed / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xl font-bold text-slate-800 block leading-none">{percentElapsed}%</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Siklus</span>
            </div>
          </div>
        </div>

        {/* Diagonal clean backlighting */}
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-rose-50/40 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Cycle Summary Metrics (Avg Cycle, Period Length, Current Phase) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center transition-all hover:bg-white hover:shadow-xs">
          <span className="text-[10px] font-sans text-slate-400 block uppercase font-semibold">Siklus</span>
          <span className="text-sm font-bold text-slate-800 block mt-1">{cycleLength} hari</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center transition-all hover:bg-white hover:shadow-xs">
          <span className="text-[10px] font-sans text-slate-400 block uppercase font-semibold">Durasi Haid</span>
          <span className="text-sm font-bold text-slate-800 block mt-1">{periodLength} hari</span>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center transition-all hover:bg-white hover:shadow-xs">
          <span className="text-[10px] font-sans text-slate-400 block uppercase font-semibold">Fase Hari Ini</span>
          <span className="text-xs font-bold text-slate-800 block mt-1 truncate" title={themeVars.label}>
            {themeVars.label}
          </span>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase flex items-center gap-1.5 pl-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-4 gap-2.5">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={() => onSelectAction(act.id)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-100 tracking-tight hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-1.5 transition-transform group-hover:scale-105 ${act.color}`}>
                <act.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-slate-600 text-center leading-3 max-w-full truncate">
                {act.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Health Tip Card */}
      <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-4.5 flex gap-3.5 items-start">
        <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-orange-500" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1 uppercase tracking-wider">
            Daily Wellness Tip
          </span>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            "{dailyTip}"
          </p>
        </div>
      </div>

      {/* Recent Symptoms Chips */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
          Recent Registered Symptoms
        </h3>
        <div className="flex flex-wrap gap-2">
          {recentSymptoms.length > 0 ? (
            recentSymptoms.map((sym, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors cursor-default"
              >
                {sym}
              </span>
            ))
          ) : (
            <div className="w-full py-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 text-slate-400 text-xs text-sans">
              No recent symptoms logged. Go to <span className="font-semibold text-rose-400 cursor-pointer hover:underline" onClick={() => onNavigate("Record")}>Record</span> to register some logs!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
