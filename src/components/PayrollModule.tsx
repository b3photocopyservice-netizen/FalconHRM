/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Payslip, Employee, Role, Attendance, LeaveRequest, SalaryAdvance, Bonus, LedgerEntry } from "../types";
import InteractivePayslipView from "./InteractivePayslipView";
import { 
  DollarSign, 
  FileCheck, 
  CheckCircle2, 
  ArrowUpRight, 
  Ban, 
  Eye, 
  Landmark, 
  Percent, 
  Clock, 
  Calendar, 
  Coins, 
  Lock, 
  Unlock, 
  Trash2, 
  AlertTriangle, 
  Check, 
  FileText, 
  X, 
  Calculator,
  User,
  Activity,
  Briefcase,
  Layers,
  Sparkles,
  Search,
  Plus,
  TrendingUp
} from "lucide-react";

interface PayrollModuleProps {
  payslips: Payslip[];
  employees: Employee[];
  currentRole: Role;
  onUpdateState: () => void;
}

enum WorkflowStep {
  ATTENDANCE = "Attendance",
  LEAVE = "Leave",
  ADVANCES = "Advances",
  LEDGER = "Ledger",
  BONUS = "Bonus",
  CALCULATE = "Calculation",
  APPROVAL = "Approval",
  LOCK = "Lock Payroll",
  PAYSLIP = "Payslip Hub"
}

