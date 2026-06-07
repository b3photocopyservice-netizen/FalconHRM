/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Attendance, Employee, Role, AttendanceCorrection } from "../types";
import { 
  Clock, 
  CheckSquare, 
  XSquare, 
  AlertCircle, 
  CalendarRange, 
  PlayCircle, 
  StopCircle, 
  Clipboard, 
  Plus, 
  Check, 
  X, 
  Edit, 
  FileSpreadsheet, 
  UploadCloud, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Calendar
} from "lucide-react";

interface AttendanceModuleProps {
  attendanceData: Attendance[];
  employees: Employee[];
  currentRole: Role;
  onUpdateState: () => void;
}

export default function AttendanceModule({ attendanceData, employees, currentRole, onUpdateState }: AttendanceModuleProps) {
  // In-sync corrections state
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [activeTab, setActiveTab] = useState<"daily" | "corrections" | "requests" | "biometric">("daily");
  
  // Tab 1: Daily Attendance States
  const todayStr = "2026-06-04"; // Synchronized static date
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [editForm, setEditForm] = useState({
    employeeId: "",
    date: "",
    checkIn1: "",
    checkOut1: "",
    checkIn2: "",
    checkOut2: "",
    checkIn3: "",
    checkOut3: "",
    checkIn4: "",
    checkOut4: "",
    status: "Present" as Attendance["status"],
    notes: ""
  });

  // Tab 2: Correction Form States
  const [requestForm, setRequestForm] = useState({
    employeeId: employees[0]?.id || "",
    date: todayStr,
    checkIn1: "09:00",
    checkOut1: "17:00",
    checkIn2: "",
    checkOut2: "",
    checkIn3: "",
    checkOut3: "",
    checkIn4: "",
    checkOut4: "",
    reason: ""
  });

  // Tab 3: Biometric CSV Simulator States
  const [simulatedCSVRows, setSimulatedCSVRows] = useState<Array<{
    employeeId: string;
    employeeName: string;
    date: string;
    punches: string[];
    notes: string;
  }>>([]);
  const [excelImportCompleted, setExcelImportCompleted] = useState(false);

  // General Notification States
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [selectedEmpIdClock, setSelectedEmpIdClock] = useState(employees[0]?.id || "");
  const [punchNotes, setPunchNotes] = useState("");
  const [reviewingCorrection, setReviewingCorrection] = useState<AttendanceCorrection | null>(null);
  const [reviewerComment, setReviewerComment] = useState("");

  // Determine standard employee session
  const defaultEmp = employees.find(e => e.role === Role.EMPLOYEE) || employees[0];
  const isEmployeeUser = currentRole === Role.EMPLOYEE;

  // React hook to fetch and synchronize corrections whenever attendanceData changes
  useEffect(() => {
    const fetchCorrectionsAndSync = async () => {
      try {
        const res = await fetch("/api/state");
        if (res.ok) {
          const data = await res.json();
          setCorrections(data.corrections || []);
        }
      } catch (e) {
        console.error("Failed to sync corrections state", e);
      }
    };
    fetchCorrectionsAndSync();
  }, [attendanceData]);

  // Sync default form selection if employee log-in
  useEffect(() => {
    if (isEmployeeUser && defaultEmp) {
      setRequestForm(prev => ({ ...prev, employeeId: defaultEmp.id }));
    }
  }, [isEmployeeUser, defaultEmp]);

  // Statistics derived based on attendance records of selectedDate
  const loggedOnSelectedDate = attendanceData.filter(a => a.date === selectedDate);
  const totalEmployees = employees.length;
  const presentCount = loggedOnSelectedDate.filter(
    a => a.status === "Present" || a.status === "Late" || a.status === "Half-Day" || a.status === "Half Day"
  ).length;
  const absentCount = totalEmployees - presentCount - loggedOnSelectedDate.filter(a => a.status === "Leave" || a.status === "Holiday").length;
  const lateCount = loggedOnSelectedDate.filter(a => a.status === "Late" || (a.lateMinutes && a.lateMinutes > 0)).length;
  const presentRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  // Handles Sequential Real-time Punching Clock Input
  const handleRealtimeClock = async (type: "in" | "out") => {
    setActionError("");
    setActionSuccess("");

    const activeEmpId = isEmployeeUser ? (defaultEmp?.id || "") : selectedEmpIdClock;
    if (!activeEmpId) {
      setActionError("Please select a corporate employee first.");
      return;
    }

    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: activeEmpId,
          clockIn: type === "in" ? "true" : undefined,
          clockOut: type === "out" ? "true" : undefined,
          notes: punchNotes.trim() || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const punchLogged = type === "in" ? "Punched Check-In" : "Punched Check-Out";
        setActionSuccess(`${punchLogged} successfully for ${data.entry.employeeName} on today's shift card.`);
        setPunchNotes("");
        onUpdateState();
      } else {
        const err = await res.json();
        setActionError(err.error || "Punctuation failure");
      }
    } catch {
      setActionError("Internal server connection failure.");
    }
  };

  // Handles manual adjustments overwrite (HR/Super Admin)
  const handleManualRowAdjust = (att: Attendance) => {
    setEditingRecord(att);
    setEditForm({
      employeeId: att.employeeId,
      date: att.date,
      checkIn1: att.checkIn1 || "",
      checkOut1: att.checkOut1 || "",
      checkIn2: att.checkIn2 || "",
      checkOut2: att.checkOut2 || "",
      checkIn3: att.checkIn3 || "",
      checkOut3: att.checkOut3 || "",
      checkIn4: att.checkIn4 || "",
      checkOut4: att.checkOut4 || "",
      status: att.status,
      notes: att.notes || ""
    });
  };

  const handleManualRowAdd = () => {
    setEditingRecord(null); // Indicates a brand new manual log entry
    setEditForm({
      employeeId: employees[0]?.id || "",
      date: selectedDate,
      checkIn1: "09:00",
      checkOut1: "17:00",
      checkIn2: "",
      checkOut2: "",
      checkIn3: "",
      checkOut3: "",
      checkIn4: "",
      checkOut4: "",
      status: "Present",
      notes: "Manual override entry"
    });
  };

  const submitManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch("/api/attendance/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRecord?.id, // Sent if adjusting existing record
          ...editForm
        })
      });

      if (res.ok) {
        setActionSuccess(`Ledger manual override synchronization completed successfully.`);
        setEditingRecord(null);
        onUpdateState();
      } else {
        const err = await res.json();
        setActionError(err.error || "Manual adjustment update failed.");
      }
    } catch {
      setActionError("Server connection error on manual save request.");
    }
  };

  // Handles correction filing request (Filing)
  const submitCorrectionFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!requestForm.reason.trim()) {
      setActionError("Please provide a legitimate reason for clocking corrections.");
      return;
    }

    try {
      const res = await fetch("/api/attendance/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestForm)
      });

      if (res.ok) {
        setActionSuccess("Attendance clocking correction request filed successfully for approval.");
        setRequestForm({
          employeeId: isEmployeeUser ? defaultEmp?.id : employees[0]?.id || "",
          date: todayStr,
          checkIn1: "09:00",
          checkOut1: "17:00",
          checkIn2: "",
          checkOut2: "",
          checkIn3: "",
          checkOut3: "",
          checkIn4: "",
          checkOut4: "",
          reason: ""
        });
        onUpdateState();
      } else {
        const err = await res.json();
        setActionError(err.error || "Correction submission rejected.");
      }
    } catch {
      setActionError("Server error filing correction.");
    }
  };

  // Handles Approval Review Actions (Approve / Reject)
  const handleActionCorrection = async (status: "Approved" | "Rejected") => {
    if (!reviewingCorrection) return;
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch("/api/attendance/corrections/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewingCorrection.id,
          status,
          comments: reviewerComment.trim() || undefined,
          actorName: "HR Manager Executive"
        })
      });

      if (res.ok) {
        setActionSuccess(`Correction request ${reviewingCorrection.id} was ${status.toUpperCase()} securely.`);
        setReviewingCorrection(null);
        setReviewerComment("");
        onUpdateState();
      } else {
        const err = await res.json();
        setActionError(err.error || "An error occurred during workflow execution.");
      }
    } catch {
      setActionError("Workflow approval dispatch connection error.");
    }
  };

  // Biometric / CSV Import Templates simulation
  const loadImportsTemplate = (type: "standard" | "overtime" | "late") => {
    setExcelImportCompleted(false);
    
    let generated: Array<{
      employeeId: string;
      employeeName: string;
      date: string;
      punches: string[];
      notes: string;
    }> = [];

    if (type === "standard") {
      generated = [
        { employeeId: "EMP-001", employeeName: "Marcus Aurelius", date: selectedDate, punches: ["08:31", "12:05", "12:58", "17:02"], notes: "Biometric Device 1A - North Wing" },
        { employeeId: "EMP-003", employeeName: "John Smith", date: selectedDate, punches: ["08:55", "17:01"], notes: "Biometric Device 1B - North Wing Gate" },
        { employeeId: "EMP-004", employeeName: "Alan Turing", date: selectedDate, punches: ["08:42", "12:00", "13:00", "17:15"], notes: "Device 2B - R&D Complex" },
        { employeeId: "EMP-005", employeeName: "Ada Lovelace", date: selectedDate, punches: ["08:45", "12:15", "12:55", "17:30"], notes: "Device 2B - R&D Complex" }
      ];
    } else if (type === "overtime") {
      generated = [
        { employeeId: "EMP-004", employeeName: "Alan Turing", date: selectedDate, punches: ["08:15", "12:00", "13:00", "17:10", "18:00", "21:30"], notes: "Complex High OT Device" },
        { employeeId: "EMP-007", employeeName: "Grace Hopper", date: selectedDate, punches: ["08:30", "12:10", "12:55", "17:05", "17:45", "22:15"], notes: "Biometric Sync - Server Room" }
      ];
    } else if (type === "late") {
      generated = [
        { employeeId: "EMP-006", employeeName: "Charles Babbage", date: selectedDate, punches: ["10:15", "12:30", "13:15", "17:05"], notes: "Device Sync Late Arrival" },
        { employeeId: "EMP-010", employeeName: "Albert Einstein", date: selectedDate, punches: ["11:00", "16:00"], notes: "Academic delayed punch" }
      ];
    }

    setSimulatedCSVRows(generated);
  };

  const processBiometricSync = async () => {
    setActionError("");
    setActionSuccess("");
    if (simulatedCSVRows.length === 0) {
      setActionError("Please load a biometric log template file path first.");
      return;
    }

    let successCount = 0;
    try {
      for (const row of simulatedCSVRows) {
        // Build sequential indices up to 4 check-in/outs
        const pInput: any = {
          employeeId: row.employeeId,
          date: row.date,
          notes: `Biometric Device Sync Log. ${row.notes}`,
          status: "Present",
          checkIn1: row.punches[0] || undefined,
          checkOut1: row.punches[1] || undefined,
          checkIn2: row.punches[2] || undefined,
          checkOut2: row.punches[3] || undefined,
          checkIn3: row.punches[4] || undefined,
          checkOut3: row.punches[5] || undefined,
          checkIn4: row.punches[6] || undefined,
          checkOut4: row.punches[7] || undefined
        };

        const res = await fetch("/api/attendance/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pInput)
        });

        if (res.ok) {
          successCount++;
        }
      }

      setActionSuccess(`Successfully processed, compiled and synchronised ${successCount} biometric timesheets.`);
      setExcelImportCompleted(true);
      setSimulatedCSVRows([]);
      onUpdateState();
    } catch {
      setActionError("Failed to dispatch device batch queries.");
    }
  };

  // Helper formats minutes to text (e.g. 510 -> 8h 30m)
  const formatMins = (mins?: number) => {
    if (!mins) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Filtered attendance dataset
  const filteredDailyAttendance = employees.filter(emp => {
    if (isEmployeeUser && emp.id !== defaultEmp?.id) return false;
    return emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) || 
           emp.id.toLowerCase().includes(searchEmployee.toLowerCase());
  }).map(emp => {
    const record = loggedOnSelectedDate.find(a => a.employeeId === emp.id);
    return {
      employee: emp,
      record: record || ({
        id: "",
        employeeId: emp.id,
        employeeName: emp.name,
        date: selectedDate,
        status: "Absent" as Attendance["status"]
      } as Attendance)
    };
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Micro-Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-bold text-slate-800 heading-display mt-1 font-mono">{presentRate}%</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Active Duty on {selectedDate}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckSquare size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Punched Presents</p>
            <p className="text-2xl font-bold text-slate-800 heading-display mt-1 font-mono">{presentCount} <span className="text-xs font-normal text-slate-400">/ {totalEmployees}</span></p>
            <p className="text-[10px] text-indigo-600 font-semibold mt-1">✓ Clocked on-site or breaks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Late Arrivals</p>
            <p className="text-2xl font-bold text-slate-800 heading-display mt-1 font-mono text-amber-600">{lateCount}</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠ After Shift Start (09:00)</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Corrections</p>
            <p className="text-2xl font-bold text-slate-800 heading-display mt-1 font-mono text-indigo-600">
              {corrections.filter(c => c.status === "Pending").length}
            </p>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">✓ Require Verification Review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* Messages / Status feedback notifications */}
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          {actionSuccess}
        </div>
      )}

      {/* Primary tab switching panel and realtime puncher */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Real-Time Punch Clock Terminal Simulator */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 h-fit space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 text-indigo-900">
              <Clock size={16} className="text-indigo-600" />
              Clock Punch Terminal
            </h3>
            <p className="text-xs text-slate-400 mt-1">Simulate biometric hardware interface swipes on real-time.</p>
          </div>

          <div className="space-y-3 pt-1">
            {isEmployeeUser ? (
              <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Device Identified ESS Session</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{defaultEmp?.name}</p>
                <p className="text-xs text-slate-500">{defaultEmp?.designation} • {defaultEmp?.id}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scan Card / Choose ID</label>
                <select
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-hidden cursor-pointer"
                  value={selectedEmpIdClock}
                  onChange={(e) => setSelectedEmpIdClock(e.target.value)}
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clock Activity Notes (Optional)</label>
              <textarea
                placeholder="Commute details, machine number, field work or breaks reason..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden h-14 placeholder-slate-400"
                value={punchNotes}
                onChange={(e) => setPunchNotes(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleRealtimeClock("in")}
                className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer"
              >
                <PlayCircle size={14} />
                Swipe Clock In
              </button>
              <button
                type="button"
                onClick={() => handleRealtimeClock("out")}
                className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer"
              >
                <StopCircle size={14} />
                Swipe Clock Out
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed text-center italic mt-1">
              Provides daily clock registers 1 to 4 with automated intervals mapping.
            </p>
          </div>
        </div>

        {/* Administration Core Deck */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 flex flex-col min-h-[480px]">
          
          {/* Deck Header & Module Tabs */}
          <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1 bg-slate-50/80 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("daily")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeTab === "daily" ? "bg-white text-indigo-950 shadow-xs border border-slate-150" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Calendar size={13} />
                Daily Roster
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab("requests")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeTab === "requests" ? "bg-white text-indigo-950 shadow-xs border border-slate-150" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Plus size={13} />
                Correction Request
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("corrections")}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeTab === "corrections" ? "bg-white text-indigo-950 shadow-xs border border-slate-150" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ShieldCheck size={13} />
                Review Workflow
                {corrections.filter(c => c.status === "Pending").length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-mono">
                    {corrections.filter(c => c.status === "Pending").length}
                  </span>
                )}
              </button>

              {!isEmployeeUser && (
                <button
                  type="button"
                  onClick={() => setActiveTab("biometric")}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    activeTab === "biometric" ? "bg-white text-indigo-950 shadow-xs border border-slate-150" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileSpreadsheet size={13} />
                  Biometric CSV Import
                </button>
              )}
            </div>

            {/* Global Date Selection widget */}
            {activeTab === "daily" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold shrink-0">Working Date:</span>
                <input
                  type="date"
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl p-1.5 font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex-1 pt-4">

            {/* TAB 1: DAILY ROSTER GRID & ADJUSTMENTS */}
            {activeTab === "daily" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-hidden text-slate-700"
                      placeholder="Search workforce roster..."
                      value={searchEmployee}
                      onChange={(e) => setSearchEmployee(e.target.value)}
                    />
                  </div>

                  {!isEmployeeUser && (
                    <button
                      type="button"
                      onClick={handleManualRowAdd}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-3 py-2 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus size={14} />
                      Append Manual Overwrite
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                        <th className="py-2.5 px-3 rounded-l-md">Staff Personnel</th>
                        <th className="py-2.5 px-2">Work Interval 1 (In/Out)</th>
                        <th className="py-2.5 px-2">Work Interval 2 (In/Out)</th>
                        <th className="py-2.5 px-2">Work Interval 3 (In/Out)</th>
                        <th className="py-2.5 px-2">Work Interval 4 (In/Out)</th>
                        <th className="py-2.5 px-2 text-center">Worked Hours</th>
                        <th className="py-2.5 px-2 text-center">Late Flag</th>
                        <th className="py-2.5 px-2 text-center">Overtime</th>
                        <th className="py-2.5 px-2">Status</th>
                        {!isEmployeeUser && <th className="py-2.5 px-3 text-right rounded-r-md">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {filteredDailyAttendance.map(({ employee, record }) => (
                        <tr key={employee.id} className="hover:bg-slate-50/30">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-800 block text-xs">{employee.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{employee.id} • {employee.department}</span>
                          </td>
                          <td className="py-3 px-2 font-mono text-slate-600">
                            {record.checkIn1 ? (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs gap-0.5">
                                {record.checkIn1} - {record.checkOut1 || "Working"}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-2 font-mono text-slate-600">
                            {record.checkIn2 ? (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                                {record.checkIn2} - {record.checkOut2 || "Working"}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-2 font-mono text-slate-600">
                            {record.checkIn3 ? (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                                {record.checkIn3} - {record.checkOut3 || "Working"}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-2 font-mono text-slate-600">
                            {record.checkIn4 ? (
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                                {record.checkIn4} - {record.checkOut4 || "Working"}
                              </span>
                            ) : "—"}
                          </td>
                          
                          <td className="py-3 px-2 text-center font-bold text-slate-700 font-mono">
                            {formatMins(record.totalWorkedMinutes)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {record.lateMinutes && record.lateMinutes > 0 ? (
                              <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100 font-mono">
                                {record.lateMinutes} mins late
                              </span>
                            ) : <span className="text-[10px] text-slate-400 font-medium">No late arrival</span>}
                          </td>
                          <td className="py-3 px-2 text-center text-emerald-600 font-bold font-mono">
                            {record.overtimeMinutes && record.overtimeMinutes > 0 ? (
                              <span className="bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 whitespace-nowrap">
                                +{formatMins(record.overtimeMinutes)}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                              record.status === "Present" ? "bg-emerald-55 text-emerald-800 border border-emerald-100 bg-emerald-50" :
                              record.status === "Late" ? "bg-amber-50 text-amber-800 border border-amber-100" :
                              record.status === "Half Day" || record.status === "Half-Day" ? "bg-indigo-50 text-indigo-800 border border-indigo-150" :
                              record.status === "Leave" ? "bg-blue-50 text-blue-800 border border-blue-150" :
                              record.status === "Holiday" ? "bg-purple-50 text-purple-800 border-purple-150" :
                              record.status === "Weekend" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                              "bg-rose-50 text-rose-800 border border-rose-100 bg-rose-50"
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          
                          {!isEmployeeUser && (
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleManualRowAdjust(record)}
                                className="p-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 font-bold rounded-lg text-[11px] text-slate-600 flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <Edit size={11} />
                                Adjust
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: REQUEST CORRECTION TERMINAL */}
            {activeTab === "requests" && (
              <div className="max-w-xl mx-auto py-2">
                <form onSubmit={submitCorrectionFiling} className="space-y-4">
                  <div className="bg-slate-50/60 p-4 rounded-xl border border-dashed border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 mb-1 text-indigo-900">
                      <Clock size={14} />
                      Correction Parameters
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Submit missing check records or hours adjustments on attendance cards.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {isEmployeeUser ? (
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Filing Employee</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                          value={`${defaultEmp?.name} (${defaultEmp?.id})`}
                          disabled
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Select Staff Employee</label>
                        <select
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden cursor-pointer"
                          value={requestForm.employeeId}
                          onChange={(e) => setRequestForm(p => ({ ...p, employeeId: e.target.value }))}
                        >
                          {employees.map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Adjustment Date</label>
                      <input
                        type="date"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
                        value={requestForm.date}
                        onChange={(e) => setRequestForm(p => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Clock-In 1</label>
                        <input type="time" className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono" value={requestForm.checkIn1} onChange={(e) => setRequestForm(p => ({ ...p, checkIn1: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Clock-Out 1</label>
                        <input type="time" className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono" value={requestForm.checkOut1} onChange={(e) => setRequestForm(p => ({ ...p, checkOut1: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Clock-In 2</label>
                        <input type="time" className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono" value={requestForm.checkIn2} onChange={(e) => setRequestForm(p => ({ ...p, checkIn2: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Clock-Out 2</label>
                        <input type="time" className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono" value={requestForm.checkOut2} onChange={(e) => setRequestForm(p => ({ ...p, checkOut2: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Core Reason for Correction</label>
                    <textarea
                      placeholder="Specify legitimate grounds, card scan error, transit delays or break overlap..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden min-h-[80px]"
                      value={requestForm.reason}
                      onChange={(e) => setRequestForm(p => ({ ...p, reason: e.target.value }))}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Transmit Correction Request File
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: REVIEW WORKFLOW CONTROL PANEL */}
            {activeTab === "corrections" && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <h4 className="text-xs font-bold text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Review Correction Approval Pipeline
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Manage requests and execute sequential workforce validation audits.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Filing Employee</th>
                        <th className="py-2.5 px-2">Work Date</th>
                        <th className="py-2.5 px-2">Proposed Clocking Multi-Punches</th>
                        <th className="py-2.5 px-2">Reason Notes</th>
                        <th className="py-2.5 px-2">Workflow Status</th>
                        {!isEmployeeUser && <th className="py-2.5 px-3 text-right">Decisions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {corrections.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                            No adjustments or correction requests in history.
                          </td>
                        </tr>
                      ) : (
                        corrections
                          .filter(c => !isEmployeeUser || c.employeeId === defaultEmp?.id)
                          .map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/45">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800">{item.employeeName}</span>
                              <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{item.employeeId}</span>
                            </td>
                            <td className="py-3 px-2 font-mono text-slate-700">{item.date}</td>
                            <td className="py-3 px-2">
                              <div className="space-y-0.5 text-[10px] font-mono text-indigo-900 bg-indigo-50/40 p-1.5 rounded border border-indigo-100/30">
                                {item.checkIn1 && <div className="block">Int-1: {item.checkIn1} - {item.checkOut1 || "Working"}</div>}
                                {item.checkIn2 && <div className="block">Int-2: {item.checkIn2} - {item.checkOut2 || "Working"}</div>}
                                {item.checkIn3 && <div className="block">Int-3: {item.checkIn3} - {item.checkOut3 || "Working"}</div>}
                                {item.checkIn4 && <div className="block">Int-4: {item.checkIn4} - {item.checkOut4 || "Working"}</div>}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-slate-600 max-w-xs break-words font-medium">
                              <div className="flex gap-1.5">
                                <MessageSquare size={13} className="text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-slate-700 italic">"{item.reason}"</span>
                                  {item.comments && (
                                    <div className="mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      Reviewer: {item.comments}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                item.status === "Approved" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                item.status === "Rejected" ? "bg-red-50 text-red-800 border border-red-100" :
                                "bg-amber-50 text-amber-800 border border-amber-100"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            {!isEmployeeUser && (
                              <td className="py-3 px-3 text-right">
                                {item.status === "Pending" ? (
                                  <button
                                    type="button"
                                    onClick={() => setReviewingCorrection(item)}
                                    className="px-2.5 py-1 bg-slate-800 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide hover:bg-slate-900 cursor-pointer"
                                  >
                                    Execute Decision
                                  </button>
                                ) : (
                                  <div className="text-[10px] text-slate-400 italic">
                                    Resolved by {item.resolvedBy || "HR System"}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: BIOMETRIC CSV FILE IMPORT IMPORT */}
            {activeTab === "biometric" && (
              <div className="space-y-6">
                <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <UploadCloud size={30} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 heading-display">Import Daily Biometric hardware logs</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Synchronize clock registers and swipe records in bulk using Excel device reports.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-2 pt-1 font-semibold text-xs">
                    <button
                      type="button"
                      onClick={() => loadImportsTemplate("standard")}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer text-slate-700"
                    >
                      Retrieve Standard Template
                    </button>
                    <button
                      type="button"
                      onClick={() => loadImportsTemplate("overtime")}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer text-slate-700"
                    >
                      Retrieve Overtime Template
                    </button>
                    <button
                      type="button"
                      onClick={() => loadImportsTemplate("late")}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer text-slate-700"
                    >
                      Retrieve Late Arrivals Template
                    </button>
                  </div>
                </div>

                {simulatedCSVRows.length > 0 && (
                  <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <FileSpreadsheet size={14} className="text-emerald-600" />
                      Spreadsheet CSV Parser View
                    </h5>

                    <div className="overflow-x-auto bg-white rounded-xl border border-slate-150">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2 px-3">Code</th>
                            <th className="py-2 px-2">Employee Name</th>
                            <th className="py-2 px-2">Work Date</th>
                            <th className="py-2 px-2">Swipe Log Sequences</th>
                            <th className="py-2 px-3">Device ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-[11px] text-slate-700">
                          {simulatedCSVRows.map((r, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-3 font-semibold text-indigo-900">{r.employeeId}</td>
                              <td className="py-2 px-2 font-sans font-semibold text-slate-850">{r.employeeName}</td>
                              <td className="py-2 px-2">{r.date}</td>
                              <td className="py-2 px-2 text-emerald-800 font-bold">
                                {r.punches.join(" → ")}
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-400 text-[10px]">{r.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={processBiometricSync}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition uppercase tracking-wide cursor-pointer"
                    >
                      Synchronize Devices with Attendance Engine
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL: EXAMINING/DECIDING CORRECTIONS WORKFLOW APPROVAL */}
      {reviewingCorrection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="heading-display font-medium text-sm text-white uppercase tracking-wider">
                Examine Proposal: {reviewingCorrection.id}
              </h3>
              <button
                type="button"
                onClick={() => setReviewingCorrection(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-150">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Requesting Employee</p>
                <p className="font-bold text-slate-850 text-sm leading-tight">{reviewingCorrection.employeeName}</p>
                <p className="text-slate-500">{reviewingCorrection.employeeId} • Date: {reviewingCorrection.date}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Employee's Rationales For Correction</p>
                <p className="font-semibold text-slate-700 bg-amber-50 p-3 rounded-lg italic border border-amber-100">
                  "{reviewingCorrection.reason}"
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Review Comments / Approvals Note</p>
                <textarea
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  placeholder="Insert authorization remarks or reject comments detail here..."
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleActionCorrection("Rejected")}
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold py-2.5 rounded-xl border border-rose-200 cursor-pointer"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleActionCorrection("Approved")}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold py-2.5 rounded-xl cursor-pointer shadow-sm"
                >
                  Approve Adjustment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL LEDGER ADJUSTMENT OVERWRITES */}
      {editingRecord !== undefined && editingRecord !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <h3 className="heading-display font-bold text-sm uppercase tracking-widest text-white">
                {editingRecord.id ? `Adjust Employee: ${editingRecord.employeeName}` : "Append Manual Attendance Ledger"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitManualAdjustment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editingRecord.id ? (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Target Personnel</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold font-sans"
                      value={`${editingRecord.employeeName} (${editingRecord.employeeId})`}
                      disabled
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Select Employee Personnel</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden font-sans cursor-pointer"
                      value={editForm.employeeId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Work Status Date Override</label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-hidden"
                    value={editForm.date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Mark Attendance Registry</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden cursor-pointer"
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as Attendance["status"] }))}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Leave">Leave</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Weekend">Weekend</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">
                  Configure punch registers (Format: HH:MM, empty slots clear)
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Check In 1</label>
                    <input type="text" placeholder="09:00" className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono" value={editForm.checkIn1} onChange={(e) => setEditForm(prev => ({ ...prev, checkIn1: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Check Out 1</label>
                    <input type="text" placeholder="12:00" className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono" value={editForm.checkOut1} onChange={(e) => setEditForm(prev => ({ ...prev, checkOut1: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Check In 2</label>
                    <input type="text" placeholder="13:00" className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono" value={editForm.checkIn2} onChange={(e) => setEditForm(prev => ({ ...prev, checkIn2: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Check Out 2</label>
                    <input type="text" placeholder="17:00" className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono" value={editForm.checkOut2} onChange={(e) => setEditForm(prev => ({ ...prev, checkOut2: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Check In 3</label>
                    <input type="text" placeholder="e.g. 18:00" className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono" value={editForm.checkIn3} onChange={(e) => setEditForm(prev => ({ ...prev, checkIn3: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Check Out 3</label>
                    <input type="text" placeholder="e.g. 20:00" className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono" value={editForm.checkOut3} onChange={(e) => setEditForm(prev => ({ ...prev, checkOut3: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Check In 4</label>
                    <input type="text" placeholder="—" className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono" value={editForm.checkIn4} onChange={(e) => setEditForm(prev => ({ ...prev, checkIn4: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Check Out 4</label>
                    <input type="text" placeholder="—" className="w-full p-1.5 bg-white border border-slate-200 rounded font-mono" value={editForm.checkOut4} onChange={(e) => setEditForm(prev => ({ ...prev, checkOut4: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Core Shift Ledger Notes</label>
                <textarea
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  placeholder="Add notes for this manual override..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-250 font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Compile & Save Ledger Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
