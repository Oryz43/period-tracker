import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Edit2, Sparkles, AlertCircle } from "lucide-react";
import { CycleRecord } from "../types";
import { buildCalendarMonth, formatReadableDate, formatDateString, parseDateString } from "../utils";

interface CalendarViewProps {
  user: any;
  records: CycleRecord[];
  onAddNote: (date: string) => void;
}

export default function CalendarView({ user, records, onAddNote }: CalendarViewProps) {
  // Use today as a baseline or let the user navigate. Let's baseline at May 2025 as shown in the wireframe!
  // If the user desires to navigate, they can navigate months and years.
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2025, 4, 16)); // May 16, 2025 like in wireframe!

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  // Find latest record before or near this date to calculate future projections
  const latestRecord = useMemo(() => {
    if (records.length === 0) return null;
    return records[0]; // Already sorted newest to oldest
  }, [records]);

  // Generate calendar days for selected month
  const calendarDays = useMemo(() => {
    const latestStartStr = latestRecord ? latestRecord.startDate : "2025-05-12"; // mock fallback if empty
    return buildCalendarMonth(year, monthIndex, latestStartStr, user.cycleLength, user.periodLength);
  }, [year, monthIndex, latestRecord, user.cycleLength, user.periodLength]);

  // Selected date state (defaults to May 16 2025 as in wireframe)
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2025-05-16");

  const selectedDateObj = useMemo(() => {
    return parseDateString(selectedDateStr);
  }, [selectedDateStr]);

  // Find if there is an existing record for the selected date
  const selectedDateRecord = useMemo(() => {
    // Check if the selected date falls within any period range
    return records.find(r => {
      if (r.startDate === selectedDateStr) return true;
      if (r.endDate && selectedDateStr >= r.startDate && selectedDateStr <= r.endDate) return true;
      return false;
    });
  }, [selectedDateStr, records]);

  // Phase information for the selected date on the calendar
  const selectedDayMetrics = useMemo(() => {
    return calendarDays.find(d => d.dateStr === selectedDateStr);
  }, [calendarDays, selectedDateStr]);

  // Month header text
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const p = new Date(prev);
      p.setMonth(prev.getMonth() - 1);
      return p;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(next => {
      const n = new Date(next);
      n.setMonth(next.getMonth() + 1);
      return n;
    });
  };

  return (
    <div className="space-y-5">
      {/* Calendar Tab Heading */}
      <div className="flex justify-between items-center bg-white p-1 pb-2">
        <div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-semibold">Interactive Grid</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Menstrual Calendar</h1>
        </div>
        <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-center">
          <CalIcon className="w-5 h-5 text-rose-500" />
        </div>
      </div>

      {/* Monthly Navigation Panel */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-slate-800 tracking-tight">
            {monthNames[monthIndex]} {year}
          </span>
          <div className="flex gap-1.5">
            <button 
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 bg-slate-50 hover:bg-white text-slate-600 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-100 bg-slate-50 hover:bg-white text-slate-600 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center mb-2.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, dIdx) => (
            <span key={dIdx} className="text-xs font-semibold text-slate-400 py-1 font-mono uppercase tracking-wider">
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1.5 text-center">
          {calendarDays.map((day, idx) => {
            const isSelected = day.dateStr === selectedDateStr;
            const isToday = formatDateString(new Date()) === day.dateStr;

            // Compute styling parameters
            let displayStyle = "text-slate-700 bg-transparent hover:bg-slate-50";
            
            if (!day.isCurrentMonth) {
              displayStyle = "text-slate-300 pointer-events-none";
            }

            // Highlighting based on phase cycles
            let indicatorBlob = null;
            if (day.isMenstruation && day.isCurrentMonth) {
              displayStyle += " text-red-600 font-bold";
              indicatorBlob = <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400"></span>;
            } else if (day.isOvulation && day.isCurrentMonth) {
              displayStyle += " text-teal-600 font-bold rounded-full border border-dashed border-teal-300";
              indicatorBlob = <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-400"></span>;
            } else if (day.isFertile && day.isCurrentMonth) {
              displayStyle += " text-teal-700 font-semibold";
              indicatorBlob = <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-teal-300"></span>;
            } else if (day.isLuteal && day.isCurrentMonth) {
              indicatorBlob = <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400"></span>;
            }

            return (
              <button
                key={idx}
                onClick={() => setSelectedDateStr(day.dateStr)}
                className={`relative h-10 w-10 flex items-center justify-center text-sm rounded-xl cursor-pointer font-sans transition-all ${displayStyle} ${
                  isSelected ? "bg-rose-500 text-white font-extrabold shadow-sm scale-105 hover:bg-rose-600" : ""
                } ${
                  isToday && !isSelected ? "border border-slate-300 outline-none" : ""
                }`}
              >
                <span>{day.dayNum}</span>
                {indicatorBlob}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color System Legend (directly from Phone 2 wireframe layout) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3.5">Legend Color System</span>
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-400 block shrink-0"></span>
            <span className="text-xs font-medium text-slate-600">Menstruation Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border border-dashed border-teal-400 block shrink-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            </div>
            <span className="text-xs font-medium text-slate-600">Estimated Ovulation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-teal-200 block shrink-0"></span>
            <span className="text-xs font-medium text-slate-600">Fertile Window</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-300 block shrink-0"></span>
            <span className="text-xs font-medium text-slate-600">PMS / Luteal Phase</span>
          </div>
        </div>
      </div>

      {/* Selected Date Details Box (Phone 2 wireframe bottom item) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider block">Selected Date Details</span>
            <h4 className="text-lg font-bold text-slate-800">
              {formatReadableDate(selectedDateStr)}
            </h4>
          </div>
          <button
            onClick={() => onAddNote(selectedDateStr)}
            className="px-3.5 py-1.5 rounded-xl border border-rose-100 bg-rose-50/50 hover:border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add/Edit Note
          </button>
        </div>

        {/* Phase descriptions */}
        <div className="divide-y divide-slate-100 pt-1">
          <div className="py-2.5 flex justify-between items-center text-xs">
            <span className="text-slate-400">Status Siklus:</span>
            <span className="font-bold text-slate-700">
              {selectedDayMetrics?.isMenstruation ? "Fase Menstruasi (Pendarahan)" : 
               selectedDayMetrics?.isOvulation ? "Hari Ovulasi Utama" :
               selectedDayMetrics?.isFertile ? "Berada Dalam Jendela Subur" : "Fase Pasca-Ovulasi (PMS)"}
            </span>
          </div>

          <div className="py-3 text-xs space-y-2">
            <span className="text-slate-400 block mb-1">Catatan Kesehatan Tanggal Ini:</span>
            {selectedDateRecord ? (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100/50 space-y-2 max-w-full">
                {selectedDateRecord.notes ? (
                  <p className="text-slate-600 font-sans italic">"{selectedDateRecord.notes}"</p>
                ) : (
                  <p className="text-slate-400 italic font-sans">Tidak ada catatan teks tertulis.</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[10px]">
                    Aliran: {selectedDateRecord.flowIntensity}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px]">
                    Suasana Hati: {selectedDateRecord.mood}
                  </span>
                  {selectedDateRecord.symptoms.map((sym, symIdx) => (
                    <span key={symIdx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 flex items-center gap-1.5 italic font-sans pt-1">
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-300" />
                Belum ada gejala atau catatan terdaftar untuk hari ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