export default function PayrollModule({ payslips, employees, currentRole, onUpdateState }: PayrollModuleProps) {
  // Stepper workflow tracking
  const [activeStep, setActiveStep] = useState<WorkflowStep>(WorkflowStep.CALCULATE);

  // Selector controls
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || "");
  const [cycleMonth, setCycleMonth] = useState("2026-06");

  // Local database state from /api/state
  const [systemDb, setSystemDb] = useState<{
    attendance: Attendance[];
    leaves: LeaveRequest[];
    advances: SalaryAdvance[];
    bonuses: Bonus[];
    ledger: LedgerEntry[];
  } | null>(null);

  // Calculation Engine State
  const [calcResult, setCalcResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Custom manual calculation fields & overrides
  const [performanceBonus, setPerformanceBonus] = useState<string>("0");
  
  // Allowance overrides
  const [attAllowanceOverride, setAttAllowanceOverride] = useState<string>("");
  const [fuelAllowanceOverride, setFuelAllowanceOverride] = useState<string>("");
  const [telAllowanceOverride, setTelAllowanceOverride] = useState<string>("");
  const [mealAllowanceOverride, setMealAllowanceOverride] = useState<string>("");
  const [budgetAllowanceOverride, setBudgetAllowanceOverride] = useState<string>("");
  const [interimAllowanceOverride, setInterimAllowanceOverride] = useState<string>("");
  const [incentiveAllowanceOverride, setIncentiveAllowanceOverride] = useState<string>("");
  const [customAllowanceOverride, setCustomAllowanceOverride] = useState<string>("");

  // Overtime overrides
  const [holidayOtOverride, setHolidayOtOverride] = useState<string>("");
  const [fridayOtOverride, setFridayOtOverride] = useState<string>("");

  // Deduction overrides
  const [etfDeductionOverride, setEtfDeductionOverride] = useState<string>("");
  const [advanceRecOverride, setAdvanceRecOverride] = useState<string>("");
  const [storeRecOverride, setStoreRecOverride] = useState<string>("");
  const [latePenaltyOverride, setLatePenaltyOverride] = useState<string>("");
  const [otherDeductionsOverride, setOtherDeductionsOverride] = useState<string>("");

  // Popup & modal controls
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [filterMonth, setFilterMonth] = useState("2026-06");
  const [lockTargetMonth, setLockTargetMonth] = useState("2026-06");
  
  // Status feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loadingDb, setLoadingDb] = useState(false);

  // Fetch full system state to view database variables in step tabs
  const loadSystemDb = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setSystemDb(data);
      }
    } catch (err) {
      console.error("Failed to load state", err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    loadSystemDb();
  }, [payslips]);

  const isPrivileged = currentRole === Role.SUPER_ADMIN || currentRole === Role.PAYROLL_OFFICER || currentRole === Role.ACCOUNTANT;

  // Run the Calculation Engine
  const triggerCalculationEngine = async () => {
    if (!selectedEmpId || !cycleMonth) return;
    setIsCalculating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Build payloads with explicit user entries if present, otherwise let server auto-calculate
      const payload: any = {
        employeeId: selectedEmpId,
        month: cycleMonth,
        performanceBonus: parseFloat(performanceBonus) || 0,
        allowancesOverride: {},
        deductionsOverride: {},
        overtimeOverride: {}
      };

      if (attAllowanceOverride !== "") payload.allowancesOverride.attendanceAllowance = parseFloat(attAllowanceOverride);
      if (fuelAllowanceOverride !== "") payload.allowancesOverride.fuelAllowance = parseFloat(fuelAllowanceOverride);
      if (telAllowanceOverride !== "") payload.allowancesOverride.telephoneAllowance = parseFloat(telAllowanceOverride);
      if (mealAllowanceOverride !== "") payload.allowancesOverride.mealAllowance = parseFloat(mealAllowanceOverride);
      if (budgetAllowanceOverride !== "") payload.allowancesOverride.budgetReliefAllowance = parseFloat(budgetAllowanceOverride);
      if (interimAllowanceOverride !== "") payload.allowancesOverride.interimAllowance = parseFloat(interimAllowanceOverride);
      if (incentiveAllowanceOverride !== "") payload.allowancesOverride.incentiveAllowance = parseFloat(incentiveAllowanceOverride);
      if (customAllowanceOverride !== "") payload.allowancesOverride.customAllowances = parseFloat(customAllowanceOverride);

      if (holidayOtOverride !== "") payload.overtimeOverride.holidayOt = parseFloat(holidayOtOverride);
      if (fridayOtOverride !== "") payload.overtimeOverride.fridayOt = parseFloat(fridayOtOverride);

      if (etfDeductionOverride !== "") payload.deductionsOverride.etfDeduction = parseFloat(etfDeductionOverride);
      if (advanceRecOverride !== "") payload.deductionsOverride.advanceRecovery = parseFloat(advanceRecOverride);
      if (storeRecOverride !== "") payload.deductionsOverride.storePurchaseRecovery = parseFloat(storeRecOverride);
      if (latePenaltyOverride !== "") payload.deductionsOverride.latePenalty = parseFloat(latePenaltyOverride);
      if (otherDeductionsOverride !== "") payload.deductionsOverride.otherDeductions = parseFloat(otherDeductionsOverride);

      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setCalcResult(data);
        
        // Auto-populate override fields to synchronize values if they list nothing empty
        if (attAllowanceOverride === "") setAttAllowanceOverride("");
        if (fuelAllowanceOverride === "") setFuelAllowanceOverride("");
        if (telAllowanceOverride === "") setTelAllowanceOverride("");
        if (mealAllowanceOverride === "") setMealAllowanceOverride("");
        if (budgetAllowanceOverride === "") setBudgetAllowanceOverride("");
        if (interimAllowanceOverride === "") setInterimAllowanceOverride("");
        if (incentiveAllowanceOverride === "") setIncentiveAllowanceOverride("");
        if (customAllowanceOverride === "") setCustomAllowanceOverride("");
        if (holidayOtOverride === "") setHolidayOtOverride("");
        if (fridayOtOverride === "") setFridayOtOverride("");
        if (etfDeductionOverride === "") setEtfDeductionOverride("");
        if (advanceRecOverride === "") setAdvanceRecOverride("");
        if (storeRecOverride === "") setStoreRecOverride("");
        if (latePenaltyOverride === "") setLatePenaltyOverride("");
        if (otherDeductionsOverride === "") setOtherDeductionsOverride("");

        setSuccessMsg("Engine simulation completed successfully. Review outputs below.");
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Calculation Engine encountered an issue.");
      }
    } catch {
      setErrorMsg("System offline or connection error during calculation simulation.");
    } finally {
      setIsCalculating(false);
    }
  };

  // Perform a full commit/draft save using the validated config
  const saveDraftPayslip = async () => {
    if (!selectedEmpId || !cycleMonth) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: any = {
        employeeId: selectedEmpId,
        month: cycleMonth,
        performanceBonus: parseFloat(performanceBonus) || 0,
        allowancesOverride: {},
        deductionsOverride: {},
        overtimeOverride: {}
      };

      if (attAllowanceOverride !== "") payload.allowancesOverride.attendanceAllowance = parseFloat(attAllowanceOverride);
      if (fuelAllowanceOverride !== "") payload.allowancesOverride.fuelAllowance = parseFloat(fuelAllowanceOverride);
      if (telAllowanceOverride !== "") payload.allowancesOverride.telephoneAllowance = parseFloat(telAllowanceOverride);
      if (mealAllowanceOverride !== "") payload.allowancesOverride.mealAllowance = parseFloat(mealAllowanceOverride);
      if (budgetAllowanceOverride !== "") payload.allowancesOverride.budgetReliefAllowance = parseFloat(budgetAllowanceOverride);
      if (interimAllowanceOverride !== "") payload.allowancesOverride.interimAllowance = parseFloat(interimAllowanceOverride);
      if (incentiveAllowanceOverride !== "") payload.allowancesOverride.incentiveAllowance = parseFloat(incentiveAllowanceOverride);
      if (customAllowanceOverride !== "") payload.allowancesOverride.customAllowances = parseFloat(customAllowanceOverride);

      if (holidayOtOverride !== "") payload.overtimeOverride.holidayOt = parseFloat(holidayOtOverride);
      if (fridayOtOverride !== "") payload.overtimeOverride.fridayOt = parseFloat(fridayOtOverride);

      if (etfDeductionOverride !== "") payload.deductionsOverride.etfDeduction = parseFloat(etfDeductionOverride);
      if (advanceRecOverride !== "") payload.deductionsOverride.advanceRecovery = parseFloat(advanceRecOverride);
      if (storeRecOverride !== "") payload.deductionsOverride.storePurchaseRecovery = parseFloat(storeRecOverride);
      if (latePenaltyOverride !== "") payload.deductionsOverride.latePenalty = parseFloat(latePenaltyOverride);
      if (otherDeductionsOverride !== "") payload.deductionsOverride.otherDeductions = parseFloat(otherDeductionsOverride);

      payload.actorRole = currentRole;
      payload.actorName = "Payroll Executive";

      const res = await fetch("/api/payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg("SUCCESS: Calculated payslip drafted and committed successfully.");
        // Reset overriding forms
        setPerformanceBonus("0");
        setAttAllowanceOverride("");
        setFuelAllowanceOverride("");
        setTelAllowanceOverride("");
        setMealAllowanceOverride("");
        setBudgetAllowanceOverride("");
        setInterimAllowanceOverride("");
        setIncentiveAllowanceOverride("");
        setCustomAllowanceOverride("");
        setHolidayOtOverride("");
        setFridayOtOverride("");
        setEtfDeductionOverride("");
        setAdvanceRecOverride("");
        setStoreRecOverride("");
        setLatePenaltyOverride("");
        setOtherDeductionsOverride("");

        setCalcResult(null);
        onUpdateState();
        setActiveStep(WorkflowStep.APPROVAL);
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Duplicate or invalid payroll parameter rejected by validation engine.");
      }
    } catch {
      setErrorMsg("Network compilation handshake aborted.");
    }
  };

  // Status transitions
  const approvePayslipState = async (id: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/payslips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved", actorRole: currentRole })
      });
      if (res.ok) {
        setSuccessMsg("Payslip successfully audited and Approved.");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Approval transaction aborted.");
      }
    } catch {
      setErrorMsg("Server error.");
    }
  };

  const trashDraftPayslip = async (id: string) => {
    if (!confirm("Are you sure you want to discard this draft? This will clear calculated values for this month.")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/payslips/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMsg("Selected draft payslip discarded successfully.");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Cancellation transaction aborted.");
      }
    } catch {
      setErrorMsg("Server error.");
    }
  };

  const handleDisbursePayslip = async (id: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/payslips/${id}/pay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setSuccessMsg("Salary successfully disbursed, transaction logs posted to Corporate Ledger.");
        setSelectedPayslip(null);
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Disbursed failed");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleLockPayrollCycle = async () => {
    if (!lockTargetMonth) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/payroll/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: lockTargetMonth,
          actorRole: currentRole,
          actorName: "Security Manager"
        })
      });

      if (res.ok) {
        const d = await res.json();
        setSuccessMsg(`SUCCESS: Closed pay cycle. Locked ${d.lockedCount} payslip accounts for month ${lockTargetMonth}.`);
        onUpdateState();
        setActiveStep(WorkflowStep.PAYSLIP);
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed to finalize lock protocol.");
      }
    } catch {
      setErrorMsg("Server connection lost during locking process.");
    }
  };

  // Selected date filtering for listings
  const filteredAttendance = systemDb?.attendance.filter(a => a.date.startsWith(filterMonth)) || [];
  const filteredLeaves = systemDb?.leaves.filter(l => l.startDate.startsWith(filterMonth) || l.endDate.startsWith(filterMonth)) || [];
  const activeAdvances = systemDb?.advances.filter(a => a.status === "Disbursed" || a.status === "Approved") || [];
  const corporateLedger = systemDb?.ledger || [];
  const activeBonuses = systemDb?.bonuses.filter(b => b.status === "Approved" && b.cycleDate === filterMonth) || [];

  return (
    <div className="space-y-6">
      {/* Dynamic Module Title */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-indigo-500/20 text-indigo-300 tracking-wider">Module 6</span>
            <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">Enterprise System Core</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1 font-sans tracking-tight">Automated Payroll Calculations Engine</h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculate Sri Lankan APIT, statutory Employee EPF (8%), and Employer EPF (12%)/ETF (3%) configurations.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 font-mono text-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Payroll Buffer State</p>
            <p className="text-sm font-black text-indigo-400 mt-0.5">{payslips.length} Compiled Slips</p>
          </div>
          <button 
            type="button"
            onClick={loadSystemDb}
            className="bg-indigo-600 hover:bg-slate-700 text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl border border-indigo-500/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={13} className="animate-spin text-indigo-200" />
            Reload Engine DB
          </button>
        </div>
      </div>

      {/* Corporate Stepper Workflow Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs overflow-x-auto">
        <p className="text-slate-400 font-mono font-extrabold uppercase tracking-wider text-[9px] mb-3 leading-none">
          Compliance Payroll Workflow Roadmap
        </p>
        <div className="flex items-center gap-2 min-w-[900px] text-[11px] font-bold">
          {Object.values(WorkflowStep).map((step, idx) => {
            const isCurrent = activeStep === step;
            return (
              <React.Fragment key={step}>
                <button
                  onClick={() => setActiveStep(step)}
                  className={`flex-1 py-2 px-3 rounded-xl text-center border transition flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
                    isCurrent
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-100"
                      : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-extrabold border bg-white/25 text-inherit">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </button>
                {idx < Object.values(WorkflowStep).length - 1 && (
                  <span className="text-slate-300 font-mono">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Validation Feedback Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
          <AlertTriangle size={16} className="text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB CONTENTS */}
      
      {/* STEP 1: ATTENDANCE INPUT */}
      {activeStep === WorkflowStep.ATTENDANCE && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                <Clock className="text-indigo-600" size={17} /> Phase 1: Attendance Verification Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Audit punch card minutes, late times, and OT minutes prior to calculation.</p>
            </div>
            <div className="flex items-center gap-2 mt-2 md:mt-0 max-w-xs">
              <label className="text-[10px] uppercase font-bold text-slate-400 shrink-0 font-mono">Cycle Month</label>
              <input
                type="month"
                className="p-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left truncate text-xs font-medium text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-3">Personnel</th>
                  <th className="p-3">Date Address</th>
                  <th className="p-3">Log Status</th>
                  <th className="p-3">Clock In / Out</th>
                  <th className="p-3">Late Mins</th>
                  <th className="p-3">OT Mins</th>
                  <th className="p-3 text-right">Duty Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">No attendance logs registered in month {filterMonth}. Use Attendance module to create checks.</td>
                  </tr>
                ) : (
                  filteredAttendance.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <strong className="text-slate-800">{a.employeeName}</strong>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{a.employeeId}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{a.date}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          a.status === "Present" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          a.status === "Late" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                          a.status === "Absent" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                          "bg-slate-50 text-slate-600 border border-slate-100"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">
                        {a.checkIn1 || a.clockIn || "--:--"} - {a.checkOut1 || a.clockOut || "--:--"}
                      </td>
                      <td className={`p-3 font-mono font-bold ${a.lateMinutes && a.lateMinutes > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {a.lateMinutes || 0}m
                      </td>
                      <td className={`p-3 font-mono font-bold ${a.overtimeMinutes && a.overtimeMinutes > 0 ? "text-indigo-600" : "text-slate-400"}`}>
                        {a.overtimeMinutes || 0}m
                      </td>
                      <td className="p-3 text-right font-mono text-slate-800 font-bold">
                        {a.totalWorkedMinutes ? (a.totalWorkedMinutes / 60).toFixed(1) : "0.0"} hrs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 2: LEAVE STATUS */}
      {activeStep === WorkflowStep.LEAVE && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" size={17} /> Phase 2: Leave & No Pay Audit Records
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Unpaid Leaves produce dynamic flat-day salary deductions.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono shrink-0">Cycle Period</label>
              <input
                type="month"
                className="p-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left truncate text-xs font-medium text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-3">Employe Reference</th>
                  <th className="p-3">Leave Category</th>
                  <th className="p-3">Time Range</th>
                  <th className="p-3 font-right">Status Flag</th>
                  <th className="p-3 text-right">No Pay Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">No leaves recorded for month {filterMonth}. Create leaves inside the Leave Module.</td>
                  </tr>
                ) : (
                  filteredLeaves.map(l => {
                    const isNoPay = l.leaveType.toLowerCase().includes("unpaid") || l.leaveType.toLowerCase().includes("no pay");
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <strong className="text-slate-800">{l.employeeName}</strong>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{l.employeeId}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-700">{l.leaveType}</span>
                          <span className="block text-[10px] text-slate-400 italic">"Reason: {l.reason}"</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">
                          {l.startDate} to {l.endDate}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            l.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          {isNoPay ? (
                            <span className="text-rose-600">Active Unpaid Leave</span>
                          ) : (
                            <span className="text-slate-400 font-medium">None (Fully Paid)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 3: ADVANCES REVIEW */}
      {activeStep === WorkflowStep.ADVANCES && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={17} /> Phase 3: Outstanding Salary Advances
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium text-slate-500">Only Approved/Disbursed advances are listed. Advances will be automatically recovered based on the schedule.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAdvances.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs col-span-full">No active or pending salary advances found in database.</p>
            ) : (
              activeAdvances.map(a => {
                const rec = a.recoveredSoFar || 0;
                const bal = a.requestAmount - rec;
                const pct = Math.min(100, Math.round((rec / a.requestAmount) * 100));

                return (
                  <div key={a.id} className="p-4 border border-slate-100 rounded-xl space-y-3 bg-slate-50/40">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{a.employeeName}</p>
                        <p className="text-[9px] font-mono text-slate-400">ID: {a.employeeId} | ({a.id})</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        a.status === "Disbursed" ? "bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {a.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-white p-2 rounded-lg border border-slate-200/50">
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Requested</span>
                        <p className="font-bold text-slate-800 mt-0.5">Rs. {a.requestAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-200/50">
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Active Balance</span>
                        <p className="font-bold text-indigo-600 mt-0.5">Rs. {bal.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold">
                        <span>Recovered Schedule</span>
                        <span>{pct}% Completed</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200/50 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400 uppercase tracking-tight text-[9px] font-bold">Method:</span>
                      <strong className="text-slate-700 uppercase leading-none">{a.recoveryMethod === "Single" ? "One-off nest payout" : `Rs. ${a.monthlyDeduction.toLocaleString()}/mo x ${a.installmentPeriod}`}</strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* STEP 4: LEDGER BALANCE */}
      {activeStep === WorkflowStep.LEDGER && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <Landmark className="text-indigo-600" size={17} /> Phase 4: verified Salaries Corporate Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Treasury ledger logging verified payments, debits, and credits.</p>
          </div>

          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left truncate text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase bg-slate-50/50 tracking-wider">
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Reporting Staff</th>
                  <th className="p-3">Cycle Date</th>
                  <th className="p-3">Post Category</th>
                  <th className="p-3">Debit (Payout)</th>
                  <th className="p-3 text-right">Credit (Recovery / Settle)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {corporateLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">No corporate transactions logged in primary ledger. Run salary disbursals to populate!</td>
                  </tr>
                ) : (
                  corporateLedger.slice().reverse().map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[10px] text-indigo-600 font-extrabold">{l.id}</td>
                      <td className="p-3">
                        <strong className="text-slate-800">{l.employeeName}</strong>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{l.employeeId}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{l.postDate}</td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-indigo-700 bg-indigo-50 leading-none">
                          {l.referenceType}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {l.debit > 0 ? `Rs. ${l.debit.toLocaleString()}` : "--"}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        {l.credit > 0 ? `+Rs. ${l.credit.toLocaleString()}` : "--"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 5: BONUS ALLOCATION */}
      {activeStep === WorkflowStep.BONUS && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                <Coins className="text-indigo-600" size={17} /> Phase 5: Active Payout Bonuses List
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Approved bonuses pending payout are pulled into standard calculations.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono shrink-0">Cycle Month</label>
              <input
                type="month"
                className="p-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left truncate text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase bg-slate-50/50 tracking-wider">
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Personnel</th>
                  <th className="p-3">Bonus Scheme</th>
                  <th className="p-3">Release Date</th>
                  <th className="p-3">Execution status</th>
                  <th className="p-3 text-right font-bold">Sum (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBonuses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">No bonuses configured for pay period {filterMonth}. Disburse outstanding bonuses through bonuses panels.</td>
                  </tr>
                ) : (
                  activeBonuses.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-[10px] text-slate-400">{b.id}</td>
                      <td className="p-3">
                        <strong className="text-slate-800">{b.employeeName}</strong>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{b.employeeId}</span>
                      </td>
                      <td className="p-3 uppercase text-[10px] text-slate-500 font-bold">{b.bonusType} Allocation</td>
                      <td className="p-3 font-mono text-slate-500">{b.cycleDate}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                          b.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-600 text-sm">
                        Rs. {b.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 6: CALCULATION ENGINE & CONFIGURATOR */}
      {activeStep === WorkflowStep.CALCULATE && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs h-fit space-y-4">
            <div>
              <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
                <Calculator className="text-indigo-600 font-extrabold" size={18} /> Step 6: Calculation Control Panel
              </h3>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">
                Retrieve automated variables from other modules and perform dry-runs. Customize allowances and deductions manually before committing.
              </p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Select Employee Contract</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold font-sans cursor-pointer"
                  value={selectedEmpId}
                  onChange={(e) => { setSelectedEmpId(e.target.value); setCalcResult(null); }}
                  id="calc-emp-select"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.department} - Rs.{e.baseSalary.toLocaleString()}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Pay Cycle target Period</label>
                <input
                  type="month"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs"
                  value={cycleMonth}
                  onChange={(e) => { setCycleMonth(e.target.value); setCalcResult(null); }}
                  id="calc-cycle-input"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isCalculating || !selectedEmpId}
                  onClick={triggerCalculationEngine}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2.5 shadow-sm shadow-slate-300 disabled:opacity-50 cursor-pointer"
                  id="calc-trigger-btn"
                >
                  <Activity size={14} className="text-indigo-400 animate-pulse" />
                  {isCalculating ? "Evaluating Engine Parameters..." : "📊 Load Auto Calculation"}
                </button>
              </div>
            </div>

            {/* Manual Allowance/Deduction Form Fields */}
            {calcResult && (
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-[11px] uppercase font-mono font-bold text-slate-400 tracking-wider">Manual Adjustment overrides (Optional)</h4>
                
                <div className="space-y-3.5 text-xs font-medium">
                  {/* Basic performance Bonus */}
                  <div className="space-y-1.5">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Welfare / Performance Bonus (Rs.)</label>
                    <input
                      type="number"
                      placeholder="Insert customized performance bonus..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs"
                      value={performanceBonus}
                      onChange={(e) => setPerformanceBonus(e.target.value)}
                    />
                  </div>

                  {/* Other Allowances Accordion Form */}
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Manual Allowance Overrides (Rs.)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Attendance (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={attAllowanceOverride}
                        onChange={(e) => setAttAllowanceOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Fuel (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={fuelAllowanceOverride}
                        onChange={(e) => setFuelAllowanceOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Telephone (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={telAllowanceOverride}
                        onChange={(e) => setTelAllowanceOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Meals (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={mealAllowanceOverride}
                        onChange={(e) => setMealAllowanceOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Budget Relief (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={budgetAllowanceOverride}
                        onChange={(e) => setBudgetAllowanceOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Interim (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={interimAllowanceOverride}
                        onChange={(e) => setInterimAllowanceOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Incentive (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={incentiveAllowanceOverride}
                        onChange={(e) => setIncentiveAllowanceOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Custom (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={customAllowanceOverride}
                        onChange={(e) => setCustomAllowanceOverride(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Overtime Form */}
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Manual Overtime Overrides (Rs.)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Holiday OT (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={holidayOtOverride}
                        onChange={(e) => setHolidayOtOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Friday OT (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={fridayOtOverride}
                        onChange={(e) => setFridayOtOverride(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Deductions Form */}
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Manual Deduction Overrides (Rs.)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Cust. ETF (Rs)"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={etfDeductionOverride}
                        onChange={(e) => setEtfDeductionOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Late Penalty"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={latePenaltyOverride}
                        onChange={(e) => setLatePenaltyOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Advance Rec."
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={advanceRecOverride}
                        onChange={(e) => setAdvanceRecOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Store Rec."
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        value={storeRecOverride}
                        onChange={(e) => setStoreRecOverride(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Other Deduct"
                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg col-span-2 text-xs font-mono"
                        value={otherDeductionsOverride}
                        onChange={(e) => setOtherDeductionsOverride(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={triggerCalculationEngine}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                    >
                      🔄 Re-Calculate Overrides
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results dashboard rendering the active calculation elements */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs lg:col-span-2 space-y-6">
            {!calcResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-3">
                <Calculator size={48} className="text-indigo-200 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-800">Calculation Engine Idle</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select an employee and click "Load Auto Calculation" to activate the automated calculation and engine validation systems.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-md font-extrabold text-slate-800">Engine Simulation Result Metrics</h3>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">Computed Draft</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Verify structural additions and deductions before compiling the Draft.</p>
                </div>

                {/* VALIDATION ENGINE WARNINGS */}
                {(calcResult.warnings.length > 0 || calcResult.infos.length > 0) && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800">
                    <p className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={12} /> Live Engine Compliance Validation Report
                    </p>
                    <div className="space-y-1.5 text-[11px] font-mono leading-relaxed">
                      {calcResult.warnings.map((w: string, i: number) => (
                        <p key={i} className="text-rose-400"><strong className="text-rose-500">◆ [CRITICAL PROTOCOL]</strong> {w}</p>
                      ))}
                      {calcResult.infos.map((info: string, i: number) => (
                        <p key={i} className="text-indigo-200"><strong>◇ [ENGINE NOTICE]</strong> {info}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary breakdown elements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  {/* Earnings */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/40 space-y-3.5">
                    <p className="text-emerald-700/80 uppercase font-black tracking-wider text-[10px] flex items-center gap-1">
                      <ArrowUpRight size={13} /> Additive Salary Components
                    </p>
                    <div className="space-y-1.5 font-sans divide-y divide-emerald-200/20">
                      <div className="flex justify-between font-mono py-1">
                        <span className="text-slate-500 font-bold">1. Basic Salary Code:</span>
                        <span className="font-bold text-slate-800">Rs. {calcResult.baseSalary.toLocaleString()}</span>
                      </div>
                      
                      {/* Allowances */}
                      <div className="space-y-1 pt-2">
                        <span className="text-[9px] uppercase text-emerald-700 font-mono font-black">Allowances Structure</span>
                        <div className="space-y-1 text-slate-600 font-mono font-medium pl-2">
                          <div className="flex justify-between text-[11px]">
                            <span>Attendance Allowance:</span>
                            <span>+Rs. {calcResult.allowances.attendanceAllowance?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Fuel Allowance:</span>
                            <span>+Rs. {calcResult.allowances.fuelAllowance?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Telephone Allowance:</span>
                            <span>+Rs. {calcResult.allowances.telephoneAllowance?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Meal Allowance:</span>
                            <span>+Rs. {calcResult.allowances.mealAllowance?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Budget Relief Allowance:</span>
                            <span>+Rs. {calcResult.allowances.budgetReliefAllowance?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Interim Allowance:</span>
                            <span>+Rs. {calcResult.allowances.interimAllowance?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Incentive Allowance:</span>
                            <span>+Rs. {calcResult.allowances.incentiveAllowance?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Custom Allowances:</span>
                            <span>+Rs. {calcResult.allowances.customAllowances?.toLocaleString() || "0"}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Medical & Housing:</span>
                            <span>+Rs. {(calcResult.allowances.medical + calcResult.allowances.housing).toLocaleString()}</span>
                          </div>
                          {calcResult.allowances.leaveEncashment > 0 && (
                            <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                              <span>Leave Cash-out (Encash):</span>
                              <span>+Rs. {calcResult.allowances.leaveEncashment.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Overtime */}
                      <div className="space-y-1 pt-2">
                        <span className="text-[9px] uppercase text-emerald-700 font-mono font-black">Overtime hours calculated</span>
                        <div className="space-y-1 text-slate-600 font-mono font-medium pl-2">
                          <div className="flex justify-between text-[11px]">
                            <span>Holiday OT ({Math.round((calcResult.overtime.holidayOtMinutes || 0)/60)} hrs):</span>
                            <span>+Rs. {calcResult.overtime.holidayOt.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Friday OT ({Math.round((calcResult.overtime.fridayOtMinutes || 0)/60)} hrs):</span>
                            <span>+Rs. {calcResult.overtime.fridayOt.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bonuses */}
                      {calcResult.bonusAmount > 0 && (
                        <div className="flex justify-between font-mono py-2 text-indigo-700">
                          <span>Active Bonuses (From Step 5):</span>
                          <span>+Rs. {calcResult.bonusAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/40 space-y-3.5">
                    <p className="text-rose-700/80 uppercase font-black tracking-wider text-[10px] flex items-center gap-1">
                      <Percent size={13} /> Subtractive Deductions
                    </p>
                    <div className="space-y-1.5 font-sans divide-y divide-rose-200/20">
                      <div className="flex justify-between font-mono py-1">
                        <span className="text-slate-500 font-bold">1. EPF (Employee 8%):</span>
                        <span className="font-bold text-slate-800">-Rs. {calcResult.deductions.providentFund.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between font-mono py-1">
                        <span className="text-slate-500 font-bold">2. ETF Deduction (Voluntary):</span>
                        <span className="font-semibold text-slate-800">-Rs. {calcResult.deductions.etfDeduction.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between font-mono py-1">
                        <span className="text-slate-500 font-bold">3. No Pay Deduction (Unpaid):</span>
                        <span className={`font-bold ${calcResult.deductions.unpaidLeaveDeduction > 0 ? "text-rose-600" : "text-slate-600"}`}>
                          -Rs. {(calcResult.deductions.unpaidLeaveDeduction || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between font-mono py-1">
                        <span className="text-slate-500 font-bold">4. APIT Income Tax:</span>
                        <span className="font-bold text-slate-800">-Rs. {calcResult.deductions.tax.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between font-mono py-1">
                        <span className="text-slate-500 font-bold">5. Advance Recovery (Step 3):</span>
                        <span className="font-bold text-slate-800">-Rs. {calcResult.deductions.advanceRecovery.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between font-mono py-1">
                        <span className="text-slate-500 font-bold">6. Staff Store Purchase Rec.:</span>
                        <span className="font-bold text-slate-800">-Rs. {calcResult.deductions.storePurchaseRecovery.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between font-mono py-1">
                        <span className="text-slate-500 font-bold">7. Attendance Late Arrival Penalty:</span>
                        <span className={`font-bold ${calcResult.deductions.latePenalty > 0 ? "text-amber-600" : "text-slate-800"}`}>
                          -Rs. {calcResult.deductions.latePenalty.toLocaleString()}
                        </span>
                      </div>

                      {calcResult.deductions.otherDeductions > 0 && (
                        <div className="flex justify-between font-mono py-1">
                          <span className="text-slate-500 font-bold">8. Other Audited Adjustments:</span>
                          <span className="font-bold text-slate-800">-Rs. {calcResult.deductions.otherDeductions.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sri Lankan Statutory Employer Cost Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Landmark size={15} className="text-slate-400" />
                    <div>
                      <p className="font-bold text-slate-800 uppercase tracking-wide text-[9px]">Sri Lankan Statutory Employer Liabilities</p>
                      <p className="text-[10px] text-slate-500">Remitted securely to Inland Revenue outside salary debits.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 font-mono text-[11px] font-bold">
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 uppercase">EPF (12%)</span>
                      <p className="text-slate-800">Rs. {calcResult.employerEpf.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 uppercase">ETF (3%)</span>
                      <p className="text-slate-800">Rs. {calcResult.employerEtf.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* FORMULAS FORMULA INTERPRETER DASHBOARD */}
                <div className="bg-indigo-900 text-white p-6 rounded-2xl space-y-4 shadow-sm shadow-indigo-100">
                  <p className="text-[9px] font-mono tracking-widest text-indigo-300 uppercase font-black">
                    Automated Payroll Formula Dashboard
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-indigo-800">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-zinc-300 uppercase">Gross Salary Formula</span>
                      <p className="text-[10px] text-indigo-200 font-mono">Basic Salary + Allowances + OT + Bonuses</p>
                      <div className="pt-1.5 flex justify-between items-end">
                        <span className="text-slate-200 text-xs font-semibold">Total Gross earnings:</span>
                        <span className="text-lg font-black text-white font-mono">Rs. {calcResult.grossSalary.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-1 md:pl-4 pt-4 md:pt-0">
                      <span className="text-[9px] font-mono text-zinc-300 uppercase">Net Salary Formula</span>
                      <p className="text-[10px] text-indigo-200 font-mono">Gross Salary - Deductions</p>
                      <div className="pt-1.5 flex justify-between items-end">
                        <span className="text-slate-200 text-zinc-200 text-xs font-bold font-semibold">Estimated Net Transfer:</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">Rs. {calcResult.netSalary.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {isPrivileged && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={saveDraftPayslip}
                        disabled={calcResult.warnings.some((w: string) => w.startsWith("CRITICAL: A payslip"))}
                        className={`w-full font-bold font-sans py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 ${
                          calcResult.warnings.some((w: string) => w.startsWith("CRITICAL: A payslip"))
                            ? "bg-rose-900 border border-rose-800 text-rose-300 cursor-not-allowed opacity-50"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm shadow-emerald-850"
                        }`}
                        id="save-draft-payroll-btn"
                      >
                        <FileCheck size={14} />
                        Confirm Compliance & Save Draft to Approvals
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 7: APPROVAL SHEET */}
      {activeStep === WorkflowStep.APPROVAL && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-md font-bold text-slate-800">Step 7: Draft Salary Approvals Sheet</h3>
              <p className="text-xs text-slate-500 mt-1">Review computed Draft payslips and Approve them prior to cycle freezing.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Cycle</label>
              <input
                type="month"
                className="p-1 px-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto truncate">
            <table className="w-full text-left truncate text-xs font-medium text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold bg-slate-50/40 uppercase tracking-wider">
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Personnel / ID</th>
                  <th className="p-3">Gross Salary</th>
                  <th className="p-3">Total Deductions</th>
                  <th className="p-3">Net Payout</th>
                  <th className="p-3">Status Flag</th>
                  <th className="p-3 text-right">Approver Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payslips.filter(p => p.month === filterMonth && p.status === "Draft").length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No Draft payslips pending approval for period {filterMonth}. Compile drafts in Phase 6.</td>
                  </tr>
                ) : (
                  payslips.filter(p => p.month === filterMonth && p.status === "Draft").map(ps => {
                    const deds = ps.deductions;
                    const totDeds = deds.tax + deds.providentFund + deds.etfDeduction + (deds.unpaidLeaveDeduction || 0) + deds.advanceRecovery + deds.storePurchaseRecovery + deds.latePenalty + deds.otherDeductions;
                    const gross = ps.grossSalary || (ps.netSalary + totDeds);

                    return (
                      <tr key={ps.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-slate-500 font-bold">{ps.id}</td>
                        <td className="p-3">
                          <strong className="text-slate-800">{ps.employeeName}</strong>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{ps.employeeId}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">Rs. {gross.toLocaleString()}</td>
                        <td className="p-3 font-mono text-slate-500">Rs. {totDeds.toLocaleString()}</td>
                        <td className="p-3 font-mono text-indigo-600 font-black text-sm">Rs. {ps.netSalary.toLocaleString()}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-100 font-mono">
                            {ps.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => approvePayslipState(ps.id)}
                              disabled={!isPrivileged}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100/50 py-1.5 px-3 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check size={11} /> Approve Draft
                            </button>
                            <button
                              onClick={() => trashDraftPayslip(ps.id)}
                              disabled={!isPrivileged}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-105/50 py-1.5 px-2 rounded-lg text-[10px] transition cursor-pointer disabled:opacity-50"
                              title="Discard Draft Calculations"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 8: LOCK PAYROLL CYCLE */}
      {activeStep === WorkflowStep.LOCK && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="text-center p-4">
            <Lock size={44} className="mx-auto text-indigo-600 mb-2 shrink-0 animate-bounce" />
            <h3 className="text-md font-extrabold text-slate-800">Step 8: Close & Lock Pay Cycle Month</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Freezing the pay cycle locks all draft and approved payslips, preventing duplicates or recursive changes. This is required before bank file transfer generation.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-800 font-semibold mb-2">
            <p className="uppercase font-bold text-[9px] tracking-wider font-mono flex items-center gap-1.5 leading-none">
              <AlertTriangle size={13} className="text-amber-600 shrink-0" /> Important Pre-Freeze Notice
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] font-sans">
              <li>Once locked, payslips go to 'Locked' status and cannot be recalculated.</li>
              <li>Only Cashiers, Payroll Officers, or Super Admins are authorized.</li>
              <li>Ensure all employees have had their payslip compiled and approved.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5 text-xs font-semibold">
              <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Select Month to Lock</label>
              <input
                type="month"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs font-bold focus:outline-hidden"
                value={lockTargetMonth}
                onChange={(e) => setLockTargetMonth(e.target.value)}
              />
            </div>

            <button
              onClick={handleLockPayrollCycle}
              disabled={!isPrivileged}
              className="w-full bg-indigo-600 hover:bg-slate-900 border border-indigo-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-150 disabled:opacity-50"
              id="lock-payroll-cycle-btn"
            >
              <Lock size={13} className="text-indigo-200" /> Lock Pay Cycle Period
            </button>
            
            {!isPrivileged && (
              <p className="text-[10px] text-rose-500 text-center font-bold font-mono">⚠ Privileged login required to issue lock instruction.</p>
            )}
          </div>
        </div>
      )}

      {/* STEP 9: PAYSLIPS HUB */}
      {activeStep === WorkflowStep.PAYSLIP && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Step 9: Corporate Cycle Payslip Hub</h3>
              <p className="text-xs text-slate-500 mt-1">Examine finished payslips, disburse direct bank settlements, or view official receipts.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Period</label>
              <input
                type="month"
                className="p-1 px-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left truncate text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Personnel</th>
                  <th className="p-3">Month</th>
                  <th className="p-3">Net Salary</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Slip Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payslips.filter(p => p.month === filterMonth).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No payslips registered for cycle month {filterMonth}.</td>
                  </tr>
                ) : (
                  payslips.filter(p => p.month === filterMonth).map(ps => (
                    <tr key={ps.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-500 font-bold">{ps.id}</td>
                      <td className="p-3">
                        <strong className="text-slate-800">{ps.employeeName}</strong>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{ps.employeeId}</span>
                      </td>
                      <td className="p-3 font-mono">{ps.month}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 text-sm">Rs. {ps.netSalary.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                          ps.status === "Paid" ? "bg-emerald-100 text-emerald-800" : 
                          ps.status === "Locked" ? "bg-indigo-100 text-indigo-800" :
                          ps.status === "Approved" ? "bg-cyan-100 text-cyan-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {ps.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedPayslip(ps)}
                          className="inline-flex items-center gap-1.5 hover:bg-slate-100 text-slate-600 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <Eye size={12} />
                          View Slip Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP PAYSLIP AUDIT MODAL */}
      {selectedPayslip && (
        <InteractivePayslipView
          payslip={selectedPayslip}
          employees={employees}
          onClose={() => setSelectedPayslip(null)}
          isPrivileged={isPrivileged}
          onDisburse={handleDisbursePayslip}
        />
      )}
    </div>
  );
}
