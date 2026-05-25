import { useState, useEffect, FormEvent } from "react";
import { Plus, Check, Heart, Droplets, Calendar as CalIcon, MessageSquare, Save, Trash2, ArrowLeft } from "lucide-react";
import { FlowIntensity, CycleRecord } from "../types";
import { formatDateString } from "../utils";

interface RecordViewProps {
  userId: string;
  records: CycleRecord[];
  onSaveRecord: (payload: any) => Promise<boolean>;
  onDeleteRecord: (id: string) => Promise<boolean>;
  preselectedDate: string | null;
  onClearPreselectedDate: () => void;
}

export default function RecordView({
  userId,
  records,
  onSaveRecord,
  onDeleteRecord,
  preselectedDate,
  onClearPreselectedDate
}: RecordViewProps) {
  // Check if there is an existing record on the preselected date
  // or default to today's date
  const initialDateStr = preselectedDate || formatDateString(new Date());

  const [id, setId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(initialDateStr);
  const [endDate, setEndDate] = useState<string>("");
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity>("Medium");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string>("Calm");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });

  // If a record already exists on the selected startDate, load it so we can Edit / Update it!
  const loadExistingRecordForDate = (dateToLoad: string) => {
    const found = records.find(r => r.startDate === dateToLoad || (r.endDate && dateToLoad >= r.startDate && dateToLoad <= r.endDate));
    if (found) {
      setId(found.id);
      setStartDate(found.startDate);
      setEndDate(found.endDate || "");
      setFlowIntensity(found.flowIntensity);
      setSymptoms(found.symptoms);
      setMood(found.mood);
      setNotes(found.notes || "");
    } else {
      // Clear except date
      setId("");
      setEndDate("");
      setFlowIntensity("Medium");
      setSymptoms([]);
      setMood("Calm");
      setNotes("");
    }
  };

  useEffect(() => {
    loadExistingRecordForDate(startDate);
  }, [startDate, records]);

  // Symptoms options matching the common Indonesian and English lists
  const availableSymptoms = [
    "Kram perut", "Nyeri payudara", "Keletihan", "Sakit kepala", 
    "Sakit pinggang", "Kembung (Bloated)", "Jerawatan (Acne)", "Mual", 
    "Sembelit/Diare", "Kurang konsentrasi"
  ];

  // Mood options
  const moodOptions = [
    { label: "Happy", emoji: "😊", color: "border-emerald-200 text-emerald-700 bg-emerald-50" },
    { label: "Calm", emoji: "🧘", color: "border-blue-200 text-blue-700 bg-blue-50" },
    { label: "Sensitive", emoji: "🥺", color: "border-amber-200 text-amber-700 bg-amber-50" },
    { label: "Sad", emoji: "😢", color: "border-indigo-200 text-indigo-700 bg-indigo-50" },
    { label: "Anxious", emoji: "😰", color: "border-purple-200 text-purple-700 bg-purple-50" },
    { label: "Angry", emoji: "😠", color: "border-red-200 text-red-700 bg-red-50" }
  ];

  // Flow intensity choices with styling
  const flowOptions: { limit: FlowIntensity; label: string; desc: string }[] = [
    { limit: "Light", label: "Light", desc: "Minimal bleeding / spotting" },
    { limit: "Medium", label: "Medium", desc: "Moderate normal flow" },
    { limit: "Heavy", label: "Heavy", desc: "Strong heavy bleeding" },
    { limit: "Very Heavy", label: "Very Heavy", desc: "Extremely heavy flow" }
  ];

  const handleToggleSymptom = (symptom: string) => {
    setSymptoms(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(s => s !== symptom);
      } else {
        return [...prev, symptom];
      }
    });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      setSaveStatus({ type: 'error', message: "Tanggal mulai wajib diisi." });
      return;
    }
    if (endDate && endDate < startDate) {
      setSaveStatus({ type: 'error', message: "Tanggal selesai tidak boleh mendahului tanggal mulai." });
      return;
    }

    setIsSubmitting(true);
    setSaveStatus({ type: null, message: "" });

    try {
      const payload = {
        id: id || undefined,
        userId,
        startDate,
        endDate: endDate || undefined,
        flowIntensity,
        symptoms,
        mood,
        notes: notes.trim()
      };

      const success = await onSaveRecord(payload);
      if (success) {
        setSaveStatus({ type: 'success', message: "Catatan siklus Anda telah berhasil disimpan!" });
        // Clear preselected indicators
        onClearPreselectedDate();
      } else {
        setSaveStatus({ type: 'error', message: "Gagal menyimpan catatan. Silakan lengkapi formulir Anda." });
      }
    } catch (err) {
      setSaveStatus({ type: 'error', message: "Kesalahan server internal. Silakan coba lagi nanti." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus catatan siklus tanggal ini?")) {
      setIsSubmitting(true);
      try {
        const success = await onDeleteRecord(id);
        if (success) {
          setSaveStatus({ type: 'success', message: "Catatan siklus telah berhasil dihapus!" });
          setId("");
          setEndDate("");
          setFlowIntensity("Medium");
          setSymptoms([]);
          setMood("Calm");
          setNotes("");
          onClearPreselectedDate();
        } else {
          setSaveStatus({ type: 'error', message: "Gagal menghapus catatan." });
        }
      } catch (err) {
        setSaveStatus({ type: 'error', message: "Gagal memproses penghapusan." });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Page header */}
      <div className="flex justify-between items-center bg-white p-1 pb-2">
        <div className="flex items-center gap-2">
          {preselectedDate && (
            <button 
              onClick={() => onClearPreselectedDate()}
              className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
            </button>
          )}
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block font-semibold">Record Log Entry</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              {id ? "Edit Cycle Record" : "Track Current Day"}
            </h1>
          </div>
        </div>
        <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100/50 flex items-center justify-center">
          <Heart className="w-5 h-5 text-teal-500" />
        </div>
      </div>

      {saveStatus.type && (
        <div className={`p-4 rounded-2xl border text-sm font-sans flex items-start gap-2.5 ${
          saveStatus.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="font-semibold">{saveStatus.type === 'success' ? "Done:" : "Error:"}</div>
          <p className="flex-1 leading-relaxed">{saveStatus.message}</p>
        </div>
      )}

      {/* Main Logging Form split into logical cards */}
      <form onSubmit={handleSave} className="space-y-5">
        
        {/* Card 1: Cycle Schedule Dates */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Period Schedule</span>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase flex items-center gap-1.5">
                <CalIcon className="w-3.5 h-3.5 text-slate-400" />
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-slate-800 bg-slate-50/50 focus:border-rose-400 focus:bg-white focus:outline-none text-xs font-semibold select-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase flex items-center gap-1.5">
                <CalIcon className="w-3.5 h-3.5 text-slate-400" />
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-slate-800 bg-slate-50/50 focus:border-rose-400 focus:bg-white focus:outline-none text-xs font-semibold select-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Flow Intensity Drops matching Phone 3 wireframe structure */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Flow Intensity</span>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {flowOptions.map((flow) => {
              const isSelected = flowIntensity === flow.limit;
              return (
                <button
                  type="button"
                  key={flow.limit}
                  onClick={() => setFlowIntensity(flow.limit)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all cursor-pointer text-center group ${
                    isSelected 
                      ? "border-rose-300 text-rose-700 bg-rose-50/60 shadow-xs" 
                      : "border-slate-100 text-slate-600 bg-slate-50/40 hover:border-slate-200"
                  }`}
                >
                  <Droplets className={`w-6 h-6 mb-1.5 transition-transform group-hover:scale-105 ${
                    isSelected ? "text-rose-500 fill-rose-500" : "text-slate-400"
                  }`} />
                  <span className="text-xs font-bold block">{flow.label}</span>
                  <span className="text-[9px] text-slate-400 leading-none mt-1 group-hover:text-slate-500">
                    {flow.limit === "Light" ? "Spotting" : flow.limit === "Medium" ? "Average" : flow.limit === "Heavy" ? "Strong" : "Severe"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 3: Symptoms Selector */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Register Symptoms</span>
          
          <div className="flex flex-wrap gap-2">
            {availableSymptoms.map((sym) => {
              const checked = symptoms.includes(sym);
              return (
                <button
                  type="button"
                  key={sym}
                  onClick={() => handleToggleSymptom(sym)}
                  className={`px-3 py-2 rounded-full border text-xs font-medium cursor-pointer transition-all flex items-center gap-1 ${
                    checked 
                      ? "bg-rose-500 text-white border-rose-500 shadow-xs" 
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5" />}
                  <span>{sym}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 4: Mood selection matching wireframe */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Core Mood Entry</span>
          
          <div className="grid grid-cols-3 gap-2.5">
            {moodOptions.map((option) => {
              const isSelected = mood === option.label;
              return (
                <button
                  type="button"
                  key={option.label}
                  onClick={() => setMood(option.label)}
                  className={`py-3.5 px-2.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${
                    isSelected 
                      ? option.color + " shadow-xs font-bold border-slate-300" 
                      : "bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xl leading-none mb-1">{option.emoji}</span>
                  <span className="text-[11px] leading-none font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 5: Text Notes */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ketik keluhan fisik, pemicu stres, tidur, atau sirkulasi pencernaan yang Anda rasakan..."
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:border-rose-400 focus:bg-white focus:outline-none text-xs font-medium text-slate-700 placeholder:text-slate-400 font-sans resize-none leading-relaxed"
          ></textarea>
        </div>

        {/* Submitting Buttons row */}
        <div className="flex gap-3 pt-1">
          {id && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="flex-1 py-3.5 px-4 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-2 py-3.5 px-5 rounded-2xl font-bold bg-slate-800 text-white hover:bg-slate-900 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Menyimpan..." : id ? "Simpan Perubahan" : "Save Record"}
          </button>
        </div>

      </form>
    </div>
  );
}
