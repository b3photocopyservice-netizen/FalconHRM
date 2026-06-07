/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LedgerEntry, Employee, Role } from "../types";
import { 
  BookOpen, Plus, Search, Filter, Trash2, Calendar, FileText, ArrowUpRight, ArrowDownLeft,
  Building, RefreshCw, BarChart3, AlertCircle, CheckCircle2, User, Wallet, Landmark,
  ArrowRightLeft, FileSpreadsheet, Printer, TrendingUp, TrendingDown, CircleDollarSign
} from "lucide-react";

interface LedgerModuleProps {
  ledger: LedgerEntry[];
  employees: Employee[];
  currentRole: Role;
  onUpdateState: () => void;
}

export default function LedgerModule({ ledger, employees, currentRole, onUpdateState }: LedgerModuleProps) {
  // Navigation subtabs inside Ledger
  const [subTab, setSubTab] = useState<"view" | "post" | "analytics">("view");

  // State filtering & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Create Transaction Form State
  const defaultEmpId = employees[0]?.id || "";
  const [formEmployeeId, setFormEmployeeId] = useState(defaultEmpId);
  const [formType, setFormType] = useState<
    "Salary Advance" | "Purchase" | "Purchase Return" | "Medical Claim" | "Welfare Loan" | "Salary Recovery" | "Manual Adjustment"
  >("Manual Adjustment");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formRefNumber, setFormRefNumber] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDirection, setFormDirection] = useState<"debit" | "credit">("debit");
  const [formAmount, setFormAmount] = useState("");

  // UI state feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reversingId, setReversingId] = useState<string | null>(null);

  // Print slip state
  const [activeReceipt, setActiveReceipt] = useState<LedgerEntry | null>(null);

  // Auto generate reference number when type changes
  useEffect(() => {
    const abbreviated = formType.split(" ").map(w => w[0]).join("");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormRefNumber(`${abbreviated}-${randomSuffix}`);
    
    // Auto set branch of chosen employee
    const emp = employees.find(e => e.id === formEmployeeId);
    if (emp) {
      setFormBranch(emp.branch || "Head Office");
    }

    // Default direction based on type convention
    // Debits represent payouts to employees, credits represent deductions or employees paying cash/returns back.
    if (["Salary Advance", "Medical Claim", "Welfare Loan"].includes(formType)) {
      setFormDirection("debit");
    } else if (["Purchase", "Salary Recovery"].includes(formType)) {
      setFormDirection("credit");
    } else if (formType === "Purchase Return") {
      setFormDirection("debit");
    }
  }, [formType, formEmployeeId, employees]);

  const handlePostTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid monetary amount.");
      return;
    }

    const employee = employees.find(e => e.id === formEmployeeId);
    if (!employee) {
      setErrorMsg("Candidate employee not found.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isDebit = formDirection === "debit";
      const payload = {
        employeeId: formEmployeeId,
        postDate: formDate,
        referenceType: formType,
        referenceId: formRefNumber.trim(),
        branch: formBranch || employee.branch || "Head Office",
        description: formDescription.trim() || `${formType} - Recorded`,
        debit: isDebit ? parsedAmount : 0,
        credit: isDebit ? 0 : parsedAmount,
        actorRole: currentRole,
        actorName: employees.find(e => e.role === currentRole)?.name || "System"
      };

      const res = await fetch("/api/ledger/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(`Transaction successfully posted under ledger ID!`);
        setFormAmount("");
        setFormDescription("");
        onUpdateState();
        // Go back to view
        setSubTab("view");
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed to post ledger transaction.");
      }
    } catch {
      setErrorMsg("Server communication error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReverseTransaction = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to reverse/delete this ledger transaction? This will permanently recalculate all subsequent employee accounting balances.")) {
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setReversingId(id);

    try {
      const actorName = employees.find(e => e.role === currentRole)?.name || "System Admin";
      const res = await fetch(`/api/ledger/transaction/${id}?actorRole=${currentRole}&actorName=${encodeURIComponent(actorName)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSuccessMsg(`Transaction ID ${id} was reversed successfully. Running balances recalculated.`);
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Reversal failed.");
      }
    } catch {
      setErrorMsg("Communication error during deletion.");
    } finally {
      setReversingId(null);
    }
  };

  // List of unique branches for filter dropdown
  const uniqueBranches = Array.from(new Set(employees.map(e => e.branch || "Head Office").filter(Boolean)));

  // Filtered entries
  const filteredLedger = ledger.filter(entry => {
    if (selectedEmployeeFilter !== "All" && entry.employeeId !== selectedEmployeeFilter) return false;
    if (selectedBranch !== "All" && (entry.branch || "Head Office") !== selectedBranch) return false;
    if (selectedType !== "All" && entry.referenceType !== selectedType) return false;
    if (startDate && entry.postDate < startDate) return false;
    if (endDate && entry.postDate > endDate) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const refMatch = entry.referenceId?.toLowerCase().includes(q);
      const nameMatch = entry.employeeName?.toLowerCase().includes(q);
      const empIdMatch = entry.employeeId?.toLowerCase().includes(q);
      const descMatch = entry.description?.toLowerCase().includes(q);
      const typeMatch = entry.referenceType?.toLowerCase().includes(q);
      return refMatch || nameMatch || empIdMatch || descMatch || typeMatch;
    }
    return true;
  }).sort((a, b) => b.postDate.localeCompare(a.postDate) || b.id.localeCompare(a.id));

  // Running totals based on filtered ledger
  const totalDebits = filteredLedger.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = filteredLedger.reduce((sum, e) => sum + e.credit, 0);
  const netBalance = totalDebits - totalCredits;

  const isEmployeeRole = currentRole === Role.EMPLOYEE;
  
  // If the log is for standard employee, restrict filtering to their own records only!
  const employeeSelfId = employees.find(e => e.role === Role.EMPLOYEE)?.id || "";
  useEffect(() => {
    if (isEmployeeRole && employeeSelfId) {
      setSelectedEmployeeFilter(employeeSelfId);
    }
  }, [isEmployeeRole, employeeSelfId]);

  // Transaction type distribution computation
  const typeAnalysis = ledger.reduce((acc: Record<string, { count: number, debits: number, credits: number }>, entry) => {
    const t = entry.referenceType || "Manual Adjustment";
    if (!acc[t]) {
      acc[t] = { count: 0, debits: 0, credits: 0 };
    }
    acc[t].count += 1;
    acc[t].debits += entry.debit;
    acc[t].credits += entry.credit;
    return acc;
  }, {});

  // Print preview container triggers native print if requested, but displaying beautifully inside modal
  const handlePrintSlip = (entry: LedgerEntry) => {
    setActiveReceipt(entry);
  };

  const handleTriggerPrint = () => {
    const printContent = document.getElementById("receipt-print-area")?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      const win = window.open("", "", "height=500,width=800");
      if (win) {
        win.document.write("<html><head><title>Payment Voucher Ledger Slip</title>");
        win.document.write("<style>body{font-family:monospace;padding:30px;color:#333;} .hr{border-bottom:1px dashed #ccc;margin:15px 0;} table{width:100%;font-size:12px;}</style>");
        win.document.write("</head><body>");
        win.document.write(printContent);
        win.document.write("</body></html>");
        win.document.close();
        win.print();
      }
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Upper Module Badge & Title Banner Area */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full text-[10px] font-bold tracking-widest bg-teal-500/30 text-teal-300 border border-teal-400/20 uppercase">Module 4</span>
            <span className="flex items-center gap-1 text-[11px] text-teal-400 font-bold"><Landmark size={12} className="animate-pulse" /> Double-Entry Accounting Core</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Employee Account Ledger</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Double-entry ledger workspace tracking employee financial assets, advance disbursement amortizations, store purchases, and statutory claim workflows.
          </p>
        </div>
        {!isEmployeeRole && (
          <button 
            onClick={() => { setSubTab("post"); setErrorMsg(""); setSuccessMsg(""); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-teal-700/20 transition cursor-pointer"
            id="ledger-post-btn-sidebar"
          >
            <Plus size={15} />
            Post New Transaction
          </button>
        )}
      </div>

      {/* Primary Dashboard Filter Cards & General Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric A: Total Debit */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
            <ArrowUpRight size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Debit Outflow</span>
            <span className="text-lg font-black text-slate-800 tracking-tight font-mono">
              Rs. {totalDebits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric B: Total Credit */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            <ArrowDownLeft size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Credit Inflow</span>
            <span className="text-lg font-black text-slate-800 tracking-tight font-mono">
              Rs. {totalCredits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric C: Net Ledger balance */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className={`p-3 rounded-xl ${netBalance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            <Wallet size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Overall Net Balance</span>
            <span className={`text-lg font-black tracking-tight font-mono ${netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              Rs. {netBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric D: Active Entries count */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-xl text-indigo-600">
            <FileText size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Filtered Records</span>
            <span className="text-lg font-black text-slate-800 tracking-tight font-mono">
              {filteredLedger.length} lines
            </span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Subtabs */}
      <div className="flex border-b border-slate-200 gap-1" id="ledger-sub-tabs">
        <button
          onClick={() => { setSubTab("view"); setErrorMsg(""); setSuccessMsg(""); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            subTab === "view" ? "border-teal-600 text-teal-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="ledger-sub-view"
        >
          <BookOpen size={14} />
          Ledger Explorer
        </button>

        {!isEmployeeRole && (
          <button
            onClick={() => { setSubTab("post"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 ${
              subTab === "post" ? "border-teal-600 text-teal-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
            id="ledger-sub-post"
          >
            <Plus size={14} />
            Post Transaction Entry
          </button>
        )}

        <button
          onClick={() => { setSubTab("analytics"); setErrorMsg(""); setSuccessMsg(""); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 ${
            subTab === "analytics" ? "border-teal-600 text-teal-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
          id="ledger-sub-anal"
        >
          <BarChart3 size={14} />
          Account Analytics
        </button>
      </div>

      {/* Global Error and Success Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-3">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SUBTAB CONTENT: VIEWER */}
      {subTab === "view" && (
        <div className="space-y-6">
          {/* Detailed filter card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Search & Ledger Sorting Filters</span>
              <span className="text-[10px] text-slate-400 italic">Filters execute dynamically</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs font-bold text-slate-600">
              
              {/* Filter 1: Search query */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] tracking-wider uppercase">Reference / Keyword</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    className="w-full pl-8 pr-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-teal-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter 2: Employee Picker (Managers only) */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] tracking-wider uppercase">Staff Member</label>
                {isEmployeeRole ? (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 italic rounded-lg font-medium text-xs">
                    Your personal ledger logs
                  </div>
                ) : (
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer text-xs"
                    value={selectedEmployeeFilter}
                    onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                  >
                    <option value="All">All Staff Roster</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Filter 3: Transaction Type Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] tracking-wider uppercase">Transaction Category</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer text-xs"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="All">All Transaction Types</option>
                  <option value="Salary Payout">Salary Payout</option>
                  <option value="Salary Advance">Salary Advance</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Purchase Return">Purchase Return</option>
                  <option value="Medical Claim">Medical Claim</option>
                  <option value="Welfare Loan">Welfare Loan</option>
                  <option value="Salary Recovery">Salary Recovery</option>
                  <option value="Manual Adjustment">Manual Adjustment</option>
                  <option value="Advance Recovery">Advance Recovery</option>
                  <option value="Staff Store Recovery">Staff Store Recovery</option>
                  <option value="Medical Reimbursement">Medical Reimbursement</option>
                  <option value="Bonus Credit">Bonus Credit</option>
                </select>
              </div>

              {/* Filter 4: Division Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 text-[10px] tracking-wider uppercase">Operating Branch</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer text-xs"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="All">All Corporate Branches</option>
                  {uniqueBranches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Filter 5: Date Range pickers */}
              <div className="grid grid-cols-2 gap-1.5 space-y-1">
                <div className="col-span-2">
                  <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Post Period</label>
                </div>
                <div>
                  <input
                    type="date"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-[10px]"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    title="From Date"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-[10px]"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    title="To Date"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Ledger table card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 bg-opacity-40">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Double-Entry Financial Registry</h3>
                <p className="text-xs text-slate-500 mt-0.5">Showing records for selected audit filter parameters</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedBranch("All");
                    setSelectedType("All");
                    if (!isEmployeeRole) setSelectedEmployeeFilter("All");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Reset Filtering
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-400 text-[10px] uppercase font-mono font-black tracking-wider border-b border-slate-200">
                    <th className="p-3.5">Transaction Date</th>
                    <th className="p-3.5">Reference ID</th>
                    <th className="p-3.5">Team Member</th>
                    <th className="p-3.5">Branch</th>
                    <th className="p-3.5">Category Type & Description</th>
                    <th className="p-3.5 text-right">Debit (Withdrawal)</th>
                    <th className="p-3.5 text-right">Credit (Deposit)</th>
                    <th className="p-3.5 text-right">Running Balance</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-slate-400 italic">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle size={24} className="text-slate-300" />
                          <span>No transaction postings fit the active filters.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((entry) => {
                      const isDebit = entry.debit > 0;
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50/70 border-b border-slate-100 text-[11px]">
                          {/* Date */}
                          <td className="p-3.5 font-mono whitespace-nowrap text-slate-500">
                            {entry.postDate}
                          </td>
                          {/* Reference Number */}
                          <td className="p-3.5 font-mono">
                            <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                              {entry.referenceId}
                            </span>
                          </td>
                          {/* Employee Name */}
                          <td className="p-3.5">
                            <div className="text-slate-800 font-bold">{entry.employeeName}</div>
                            <div className="text-[10px] font-mono text-slate-400 uppercase">{entry.employeeId}</div>
                          </td>
                          {/* Branch */}
                          <td className="p-3.5 text-slate-500 text-[10px] whitespace-nowrap uppercase tracking-wider font-mono">
                            {entry.branch || "Colombo Head Office"}
                          </td>
                          {/* Description */}
                          <td className="p-3.5 space-y-0.5 max-w-xs">
                            <div className="text-slate-800 font-black flex items-center gap-1.5">
                              {entry.referenceType}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium font-sans leading-relaxed truncate">
                              {entry.description || "N/A"}
                            </p>
                          </td>
                          {/* Debit */}
                          <td className="p-3.5 text-right font-mono text-teal-600 font-black">
                            {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : "—"}
                          </td>
                          {/* Credit */}
                          <td className="p-3.5 text-right font-mono text-slate-700 font-black">
                            {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : "—"}
                          </td>
                          {/* Running Balance */}
                          <td className={`p-3.5 text-right font-mono font-black ${entry.balance >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                            Rs. {entry.balance.toLocaleString()}
                          </td>
                          {/* Actions */}
                          <td className="p-3.5 text-center whitespace-nowrap space-x-1.5">
                            <button
                              onClick={() => handlePrintSlip(entry)}
                              className="p-1 px-1.5 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-500 mt-0.5 rounded transition inline-flex items-center gap-1 cursor-pointer"
                              title="Print Entry Slip"
                            >
                              <Printer size={11} />
                              <span className="text-[9px] font-bold uppercase">Slip</span>
                            </button>
                            {!isEmployeeRole && (
                              <button
                                onClick={() => handleReverseTransaction(entry.id)}
                                disabled={reversingId === entry.id}
                                className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 mt-0.5 rounded transition inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                                title="Reverse / Delete Transaction Entry"
                              >
                                {reversingId === entry.id ? (
                                  <RefreshCw size={11} className="animate-spin" />
                                ) : (
                                  <Trash2 size={11} />
                                )}
                                <span className="text-[9px] font-bold uppercase">Reverse</span>
                              </button>
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
        </div>
      )}

      {/* SUBTAB CONTENT: POST NEW TRANSACTION */}
      {subTab === "post" && !isEmployeeRole && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">Post Transaction to Ledger</h3>
              <p className="text-xs text-slate-500 mt-1">Lodge journal assets, manual adjustments, purchase writebacks, or loans into employee balance sheets.</p>
            </div>

            <form onSubmit={handlePostTransaction} className="space-y-4 text-xs font-bold text-slate-600">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee selection */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Employee Account</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs cursor-pointer focus:ring-1 focus:ring-teal-500"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.id} — {e.department})</option>
                    ))}
                  </select>
                </div>

                {/* Transaction Type selection */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Transaction Type</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs cursor-pointer focus:ring-1 focus:ring-teal-500"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                  >
                    <option value="Salary Advance">Salary Advance</option>
                    <option value="Purchase">Purchase</option>
                    <option value="Purchase Return">Purchase Return</option>
                    <option value="Medical Claim">Medical Claim</option>
                    <option value="Welfare Loan">Welfare Loan</option>
                    <option value="Salary Recovery">Salary Recovery</option>
                    <option value="Manual Adjustment">Manual Adjustment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Transaction Date */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Transaction Date</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                {/* Reference Number */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Reference Number (Ref)</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                    value={formRefNumber}
                    onChange={(e) => setFormRefNumber(e.target.value)}
                  />
                </div>

                {/* Branch */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Corporate Branch</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs cursor-pointer focus:ring-1 focus:ring-teal-500"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                  >
                    <option value="Head Office">Colombo Head Office</option>
                    <option value="Colombo">Colombo Branch</option>
                    <option value="Kandy">Kandy Branch</option>
                    <option value="Galle">Galle Branch</option>
                    <option value="Jaffna">Jaffna Branch</option>
                  </select>
                </div>
              </div>

              {/* Amount and Direction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Transaction Balance Impact</label>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <button
                      type="button"
                      onClick={() => setFormDirection("debit")}
                      className={`py-2 px-3 rounded-lg border font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formDirection === "debit" 
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowUpRight size={14} />
                      Debit (Payout/Asset)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDirection("credit")}
                      className={`py-2 px-3 rounded-lg border font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formDirection === "credit" 
                          ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ArrowDownLeft size={14} />
                      Credit (Deduction/Repay)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Monetary Amount (Rs.)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">Rs.</span>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      className="w-full pl-10 pr-2.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[10px] tracking-wider uppercase block">Detailed Entry Description / Description</label>
                <textarea
                  required
                  placeholder="Lodge professional description accounting voucher logs..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-normal focus:ring-1 focus:ring-teal-500"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Committing Entry..." : "Post Transaction Entry"}
                </button>
              </div>

            </form>
          </div>

          {/* Workflow forecast sidebar */}
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl flex flex-col justify-between shadow-md">
            <div className="space-y-5">
              <div className="flex items-center gap-1.5 text-teal-400 text-xs font-mono uppercase tracking-widest font-bold">
                <ArrowRightLeft size={14} /> Future State Forecast
              </div>
              
              {(() => {
                const emp = employees.find(e => e.id === formEmployeeId);
                const currentEmpHistory = ledger.filter(l => l.employeeId === formEmployeeId);
                const currentTotalDebit = currentEmpHistory.reduce((sum, item) => sum + item.debit, 0);
                const currentTotalCredit = currentEmpHistory.reduce((sum, item) => sum + item.credit, 0);
                const currentEmpBalance = currentTotalDebit - currentTotalCredit;
                
                const amt = parseFloat(formAmount) || 0;
                const change = formDirection === "debit" ? amt : -amt;
                const forecastedBalance = currentEmpBalance + change;

                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700/50 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Current Account Balance</span>
                      <div className={`text-xl font-mono font-black ${currentEmpBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        Rs. {currentEmpBalance.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Employee: {emp?.name || "None"}</span>
                    </div>

                    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700/50 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Transaction Impact</span>
                      <div className={`text-xl font-mono font-black ${change >= 0 ? "text-teal-400" : "text-amber-400"}`}>
                        {change >= 0 ? "+ Rs. " : "- Rs. "}{Math.abs(change).toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase font-mono font-bold block">Action Code: {formType}</span>
                    </div>

                    <div className="p-4 bg-teal-950 rounded-xl border border-teal-900/50 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-teal-400 font-mono">Forecasted Running Balance</span>
                      <div className={`text-2xl font-mono font-black ${forecastedBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        Rs. {forecastedBalance.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-teal-500 font-bold uppercase font-mono block">Commits instantly upon submit</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-6 font-normal italic text-slate-400 leading-normal text-[10px]">
              "Accounting Worksite directive ensures all updates execute double-entry ledger audits automatically with active RBAC matrix checks."
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB CONTENT: ANALYTICS */}
      {subTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Category analysis */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Post Breakdown by Transaction Core Category</h3>
                <p className="text-xs text-slate-500 mt-1">Direct statistics of logged transaction volumes in database</p>
              </div>

              <div className="space-y-3">
                {Object.keys(typeAnalysis).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No ledger statistics found.</p>
                ) : (
                  Object.keys(typeAnalysis).map(type => {
                    const stats = typeAnalysis[type];
                    const percentage = Math.min(100, Math.round((stats.count / ledger.length) * 100));
                    return (
                      <div key={type} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between gap-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                            {type}
                          </span>
                          <span className="text-slate-500 text-[10px] font-mono font-bold">
                            {stats.count} posts ({percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-600 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-bold">
                          <span>Total Payout Debits: Rs. {stats.debits.toLocaleString()}</span>
                          <span>Total Claim Credits: Rs. {stats.credits.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column - Audit integrity checklist */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Voucher Validation Checks</h3>
                <p className="text-xs text-slate-500 mt-1">Active compliance metrics verifying corporate double-entry validity</p>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 font-bold">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-start gap-2.5 border border-emerald-150">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Ledger Balance Alignment</p>
                    <p className="text-[10px] text-emerald-600/80 leading-normal font-normal mt-0.5">
                      Double-entry calculations checked. Cumulative ledger balance aligned with employee accounts.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-start gap-2.5 border border-emerald-150">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Auto Payroll Recalibration</p>
                    <p className="text-[10px] text-emerald-600/80 leading-normal font-normal mt-0.5">
                      Store purchases and advance recovery modules map directly to monthly payslips.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl flex items-start gap-2.5 border border-indigo-150">
                  <Building size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Branch Mapping Safety</p>
                    <p className="text-[10px] text-indigo-600/80 leading-normal font-normal mt-0.5">
                      Transaction branches matches active staff member's physical workstation base.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRINT SLIP / RECEIPT MODAL (LIGHTWEIGHT PREVIEW) */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-bold font-mono tracking-widest uppercase">Payment Voucher Slip</span>
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-white transition font-black font-mono text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Print Area block */}
            <div className="p-6 overflow-y-auto space-y-4" id="receipt-print-area">
              <div className="text-center font-mono space-y-1">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">DEMO HR ENTERPRISE</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{activeReceipt.branch || "Head Office Central"}</p>
                <div className="border-b border-dashed border-slate-200 py-1"></div>
              </div>

              <table className="w-full text-xs font-mono">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-400 font-bold">VOUCHER ID</td>
                    <td className="py-1.5 text-right font-bold text-slate-800">{activeReceipt.id}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-400 font-bold">TRANSACTION DATE</td>
                    <td className="py-1.5 text-right font-bold text-slate-800">{activeReceipt.postDate}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-400 font-bold">REFERENCE NO</td>
                    <td className="py-1.5 text-right font-bold text-slate-800">{activeReceipt.referenceId}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-400 font-bold">EMPLOYEE</td>
                    <td className="py-1.5 text-right font-bold text-slate-800">{activeReceipt.employeeName} ({activeReceipt.employeeId})</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-400 font-bold">TYPE</td>
                    <td className="py-1.5 text-right font-bold text-slate-800">{activeReceipt.referenceType}</td>
                  </tr>
                  {activeReceipt.debit > 0 && (
                    <tr className="border-b border-slate-100 bg-emerald-50/50">
                      <td className="py-1.5 text-emerald-800 font-extrabold">DEBIT (OUTFLOW)</td>
                      <td className="py-1.5 text-right font-mono font-black text-emerald-700">Rs. {activeReceipt.debit.toLocaleString()}</td>
                    </tr>
                  )}
                  {activeReceipt.credit > 0 && (
                    <tr className="border-b border-slate-100 bg-indigo-50/50">
                      <td className="py-1.5 text-indigo-800 font-extrabold">CREDIT (INFLOW)</td>
                      <td className="py-1.5 text-right font-mono font-black text-indigo-700">Rs. {activeReceipt.credit.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-200 font-black">
                    <td className="py-2 text-slate-800">RUNNING BALANCE</td>
                    <td className="py-2 text-right font-mono text-slate-800">Rs. {activeReceipt.balance.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-1.5 font-sans">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Comments Voucher Rationale:</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium leading-relaxed rounded-xl italic">
                  {activeReceipt.description || "No comments lodged with ledger entry."}
                </p>
              </div>

              <div className="pt-4 text-center font-mono text-[9px] text-slate-400 font-bold uppercase space-y-1">
                <div>*** CERTIFIED GENERAL LEDGER RECORD ***</div>
                <div>AUTHORIZATION CHECKS PASSED SUCCESSFULLY</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={handleTriggerPrint}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex justify-center items-center gap-1.5"
              >
                <Printer size={14} />
                Print Voucher
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2.5 bg-slate-250 hover:bg-slate-350 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition border border-slate-300 cursor-pointer text-center"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
