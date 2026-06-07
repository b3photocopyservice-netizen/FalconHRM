/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LeaveRequest, Employee, Role, EmployeeLeaveBalance, LeaveEncashment } from "../types";
import { 
  Calendar, CheckCircle2, XSquare, Clock, ArrowRight, UserCheck, 
  HeartPulse, Sparkles, List, Calculator, RotateCcw, BarChart3, 
  AlertCircle, DollarSign, Wallet, RefreshCw, Layers, Check, X,
  FileSpreadsheet, Sparkle
} from "lucide-react";

interface LeaveModuleProps {
  leaves: LeaveRequest[];
  employees: Employee[];
  currentRole: Role;
  onUpdateState: () => void;
}

export default function LeaveModule({ leaves, employees, currentRole, onUpdateState }: LeaveModuleProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"balances" | "apply" | "approvals" | "carry" | "reports">("balances");
  
  // Balance dashboard employee selector state
  const defaultEmp = employees.find(e => e.role === Role.EMPLOYEE) || employees[0];
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || "");
  
  // API and local states
  const [balances, setBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [encashments, setEncashments] = useState<LeaveEncashment[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Leave Request Form State
  const [formEmployeeId, setFormEmployeeId] = useState(employees[0]?.id || "");
  const [leaveType, setLeaveType] = useState<
    "Annual Leave" | "Casual Leave" | "Medical Leave" | "Maternity Leave" | "Special Leave" | "No Pay Leave"
  >("Annual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Leave Encashment Form State
  const [encashEmployeeId, setEncashEmployeeId] = useState(employees[0]?.id || "");
  const [encashDays, setEncashDays] = useState(1);
  const [encashMonth, setEncashMonth] = useState("2026-06");

  // Approval Processing States
  const [comments, setComments] = useState<Record<string, string>>({});
  const [encashComments, setEncashComments] = useState<Record<string, string>>({});

  // Sync balances and encashments when leaves prop changes or on mount
  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setBalances(data.leaveBalances || []);
        setEncashments(data.encashments || []);
      }
    } catch (e) {
      console.error("Failed to load leave balance state", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
    // Pre-populate selectors safely
    const firstEmp = employees[0]?.id || "";
    if (firstEmp) {
      if (!selectedEmpId) setSelectedEmpId(firstEmp);
      if (!formEmployeeId) setFormEmployeeId(firstEmp);
      if (!encashEmployeeId) setEncashEmployeeId(firstEmp);
    }
  }, [leaves, employees]);

  // Utility to calculate requested duration
  const getDaysCount = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diff = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diff / (1000 * 3600 * 24)) + 1;
  };

  const calculatedDays = getDaysCount(startDate, endDate);

  // Leave balance fetch helper
  const getEmployeeBalance = (empId: string): EmployeeLeaveBalance | undefined => {
    return balances.find(b => b.employeeId === empId);
  };

  // Form balance validation helper
  const getRemainingBalanceDetails = (empId: string, type: string) => {
    const bal = getEmployeeBalance(empId);
    if (!bal) return { allowed: 14, used: 0, remaining: 14, text: "No balance sheet found. Click to create." };

    const t = type.toLowerCase();
    if (t.includes("no pay") || t.includes("unpaid")) {
      return { allowed: 999, used: bal.noPayUsed, remaining: 999, text: "No Pay leave tracks unpaid downtime. No limits apply, but triggers active payroll deductions." };
    }
    if (t.includes("annual")) {
      const allowed = bal.annualAllocation + bal.annualCarriedForward;
      const remaining = allowed - bal.annualUsed;
      return { allowed, used: bal.annualUsed, remaining, text: `Annual Leave: ${remaining} days available (Base Allocation: ${bal.annualAllocation} + Carried: ${bal.annualCarriedForward}, Used: ${bal.annualUsed})` };
    }
    if (t.includes("casual")) {
      const remaining = bal.casualAllocation - bal.casualUsed;
      return { allowed: bal.casualAllocation, used: bal.casualUsed, remaining, text: `Casual Emergency: ${remaining} days remaining of ${bal.casualAllocation} allocation.` };
    }
    if (t.includes("medical") || t.includes("sick")) {
      const remaining = bal.medicalAllocation - bal.medicalUsed;
      return { allowed: bal.medicalAllocation, used: bal.medicalUsed, remaining, text: `Medical/Sick Leave: ${remaining} days remaining of ${bal.medicalAllocation} allocation.` };
    }
    if (t.includes("maternity")) {
      const remaining = bal.maternityAllocation - bal.maternityUsed;
      return { allowed: bal.maternityAllocation, used: bal.maternityUsed, remaining, text: `Maternity Break: ${remaining} days remaining of ${bal.maternityAllocation} allocation.` };
    }
    if (t.includes("special")) {
      const remaining = bal.specialAllocation - bal.specialUsed;
      return { allowed: bal.specialAllocation, used: bal.specialUsed, remaining, text: `Special Leave: ${remaining} days remaining of ${bal.specialAllocation} allocation.` };
    }
    return { allowed: 0, used: 0, remaining: 0, text: "" };
  };

  const selectedEmp = employees.find(e => e.id === (currentRole === Role.EMPLOYEE ? (defaultEmp?.id || "") : selectedEmpId));
  const activeBalance = selectedEmp ? getEmployeeBalance(selectedEmp.id) : undefined;

  // Handler: Lodge Furlough
  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode("");
    setSuccessMsg("");

    const targetEmpId = currentRole === Role.EMPLOYEE ? (defaultEmp?.id || "") : formEmployeeId;

    if (!targetEmpId) {
      setErrorCode("Please ensure log employee is specified.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorCode("Choose scheduling dates.");
      return;
    }
    if (calculatedDays <= 0) {
      setErrorCode("Invalid date range. Return end date must succeed inception start date.");
      return;
    }
    if (!reason.trim()) {
      setErrorCode("Lodge formal description rationale.");
      return;
    }

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: targetEmpId,
          leaveType,
          startDate,
          endDate,
          reason: reason.trim()
        })
      });

      if (res.ok) {
        setSuccessMsg("Leave request lodged successfully in active organizational approval workflow!");
        setReason("");
        setStartDate("");
        setEndDate("");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorCode(d.error || "Failed to submit leave request.");
      }
    } catch {
      setErrorCode("Network communication failure. Ensure backend services are online.");
    }
  };

  // Handler: Action Leave Request (Manager Approval or HR Approval)
  const handleActionLeave = async (id: string, actionType: "ManagerApprove" | "ManagerReject" | "HrApprove" | "HrReject") => {
    setErrorCode("");
    setSuccessMsg("");
    try {
      const note = comments[id]?.trim() || "";
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          comments: note,
          actorRole: currentRole,
          actorName: employees.find(e => e.role === currentRole)?.name || currentRole
        })
      });

      if (res.ok) {
        setSuccessMsg(`Workflow updated successfully for Leave ID ${id}.`);
        setComments(prev => ({ ...prev, [id]: "" }));
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorCode(d.error || "Action failed.");
      }
    } catch {
      setErrorCode("Server communication error.");
    }
  };

  // Handler: Lodge Annual Leave Encashment
  const handleLodgeEncashment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode("");
    setSuccessMsg("");

    const targetEmpId = currentRole === Role.EMPLOYEE ? (defaultEmp?.id || "") : encashEmployeeId;
    if (!targetEmpId) {
      setErrorCode("Invalid Employee Selected.");
      return;
    }

    try {
      const res = await fetch("/api/leaves/encash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: targetEmpId,
          daysToEncash: Number(encashDays),
          month: encashMonth,
          actorRole: currentRole,
          actorName: employees.find(e => e.role === currentRole)?.name || currentRole
        })
      });

      if (res.ok) {
        setSuccessMsg(`Leave encashment requested. Calculated payout will post dynamically to active payroll.`);
        setEncashDays(1);
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorCode(d.error || "Encashment listing failed.");
      }
    } catch {
      setErrorCode("Server communication error.");
    }
  };

  // Handler: Process Encashment (HR Action)
  const handleProcessEncashment = async (id: string, decision: "Approved" | "Rejected") => {
    setErrorCode("");
    setSuccessMsg("");
    try {
      const note = encashComments[id] || "";
      const res = await fetch(`/api/leaves/encash/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          actorRole: currentRole,
          actorName: employees.find(e => e.role === currentRole)?.name || currentRole,
          comments: note
        })
      });

      if (res.ok) {
        setSuccessMsg(`Leave encashment marked ${decision}.`);
        setEncashComments(prev => ({ ...prev, [id]: "" }));
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorCode(d.error || "Failed to process encashment.");
      }
    } catch {
      setErrorCode("Network connection error.");
    }
  };

  // Handler: Year-End Carry Forward Logic Sweep
  const triggerCarryForwardSweep = async (empId?: string) => {
    setErrorCode("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/leaves/carry-forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empId || undefined,
          actorRole: currentRole,
          actorName: employees.find(e => e.role === currentRole)?.name || currentRole
        })
      });

      if (res.ok) {
        const d = await res.json();
        setSuccessMsg(`Year-end Carry Forward sweep successfully completed for ${empId ? empId : 'all employees'}! Eligible Annual leaves rolled over.`);
        onUpdateState();
      } else {
        setErrorCode("Carry forward execution failed.");
      }
    } catch {
      setErrorCode("Server communication error.");
    }
  };

  // Role Checks
  const isEmployee = currentRole === Role.EMPLOYEE;
  const isBranchManager = currentRole === Role.BRANCH_MANAGER;
  const isHrOrAdmin = currentRole === Role.HR_MANAGER || currentRole === Role.SUPER_ADMIN;
  const isManagerOrAbove = isBranchManager || isHrOrAdmin;

  // Selected Employee Details for request form helper
  const formEmpObj = employees.find(e => e.id === (isEmployee ? (defaultEmp?.id || "") : formEmployeeId));
  const formBalanceDetails = formEmpObj ? getRemainingBalanceDetails(formEmpObj.id, leaveType) : null;

  // Selected Encashment Employee Details
  const encashEmpObj = employees.find(e => e.id === (isEmployee ? (defaultEmp?.id || "") : encashEmployeeId));
  const encashBalanceDetails = encashEmpObj ? getRemainingBalanceDetails(encashEmpObj.id, "Annual Leave") : null;
  const encashRateEst = encashEmpObj ? Math.round(encashEmpObj.baseSalary / 30) : 0;
  const encashPayoutVal = encashDays * encashRateEst;

  // Analytics Computation (Reports metadata)
  const totalLeavesApproved = leaves.filter(l => l.status === "Approved").length;
  const totalUnpaidDaysTaken = leaves
    .filter(l => l.status === "Approved" && (l.leaveType.includes("No Pay") || l.leaveType.includes("Unpaid")))
    .reduce((sum, l) => sum + (l.durationDays || getDaysCount(l.startDate, l.endDate)), 0);
  
  const activeOnLeaveCount = employees.filter(e => e.status === "On Leave").length;
  
  const totalEncashmentExpenditures = encashments
    .filter(e => e.status === "Approved")
    .reduce((sum, e) => sum + e.amountPaid, 0);

  // Leave frequency distribution
  const typeFrequencies = {
    "Annual Leave": 0,
    "Casual Leave": 0,
    "Medical Leave": 0,
    "Maternity Leave": 0,
    "Special Leave": 0,
    "No Pay Leave": 0,
  };

  leaves.forEach(l => {
    if (l.status === "Approved") {
      const typeStr = l.leaveType;
      if (typeStr.includes("Annual")) typeFrequencies["Annual Leave"] += l.durationDays || 1;
      else if (typeStr.includes("Casual")) typeFrequencies["Casual Leave"] += l.durationDays || 1;
      else if (typeStr.includes("Sick") || typeStr.includes("Medical")) typeFrequencies["Medical Leave"] += l.durationDays || 1;
      else if (typeStr.includes("Maternity")) typeFrequencies["Maternity Leave"] += l.durationDays || 1;
      else if (typeStr.includes("Special")) typeFrequencies["Special Leave"] += l.durationDays || 1;
      else if (typeStr.includes("Unpaid") || typeStr.includes("No Pay")) typeFrequencies["No Pay Leave"] += l.durationDays || 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Banner Area */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full text-[10px] font-bold tracking-widest bg-indigo-500/30 text-indigo-300 border border-indigo-400/20 uppercase">Module 3</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400"><Sparkle size={12}/> Live Balance Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Leave & Furlough Management</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Administer Sri Lankan statutory leave, multi-tier approvals workflow, carry forward sweep policies, and direct payroll integrated encashments.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchLeaveData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-200 transition cursor-pointer"
            title="Refresh Ledger"
            id="leave-refresh-btn"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1" id="leave-subtabs">
        <button
          onClick={() => { setActiveTab("balances"); setErrorCode(""); setSuccessMsg(""); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition border-b-2 ${
            activeTab === "balances" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-balances-btn"
        >
          <Layers size={14} />
          Leave Balances
        </button>
        <button
          onClick={() => { setActiveTab("apply"); setErrorCode(""); setSuccessMsg(""); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition border-b-2 ${
            activeTab === "apply" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-apply-btn"
        >
          <Calendar size={14} />
          Lodge Applications / Encashment
        </button>
        <button
          onClick={() => { setActiveTab("approvals"); setErrorCode(""); setSuccessMsg(""); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition border-b-4 relative ${
            activeTab === "approvals" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-approvals-btn"
        >
          <CheckCircle2 size={14} />
          Approval Queue
          {leaves.filter(l => l.status === "Pending").length > 0 && (
            <span className="ml-1 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
              {leaves.filter(l => l.status === "Pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("carry"); setErrorCode(""); setSuccessMsg(""); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition border-b-2 ${
            activeTab === "carry" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-carry-btn"
        >
          <RotateCcw size={14} />
          Carry Forward & Encashments (HR Tools)
        </button>
        <button
          onClick={() => { setActiveTab("reports"); setErrorCode(""); setSuccessMsg(""); }}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition border-b-2 ${
            activeTab === "reports" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="tab-reports-btn"
        >
          <BarChart3 size={14} />
          Analytics & Reports
        </button>
      </div>

      {/* Global Toast Success and Error Displays */}
      {errorCode && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-700 rounded-xl text-xs font-medium flex items-start gap-2.5">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{errorCode}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-700 rounded-xl text-xs font-medium flex items-start gap-2.5">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB CONTENTS */}

      {/* TAB 1: LEAVE BALANCES */}
      {activeTab === "balances" && (
        <div className="space-y-6">
          {/* Employee Selection row if Manager or Admin */}
          {isManagerOrAbove ? (
            <div className="p-4 bg-slate-50 bg-opacity-70 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Organizational Overseer Filter</h4>
                <p className="text-sm font-bold text-slate-800">Select any Employee to audit their specific Balance Ledger</p>
              </div>
              <select
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium font-sans focus:ring-2 focus:ring-indigo-500"
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                id="balance-employee-select"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.id} — {e.department})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-800">
              Your active employee logs are locked to: <strong>{defaultEmp?.name} ({defaultEmp?.id})</strong>. Showing your live statutory allocations.
            </div>
          )}

          {selectedEmp && (
            <div className="space-y-4">
              {/* Selected Employee Info summary */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedEmp.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-mono font-semibold mt-0.5">{selectedEmp.designation} • {selectedEmp.department} • {selectedEmp.id}</p>
                </div>
                <div className="mt-2.5 sm:mt-0 font-mono text-xs bg-slate-100 p-2 rounded-xl border border-slate-200/50">
                  <span className="text-slate-500">Base Monthly Basic: </span>
                  <span className="font-bold text-slate-800">Rs. {selectedEmp.baseSalary.toLocaleString()}</span>
                </div>
              </div>

              {/* Leave Balance Engine Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="leave-balance-engine-grid">
                
                {/* 1. Annual Leave Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="font-bold text-sm text-slate-800">Annual Leave</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600">Statutory</span>
                    </div>
                    {activeBalance ? (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold bg-slate-50 p-2 rounded-xl">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Base</span>
                            <span className="text-slate-700 text-xs font-bold">{activeBalance.annualAllocation}</span>
                          </div>
                          <div className="border-x border-slate-200">
                            <span className="text-slate-400 block text-[9px] uppercase">Rollover</span>
                            <span className="text-indigo-600 text-xs font-bold">+{activeBalance.annualCarriedForward}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Used</span>
                            <span className="text-rose-500 text-xs font-bold">{activeBalance.annualUsed}</span>
                          </div>
                        </div>

                        {/* Progress */}
                        {(() => {
                          const total = activeBalance.annualAllocation + activeBalance.annualCarriedForward;
                          const remaining = Math.max(0, total - activeBalance.annualUsed);
                          const pct = Math.min(100, Math.round((activeBalance.annualUsed / Math.max(1, total)) * 100));
                          return (
                            <div className="space-y-1">
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>{pct}% Used</span>
                                <span className="text-slate-800 font-black">{remaining} remaining (of {total})</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Balance sheet not generated.</p>
                    )}
                  </div>
                </div>

                {/* 2. Casual Leave Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="font-bold text-sm text-slate-800">Casual Leave</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">Short Break</span>
                    </div>
                    {activeBalance ? (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-semibold bg-slate-50 p-2 rounded-xl">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Allocated</span>
                            <span className="text-slate-700 text-xs font-bold">{activeBalance.casualAllocation}</span>
                          </div>
                          <div className="border-l border-slate-200">
                            <span className="text-slate-400 block text-[9px] uppercase">Used</span>
                            <span className="text-rose-500 text-xs font-bold">{activeBalance.casualUsed}</span>
                          </div>
                        </div>

                        {(() => {
                          const remaining = Math.max(0, activeBalance.casualAllocation - activeBalance.casualUsed);
                          const pct = Math.min(100, Math.round((activeBalance.casualUsed / Math.max(1, activeBalance.casualAllocation)) * 100));
                          return (
                            <div className="space-y-1">
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>{pct}% Used</span>
                                <span className="text-slate-800 font-black">{remaining} remaining (of {activeBalance.casualAllocation})</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Balance sheet not generated.</p>
                    )}
                  </div>
                </div>

                {/* 3. Medical Leave Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="font-bold text-sm text-slate-800">Medical Leave</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">Sickness</span>
                    </div>
                    {activeBalance ? (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-semibold bg-slate-50 p-2 rounded-xl">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Allocated</span>
                            <span className="text-slate-700 text-xs font-bold">{activeBalance.medicalAllocation}</span>
                          </div>
                          <div className="border-l border-slate-200">
                            <span className="text-slate-400 block text-[9px] uppercase">Used</span>
                            <span className="text-rose-500 text-xs font-bold">{activeBalance.medicalUsed}</span>
                          </div>
                        </div>

                        {(() => {
                          const remaining = Math.max(0, activeBalance.medicalAllocation - activeBalance.medicalUsed);
                          const pct = Math.min(100, Math.round((activeBalance.medicalUsed / Math.max(1, activeBalance.medicalAllocation)) * 100));
                          return (
                            <div className="space-y-1">
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>{pct}% Used</span>
                                <span className="text-slate-800 font-black">{remaining} remaining (of {activeBalance.medicalAllocation})</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Balance sheet not generated.</p>
                    )}
                  </div>
                </div>

                {/* 4. Maternity Leave Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="font-bold text-sm text-slate-800">Maternity Leave</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600">Parental Support</span>
                    </div>
                    {activeBalance ? (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-semibold bg-slate-50 p-2 rounded-xl">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Allocated</span>
                            <span className="text-slate-700 text-xs font-bold">{activeBalance.maternityAllocation}</span>
                          </div>
                          <div className="border-l border-slate-200">
                            <span className="text-slate-400 block text-[9px] uppercase">Used</span>
                            <span className="text-rose-500 text-xs font-bold">{activeBalance.maternityUsed}</span>
                          </div>
                        </div>

                        {(() => {
                          const remaining = Math.max(0, activeBalance.maternityAllocation - activeBalance.maternityUsed);
                          const pct = Math.min(100, Math.round((activeBalance.maternityUsed / Math.max(1, activeBalance.maternityAllocation)) * 100));
                          return (
                            <div className="space-y-1">
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>{pct}% Used</span>
                                <span className="text-slate-800 font-black">{remaining} remaining (of {activeBalance.maternityAllocation} days)</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Balance sheet not generated.</p>
                    )}
                  </div>
                </div>

                {/* 5. Special Leave Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <span className="font-bold text-sm text-slate-800">Special Leave</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-600">Discretionary</span>
                    </div>
                    {activeBalance ? (
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-semibold bg-slate-50 p-2 rounded-xl">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Allocated</span>
                            <span className="text-slate-700 text-xs font-bold">{activeBalance.specialAllocation}</span>
                          </div>
                          <div className="border-l border-slate-200">
                            <span className="text-slate-400 block text-[9px] uppercase">Used</span>
                            <span className="text-rose-500 text-xs font-bold">{activeBalance.specialUsed}</span>
                          </div>
                        </div>

                        {(() => {
                          const remaining = Math.max(0, activeBalance.specialAllocation - activeBalance.specialUsed);
                          const pct = Math.min(100, Math.round((activeBalance.specialUsed / Math.max(1, activeBalance.specialAllocation)) * 100));
                          return (
                            <div className="space-y-1">
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-pink-500 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>{pct}% Used</span>
                                <span className="text-slate-800 font-black">{remaining} remaining (of {activeBalance.specialAllocation})</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Balance sheet not generated.</p>
                    )}
                  </div>
                </div>

                {/* 6. No Pay Leave Card */}
                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <span className="font-bold text-sm text-indigo-300">No Pay Leave</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">Payroll Impact</span>
                    </div>
                    {activeBalance ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-800 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Unpaid Days Swapped</span>
                          <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">{activeBalance.noPayUsed}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">
                          "Each No Pay Leave day approved triggers a subtraction of <strong>(Base Salary / 30)</strong> in the month's active automated salary ledger cycle."
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Balance sheet not generated.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* General balances registry table for managers */}
              {isManagerOrAbove && (
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">All Employees Leave Ledger Status Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium text-slate-600">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-mono font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">Staff Member</th>
                          <th className="p-3 text-center">Annual (Allowed/CF/Used)</th>
                          <th className="p-3 text-center">Casual (Used/Left)</th>
                          <th className="p-3 text-center">Medical (Used/Left)</th>
                          <th className="p-3 text-center">Parental Break</th>
                          <th className="p-3 text-center">No-Paid Days</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] font-semibold">
                        {balances.map(b => {
                          const emp = employees.find(e => e.id === b.employeeId);
                          if (!emp) return null;
                          return (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{b.employeeName}</div>
                                <div className="text-[9px] text-slate-400 font-mono uppercase">{b.employeeId} • {emp.department}</div>
                              </td>
                              <td className="p-3 text-center">
                                <span className="font-bold text-slate-800">{b.annualAllocation + b.annualCarriedForward}</span>
                                <span className="text-slate-400"> / </span>
                                <span className="text-indigo-600">+{b.annualCarriedForward}</span>
                                <span className="text-slate-400"> / </span>
                                <span className="text-rose-500 font-bold">{b.annualUsed}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-rose-500">{b.casualUsed}</span>
                                <span className="text-slate-400"> / </span>
                                <span className="text-slate-700">{b.casualAllocation - b.casualUsed} remaining</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-rose-500">{b.medicalUsed}</span>
                                <span className="text-slate-400"> / </span>
                                <span className="text-slate-700">{b.medicalAllocation - b.medicalUsed} remaining</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-slate-700">{b.maternityUsed} taken</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-mono text-[10px] border border-rose-100 font-bold">{b.noPayUsed} days</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPLY / REQUEST LEAVE & ENCASHMENT */}
      {activeTab === "apply" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Column A: Apply for Leave request */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 heading-display">Lodge Furlough Request</h3>
              <p className="text-xs text-slate-500 mt-1">Lodge sick, casual, discretionary or unpaid leave requests into the corporate scheduling ledger.</p>
            </div>

            <form onSubmit={handleRequestLeave} className="space-y-4 text-xs font-semibold">
              {/* Employee selector */}
              {isEmployee ? (
                <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl">
                  <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">Active Staff Logs</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{defaultEmp?.name}</p>
                  <p className="text-[10px] text-slate-500">{defaultEmp?.designation} • {defaultEmp?.id}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Lodge On Behalf Of Staff</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                    id="lodge-emp-select"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} (Code: {e.id})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Leave Type Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Furlough Category type</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  id="lodge-type-select"
                >
                  <option value="Annual Leave">Annual Leave (Fully Paid)</option>
                  <option value="Casual Leave">Casual Leave (Short Emergency)</option>
                  <option value="Medical Leave">Medical Leave (Sickness Respite)</option>
                  <option value="Maternity Leave">Maternity Leave (Extended Parental)</option>
                  <option value="Special Leave">Special Leave (Discretionary)</option>
                  <option value="No Pay Leave">No Pay Leave (Payroll Deduction)</option>
                </select>
              </div>

              {/* Inception dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Inception date</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden font-mono text-xs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    id="lodge-start-date"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Return date</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden font-mono text-xs"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    id="lodge-end-date"
                  />
                </div>
              </div>

              {/* Dynamic balance warning sheet */}
              {formBalanceDetails && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200/60 text-[11px]">
                  <div className="font-bold text-slate-700 uppercase tracking-widest text-[9px] text-slate-400">Balance ledger forecast</div>
                  <p className="text-slate-600 leading-normal">{formBalanceDetails.text}</p>
                  
                  {calculatedDays > 0 && (
                    <div className="pt-1.5 border-t border-slate-200/50 flex items-center justify-between font-mono">
                      <span className="text-slate-400 font-bold">REQUESTING:</span>
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{calculatedDays} day{calculatedDays > 1 ? "s" : ""}</span>
                    </div>
                  )}

                  {calculatedDays > 0 && leaveType !== "No Pay Leave" && (
                    <div className="mt-1 font-bold">
                      {formBalanceDetails.remaining >= calculatedDays ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={13}/> Sufficient balance! Post submission valid.
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle size={13}/> Warning: Balance deficit by {calculatedDays - formBalanceDetails.remaining} days! Request will be flagged as invalid.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Detailed rationale / comments</label>
                <textarea
                  placeholder="State detailed reason for log parameters optimization..."
                  required
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  id="lodge-reason-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={calculatedDays > 0 && leaveType !== "No Pay Leave" && (formBalanceDetails?.remaining || 0) < calculatedDays}
                className={`w-full font-bold py-3 px-4 rounded-xl transition cursor-pointer text-xs text-center block uppercase tracking-wider ${
                  calculatedDays > 0 && leaveType !== "No Pay Leave" && (formBalanceDetails?.remaining || 0) < calculatedDays
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                }`}
                id="lodge-submit-btn"
              >
                Submit Furlough Application
              </button>
            </form>
          </div>

          {/* Column B: Request Leave Encashment */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 heading-display">Annual Leave Cash Encashment</h3>
              <p className="text-xs text-slate-500 mt-1">Optionally "encash" unused Annual Leave days in exchange for immediate pay calculations based on statutory daily rate indices.</p>
            </div>

            <form onSubmit={handleLodgeEncashment} className="space-y-4 text-xs font-semibold">
              {/* Employee Selector */}
              {isEmployee ? (
                <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl">
                  <p className="text-[9px] text-violet-500 font-bold uppercase tracking-wider">Staff Code Logs</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{defaultEmp?.name}</p>
                  <p className="text-[10px] text-slate-500">{defaultEmp?.designation} • {defaultEmp?.id}</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Encashment Beneficiary</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer focus:ring-2 focus:ring-violet-500"
                    value={encashEmployeeId}
                    onChange={(e) => setEncashEmployeeId(e.target.value)}
                    id="encash-emp-select"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} (Basic: Rs. {e.baseSalary.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Number of days */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Days to liquidate</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden font-mono"
                    value={encashDays}
                    onChange={(e) => setEncashDays(Number(e.target.value))}
                    id="encash-days-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Claim Payroll Month</label>
                  <input
                    type="month"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden font-mono"
                    value={encashMonth}
                    onChange={(e) => setEncashMonth(e.target.value)}
                    id="encash-month-input"
                  />
                </div>
              </div>

              {/* Formula & Calculation Visualizer */}
              {encashEmpObj && encashBalanceDetails && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-3">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 pb-1.5">
                    <span>Statutory Computation Sheet</span>
                    <span className="text-violet-600">Ceylon Chapter 16</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Total Annual Balance</span>
                      <span className="font-bold text-slate-800">{encashBalanceDetails.remaining} days available</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Base Monthly Basic</span>
                      <span className="font-bold text-slate-800">Rs. {encashEmpObj.baseSalary.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-violet-50 text-violet-900 rounded-lg space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span>Daily Basic Rate (Basic / 30):</span>
                      <span className="font-bold">Rs. {encashRateEst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-violet-100/30 pt-1 text-xs font-bold text-violet-700">
                      <span>Calculated Liquid Value (Days * Rate):</span>
                      <span>Rs. {encashPayoutVal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[10px] leading-normal text-slate-400 italic">
                    * Once approved by the HR Executive, encashment is paid as an allowance, appearing directly in active payslip line item: "leaveEncashment".
                  </div>

                  {encashBalanceDetails.remaining < encashDays && (
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold border border-rose-100">
                      <AlertCircle size={12} className="inline mr-1" />
                      Deficit Warning: Beneficiary only possesses {encashBalanceDetails.remaining} days available. Request will fail validation.
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={encashBalanceDetails && encashBalanceDetails.remaining < encashDays}
                className={`w-full font-bold py-3 px-4 rounded-xl transition cursor-pointer text-xs text-center block uppercase tracking-wider ${
                  encashBalanceDetails && encashBalanceDetails.remaining < encashDays
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                }`}
                id="encash-submit-btn"
              >
                Submit Encashment Claim
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 3: APPROVAL STACK (MULTI-STAGE WORKFLOW) */}
      {activeTab === "approvals" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 heading-display">Statutory Leave Workflows & Approval Stack</h3>
            <p className="text-xs text-slate-500 mt-1">Multi-stage compliance flow: Employee Request ➔ Manager Review ➔ HR Executive Review ➔ Automated Payroll Entry updates.</p>
          </div>

          {/* Quick info bar depending on role */}
          {isManagerOrAbove ? (
            <div className="p-3 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl text-xs font-bold flex items-center gap-2">
              <Sparkles size={14} className="animate-pulse" />
              <span>
                {currentRole === Role.BRANCH_MANAGER && "You possess Branch Manager authority. You are authorized to action 'Manager Approval' stages."}
                {isHrOrAdmin && "You possess HR Executive authority. You are authorized to finalize requests ('HR Approval') and execute payroll edits."}
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-xs font-semibold">
              Showing scheduling requests logged. Status tracking is live. Ensure managers review outstanding requests.
            </div>
          )}

          <div className="space-y-6">
            {leaves.length === 0 ? (
              <p className="p-10 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl">No Leave scheduling requests found.</p>
            ) : (
              leaves.map((leave) => {
                const isNp = leave.leaveType.toLowerCase().includes("no pay") || leave.leaveType.toLowerCase().includes("unpaid");
                const days = leave.durationDays || getDaysCount(leave.startDate, leave.endDate);
                
                return (
                  <div key={leave.id} className="p-5 border border-slate-200 rounded-2xl space-y-4 hover:border-slate-300 transition duration-150">
                    
                    {/* Header: Employee & Request overview info */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{leave.employeeName}</h4>
                          <span className="font-mono text-[9px] bg-slate-100 text-slate-500 rounded px-1.5 uppercase font-bold">{leave.employeeId}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <HeartPulse size={12} className="text-indigo-400" />
                          Category: <span className="text-slate-700 font-bold">{leave.leaveType}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-slate-600 font-black">{days} Days</span>
                        <span className={`px-2.5 py-0.5 rounded-sm text-[10px] tracking-wider uppercase font-black ${
                          leave.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          leave.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                          "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                    </div>

                    {/* Timeline visualization flow */}
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                      {/* Sub-dates display */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-slate-600 mb-2">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{leave.startDate}</span>
                        <ArrowRight size={11} className="text-slate-400" />
                        <span>{leave.endDate}</span>
                      </div>

                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                        " {leave.reason ? leave.reason : "No rationale comment registered."} "
                      </p>

                      {/* WORKFLOW MATRIX GRAPHIC */}
                      <div className="pt-3 border-t border-slate-200/60">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block mb-2.5">Live Workflow Board Map</span>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          
                          {/* Step 1: Employee Submit */}
                          <div className="p-2 rounded-lg bg-green-50 border border-emerald-100 flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <div>
                              <span>1. Employee Request</span>
                              <span className="block text-[8px] text-emerald-500 font-normal">Logged successfully</span>
                            </div>
                          </div>

                          {/* Step 2: Manager approval */}
                          <div className={`p-2 rounded-lg border flex items-center gap-1.5 text-[10px] font-bold ${
                            leave.managerApproval === "Approved" ? "bg-green-50 border-emerald-100 text-emerald-800" :
                            leave.managerApproval === "Rejected" ? "bg-rose-50 border-rose-100 text-rose-800" :
                            "bg-amber-50/50 border-amber-200/50 text-amber-800"
                          }`}>
                            <Clock size={13} className={leave.managerApproval === "Pending" ? "animate-spin text-amber-500" : "text-slate-400"} />
                            <div>
                              <span>2. Manager approval</span>
                              <span className="block text-[8px] text-slate-500 font-normal">
                                {leave.managerApproval === "Approved" ? `Approved by ${leave.managerApprovedBy || 'Manager'}` :
                                 leave.managerApproval === "Rejected" ? "Rejected" : "Waiting review"}
                              </span>
                            </div>
                          </div>

                          {/* Step 3: HR approval */}
                          <div className={`p-2 rounded-lg border flex items-center gap-1.5 text-[10px] font-bold ${
                            leave.hrApproval === "Approved" ? "bg-green-50 border-emerald-100 text-emerald-800" :
                            leave.hrApproval === "Rejected" ? "bg-rose-50 border-rose-100 text-rose-800" :
                            "bg-amber-50/50 border-amber-200/50 text-amber-800"
                          }`}>
                            <Clock size={13} className={leave.hrApproval === "Pending" && leave.managerApproval === "Approved" ? "animate-spin text-amber-500" : "text-slate-400"} />
                            <div>
                              <span>3. HR Final Approval</span>
                              <span className="block text-[8px] text-slate-500 font-normal">
                                {leave.hrApproval === "Approved" ? `Approved by ${leave.hrApprovedBy || 'HR'}` :
                                 leave.hrApproval === "Rejected" ? "Rejected" : "Waiting Review"}
                              </span>
                            </div>
                          </div>

                          {/* Step 4: Payroll Impact */}
                          <div className={`p-2 rounded-lg border flex items-center gap-1.5 text-[10px] font-bold ${
                            leave.status === "Approved" ? "bg-teal-50 border-teal-100 text-teal-800" : "bg-slate-105 border-slate-200/50 text-slate-400"
                          }`}>
                            <CheckCircle2 size={13} className={leave.status === "Approved" ? "text-teal-600" : "text-slate-300"} />
                            <div>
                              <span>4. Payroll impact</span>
                              <span className="block text-[8px] text-slate-500 font-normal leading-tight">
                                {leave.status === "Approved" 
                                  ? (isNp ? "No-Pay deduction saved" : "Paid leave fully funded")
                                  : "Awaiting final approval"}
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Comments display */}
                    {leave.comments && (
                      <div className="bg-amber-50/50 p-2.5 rounded-lg text-[11px] text-slate-600 border border-amber-100">
                        <strong>Audit remarks/comments:</strong> "{leave.comments}"
                      </div>
                    )}

                    {/* Action Controls logic based on active role permissions */}
                    {leave.status === "Pending" && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        {/* 1. Branch Manager controls */}
                        {leave.managerApproval === "Pending" && (isBranchManager || isHrOrAdmin) && (
                          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/50">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">BRANCH MANAGER ACTION CONTAINER</span>
                            <div className="flex gap-2 text-[10px]">
                              <input 
                                type="text"
                                placeholder="Audit comment (Optional)..."
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs flex-1 text-slate-700"
                                value={comments[leave.id] || ""}
                                onChange={(e) => setComments({ ...comments, [leave.id]: e.target.value })}
                                id={`mgr-comment-${leave.id}`}
                              />
                              <button
                                onClick={() => handleActionLeave(leave.id, "ManagerReject")}
                                className="px-3.5 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-bold rounded-lg cursor-pointer"
                                id={`mgr-rej-${leave.id}`}
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleActionLeave(leave.id, "ManagerApprove")}
                                className="px-4 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg cursor-pointer"
                                id={`mgr-app-${leave.id}`}
                              >
                                Approve Request
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. HR Management controls */}
                        {leave.managerApproval === "Approved" && leave.hrApproval === "Pending" && isHrOrAdmin && (
                          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/50">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">HR EXECUTIVE FINAL GATEKEEPER CONTAINER</span>
                            <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                              * Important: Finalizing this request as APPROVED automatically registers the furlough days onto the balance engine and feeds directly to payroll.
                            </p>
                            <div className="flex gap-2 text-[10px]">
                              <input 
                                type="text"
                                placeholder="Audit comment / comments (Optional)..."
                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs flex-1 text-slate-700"
                                value={comments[leave.id] || ""}
                                onChange={(e) => setComments({ ...comments, [leave.id]: e.target.value })}
                                id={`hr-comment-${leave.id}`}
                              />
                              <button
                                onClick={() => handleActionLeave(leave.id, "HrReject")}
                                className="px-3.5 py-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-bold rounded-lg cursor-pointer"
                                id={`hr-rej-${leave.id}`}
                              >
                                HR Reject
                              </button>
                              <button
                                onClick={() => handleActionLeave(leave.id, "HrApprove")}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                                id={`hr-app-${leave.id}`}
                              >
                                Finalize HR Approval
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Non-authorized warning */}
                        {((leave.managerApproval === "Pending" && !isBranchManager && !isHrOrAdmin) ||
                          (leave.managerApproval === "Approved" && !isHrOrAdmin)) && (
                          <div className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1 bg-slate-50 p-2 rounded-lg">
                            <Clock size={12} className="animate-pulse" />
                            <span>
                              {leave.managerApproval === "Pending" 
                                ? "Awaiting Branch Manager review..." 
                                : "Manager sanctioned. Awaiting final HR Executive approval..."}
                            </span>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CARRY FORWARD & ENCASHMENTS (HR TOOLS) */}
      {activeTab === "carry" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Sweep Carry forward logic tool */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Year-End Carry Forward Logic</h3>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Policy Compliance sweeps</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Execute corporate year-end leave reconciliation sweeps. System sweeps remaining unused Annual Leave and carries them forward to next year's allowances. 
              </p>
              
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200/50 text-[11px]">
                <span className="font-bold text-slate-700 text-[10px] uppercase">Corporate sweep rules:</span>
                <ul className="list-disc list-inside text-slate-500 space-y-1">
                  <li>Only <strong>Annual Leave</strong> is eligible.</li>
                  <li>Maximum allowable carry-over limit: <strong>7 Working Days</strong> per employee.</li>
                  <li>All unused Casual, Medical and Special leaves expire immediately.</li>
                  <li>Resets used meters to zero for next year's accounting.</li>
                </ul>
              </div>

              {isHrOrAdmin ? (
                <div className="space-y-3.5">
                  <div className="p-3 bg-red-50 border border-red-200/50 rounded-xl text-[10px] font-bold text-red-700 flex items-start gap-1.5 leading-normal">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>Run requires authorization. Carrying forward will override active balances. Make sure pending leaves are processed.</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => triggerCarryForwardSweep()}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-xs text-center block uppercase tracking-wider shadow-sm"
                      id="sweep-all-btn"
                    >
                      Sweep All Staff
                    </button>
                    {selectedEmpId && (
                      <button
                        onClick={() => triggerCarryForwardSweep(selectedEmpId)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2.5 rounded-xl text-xs font-bold border border-indigo-100 transition whitespace-nowrap cursor-pointer"
                        id="sweep-target-btn"
                      >
                        Sweep selected
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl text-xs font-semibold">
                  * Note: Year-end Carry Forward sweep tools are restricted to HR Executives or Super Administrators only.
                </div>
              )}
            </div>

            {/* Encashment rules panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Leave Encashment sweep indices</h3>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Payout formulation parameters</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Liquidation policy: Unused Annual Leave may be encashed for financial payouts. Once approved, the cash value calculations post automatically.
              </p>

              <div className="p-3.5 bg-violet-50/50 rounded-xl space-y-2 border border-violet-100 text-[11px] text-violet-950 font-medium">
                <span className="font-bold text-violet-900 text-[10px] uppercase">Statutory Compensation payout formula:</span>
                <p className="leading-normal font-mono">
                  Payout = Days to Encash * (Base Basic Salary / 30)
                </p>
                <p className="leading-normal text-[10px] text-slate-500 font-sans italic">
                  Example: Basic Salary of Rs. 150,000 with 10 days encashed outputs a payout allowance of Rs. 50,000 (Subject to APIT tax schedules).
                </p>
              </div>

              <div className="p-3 block rounded-xl bg-orange-50 border border-orange-100 text-orange-700 text-[10px]">
                <strong className="block uppercase tracking-wider mb-0.5">Active Payroll Integration</strong>
                Approved encashments will automatically be parsed during draft generation and injected into the target month's payslip.
              </div>
            </div>

          </div>

          {/* Encashment requests board */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Liquid Leave Encashment Claims Queue</h3>
            <div className="overflow-x-auto">
              {encashments.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl">No encashment ledger items submitted.</p>
              ) : (
                <div className="space-y-3">
                  {encashments.map(item => {
                    const empObj = employees.find(e => e.id === item.employeeId);
                    return (
                      <div key={item.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/20 text-xs space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm">{item.employeeName}</span>
                              <span className="font-mono text-[9px] bg-slate-100 p-0.5 px-1.5 text-slate-500 rounded uppercase font-bold">{item.employeeId}</span>
                              <span className="text-slate-400 font-bold">• Claim Month: <strong className="text-slate-700 font-mono">{item.month}</strong></span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Applied: {item.requestedDate}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 font-mono">
                            <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-black">{item.daysToEncash} Days</span>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">Rate: Rs. {item.dailyRate}/day</span>
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black">Gross Pay: Rs. {item.amountPaid.toLocaleString()}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wide ${
                              item.status === 'Pending' ? 'bg-amber-50 text-amber-500 border border-amber-200' :
                              item.status === 'Approved' ? 'bg-emerald-50 text-emerald-500 border border-emerald-200' :
                              'bg-rose-50 text-rose-500 border border-rose-200'
                            }`}>{item.status}</span>
                          </div>
                        </div>

                        {item.comments && (
                          <p className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-500 italic">" Remarks: {item.comments} "</p>
                        )}

                        {item.status === "Pending" && (
                          <div className="pt-2 border-t border-slate-50 flex justify-between items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <Clock size={12}/>
                              {isHrOrAdmin ? "Authorized. Process liquidation claim." : "Awaiting HR Executive review..."}
                            </div>
                            {isHrOrAdmin && (
                              <div className="flex gap-2 text-[10px]">
                                <input
                                  type="text"
                                  placeholder="Processor comments..."
                                  className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                  value={encashComments[item.id] || ""}
                                  onChange={(e) => setEncashComments({ ...encashComments, [item.id]: e.target.value })}
                                  id={`encash-com-${item.id}`}
                                />
                                <button
                                  onClick={() => handleProcessEncashment(item.id, "Rejected")}
                                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 cursor-pointer font-bold"
                                  id={`encash-rej-${item.id}`}
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleProcessEncashment(item.id, "Approved")}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer font-bold shadow-xs"
                                  id={`encash-app-${item.id}`}
                                >
                                  Approve Claim
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LEAVE ANALYTICS & REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          
          {/* Metrics Ribbon summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="leave-analytics-ribbon">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">Furloughs Sanctioned</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{totalLeavesApproved} requests</div>
              <div className="text-[10px] text-slate-500 mt-1">Accumulated calendar year</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">No-Pay Days Swept</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{totalUnpaidDaysTaken} days</div>
              <div className="text-[10px] text-slate-550 mt-1">Calculates salary cost savings</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">Active Furlough (Today)</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">{activeOnLeaveCount} staff</div>
              <div className="text-[10px] text-slate-500 mt-1">Currently marked "On Leave"</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">Liquidated Liability</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">Rs. {totalEncashmentExpenditures.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 mt-1">Approved Cash Encashment</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Column A: custom responsive SVG bar-line graph */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <h3 className="text-sm font-bold text-slate-800">Approved Leave Days Taken by category</h3>
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider font-mono bg-indigo-50 p-1 rounded">Visual Matrix Metrics</span>
              </div>

              {/* Custom SVG Bar Graph */}
              <div className="space-y-4">
                {Object.entries(typeFrequencies).map(([type, value]) => {
                  const maxVal = Math.max(...Object.values(typeFrequencies), 1);
                  const widthPct = Math.max(3, Math.round((value / maxVal) * 100));
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-bold">{type}</span>
                        <span className="font-mono bg-slate-100 p-0.5 px-2 rounded font-black text-slate-800">{value} Day{value > 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-6 w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-100/50 flex">
                        <div 
                          className={`h-full transition-all duration-500 flex items-center justify-end pr-2 text-[9px] font-mono font-black text-white ${
                            type.includes("Annual") ? "bg-indigo-500" :
                            type.includes("Casual") ? "bg-amber-500" :
                            type.includes("Medical") ? "bg-emerald-500" :
                            type.includes("Maternity") ? "bg-purple-500" :
                            type.includes("Special") ? "bg-pink-500" :
                            "bg-rose-500"
                          }`}
                          style={{ width: `${widthPct}%` }}
                        >
                          {value > 0 ? `${widthPct}%` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Column B: Employee frequency ledger */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <h3 className="text-sm font-bold text-slate-800">Top Furlough Applicants</h3>
                <span className="text-[9px] text-rose-600 font-bold uppercase tracking-wider bg-rose-50 p-1 rounded">Audit Focus</span>
              </div>

              <div className="space-y-3.5">
                {balances
                  .map(b => {
                    const totalTaken = b.annualUsed + b.casualUsed + b.medicalUsed + b.maternityUsed + b.specialUsed + b.noPayUsed;
                    return { ...b, totalTaken };
                  })
                  .sort((a, b) => b.totalTaken - a.totalTaken)
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between text-xs border-b border-dashed border-slate-100 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 p-1 px-2 rounded-full font-mono text-[10px] font-black">{index + 1}</span>
                        <div>
                          <span className="font-bold text-slate-800 block leading-tight">{item.employeeName}</span>
                          <span className="text-[9px] font-mono text-slate-400 uppercase">{item.employeeId}</span>
                        </div>
                      </div>
                      <span className="font-mono bg-slate-900 border border-slate-800 text-indigo-300 font-black px-2 py-0.5 rounded text-[11px]">
                        {item.totalTaken} days
                      </span>
                    </div>
                  ))}
              </div>
            </div>

          </div>

          {/* Leave Analytics disclaimer */}
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100/50 flex gap-2 items-center text-indigo-900 text-xs text-[11px] leading-relaxed">
            <AlertCircle className="shrink-0 text-indigo-600" size={15}/>
            <p>
              Information indices compile real-time approvals logged inside the local SQL simulation arrays. Changes made inside the multi-tier schedules queue propagate seamlessly.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
