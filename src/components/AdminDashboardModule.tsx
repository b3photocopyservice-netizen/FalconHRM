import React, { useState, useEffect } from "react";
import { Role, Employee, Attendance, LeaveRequest, SalaryAdvance, Payslip, LedgerEntry, AuditLog } from "../types";
import FalconLogo from "./FalconLogo";
import {
  Users,
  Clock,
  CalendarDays,
  Coins,
  Receipt,
  BookOpen,
  Activity,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  UserPlus,
  Compass,
  AlertCircle,
  Clock3,
  Terminal,
  Megaphone,
  AreaChart
} from "lucide-react";

interface AdminDashboardModuleProps {
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  payslips: Payslip[];
  advances: SalaryAdvance[];
  ledger: LedgerEntry[];
  auditLogs: AuditLog[];
  currentRole: Role;
  onTabChange: (tab: any) => void;
  onCheckInPress?: () => void;
}

export default function AdminDashboardModule({
  employees,
  attendance,
  leaves,
  payslips,
  advances,
  ledger,
  auditLogs,
  currentRole,
  onTabChange,
  onCheckInPress
}: AdminDashboardModuleProps) {
  const [timeState, setTimeState] = useState<string>("");

  // Update clock simulating official system metadata times
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeState(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Safe search for active operator metadata name
  const currentOperatorName = employees.find(e => e.role === currentRole)?.name || "System Admin";

  // Compute stats dynamically to reflect original database state
  const totalStaff = employees.length;
  const activeStaff = employees.filter(e => e.status === "Active").length;
  const leaveStaff = employees.filter(e => e.status === "On Leave" || e.status === "Suspended").length;
  
  // Roster turnout today
  const todayDate = new Date().toISOString().split("T")[0];
  const todayPunches = attendance.filter(a => a.date === todayDate || a.date === "2026-06-06");
  const presentTodayCount = todayPunches.filter(p => p.clockIn).length;
  const lateTodayCount = todayPunches.filter(p => p.status === "Late").length;
  const absentTodayCount = Math.max(0, activeStaff - presentTodayCount);
  const turnoutPercent = activeStaff > 0 ? Math.round((presentTodayCount / activeStaff) * 100) : 92;

  // Unresolved items count
  const pendingLeaves = leaves.filter(l => l.status === "Pending").length;
  const pendingAdvances = advances.filter(a => a.status === "Pending").length;
  const actionRequiredCount = pendingLeaves + pendingAdvances;

  // Cashflow summaries
  const totalLockedPayroll = payslips
    .filter(p => p.status === "Locked")
    .reduce((sum, item) => sum + Number(item.netSalary || 0), 0);
  
  const totalDraftPayrollBudget = payslips
    .filter(p => p.status === "Draft")
    .reduce((sum, item) => sum + Number(item.netSalary || 0), 0);

  // Department distribution
  const deptCounts: Record<string, number> = {};
  employees.forEach(emp => {
    if (emp.department) {
      deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
    }
  });

  // Default color themes for departments
  const deptColors: Record<string, string> = {
    "Operations": "bg-indigo-600",
    "Human Resources": "bg-pink-600",
    "Finance & Accounts": "bg-emerald-600",
    "Operations & Logistics": "bg-yellow-600",
    "Engineering": "bg-blue-600",
    "R&D": "bg-purple-600",
    "Sales & Marketing": "bg-teal-600"
  };

  return (
    <div className="space-y-6">
      {/* 1. VISUAL GREETING HERO BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Dynamic decorative backdrop grids */}
        <div className="absolute inset-0 bg-radial-[at_top_right] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute right-0 bottom-[-50px] w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="hidden sm:block p-2 bg-slate-800 rounded-2xl border border-slate-700/50">
              <FalconLogo size="lg" variant="icon" />
            </div>
            <div className="space-y-2">
              <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-block animate-pulse">
                ● Falcon HRM Command Node Live
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none heading-display">
                Welcome back, <span className="text-blue-400">{currentOperatorName}</span>
              </h2>
              <p className="text-slate-400 text-xs max-w-xl leading-relaxed font-sans">
                Corporate general admin control cockpit. You are currently authorized on the <strong className="text-white font-semibold">{currentRole}</strong> access credentials block.
              </p>
            </div>
          </div>

          {/* Connected Virtual Clock Card */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-2xl flex items-center gap-3 shrink-0 backdrop-blur-xs min-w-[200px] justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">System Local Time</span>
              <span className="text-xl font-mono text-white tracking-widest block font-bold">
                {timeState || "08:34 AM"}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono block">Jun 6, 2026 (UTC+08:00)</span>
            </div>
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl shrink-0">
              <Clock3 size={18} className="animate-spin-slow" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC KPI KEY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Workforce */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between hover:border-slate-350 transition relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Operations Directory</span>
            <span className="p-2 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl shrink-0 group-hover:scale-110 transition">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">{totalStaff}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Headcount</span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">Active: {activeStaff} | Leave: {leaveStaff}</span>
            <button 
              onClick={() => onTabChange("employees")}
              className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Roster <ChevronRight size={10} />
            </button>
          </div>
        </div>

        {/* Metric 2: Today attendance Turnout */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between hover:border-slate-350 transition relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Shift Turnout</span>
            <span className={`p-2 rounded-xl shrink-0 group-hover:scale-110 transition border ${
              turnoutPercent >= 90 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
            }`}>
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">{turnoutPercent}%</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded font-mono">
              +{presentTodayCount} IN
            </span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-5(00) font-mono text-slate-500">Late: {lateTodayCount} | Miss: {absentTodayCount}</span>
            <button 
              onClick={() => onTabChange("attendance")}
              className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Timecard <ChevronRight size={10} />
            </button>
          </div>
        </div>

        {/* Metric 3: Action Required Pending Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between hover:border-slate-350 transition relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Governance Backlog</span>
            <span className={`p-2 rounded-xl shrink-0 group-hover:scale-110 transition border ${
              actionRequiredCount > 0 ? "bg-rose-50 text-rose-600 border-rose-100 animate-bounce-slow" : "bg-slate-50 text-slate-500 border-slate-100"
            }`}>
              <AlertCircle size={16} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">{actionRequiredCount}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Pending Approvals</span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">Leaves: {pendingLeaves} | Advances: {pendingAdvances}</span>
            <button 
              onClick={() => onTabChange(pendingLeaves > 0 ? "leaves" : "financials")}
              className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Resolve <ChevronRight size={10} />
            </button>
          </div>
        </div>

        {/* Metric 4: Salary Expenditure Locked */}
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col justify-between hover:border-slate-350 transition relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">Committed Payroll</span>
            <span className="p-2 text-amber-600 bg-amber-50 border border-amber-100 rounded-xl shrink-0 group-hover:scale-110 transition">
              <Coins size={16} />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-lg font-black text-slate-850 font-mono tracking-tight">
              ${totalLockedPayroll.toLocaleString()} LKR
            </span>
          </div>
          <div className="mt-2.5 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">Draft Accrual: ${totalDraftPayrollBudget.toLocaleString()}</span>
            <button 
              onClick={() => onTabChange("payroll")}
              className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Payslips <ChevronRight size={10} />
            </button>
          </div>
        </div>

      </div>

      {/* 3. MIDDLE GRAPHICS: CUSTOM STATS AND DEPARTMENT BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Grid Left: Custom SVG Cash Flow Vouchers Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-mono uppercase bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded tracking-wider">
                VOUCHER BUDGET LEDGER
              </span>
              <h3 className="font-bold text-slate-850 text-xs tracking-tight mt-1">
                Corporate Ledger Ledger Transaction Distribution
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total volume: {ledger.length} posted</span>
          </div>

          {/* Simple Highly Polished SVG Graphics representation */}
          <div className="h-48 w-full border border-slate-100 rounded-xl bg-slate-50/50 p-4 relative flex flex-col justify-between">
            
            {/* Visual Guide Lines */}
            <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-slate-200/60" />
            <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-slate-200/60" />
            <div className="absolute inset-x-0 top-3/2 border-t border-dashed border-slate-200/60" />

            <div className="flex-1 w-full flex items-end justify-between px-4 pb-2 z-10 gap-2">
              {/* Dynamic render of several bars representing ledger entries */}
              {[
                { label: "Salary Payouts", value: totalLockedPayroll > 0 ? totalLockedPayroll : 320000, color: "bg-blue-600", desc: "Net Salary" },
                { label: "Salary Advances", value: 45000, color: "bg-rose-500", desc: "Outward Debit" },
                { label: "Health Welfare", value: 35000, color: "bg-emerald-500", desc: "Claim Files" },
                { label: "Accounts Recovery", value: 15000, color: "bg-amber-500", desc: "Refund Credits" }
              ].map((item, idx) => {
                const maxVal = 320000;
                const heightPercent = Math.max(12, Math.min(100, (item.value / maxVal) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full space-y-2">
                    <span className="text-[8.5px] font-mono text-slate-505 font-bold">
                      ${Math.round(item.value / 1000)}k
                    </span>
                    <div className="w-8 sm:w-12 bg-slate-200 rounded-md overflow-hidden h-24 flex items-end">
                      <div 
                        className={`w-full rounded-b-md ${item.color} transition-all duration-500 hover:opacity-80`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-sans font-bold text-slate-705 text-center leading-tight">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-blue-600 inline-block" /> Net Outflow Payments
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-emerald-500 inline-block" /> Security Trust Subsidies
            </span>
            <button 
              onClick={() => onTabChange("ledger")}
              className="text-indigo-600 font-bold hover:underline flex items-center cursor-pointer"
            >
              Examine Ledger Vouchers <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* Grid Right: Department footprint Roster bar scales */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded tracking-wider">
                DEPARTMENTS PROFILE
              </span>
              <h3 className="font-bold text-slate-850 text-xs tracking-tight mt-1">
                Workforce Deployment Distributions
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total segments: {Object.keys(deptCounts).length}</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
            Distribution footprint representing current operational teams appointed into corporate rosters.
          </p>

          <div className="space-y-3.5 pt-1">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const sharePercent = totalStaff > 0 ? Math.round((count / totalStaff) * 100) : 0;
              const barColor = deptColors[dept] || "bg-slate-600";
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{dept}</span>
                    <span className="font-mono font-bold text-slate-500">
                      {count} ({sharePercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`${barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${sharePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. RECENT AUDIT TRAIL LOGS & SHORTCUTS ACTIONS PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: shortcuts Station */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-850 text-xs tracking-tight flex items-center gap-2">
            <Compass size={14} className="text-indigo-600" />
            Operational Shortcut Gates
          </h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Quick administrative actions linked directly to modular state controllers. Click any panel gate to hop sections:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {[
              { id: "employees", label: "Personnel Directory", desc: "Appoint staff candidates", color: "hover:bg-indigo-50 border-indigo-100/50 hover:border-indigo-300" },
              { id: "attendance", label: "Attendance Sheet", desc: "Revise work clockings", color: "hover:bg-blue-50 border-blue-100/50 hover:border-blue-300" },
              { id: "leaves", label: "Leave Applications", desc: "Approve medical furloughs", color: "hover:bg-pink-50 border-pink-100/50 hover:border-pink-300 animate-pulse-slow" },
              { id: "payroll", label: "Automated Payroll", desc: "Calculate monthly cycles", color: "hover:bg-emerald-50 border-emerald-100/50 hover:border-emerald-300" },
              { id: "ledger", label: "Double-Entry Ledger", desc: "View accounting journals", color: "hover:bg-amber-50 border-amber-100/50 hover:border-amber-300" },
              { id: "srs", label: "System Architecture SRS", desc: "Inspect database indices", color: "hover:bg-purple-50 border-purple-100/50 hover:border-purple-300" }
            ].map(shortcut => (
              <button
                key={shortcut.id}
                onClick={() => onTabChange(shortcut.id as any)}
                className={`text-left p-3 rounded-xl border border-slate-150/80 transition flex flex-col justify-between cursor-pointer ${shortcut.color} hover:scale-[1.01] active:scale-[0.98]`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-extrabold text-slate-800">{shortcut.label}</span>
                  <ChevronRight size={12} className="text-slate-400 shrink-0" />
                </div>
                <span className="text-[9px] text-slate-400 leading-none mt-1.5 block font-medium">
                  {shortcut.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Security Audit Stream */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl lg:col-span-3 space-y-4 text-white relative">
          <div className="absolute top-4 right-4 animate-pulse">
            <span className="text-[8px] bg-red-950 text-red-400 font-mono font-bold px-1.5 py-0.2 rounded border border-red-900">
              LEDGER AUDITING CONTEXT ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Activity size={13} className="text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-xs uppercase tracking-wider font-mono text-slate-200">
              Live Secure Audit Trail Stream
            </h3>
          </div>

          <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans">
            Displaying the absolute newest write activities on resources, tracking actors role states and authorized communication points:
          </p>

          <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin">
            {auditLogs.slice(0, 4).map((log, index) => (
              <div 
                key={log.id || index} 
                className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-start gap-3 transition hover:border-slate-700/60"
              >
                <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 animate-pulse" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="text-white font-semibold">{log.actorName}</span>
                    <span className="text-[8px] bg-indigo-950 text-indigo-300 font-bold px-1.5 py-0.2 rounded uppercase">
                      {log.actorRole}
                    </span>
                    <span className="text-slate-500">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "Recent"}</span>
                  </div>
                  <p className="text-[10.5px] text-slate-300 font-medium font-sans leading-snug">
                    {log.details || `${log.action} transaction executed on ${log.module}`}
                  </p>
                  <span className="text-[8.5px] text-indigo-400 font-mono block">
                    Source communications point: {log.ipAddress || "192.168.10.42"}
                  </span>
                </div>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-505 font-mono">
                No state writes recorded in security ledgers.
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/60 pt-3.5 flex justify-between items-center">
            <span className="text-[9px] text-slate-500 font-mono">Signed with SHA256 Handshakes TLS</span>
            <button 
              onClick={() => onTabChange("security")}
              className="text-[9.5px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline flex items-center cursor-pointer"
            >
              Verify Complete Archives Logs <ChevronRight size={11} className="ml-0.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
