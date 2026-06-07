/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SalaryAdvance, StorePurchaseRecovery, WelfareClaim, Bonus, Employee, Role } from "../types";
import { HandCoins, ShoppingBag, HeartHandshake, Award, HelpCircle, Sparkles, Check, Flame, X } from "lucide-react";

interface FinancialsModuleProps {
  advances: SalaryAdvance[];
  recoveries: StorePurchaseRecovery[];
  claims: WelfareClaim[];
  bonuses: Bonus[];
  employees: Employee[];
  currentRole: Role;
  onUpdateState: () => void;
}

export default function FinancialsModule({
  advances,
  recoveries,
  claims,
  bonuses,
  employees,
  currentRole,
  onUpdateState
}: FinancialsModuleProps) {
  const [activeTab, setActiveTab] = useState<"advance" | "store" | "welfare" | "bonus" >("advance");

  // Form states
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [amount, setAmount] = useState("1000");
  const [reason, setReason] = useState("");
  const [installments, setInstallments] = useState("6");
  const [itemName, setItemName] = useState("");
  const [claimType, setClaimType] = useState<WelfareClaim["claimType"]>("Medical");
  const [bonusType, setBonusType] = useState<Bonus["bonusType"]>("Performance Bonus");

  // Module 5 recovery and repayment states
  const [recoveryMethod, setRecoveryMethod] = useState<"Single" | "Installment">("Installment");
  const [repayingAdvance, setRepayingAdvance] = useState<SalaryAdvance | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayNote, setRepayNote] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const defaultEmp = employees.find(e => e.role === Role.EMPLOYEE) || employees[0];

  const handleCreateAdvanceOffered = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const activeEmpId = currentRole === Role.EMPLOYEE ? (defaultEmp?.id || "") : employeeId;
    try {
      const payload = {
        employeeId: activeEmpId,
        requestAmount: parseFloat(amount) || 0,
        reason,
        installmentPeriod: recoveryMethod === "Single" ? 1 : (parseInt(installments) || 6),
        recoveryMethod,
        actorRole: currentRole,
        actorName: employees.find(e => e.role === currentRole)?.name || "System"
      };

      const res = await fetch("/api/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Advance application requested.");
        setReason("");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Request failed");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleActionAdvance = async (id: string, decision: "Approved" | "Rejected") => {
    resetMessages();
    try {
      const res = await fetch(`/api/advances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          actorRole: currentRole,
          actorName: employees.find(e => e.role === currentRole)?.name || "HR Manager"
        })
      });
      if (res.ok) {
        setSuccessMsg(`Salary advance request marked ${decision}`);
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed process advance");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleDisburseAdvance = async (id: string) => {
    resetMessages();
    try {
      const res = await fetch(`/api/advances/${id}/disburse`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorRole: currentRole,
          actorName: employees.find(e => e.role === currentRole)?.name || "Finance Admin"
        })
      });
      if (res.ok) {
        setSuccessMsg("Salary advance successfully disbursed and recorded on treasury ledger.");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed context disbursement.");
      }
    } catch {
      setErrorMsg("Server communication error.");
    }
  };

  const handleRepayAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!repayingAdvance) return;

    const parsed = parseFloat(repayAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg("Please enter a valid cash repayment amount.");
      return;
    }

    try {
      const res = await fetch(`/api/advances/${repayingAdvance.id}/repay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsed,
          note: repayNote.trim(),
          actorRole: currentRole,
          actorName: employees.find(e => e.role === currentRole)?.name || "Cashier"
        })
      });

      if (res.ok) {
        setSuccessMsg(`Repayment of Rs. ${parsed.toLocaleString()} recorded inside double-entry company ledger.`);
        setRepayAmount("");
        setRepayNote("");
        setRepayingAdvance(null);
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed repayment post.");
      }
    } catch {
      setErrorMsg("Server communication error during payback.");
    }
  };

  const handleCreateStorePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const activeEmpId = currentRole === Role.EMPLOYEE ? (defaultEmp?.id || "") : employeeId;
    try {
      const payload = {
        employeeId: activeEmpId,
        itemName,
        totalCost: parseFloat(amount) || 0,
        installmentPeriod: parseInt(installments) || 6
      };

      const res = await fetch("/api/recoveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Purchase amortisation logged in salary recovery flow.");
        setItemName("");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Creation failed");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleCreateAssistanceClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const activeEmpId = currentRole === Role.EMPLOYEE ? (defaultEmp?.id || "") : employeeId;
    try {
      const payload = {
        employeeId: activeEmpId,
        claimType,
        amount: parseFloat(amount) || 0,
        description: reason
      };

      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Welfare claim successfully submitted.");
        setReason("");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Claim failed");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleActionClaim = async (id: string, decision: "Approved" | "Rejected") => {
    resetMessages();
    try {
      const res = await fetch(`/api/claims/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          actorRole: currentRole,
          actorName: defaultEmp?.name || "HR Manager"
        })
      });
      if (res.ok) {
        setSuccessMsg(`Medical/assistance claim marked ${decision}`);
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed processing claim");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleCreateBonusCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const activeEmpId = currentRole === Role.EMPLOYEE ? (defaultEmp?.id || "") : employeeId;
    try {
      const payload = {
        employeeId: activeEmpId,
        bonusType,
        amount: parseFloat(amount) || 0,
        description: reason
      };

      const res = await fetch("/api/bonuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessMsg("Bonus allocation recorded in pending schedule.");
        setReason("");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed scheduling bonus");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleDisburseBonus = async (id: string) => {
    resetMessages();
    try {
      const res = await fetch(`/api/bonuses/${id}/disburse`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setSuccessMsg("Bonus credit disbursed and logged inside ledger.");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Disbursed failed");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleActionBonus = async (id: string, status: "Approved" | "Rejected") => {
    resetMessages();
    try {
      const res = await fetch(`/api/bonuses/${id}/action`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          actorRole: currentRole,
          actorName: defaultEmp?.fullName || "HR Manager"
        })
      });
      if (res.ok) {
        setSuccessMsg(`Bonus allocation has been successfully ${status.toLowerCase()}!`);
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Action failed");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const isPrivileged = currentRole === Role.SUPER_ADMIN || currentRole === Role.ACCOUNTANT || currentRole === Role.PAYROLL_OFFICER || currentRole === Role.HR_MANAGER;

  return (
    <div className="space-y-6">
      {/* Sub tabs switcher */}
      <div className="flex bg-white p-2 rounded-2xl shadow-xs border border-slate-100 overflow-x-auto gap-2">
        <button
          onClick={() => { setActiveTab("advance"); resetMessages(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "advance" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          }`}
          id="tab-advance-btn"
        >
          <HandCoins size={16} />
          Salary Advances
        </button>

        <button
          onClick={() => { setActiveTab("store"); resetMessages(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "store" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          }`}
          id="tab-store-btn"
        >
          <ShoppingBag size={16} />
          Staff Store Amortization
        </button>

        <button
          onClick={() => { setActiveTab("welfare"); resetMessages(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "welfare" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          }`}
          id="tab-welfare-btn"
        >
          <HeartHandshake size={16} />
          Medical & Welfare Claims
        </button>

        <button
          onClick={() => { setActiveTab("bonus"); resetMessages(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer whitespace-nowrap ${
            activeTab === "bonus" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          }`}
          id="tab-bonus-btn"
        >
          <Award size={16} />
          Corporate Bonuses
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Left Input Form Panel depending on Tab selection */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 h-fit space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 heading-display capitalize">
              {activeTab === "advance" && "Apply Salary Advance"}
              {activeTab === "store" && "Staff Store Purchase"}
              {activeTab === "welfare" && "Assistance claim"}
              {activeTab === "bonus" && "Schedule Bonus Payout"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === "advance" && "Request an interest-free advance package to be recovered monthly."}
              {activeTab === "store" && "Register item purchased in staff cafeteria or store to amortise over salary."}
              {activeTab === "welfare" && "Request medical test reimbursement or emergency welfare assistance grants."}
              {activeTab === "bonus" && "Award performance-based or festive incentives to rostered personnel."}
            </p>
          </div>

          <form
            onSubmit={
              activeTab === "advance" ? handleCreateAdvanceOffered :
              activeTab === "store" ? handleCreateStorePurchase :
              activeTab === "welfare" ? handleCreateAssistanceClaim :
              handleCreateBonusCredit
            }
            className="space-y-4 text-xs font-semibold"
          >
            {currentRole === Role.EMPLOYEE ? (
              <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-mono">Active Employee Session</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{defaultEmp?.name}</p>
                <p className="text-xs text-slate-500">{defaultEmp?.designation} • {defaultEmp?.id}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Lodge Personnel</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  id="fin-emp-select"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === "store" && (
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Item/ cafeteria Purchase Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ThinkPad T14 AMD Laptop Upgrade"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  id="fin-item-input"
                />
              </div>
            )}

            {activeTab === "welfare" && (
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Welfare & Medical Category</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs"
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value as WelfareClaim["claimType"])}
                  id="fin-claim-type"
                >
                  <option value="Medical">Medical Relief Allowance</option>
                  <option value="House Rent">House Rent Assistance</option>
                  <option value="House Construction">House Construction Relief Fund</option>
                  <option value="Education Assistance">Education Support Grant</option>
                  <option value="Emergency Assistance">Emergency Assistance Fund / Welfare Aid</option>
                </select>
              </div>
            )}

            {activeTab === "bonus" && (
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Bonus program category</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs"
                  value={bonusType}
                  onChange={(e) => setBonusType(e.target.value as Bonus["bonusType"])}
                  id="fin-bonus-type"
                >
                  <option value="Festival Bonus">Festival Bonus (Sinhala & Tamil New Year, Eid, Christmas)</option>
                  <option value="Year End Bonus">Year End Bonus / 13th Month Pay</option>
                  <option value="Performance Bonus">Performance Bonus (KPI Appraisals)</option>
                  <option value="Special Bonus">Special Bonus / Ad-hoc Discretionary</option>
                </select>
              </div>
            )}

            {activeTab === "advance" && (
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Recovery Method</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRecoveryMethod("Installment")}
                    className={`p-2 rounded-xl text-center border font-semibold text-xs cursor-pointer transition ${
                      recoveryMethod === "Installment"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Monthly Installments
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryMethod("Single")}
                    className={`p-2 rounded-xl text-center border font-semibold text-xs cursor-pointer transition ${
                      recoveryMethod === "Single"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Single Deduction
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Lump Payout (Rs.)</label>
                <input
                  type="number"
                  min="50"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  id="fin-amount-input"
                />
              </div>

              {((activeTab === "advance" && recoveryMethod === "Installment") || activeTab === "store") && (
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Amortisation Periods</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    id="fin-months-select"
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="10">10 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>
              )}
            </div>

            {activeTab !== "store" && (
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Purpose Justification / Descriptions</label>
                <textarea
                  placeholder="Insert auditing description details..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 h-20 placeholder-slate-400"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  id="fin-reason-textarea"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition text-xs cursor-pointer"
              id="fin-submit-btn"
            >
              Submit Financial Allocation
            </button>
          </form>
        </div>

        {/* Dynamic Right Listing View Depending on Tab Selection */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 lg:col-span-2 space-y-4">
          {activeTab === "advance" && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-800 heading-display">Active Salary Advances Register</h4>
              <div className="space-y-3">
                {advances.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-xs">No active salary advances.</p>
                ) : (
                  advances.map(a => {
                    const recSoFar = a.recoveredSoFar || 0;
                    const pct = Math.min(100, Math.round((recSoFar / a.requestAmount) * 100));
                    const remainingBalance = Math.max(0, a.requestAmount - recSoFar);
                    const method = a.recoveryMethod || "Installment";

                    return (
                      <div key={a.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 flex flex-col gap-3 text-xs font-semibold">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-slate-800 font-bold">{a.employeeName}</p>
                              <span className="text-[10px] text-slate-400 font-mono">({a.employeeId})</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                method === "Single"
                                  ? "bg-purple-50 text-purple-600 border border-purple-100"
                                  : "bg-blue-50 text-blue-600 border border-blue-100"
                              }`}>
                                {method === "Single" ? "Single Recovery" : "Installment Plan"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1">Reason: "{a.reason}"</p>
                            {a.comments && (
                              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Admin Note: "{a.comments}"</p>
                            )}
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Applied: {a.requestDate}</p>
                          </div>

                          <div className="flex items-center gap-4 text-right shrink-0">
                            <div className="font-mono">
                              <p className="text-slate-900 font-extrabold text-sm">Rs. {a.requestAmount.toLocaleString()}</p>
                              {method === "Installment" ? (
                                <p className="text-[10px] text-slate-500 font-medium font-mono">Rs. {a.monthlyDeduction.toLocaleString()}/mo x {a.installmentPeriod} mos</p>
                              ) : (
                                <p className="text-[10px] text-slate-500 font-medium font-mono">One-off next payroll</p>
                              )}
                            </div>
                            
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              a.status === "Approved" ? "bg-cyan-50 text-cyan-600 border border-cyan-100" :
                              a.status === "Disbursed" ? "bg-indigo-50 text-indigo-600 border border-indigo-100 animate-pulse" :
                              a.status === "Fully Recovered" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              a.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}>
                              {a.status === "Approved" ? "Approved (Pending Disb.)" : a.status}
                            </span>

                            {a.status === "Pending" && isPrivileged && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleActionAdvance(a.id, "Rejected")}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-1 rounded-md transition cursor-pointer"
                                  id={`reject-adv-${a.id}`}
                                >
                                  ✕
                                </button>
                                <button
                                  onClick={() => handleActionAdvance(a.id, "Approved")}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold p-1 rounded-md transition cursor-pointer"
                                  id={`approve-adv-${a.id}`}
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            )}

                            {a.status === "Approved" && isPrivileged && (
                              <button
                                onClick={() => handleDisburseAdvance(a.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3.5 rounded-lg text-[10px] font-sans transition cursor-pointer flex items-center gap-1 shrink-0"
                                id={`disburse-adv-${a.id}`}
                              >
                                <Flame size={12} /> Disburse
                              </button>
                            )}
                          </div>
                        </div>

                        {(a.status === "Disbursed" || a.status === "Fully Recovered") && (
                          <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-lg">
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                <span>Recovered: Rs. {recSoFar.toLocaleString()} / Rs. {a.requestAmount.toLocaleString()}</span>
                                <span className="font-bold text-indigo-600">{pct}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end md:self-auto shrink-0 font-mono text-[10px]">
                              <p className="text-slate-600">Balance: <strong className="text-slate-800">Rs. {remainingBalance.toLocaleString()}</strong></p>
                              {a.status === "Disbursed" && isPrivileged && (
                                <button
                                  onClick={() => { setRepayingAdvance(a); setRepayAmount(""); setRepayNote(""); }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-sans font-bold px-2 py-0.5 rounded transition cursor-pointer"
                                >
                                  Cash Repay
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {a.disbursedBy && (
                          <p className="text-[9px] text-slate-400 font-mono text-right capitalize">Disbursed by {a.disbursedBy} on {a.disbursedDate}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "store" && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-800 heading-display font-sans">Active staff Store Recoveries</h4>
              <div className="space-y-3">
                {recoveries.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-xs">No store purchases registered.</p>
                ) : (
                  recoveries.map(r => {
                    const percent = Math.round((r.recoveredSoFar / r.totalCost) * 100);
                    return (
                      <div key={r.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-slate-800 font-bold">{r.employeeName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">({r.employeeId})</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">Purchased: <strong className="text-slate-700">{r.itemName}</strong></p>
                          {/* Progress bar */}
                          <div className="pt-2 w-full max-w-xs space-y-1">
                            <div className="flex justify-between text-[9px] font-mono text-indigo-600">
                              <span>Recovered: Rs. {r.recoveredSoFar.toLocaleString()} / Rs. {r.totalCost.toLocaleString()}</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 transition-all duration-350" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono">
                          <p className="text-slate-900 font-extrabold">Rs. {r.monthlyRecovery.toLocaleString()}/mo</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold mt-1 ${
                            r.status === "Active" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "welfare" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-bold text-slate-800 heading-display">Registered Welfare & Assistance Claims</h4>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                    Module 9 Welfare Audit
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {claims.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-xs">No medical or welfare assistance submissions registered.</p>
                ) : (
                  claims.map(c => (
                    <div key={c.id} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold font-sans">
                      <div className="space-y-1.5 flex-1 min-w-[50%]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-slate-800 font-bold text-sm">Appointed Staff: {c.employeeName}</p>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">({c.employeeId})</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-indigo-600 font-bold inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 text-[10px]">
                            💼 Welfare Aid: {c.claimType}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Reference ID: {c.id}</span>
                        </div>
                        
                        <p className="text-xs text-slate-500 italic font-normal bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 max-w-xl">
                          " {c.description} "
                        </p>

                        {c.approvedBy && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                              ✓ Approved and Remitted by: <strong className="font-semibold">{c.approvedBy}</strong>
                            </span>
                            {c.actionDate && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                on {c.actionDate}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 self-stretch md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-left md:text-right">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Amount Claimed</p>
                          <p className="text-base font-black text-slate-900 font-mono mt-0.5">Rs. {c.amount.toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                            c.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            c.status === "Pending" ? "bg-amber-50 text-amber-750 border-amber-200" :
                            "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {c.status}
                          </span>

                          {c.status === "Pending" && isPrivileged && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleActionClaim(c.id, "Rejected")}
                                className="bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 font-bold px-2 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition border border-rose-150"
                                id={`reject-clm-${c.id}`}
                                title="Reject Welfare Claim"
                              >
                                <X size={12} /> Reject
                              </button>
                              <button
                                onClick={() => handleActionClaim(c.id, "Approved")}
                                className="bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 text-emerald-600 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition border border-emerald-150"
                                id={`approve-clm-${c.id}`}
                                title="Approve Welfare Claim"
                              >
                                <Check size={12} /> Approve
                              </button>
                            </div>
                          )}
                        </div>

                        {c.status === "Approved" && (
                          <div className="hidden md:block text-[9px] text-emerald-600 font-mono text-right font-medium max-w-[150px] leading-tight mt-1">
                            ✓ Cash Disbursed via Ledger
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "bonus" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-bold text-slate-800 heading-display">Corporate scheduled Bonuses</h4>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                    Module 8 Approved Ledger
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {bonuses.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-xs">No bonus payouts compiled.</p>
                ) : (
                  bonuses.map(b => (
                    <div key={b.id} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold">
                      <div className="space-y-1.5 flex-1 min-w-[50%]">
                        <div className="flex items-center gap-2">
                          <p className="text-slate-800 font-bold text-sm">{b.employeeName}</p>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">({b.employeeId})</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-indigo-600 font-bold inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            <Award size={13} /> {b.bonusType} program
                          </span>
                          {b.performanceScore && (
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100 text-[10px] font-mono">
                              ★ GPA Score: {b.performanceScore}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">Assigned. cycle: {b.cycleDate}</span>
                        </div>

                        {b.description && (
                          <p className="text-slate-500 font-normal italic text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 max-w-xl">
                            " {b.description} "
                          </p>
                        )}

                        {b.approvedBy && (
                          <p className="text-[10px] text-emerald-700 font-mono flex items-center gap-1.5 mt-1">
                            <span className="text-slate-400">Action Authorizer:</span> {b.approvedBy}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 self-stretch md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-left md:text-right">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider uppercase">Compensation</p>
                          <p className="text-base font-black text-slate-900 font-mono mt-0.5">Rs. {b.amount.toLocaleString()}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                            b.status === "Disbursed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            b.status === "Approved" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            b.status === "Rejected" ? "bg-rose-50 text-rose-750 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200" // Pending
                          }`}>
                            {b.status === "Pending" ? "Pending Approval" : b.status}
                          </span>

                          {/* Approval Actions Panel for privileged Users */}
                          {b.status === "Pending" && isPrivileged && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleActionBonus(b.id, "Rejected")}
                                className="bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 font-bold px-2 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition border border-rose-150"
                                title="Reject Bonus Payout"
                              >
                                <X size={12} /> Reject
                              </button>
                              <button
                                onClick={() => handleActionBonus(b.id, "Approved")}
                                className="bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 text-emerald-600 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition border border-emerald-150"
                                title="Approve Bonus Payout"
                              >
                                <Check size={12} /> Approve
                              </button>
                            </div>
                          )}

                          {/* Approved state: allows immediate disbursement, or advises automated payroll ingestion */}
                          {b.status === "Approved" && isPrivileged && (
                            <button
                              onClick={() => handleDisburseBonus(b.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] font-sans transition cursor-pointer flex items-center gap-1 shadow-xs"
                              id={`disburse-bonus-${b.id}`}
                              title="Disburse Direct Payment"
                            >
                              <Flame size={12} /> Disburse Direct
                            </button>
                          )}
                        </div>

                        {b.status === "Approved" && (
                          <div className="hidden md:block text-[9px] text-indigo-500 font-mono text-right font-medium max-w-[150px] leading-tight mt-1">
                            ✓ Ingestible via Monthly Payroll
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {repayingAdvance && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Record Direct Cash Repayment</h4>
                <p className="text-xs text-slate-500">Manual cash adjustment for employee {repayingAdvance.employeeName}'s advance ({repayingAdvance.id}).</p>
              </div>
              <button
                type="button"
                onClick={() => setRepayingAdvance(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRepayAdvanceSubmit} className="space-y-4 text-xs font-semibold">
              <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px] text-indigo-400 font-mono uppercase tracking-wider">
                  <span>Gross Advance</span>
                  <span>Balance Due</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800">
                  <span>Rs. {repayingAdvance.requestAmount.toLocaleString()}</span>
                  <span className="text-indigo-600 font-mono">Rs. {(repayingAdvance.requestAmount - (repayingAdvance.recoveredSoFar || 0)).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Repayment Cash Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={(repayingAdvance.requestAmount - (repayingAdvance.recoveredSoFar || 0))}
                  placeholder="Insert payment amount..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Audit Adjustment Comments / Note</label>
                <textarea
                  required
                  placeholder="e.g. Settle early via cash, receipt voucher #4019"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 h-20 placeholder-slate-400"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                />
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRepayingAdvance(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Confirm Payout Repay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
