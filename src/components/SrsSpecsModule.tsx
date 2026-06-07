import React, { useState } from "react";
import { Role } from "../types";
import {
  BookOpen,
  Database,
  Terminal,
  Cpu,
  Calculator,
  Server,
  Workflow,
  Copy,
  Check,
  Code,
  CheckCircle2,
  Lock,
  GitBranch,
  FileText
} from "lucide-react";

export default function SrsSpecsModule() {
  const [activeSubTab, setActiveSubTab] = useState<"architecture" | "database" | "api" | "payroll" | "security" | "devops">("architecture");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // States for Payroll Calculation Simulator
  const [baseSalary, setBaseSalary] = useState<number>(150000);
  const [allowance, setAllowance] = useState<number>(25000);
  const [overtime, setOvertime] = useState<number>(12000);
  const [bonus, setBonus] = useState<number>(15000);
  const [advanceDeduct, setAdvanceDeduct] = useState<number>(10000);
  const [storeDeduct, setStoreDeduct] = useState<number>(5000);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Statutory math calculator based on SRS Specifications
  const calcGross = baseSalary + allowance + overtime + bonus;
  const calcEpfEmployee = Math.round(baseSalary * 0.12 * 100) / 100;
  const calcEpfEmployer = Math.round(baseSalary * 0.15 * 100) / 100;
  const calcEtfEmployer = Math.round(baseSalary * 0.03 * 100) / 100;

  // Sri Lankan Inland Revenue Progressive APIT Tax Scale equivalent
  const calculateApit = (salary: number) => {
    if (salary <= 100000) return 0;
    if (salary <= 141667) return (salary - 100000) * 0.06;
    if (salary <= 183333) return 2500 + (salary - 141667) * 0.12;
    if (salary <= 225000) return 7500 + (salary - 183333) * 0.18;
    if (salary <= 266667) return 15000 + (salary - 225000) * 0.24;
    return 25000 + (salary - 266667) * 0.30;
  };

  const calcApit = Math.round(calculateApit(baseSalary) * 100) / 100;
  const totalDeduct = calcEpfEmployee + calcApit + advanceDeduct + storeDeduct;
  const calcNet = calcGross - totalDeduct;

  // Selected API payload item state
  const [selectedEndpoint, setSelectedEndpoint] = useState<"createStaff" | "leaveRequest" | "approveLeave" | "lockPayroll" | "auditLog">("createStaff");

  const apiSpecs = {
    createStaff: {
      method: "POST",
      route: "/api/employees",
      desc: "Registers and appoints a new corporate employee profile inside active rolls.",
      rules: [
        "name: String, required. Valid length between 2 and 150 characters.",
        "baseSalary: Decimal, must be positive.",
        "role: Enum constraint, must match predefined core permissions sets."
      ],
      payload: JSON.stringify(
        {
          name: "Arjun Wijesinghe",
          designation: "Staff Engineer L2",
          department: "Engineering",
          baseSalary: 245000,
          role: "EMPLOYEE",
          status: "Active"
        },
        null,
        2
      ),
      response: JSON.stringify(
        {
          message: "Employee appointed successfully",
          employee: {
            id: "EMP-384918",
            name: "Arjun Wijesinghe",
            designation: "Staff Engineer L2",
            department: "Engineering",
            baseSalary: 245000,
            role: "EMPLOYEE",
            status: "Active"
          }
        },
        null,
        2
      )
    },
    leaveRequest: {
      method: "POST",
      route: "/api/leaves",
      desc: "Applies for a short term casual/annual leave request with validation rules.",
      rules: [
        "employeeId: FK references employee id directly.",
        "startDate / endDate: Standard YYYY-MM-DD timelines.",
        "Duration validation: Start date must precede or equal end date."
      ],
      payload: JSON.stringify(
        {
          employeeId: "EMP-384918",
          startDate: "2026-06-10",
          endDate: "2026-06-15",
          type: "Annual",
          comments: "Sabbatical family leave"
        },
        null,
        2
      ),
      response: JSON.stringify(
        {
          message: "Leave application recorded",
          leave: {
            id: "LV-194058",
            employeeId: "EMP-384918",
            employeeName: "Arjun Wijesinghe",
            startDate: "2026-06-10",
            endDate: "2026-06-15",
            days: 5,
            type: "Annual",
            status: "Pending",
            managerApproval: "Pending",
            hrApproval: "Pending"
          }
        },
        null,
        2
      )
    },
    approveLeave: {
      method: "PUT",
      route: "/api/leaves/:id",
      desc: "Updates multi-stage leave approvals. Resolves statuses securely.",
      rules: [
        "action: Must fit workflow parameters (ManagerApprove, ManagerReject, HrApprove, HrReject)",
        "Write Audit Interceptor: Saves previous and upcoming states."
      ],
      payload: JSON.stringify(
        {
          action: "HrApprove",
          actorName: "Dilshan Fernando",
          actorRole: "HR_MANAGER",
          comments: "Cleared by HR Management"
        },
        null,
        2
      ),
      response: JSON.stringify(
        {
          message: "Leave decision recorded successfully",
          leave: {
            id: "LV-194058",
            status: "Approved",
            hrApproval: "Approved",
            hrApprovedBy: "Dilshan Fernando",
            hrApprovedAt: "2026-06-06T08:15:30Z"
          }
        },
        null,
        2
      )
    },
    lockPayroll: {
      method: "POST",
      route: "/api/payroll/:id/lock",
      desc: "Locks pay slips, preventing adjustments and logging to ledger accounts.",
      rules: [
        "No body parameter needed. Triggered via localized API keys.",
        "Double-entry creation: Writes matching debit records securely."
      ],
      payload: "// Path parameters carry structural context",
      response: JSON.stringify(
        {
          message: "Payslip locked and ledger posted",
          payslip: {
            id: "PAY-702319",
            status: "Locked",
            netSalary: 185002.5
          },
          ledgerEntry: {
            id: "LED-91048",
            type: "Debit",
            category: "Payroll Payout",
            amount: 185002.5,
            referenceId: "PAY-702319",
            description: "Posted salary payment for pay cycle 2026-06 of Arjun Wijesinghe"
          }
        },
        null,
        2
      )
    },
    auditLog: {
      method: "POST",
      route: "/api/audit-logs",
      desc: "Appends highly validated, tamper-proof logs with state diffs.",
      rules: [
        "actorRole / actorName: Context tags captured from session cookies.",
        "oldValue / newValue: Serialized JSON blocks containing state details."
      ],
      payload: JSON.stringify(
        {
          actorRole: "SUPER_ADMIN",
          actorName: "Security Director",
          module: "Authentication Gate",
          action: "Login",
          details: "Staff operator successfully passed complex 2FA / JWT challenge clearance",
          oldValue: "No Active Session (Guest Node)",
          newValue: "Active JWT Session Token ID: \"JWT-SEC-920\"",
          ipAddress: "192.168.10.42"
        },
        null,
        2
      ),
      response: JSON.stringify(
        {
          success: true,
          log: {
            id: "AUD-910481",
            timestamp: "2026-06-06T08:15:00Z",
            actorRole: "SUPER_ADMIN",
            actorName: "Security Director",
            module: "Authentication Gate",
            action: "Login",
            details: "Staff operator successfully passed complex 2FA / JWT challenge clearance",
            status: "Success",
            ipAddress: "192.168.10.42",
            oldValue: "No Active Session (Guest Node)",
            newValue: "Active JWT Session Token ID: \"JWT-SEC-920\""
          }
        },
        null,
        2
      )
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <span className="bg-indigo-600/30 text-indigo-400 font-mono text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-indigo-505/20 inline-block">
            Enterprise Deliverable Spec
          </span>
          <h2 className="text-2xl font-black tracking-tight leading-tight uppercase heading-display">
            Interactive SRS Specification Board
          </h2>
          <p className="text-xs text-slate-350 max-w-2xl leading-relaxed">
            A comprehensive, modular Software Requirements Specification (SRS) mapping our database indexes, 3-tier architecture pipelines, REST services patterns, statutory tax engines, and deployment structures in real-time.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <a
            href="/SRS.md"
            target="_blank"
            download="SRS.md"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-505 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/15 transition cursor-pointer"
          >
            <BookOpen size={14} />
            Export Raw SRS.md
          </a>
        </div>
      </div>

      {/* Mini Tabs Selector */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1 scrollbar-thin">
        {[
          { id: "architecture", label: "System Architecture", icon: Cpu },
          { id: "database", label: "Database Design & ERD", icon: Database },
          { id: "api", label: "API Design & Payload", icon: Terminal },
          { id: "payroll", label: "Payroll Engine Workbench", icon: Calculator },
          { id: "security", label: "Security & Ledger Gates", icon: Lock },
          { id: "devops", label: "DevOps & Deployment", icon: Server }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition border-b-2 cursor-pointer ${
                isSelected
                  ? "border-indigo-600 text-indigo-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TAB CONTENTS */}

      {/* 1. SYSTEM ARCHITECTURE & TOPOLOGY */}
      {activeSubTab === "architecture" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-6">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Cpu className="text-indigo-600" size={16} />
              3-Tier Monolith Layer Topology
            </h3>

            {/* ASCII flow map styled with CSS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-slate-200 leading-snug space-y-4">
              <div className="border border-indigo-500/30 bg-indigo-950/40 p-3 rounded-lg text-center relative">
                <span className="absolute top-1.5 left-2 text-[8px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">CLIENT TIER</span>
                <span className="font-bold text-indigo-400">React JS Client App</span>
                <p className="text-[10px] text-slate-400 mt-1">Interacts with local browser DOM | Switches Role contexts</p>
              </div>

              <div className="text-center text-slate-505 py-0.5">▼ JSON API Over HTTPS Transport Connection</div>

              <div className="border border-purple-500/30 bg-purple-950/40 p-3 rounded-lg text-center relative">
                <span className="absolute top-1.5 left-2 text-[8px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-bold">API CONTROLLER TIER</span>
                <span className="font-bold text-purple-400">Express App Router (server.ts)</span>
                <p className="text-[10px] text-slate-400 mt-1">Validates payload schemas | Implements Write Interceptors</p>
              </div>

              <div className="text-center text-slate-505 py-0.5">▼ Strict Double-Entry Memory Commits</div>

              <div className="border border-emerald-500/30 bg-emerald-950/40 p-3 rounded-lg text-center relative">
                <span className="absolute top-1.5 left-2 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">DATA STORE TIER</span>
                <span className="font-bold text-emerald-400">In-Memory Thread-Safe Ledger (JSON arrays)</span>
                <p className="text-[10px] text-slate-400 mt-1">Indexes relationships | Preserves state consistency</p>
              </div>
            </div>

            <p className="text-xs text-slate-550 leading-relaxed">
              Every request entering this system is strictly audited. When clicking and switching between personas (e.g., Cashier, HR Director), the app triggers automatic session cookies clearance and writes authentication logout/login pairs securely to the backend logs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Workflow className="text-indigo-600" size={16} />
              Core Routing Modules
            </h3>
            <div className="space-y-3">
              {[
                { title: "Personnel Registry Directory", text: "Maintains official corporate roles and soft deletion indexes.", role: "HR_MANAGER" },
                { title: "Attendance & Shifts Tracker", text: "Compiles check-in/checkout timestamps to calculate late hours.", role: "SUPER_ADMIN" },
                { title: "Leaves & Furloughs Decision Tree", text: "Facilitates multi-stage approvals by Manager followed by HR.", role: "BRANCH_MANAGER" },
                { title: "Payroll Ledger Posting Engine", text: "Calculates taxes and automatically debits salary vouchers.", role: "PAYROLL_OFFICER" }
              ].map((m, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <div className="h-6 w-6 rounded bg-indigo-50 text-indigo-600 text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-[11px] font-sans">{m.title}</h4>
                    <p className="text-[10px] text-slate-505 mt-0.5">{m.text}</p>
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-200/55 px-1.5 py-0.2 rounded mt-1.5 inline-block">
                      Primary: {m.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. DATABASE DESIGN & ERD */}
      {activeSubTab === "database" && (
        <div className="space-y-6">
          {/* Conceptual Table Relations ERD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Database className="text-indigo-600" size={16} />
              Enterprise Entity Relations Mapping
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              Our relational database structure is designed to guarantee high-performance lookup and ledger balances. Every table corresponds to strict, typed TypeScript definitions:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px]">
              {/* Table Employee */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                <span className="text-indigo-600 font-extrabold block border-b border-slate-200 pb-1">🗂️ Table: employees</span>
                <ul className="space-y-1 text-slate-600">
                  <li><strong className="text-slate-800">id</strong> (PK / String)</li>
                  <li><strong>employeeCode</strong> (String / Key)</li>
                  <li><strong>name</strong> (String / Name lookup)</li>
                  <li><strong>baseSalary</strong> (Decimal)</li>
                  <li><strong>department</strong> (String)</li>
                  <li><strong>status</strong> (Enum / Active, On Leave)</li>
                  <li><strong>isDeleted</strong> (Boolean / Filter)</li>
                </ul>
              </div>

              {/* Table Attendance */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                <span className="text-emerald-650 font-extrabold block border-b border-slate-200 pb-1">⏰ Table: attendance</span>
                <ul className="space-y-1 text-slate-600">
                  <li><strong className="text-slate-800">id</strong> (PK)</li>
                  <li><strong>employeeId</strong> (FK REFERENCES e.id)</li>
                  <li><strong>date</strong> (String YYYY-MM-DD)</li>
                  <li><strong>clockIn</strong> (String / ISO Timestamp)</li>
                  <li><strong>clockOut</strong> (String / Nullable)</li>
                  <li><strong>status</strong> (Enum / Present, Late)</li>
                </ul>
              </div>

              {/* Table Ledger Entry */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                <span className="text-amber-600 font-extrabold block border-b border-slate-200 pb-1">📓 Table: ledger_entries</span>
                <ul className="space-y-1 text-slate-600">
                  <li><strong className="text-slate-800">id</strong> (PK)</li>
                  <li><strong>postDate</strong> (String / ISO)</li>
                  <li><strong>referenceId</strong> (UUID link lookup)</li>
                  <li><strong>debit</strong> (Decimal value)</li>
                  <li><strong>credit</strong> (Decimal value)</li>
                  <li><strong>balance</strong> (Cumulative state)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Database Indexes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <Code className="text-indigo-600" size={16} />
                Strategic SQL Indexes and Constraints
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Target Engine: PostgreSQL / Relational</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50">
                    <th className="py-2.5 px-3">Index Identifier</th>
                    <th className="py-2.5 px-3">Table target</th>
                    <th className="py-2.5 px-3">Keys mapped</th>
                    <th className="py-2.5 px-3">Optimization Goal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr>
                    <td className="py-3 px-3 font-mono text-indigo-600">idx_employees_status_deleted</td>
                    <td className="py-3 px-3">employees</td>
                    <td className="py-3 px-3 font-mono text-slate-500">(status, isDeleted)</td>
                    <td className="py-3 px-3">Accelerates HR directory lists, keeping trash items decoupled.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono text-indigo-600">idx_attendance_emp_date</td>
                    <td className="py-3 px-3">attendance</td>
                    <td className="py-3 px-3 font-mono text-slate-500">(employeeId, date)</td>
                    <td className="py-3 px-3">Speeds up daily checkout validation rules checks.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono text-indigo-600">idx_payslips_month</td>
                    <td className="py-3 px-3">payslips</td>
                    <td className="py-3 px-3 font-mono text-slate-500">(month)</td>
                    <td className="py-3 px-3">Enables lightning fast monthly tax & cost aggregated analytics.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono text-indigo-600">idx_ledger_ref</td>
                    <td className="py-3 px-3">ledger_entries</td>
                    <td className="py-3 px-3 font-mono text-slate-500">(referenceId)</td>
                    <td className="py-3 px-3">Optimizes reverse-query trace reports linking back from vouchers.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. API DESIGN PLAYGROUND */}
      {activeSubTab === "api" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs lg:col-span-1 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2 mb-3">
              <Terminal className="text-indigo-600" size={16} />
              API Endpoints Matrix
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Click any API route segment to explore its strict JSON payloads, input types, and active validation policies:
            </p>

            <div className="space-y-2">
              {[
                { id: "createStaff", method: "POST", path: "/api/employees", label: "Appoint Staff Info" },
                { id: "leaveRequest", method: "POST", path: "/api/leaves", label: "Submit Leave Request" },
                { id: "approveLeave", method: "PUT", path: "/api/leaves/:id", label: "Decision Workflow" },
                { id: "lockPayroll", method: "POST", path: "/api/payroll/:id/lock", label: "Freeze Ledger Slip" },
                { id: "auditLog", method: "POST", path: "/api/audit-logs", label: "Commit Audit Entry" }
              ].map(ep => (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep.id as any)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-1 cursor-pointer ${
                    selectedEndpoint === ep.id
                      ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                      : "bg-white border-slate-150 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      ep.method === "POST" ? "bg-emerald-100 text-emerald-800" : "bg-blue-105 text-blue-800"
                    }`}>{ep.method}</span>
                    <span className="text-[11.5px] font-mono font-bold truncate">{ep.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans leading-none">{ep.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-mono uppercase bg-indigo-600 text-white font-extrabold px-2 py-0.5 rounded inline-block mb-1">
                  ROUTE CONTRACT DETAILS
                </span>
                <h4 className="font-bold text-slate-800 text-sm font-mono tracking-tight flex items-center gap-2">
                  <span className="text-emerald-600">{apiSpecs[selectedEndpoint].method}</span>
                  {apiSpecs[selectedEndpoint].route}
                </h4>
              </div>
              <button
                onClick={() => handleCopy(apiSpecs[selectedEndpoint].payload, selectedEndpoint)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xxs py-1 px-2.5 rounded-md transition cursor-pointer"
              >
                {copiedText === selectedEndpoint ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copiedText === selectedEndpoint ? "Copied Contract" : "Copy Payload"}
              </button>
            </div>

            <p className="text-xs text-slate-550 leading-relaxed">{apiSpecs[selectedEndpoint].desc}</p>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Strict Controller Policies</span>
              <ul className="text-xs text-slate-600 space-y-1">
                {apiSpecs[selectedEndpoint].rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10.5px]">
                <span className="text-slate-400 font-bold block mb-2 font-mono pb-1 border-b border-slate-800 uppercase tracking-wider">
                  Request Payload Model (JSON schema)
                </span>
                <pre className="overflow-x-auto whitespace-pre leading-normal leading-relaxed text-indigo-305">
                  {apiSpecs[selectedEndpoint].payload}
                </pre>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10.5px]">
                <span className="text-slate-400 font-bold block mb-2 font-mono pb-1 border-b border-slate-800 uppercase tracking-wider">
                  Success Response Contract
                </span>
                <pre className="overflow-x-auto whitespace-pre leading-normal leading-relaxed text-emerald-305">
                  {apiSpecs[selectedEndpoint].response}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. REAL-TIME STATUTORY PAYROLL CALCULATOR PLAYGROUND */}
      {activeSubTab === "payroll" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Controls Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs lg:col-span-2 space-y-5">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Calculator className="text-indigo-600" size={16} />
              Statutory Formulas Workbench
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Slide variables below to calculate employee payroll details based on statutory guidelines.
            </p>

            <div className="space-y-4 pt-2">
              {/* Base Salary */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Base Salary:</span>
                  <span className="font-mono font-extrabold text-indigo-650">{baseSalary.toLocaleString()} LKR</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="400000"
                  step="5000"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Allowances */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Earnings Allowances:</span>
                  <span className="font-mono font-extrabold text-slate-600">{allowance.toLocaleString()} LKR</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="2500"
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value))}
                  className="w-full accent-slate-650"
                />
              </div>

              {/* Overtime Pay */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Overtime Accumulations (OT):</span>
                  <span className="font-mono font-extrabold text-slate-600">{overtime.toLocaleString()} LKR</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={overtime}
                  onChange={(e) => setOvertime(Number(e.target.value))}
                  className="w-full accent-slate-650"
                />
              </div>

              {/* Recovery Deduction Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">Salary Advance Installment:</span>
                  <span className="font-mono font-extrabold text-rose-600">-{advanceDeduct.toLocaleString()} LKR</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="2500"
                  value={advanceDeduct}
                  onChange={(e) => setAdvanceDeduct(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="text-indigo-600 shrink-0 mt-0.5" size={14} />
              <div className="text-[10px] text-slate-500 leading-relaxed">
                <strong>Audit Compliance Guarantee:</strong> Adjusting these states immediately executes a synchronized simulation of statutory contributions (EPF Employee 12%, EPF Employer 15%, ETF 3%) as specified by state labor regulations.
              </div>
            </div>
          </div>

          {/* Results Sheet Panel */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl lg:col-span-3 space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-[9px] font-mono text-indigo-400 font-extrabold tracking-widest">
                  STATUTORY EARNINGS SUMMARY
                </span>
                <span className="text-[9px] text-slate-400 font-mono">STATUS: VALIDATED OK</span>
              </div>

              <div className="space-y-3 pt-4 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-350">
                  <span>Gross Earnings (Base + Allowances + OT + Bonus):</span>
                  <span className="font-bold font-mono text-white text-sm">{calcGross.toLocaleString()}.00 LKR</span>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></div>
                      EPF Employee Share Allocation (12% Base):
                    </span>
                    <span className="text-rose-450">-{calcEpfEmployee.toLocaleString()}.00 LKR</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></div>
                      Progressive APIT/PAYE Tax withholding:
                    </span>
                    <span className="text-rose-450">-{calcApit.toLocaleString()}.00 LKR</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block"></div>
                      Salary Advance Deduction Recoveries:
                    </span>
                    <span className="text-rose-450">-{advanceDeduct.toLocaleString()}.00 LKR</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-2.5">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    Employer Paid Trust Contributions (Not deducted from Employee)
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">EPF Employer Contribution (15% Base):</span>
                    <span className="text-emerald-400">+{calcEpfEmployer.toLocaleString()}.00 LKR</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ETF Employer Contribution (3% Base):</span>
                    <span className="text-emerald-400">+{calcEtfEmployer.toLocaleString()}.00 LKR</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-900 text-center space-y-1 mt-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Net Payable Amount to Employee Bank Account</span>
              <p className="text-2xl font-black text-white font-mono tracking-tight">
                {calcNet.toLocaleString()}.00 LKR
              </p>
              <span className="text-[9px] text-slate-500 font-mono italic block leading-none pt-1">
                Net Pay = Gross Earnings - Total Deductions
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. SECURITY & DOUBLE-ENTRY LEDGER GATES */}
      {activeSubTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Lock className="text-indigo-600" size={16} />
              Role Based Access Control Matrix Mapping
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              Our Security architecture strictly limits access to features depending on role profiles. We enforce access checks both client-side and at direct API controller endpoints:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 bg-slate-51">
                    <th className="py-2 px-3">Role Group Context</th>
                    <th className="py-2 px-3">Primary Permission Set</th>
                    <th className="py-2 px-3">Ledger Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-indigo-700">SUPER_ADMIN</td>
                    <td className="py-2.5 px-3">Global security control settings override and telemetry clearance</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-bold">UNRESTRICTED</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">HR_MANAGER</td>
                    <td className="py-2.5 px-3">Appoint staff, final leave decision-making override status</td>
                    <td className="py-2.5 px-3"><span className="text-slate-550">Read-Only View</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">PAYROLL_OFFICER</td>
                    <td className="py-2.5 px-3">EPF calculator control, lock monthly cycles, post debit vouchers</td>
                    <td className="py-2.5 px-3"><span className="text-emerald-600 font-bold">Write / Commit</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-800">EMPLOYEE</td>
                    <td className="py-2.5 px-3">Attendance punch-in, self salary check, request leave form</td>
                    <td className="py-2.5 px-3"><span className="text-red-600 font-bold">RESTRICTED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <CheckCircle2 className="text-indigo-600" size={16} />
              Double-Entry Accounting & Ledger Rules
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              To prevent financial discrepancies or ledger tampering, the system enforces the following bookkeeping mandates:
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: "One-Way Slip Lock", desc: "No locked payslip can ever be modified or soft-deleted once ledger posts complete.", status: "Immutable Locks" },
                { title: "Voucher Integrity Code", desc: "Every Debit on corporate ledger files must link back to a verified ID reference model.", status: "Verified FK Referrals" },
                { title: "Zero Balance Offsets", desc: "Calculated debit matches must equal actual bank transactions to prevent fraud.", status: "Asset Balance Match" }
              ].map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[11px] text-slate-850 font-sans">{r.title}</span>
                    <span className="text-[8px] font-mono uppercase bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">{r.status}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. DEVOPS & PRODUCTION DEPLOYMENT GUIDE */}
      {activeSubTab === "devops" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <Server className="text-indigo-600" size={16} />
              Dockerfile Container Deployment Spec
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              We leverage multi-stage lightweight Alpine Node images to keep deployment sizes small and protect against software vulnerabilities:
            </p>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10px] leading-relaxed relative">
              <button
                onClick={() => handleCopy("FROM node:22-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/package*.json ./\nRUN npm ci --only=production\nEXPOSE 3000\nCMD [\"npm\", \"start\"]", "dockerfile")}
                className="absolute right-3.5 top-3.5 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold text-xxs py-1 px-2 rounded cursor-pointer transition"
              >
                {copiedText === "dockerfile" ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                Copy Script
              </button>
              <pre className="text-indigo-305 overflow-x-auto">
                {`FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]`}
              </pre>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <GitBranch className="text-indigo-600" size={16} />
              CI/CD Blueprint Roadmap Phases
            </h3>

            <div className="space-y-4">
              {[
                { phase: "PHASE 1: Code Check", desc: "Triggers linter tests via 'tsc --noEmit' in dynamic workflows." },
                { phase: "PHASE 2: Build Container", desc: "Builds production layers with esbuild Bundling." },
                { phase: "PHASE 3: Vulnerability Scan", desc: "Scans layers against CVE vulnerability registers." },
                { phase: "PHASE 4: Serverless Release", desc: "Deploys zero-downtime releases on Cloud Run platform." }
              ].map((p, idx) => (
                <div key={idx} className="relative pl-6">
                  {/* Vertical bar */}
                  {idx !== 3 && <div className="absolute left-2.5 top-4 bottom-[-16px] w-[2px] bg-slate-200" />}
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-indigo-600 block leading-none">
                    {p.phase}
                  </span>
                  <p className="text-[10.5px] text-slate-550 leading-relaxed mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
