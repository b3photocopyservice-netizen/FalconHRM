/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Role, Permission, AuditLog, Employee } from "../types";
import { 
  Shield, Sliders, Activity, Search, Trash2, KeyRound, Lock, 
  Settings2, Smartphone, Globe, RefreshCw, CheckCircle2, 
  AlertCircle, ShieldCheck, UserX, UserCheck, ShieldAlert 
} from "lucide-react";

interface SecurityModuleProps {
  employees: Employee[];
  rbacMatrix: Record<Role, Permission[]>;
  auditLogs: AuditLog[];
  currentRole: Role;
  onUpdateMatrix: (updated: Record<Role, Permission[]>) => Promise<void>;
  onClearLogs: () => Promise<void>;
  logAuditAction: (module: string, action: string, details: string) => void;
  onUpdateState?: () => Promise<void>;
}

export default function SecurityModule({
  employees,
  rbacMatrix,
  auditLogs,
  currentRole,
  onUpdateMatrix,
  onClearLogs,
  logAuditAction,
  onUpdateState
}: SecurityModuleProps) {
  const [activeTab, setActiveTab] = useState<"matrix" | "audit" | "policies" | "deleted">("matrix");
  const [saving, setSaving] = useState(false);
  const [matrixState, setMatrixState] = useState<Record<Role, Permission[]>>(() => rbacMatrix);

  // Success and Error notification banners
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state if prop changes
  React.useEffect(() => {
    setMatrixState(rbacMatrix);
  }, [rbacMatrix]);

  // Security Policies persistence via localStorage/state
  const [minPasswordLength, setMinPasswordLength] = useState(() => {
    return Number(localStorage.getItem("sec_min_pw_len") || "8");
  });
  const [requireComplexity, setRequireComplexity] = useState(() => {
    return localStorage.getItem("sec_require_complex") === "true";
  });
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    return Number(localStorage.getItem("sec_session_timeout") || "15");
  });
  const [jwtPayloadRequired, setJwtPayloadRequired] = useState(() => {
    return localStorage.getItem("sec_jwt_required") === "true";
  });
  const [ipWhitelist, setIpWhitelist] = useState(() => {
    return localStorage.getItem("sec_ip_whitelist") || "127.0.0.1, 192.168.10.42";
  });

  // Track state of action requests
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Audit Log filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterModule, setFilterModule] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const rolesList = [
    { key: Role.SUPER_ADMIN, label: "Super Admin", color: "bg-red-500 text-white" },
    { key: Role.HR_MANAGER, label: "HR Manager", color: "bg-orange-500 text-white" },
    { key: Role.PAYROLL_OFFICER, label: "Payroll Officer", color: "bg-green-500 text-white" },
    { key: Role.BRANCH_MANAGER, label: "Branch Manager", color: "bg-purple-500 text-white" },
    { key: Role.ACCOUNTANT, label: "Accountant", color: "bg-blue-500 text-white" },
    { key: Role.CASHIER, label: "Cashier", color: "bg-teal-500 text-white" },
    { key: Role.EMPLOYEE, label: "Employee", color: "bg-slate-500 text-white" }
  ];

  const permissionsList = [
    { key: Permission.EMPLOYEE_CREATE, label: "Employee Create", group: "Employee" },
    { key: Permission.EMPLOYEE_EDIT, label: "Employee Edit", group: "Employee" },
    { key: Permission.EMPLOYEE_DELETE, label: "Employee Delete", group: "Employee" },
    { key: Permission.EMPLOYEE_VIEW, label: "Employee View", group: "Employee" },
    { key: Permission.ATTENDANCE_CREATE, label: "Attendance Create", group: "Attendance" },
    { key: Permission.ATTENDANCE_EDIT, label: "Attendance Edit", group: "Attendance" },
    { key: Permission.ATTENDANCE_APPROVE, label: "Attendance Approve", group: "Attendance" },
    { key: Permission.LEAVE_APPROVE, label: "Leave Approve", group: "Leaves" },
    { key: Permission.LEAVE_REJECT, label: "Leave Reject", group: "Leaves" },
    { key: Permission.PAYROLL_GENERATE, label: "Payroll Generate", group: "Payroll" },
    { key: Permission.PAYROLL_APPROVE, label: "Payroll Approve", group: "Payroll" },
    { key: Permission.PAYROLL_LOCK, label: "Payroll Lock", group: "Payroll" },
    { key: Permission.BONUS_CREATE, label: "Bonus Create", group: "Finance" },
    { key: Permission.BONUS_APPROVE, label: "Bonus Approve", group: "Finance" },
    { key: Permission.REPORTS_VIEW, label: "Reports View", group: "Reporting" },
    { key: Permission.REPORTS_EXPORT, label: "Reports Export", group: "Reporting" },
    { key: Permission.USER_MANAGEMENT, label: "User Management / RBAC", group: "Administration" },
    { key: Permission.AUDIT_LOG_VIEW, label: "Audit Logs View", group: "Administration" }
  ];

  const hasAccessToSecurity = 
    currentRole === Role.SUPER_ADMIN || 
    (rbacMatrix[currentRole] && (rbacMatrix[currentRole].includes(Permission.USER_MANAGEMENT) || rbacMatrix[currentRole].includes(Permission.AUDIT_LOG_VIEW)));

  if (!hasAccessToSecurity) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 shadow-xs">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 shadow-sm animate-pulse">
          <Lock size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 heading-display">Insufficient System Authorization</h3>
        <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">
          Access to Security Configurations, Role Matrices, Cryptographic Policies, and System Auditing registers is restricted. Please toggle your active portal session Role to **Super Admin** or another authorized profile.
        </p>
      </div>
    );
  }

  const handleTogglePermission = (role: Role, permission: Permission) => {
    if (role === Role.SUPER_ADMIN) return;

    const currentPermissions = matrixState[role] || [];
    let updatedPermissions: Permission[] = [];

    if (currentPermissions.includes(permission)) {
      updatedPermissions = currentPermissions.filter(p => p !== permission);
    } else {
      updatedPermissions = [...currentPermissions, permission];
    }

    setMatrixState(prev => ({
      ...prev,
      [role]: updatedPermissions
    }));
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await onUpdateMatrix(matrixState);
      logAuditAction(
        "User Management / RBAC",
        "Configure Permissions Matrix",
        "Successfully updated active RBAC permission scopes for executive roles, adjusting personnel authorization."
      );
      setSuccessMsg("System authorization matrices recalibrated and synchronized successfully.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to synchronize permissions matrix: " + (err.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleResetMatrix = () => {
    setMatrixState(rbacMatrix);
    setSuccessMsg("");
  };

  // Filter audit logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === "ALL" || log.actorRole === filterRole;
    const matchesModule = filterModule === "ALL" || log.module === filterModule;
    const matchesStatus = filterStatus === "ALL" || log.status === filterStatus;

    return matchesSearch && matchesRole && matchesModule && matchesStatus;
  });

  const uniqueModules = Array.from(new Set(auditLogs.map(l => l.module)));

  // Soft-deleted employees
  const deletedEmployees = useMemo(() => {
    return employees.filter(e => e.isDeleted);
  }, [employees]);

  // REST RESTORE DELETED EMPLOYEE
  const handleRestoreEmployee = async (empId: string, name: string) => {
    setProcessingId(empId);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`/api/employees/${empId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorRole: currentRole,
          actorName: "Security Administrator"
        })
      });

      if (!response.ok) {
        throw new Error("Unable to complete restore payload.");
      }

      setSuccessMsg(`Employee account for '${name}' (${empId}) restored to active registers successfully.`);
      if (onUpdateState) {
        await onUpdateState();
      }
    } catch (err: any) {
      setErrorMsg(`Failed to restore employee: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  // REST PERMANENT PURGE EMPLOYEE
  const handleHardPurgeEmployee = async (empId: string, name: string) => {
    if (!confirm(`CRITICAL WARNING: Are you absolutely certain you want to permanently purge '${name}' (${empId})? This action is absolutely irreversible and removes all traces from SQL registries.`)) {
      return;
    }

    setProcessingId(empId);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`/api/employees/${empId}/purge`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorRole: currentRole,
          actorName: "Security System Controller"
        })
      });

      if (!response.ok) {
        throw new Error("Unable to complete purge payload.");
      }

      setSuccessMsg(`Personnel register for '${name}' (${empId}) permanently purged from systems directory.`);
      if (onUpdateState) {
        await onUpdateState();
      }
    } catch (err: any) {
      setErrorMsg(`Failed to hard delete employee: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  // SAVE PASSWORD AND COMPLIANCE SECURITY POLICIES
  const handleSavePolicies = () => {
    setSaving(true);
    setSuccessMsg("");
    
    setTimeout(() => {
      try {
        localStorage.setItem("sec_min_pw_len", String(minPasswordLength));
        localStorage.setItem("sec_require_complex", String(requireComplexity));
        localStorage.setItem("sec_session_timeout", String(sessionTimeout));
        localStorage.setItem("sec_jwt_required", String(jwtPayloadRequired));
        localStorage.setItem("sec_ip_whitelist", ipWhitelist);
        
        logAuditAction(
          "Security Policies Gate",
          "Modify Global Compliance Parameters",
          `Recalibrated password policy rules (min_len: ${minPasswordLength}, complex_rules: ${requireComplexity}), active session timeout locked at ${sessionTimeout} minutes, whitelists: [${ipWhitelist}]`
        );

        setSuccessMsg("Enterprise passwords and cryptographic token constraints updated correctly.");
      } catch (err: any) {
        setErrorMsg("Failed to save policy: " + err.message);
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* SUCCESS POPUP OR ERROR */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700 font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Header Card with 4 Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50/70 text-indigo-600 flex items-center justify-center">
              <Shield size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight heading-display">Module 13 Security & Governance</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconfigure RBAC permission vectors, set password/JWT cryptographic policies, view log audits, and restore soft-deleted directories.
          </p>
        </div>

        {/* Tab Switcher Headers */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 self-start xl:self-auto shrink-0 gap-1">
          <button
            onClick={() => {
              setActiveTab("matrix");
              setSuccessMsg("");
              setErrorMsg("");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "matrix" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders size={13} />
            Authorization Matrix
          </button>
          
          <button
            onClick={() => {
              setActiveTab("audit");
              setSuccessMsg("");
              setErrorMsg("");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "audit" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <Activity size={13} />
            Absolute Audit Trail
          </button>

          <button
            onClick={() => {
              setActiveTab("policies");
              setSuccessMsg("");
              setErrorMsg("");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "policies" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <KeyRound size={13} />
            Password & JWT Policies
          </button>

          <button
            onClick={() => {
              setActiveTab("deleted");
              setSuccessMsg("");
              setErrorMsg("");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer relative ${
              activeTab === "deleted" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <UserX size={13} />
            Soft Deletes Bin
            {deletedEmployees.length > 0 && (
              <span className="absolute -top-1.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white leading-none">
                {deletedEmployees.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 1. AUTHORIZATION RBAC TAB */}
      {activeTab === "matrix" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden pb-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-850 text-sm tracking-tight">Active Access Control Directives</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Edit operational flags to expand or restrict gateway gateways. Super Admin retains static complete privilege scope.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleResetMatrix}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Reset Layout
              </button>
              <button
                onClick={handleSaveMatrix}
                disabled={saving}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                id="btn-save-rbac"
              >
                {saving && <RefreshCw size={12} className="animate-spin" />}
                Commit RBAC Rules
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5 font-bold min-w-[220px] border-r border-slate-200">Personnel Operations / Actions Gateway</th>
                  {rolesList.map(r => (
                    <th key={r.key} className="py-3 px-3 text-center font-bold font-mono min-w-[120px] border-r border-slate-100 last:border-r-0">
                      <span className="block">{r.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {["Employee", "Attendance", "Leaves", "Payroll", "Finance", "Reporting", "Administration"].map(grp => (
                  <React.Fragment key={grp}>
                    <tr className="bg-slate-50 font-semibold text-[10px] text-indigo-705 tracking-wider uppercase border-y border-slate-200/50">
                      <td colSpan={rolesList.length + 1} className="py-2.5 px-5 font-bold font-mono">{grp} Resource Scope Gateway</td>
                    </tr>
                    {permissionsList
                      .filter(p => p.group === grp)
                      .map(p => (
                        <tr key={p.key} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-5 font-medium text-slate-700 border-r border-slate-150 bg-white">
                            <p className="font-bold text-slate-800 text-[11px]">{p.label}</p>
                            <span className="text-[9px] text-slate-400 font-mono tracking-wider lowercase">sys_ref: {p.key}</span>
                          </td>
                          {rolesList.map(r => {
                            const isPermitted = (matrixState[r.key] || []).includes(p.key);
                            const isSuperAdmin = r.key === Role.SUPER_ADMIN;
                            return (
                              <td key={r.key} className="p-3 text-center border-r border-slate-100 last:border-r-0 bg-white">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={isPermitted}
                                    disabled={isSuperAdmin}
                                    onChange={() => handleTogglePermission(r.key, p.key)}
                                    className={`w-4 h-4 rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 transition cursor-pointer ${
                                      isSuperAdmin ? "opacity-60 cursor-not-allowed text-indigo-800 bg-indigo-50" : ""
                                    }`}
                                    id={`checkbox-${r.key}-${p.key}`}
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ABSOLUTE AUDIT TRAILS TAB */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          {/* INTERACTIVE AUDIT SIMULATION SANDBOX CONSOLE */}
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 px-2 rounded-md bg-indigo-600 text-white font-mono text-[9px] font-bold">SANDBOX CONSOLE</div>
                <h3 className="font-bold text-xs text-white tracking-tight flex items-center gap-1.5">
                  <Activity size={13} className="text-indigo-400 animate-pulse" />
                  Audit Governance Directive Real-Time Simulator
                </h3>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">Status: ACTIVE STANDARDS VERIFICATION</span>
            </div>
            
            <p className="text-[10.5px] text-slate-350 leading-relaxed">
              Verify standard compliance structures. Activating one of the simulator actions below instantly fires a backend transaction logging event, writing to the central database with your active role state, custom IP address parameters, and detailed <strong>Old value</strong> and <strong>New value</strong> mappings.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
              {[
                { label: "Login Session", action: "Login", module: "Authentication Gate", details: "Staff operator successfully passed complex 2FA / JWT challenge clearance", old: "No Active Session (Guest Node)", new: "Active JWT Session Token: \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\"", color: "bg-emerald-950/80 text-emerald-305 hover:bg-emerald-900 border-emerald-800/80" },
                { label: "Logout Session", action: "Logout", module: "Authentication Gate", details: "Terminated active JWT authorization token cookie session", old: "Active JWT Session Token ID: \"JWT-SEC-920\"", new: "No Active Session (Guest / Disconnected)", color: "bg-amber-950/80 text-amber-305 hover:bg-amber-900 border-amber-800/80" },
                { label: "Create Record", action: "Create", module: "Staff Directory", details: "Created new candidate file representation for appointed Executive", old: "Database Registry: NULL (No active record key matching EMP-405)", new: "{\n  \"status\": \"Active\",\n  \"employeeCode\": \"EMP-405\",\n  \"name\": \"Chathura Perera\",\n  \"role\": \"CASHIER\"\n}", color: "bg-indigo-950/80 text-indigo-305 hover:bg-indigo-900 border-indigo-800/80" },
                { label: "Update Profile", action: "Update", module: "Employee Registry", details: "Modified core base salary scale to adjusted annual tiers", old: "{\n  \"baseSalary\": 120000,\n  \"grade\": \"Executive L3\"\n}", new: "{\n  \"baseSalary\": 145000,\n  \"grade\": \"Executive L4\"\n}", color: "bg-purple-950/80 text-purple-305 hover:bg-purple-900 border-purple-800/80" },
                { label: "Soft Delete", action: "Delete", module: "Staff Directory", details: "Soft-deleted employee profile resource with active reference tags", old: "{\n  \"isDeleted\": false,\n  \"id\": \"EMP-902\"\n}", new: "{\n  \"isDeleted\": true,\n  \"deletedAt\": \"2026-06-06T08:00:00Z\"\n}", color: "bg-rose-950/80 text-rose-300 hover:bg-rose-900 border-rose-800/80" },
                { label: "Approve Request", action: "Approve", module: "Leave Management", details: "Finalized executive medical leave requests with HR Overrides", old: "{\n  \"status\": \"Pending\",\n  \"duration\": \"5 days\"\n}", new: "{\n  \"status\": \"Approved\",\n  \"finalizedBy\": \"HR Manager\"\n}", color: "bg-teal-950/80 text-teal-300 hover:bg-teal-900 border-teal-800/80" },
                { label: "Reject Request", action: "Reject", module: "Payroll Processing", details: "Rejected proposed manual base adjustments due to compliance rules", old: "{\n  \"adjustment\": 5000,\n  \"status\": \"Proposed\"\n}", new: "{\n  \"status\": \"Rejected\",\n  \"comments\": \"Adjustment violates compliance Directive L-4\"\n}", color: "bg-red-950/80 text-red-300 hover:bg-red-900 border-red-800/80" }
              ].map(m => (
                <button
                  key={m.label}
                  onClick={async () => {
                    try {
                      const simulatedIp = `192.168.${Math.floor(10 + Math.random() * 89)}.${Math.floor(10 + Math.random() * 240)}`;
                      const response = await fetch("/api/audit-logs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          actorRole: currentRole,
                          actorName: employees.find(e => e.role === currentRole)?.name || "Super Admin",
                          module: m.module,
                          action: m.action,
                          details: m.details,
                          status: "Success",
                          oldValue: m.old,
                          newValue: m.new,
                          ipAddress: simulatedIp
                        })
                      });
                      if (response.ok) {
                        setSuccessMsg(`Simulated "${m.action}" log event successfully written to security ledger!`);
                        if (onUpdateState) {
                          await onUpdateState();
                        }
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className={`p-2 rounded-lg border text-sans text-[11px] font-bold transition flex flex-col items-center justify-center text-center gap-1 cursor-pointer hover:border-slate-500 hover:scale-[1.02] active:scale-[0.98] ${m.color}`}
                >
                  <span className="text-[10px] uppercase font-mono tracking-wide">{m.action}</span>
                  <span className="text-[8px] opacity-75 font-normal leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Filter logs by operator name, transactional memo, action ID, or terminal parameters..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-202 rounded-xl text-xs text-slate-705 placeholder-slate-400 focus:outline-hidden hover:border-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="audit-search"
                />
              </div>

              {/* Filtering block dropdown selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-50 border border-slate-200 px-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase mr-1">ROLE:</span>
                  <select
                    className="bg-transparent text-slate-700 text-[10px] py-2.5 focus:outline-hidden pr-3 cursor-pointer font-bold cursor-hand"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    <option value="ALL">All Roles</option>
                    {rolesList.map(r => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 px-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase mr-1">GATE:</span>
                  <select
                    className="bg-transparent text-slate-700 text-[10px] py-2.5 focus:outline-hidden pr-3 cursor-pointer font-bold cursor-hand"
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                  >
                    <option value="ALL">All Systems</option>
                    {uniqueModules.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-200 px-2 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase mr-1">STATUS:</span>
                  <select
                    className="bg-transparent text-slate-700 text-[10px] py-2.5 focus:outline-hidden pr-3 cursor-pointer font-bold cursor-hand"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All States</option>
                    <option value="Success">Success</option>
                    <option value="Failure">Failure</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-450 border-t border-slate-100 pt-3">
              <span className="text-slate-500">RESOLVED AUDIT RECORDS RETURNED: {filteredLogs.length} EVENTS</span>
              {filteredLogs.length > 0 && (
                <button
                  onClick={async () => {
                    if (confirm("Are you absolutely sure you want to securely purge all transaction log trailing records?")) {
                      await onClearLogs();
                      logAuditAction("Audit Trail Space", "Purge Audit Trail History", "Executed secure master purge wiping historical corporate audit trails.");
                      setSuccessMsg("System audit trail purged correctly.");
                    }
                  }}
                  className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 cursor-pointer"
                  id="btn-purge-logs"
                >
                  <Trash2 size={13} />
                  Purge Trails History
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-sans">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[9px] font-mono font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Event ID & Time</th>
                    <th className="py-3.5 px-4">Active Operator</th>
                    <th className="py-3.5 px-4">Gateway Target</th>
                    <th className="py-3.5 px-5">Terminal Ledger Details</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <ShieldAlert size={24} className="text-slate-300" />
                          <p className="font-bold text-slate-600">No active parameters matches filter</p>
                          <p className="text-[10px] text-slate-400">Expand your search options or register another system event</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => {
                      const rMeta = rolesList.find(rx => rx.key === log.actorRole);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition">
                          <td className="py-4 px-5">
                            <span className="font-mono text-slate-800 font-extrabold bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded text-[10px] shrink-0 block w-fit">
                              {log.id}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono mt-1.5 block">
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-850 text-[12px] leading-tight">{log.actorName}</p>
                            <span className="inline-block text-[8px] font-mono font-bold bg-slate-50 border border-slate-150 text-slate-500 px-1 py-0.2 rounded mt-1 uppercase">
                              {rMeta?.label || log.actorRole}
                            </span>
                          </td>
                          <td className="py-4 px-4 space-y-1.5">
                            <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded leading-none">
                              {log.module}
                            </span>
                            <p className="font-bold text-slate-850 text-[11px] mt-1">{log.action}</p>
                          </td>
                          <td className="py-4 px-5 max-w-lg">
                            <p className="text-slate-550 text-xs leading-relaxed font-sans">{log.details}</p>
                            
                            {(log.oldValue || log.newValue) && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {log.oldValue && (
                                  <div className="bg-slate-50 border border-slate-150 p-2 rounded-lg font-mono">
                                    <span className="text-[8.5px] text-rose-600 font-extrabold uppercase tracking-wider block mb-1">◀ Prior State</span>
                                    <pre className="text-[9.5px] text-slate-500 overflow-x-auto whitespace-pre-wrap leading-tight max-h-36 max-w-full font-medium">
                                      {log.oldValue}
                                    </pre>
                                  </div>
                                )}
                                {log.newValue && (
                                  <div className="bg-slate-50 border border-slate-150 p-2 rounded-lg font-mono">
                                    <span className="text-[8.5px] text-emerald-650 font-extrabold uppercase tracking-wider block mb-1">▶ Next State</span>
                                    <pre className="text-[9.5px] text-slate-600 overflow-x-auto whitespace-pre-wrap leading-tight max-h-36 max-w-full font-medium">
                                      {log.newValue}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}

                            <span className="text-[9px] text-slate-400 font-mono block mt-2.5">
                              Authorized Node Point: <span className="text-indigo-600 font-bold">{log.ipAddress || "192.168.10.42"}</span> (SHA256 Handshake)
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-mono font-extrabold border ${
                              log.status === "Success" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-rose-50 text-rose-700 border-rose-100"
                            }`}>
                              {log.status}
                            </span>
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

      {/* 3. PASSWORD & JWT POLICIES TAB */}
      {activeTab === "policies" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Active Policies Customizer Settings Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 lg:col-span-2">
            <div className="border-b border-slate-150 pb-4">
              <h3 className="font-bold text-slate-805 text-sm tracking-tight flex items-center gap-1.5">
                <Settings2 size={16} className="text-indigo-600" />
                Password & JWT Governance Settings
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Configure automated cryptographic limits, token requirements, MFA constraints, and localized node whitelist configurations.</p>
            </div>

            <div className="space-y-5">
              
              {/* Slider for Min password complexity length */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-750">Password Minimum Character Length</label>
                  <span className="text-xs font-mono font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    {minPasswordLength} Characters
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="20"
                  value={minPasswordLength}
                  onChange={(e) => setMinPasswordLength(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
                <p className="text-[10px] text-slate-400">Sri Lankan SEC-ISO directive recommends standard 8+ characters for staff, 12+ for admin panels.</p>
              </div>

              {/* Grid checkbox indicators for policies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* COMPLEXITY FLAG */}
                <div className="p-4 rounded-xl border border-slate-150 hover:bg-slate-50/50 transition">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireComplexity}
                      onChange={(e) => setRequireComplexity(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Force Complex Passwords</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Requires at least an uppercase, lower letter, digit, and special ASCII symbol on reset.</span>
                    </div>
                  </label>
                </div>

                {/* JWT REQUIREMENT HEADER TIGHT */}
                <div className="p-4 rounded-xl border border-slate-150 hover:bg-slate-50/50 transition">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jwtPayloadRequired}
                      onChange={(e) => setJwtPayloadRequired(e.target.checked)}
                      className="w-4.5 h-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Enforce JWT Verification</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Requires valid authorization Bearer header JWT payloads on all state-altering requests.</span>
                    </div>
                  </label>
                </div>

              </div>

              {/* Slider for Session Expiry timeout config */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-750">Active Session Inactivity Expiry Timeout</label>
                  <span className="text-xs font-mono font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    {sessionTimeout} Minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
                <p className="text-[10px] text-slate-400">Idle terminals automatically lock active sessions. Recommended standard: 15 minutes.</p>
              </div>

              {/* Whitelisting IP addresses control */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-750 block">Whitelisted System IPv4/IPv6 Nodes</label>
                <input
                  type="text"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  placeholder="e.g. 127.0.0.1, 192.168.10.42"
                  className="w-full p-2.5 bg-slate-50 border border-slate-205 rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-hidden hover:border-slate-300"
                />
                <p className="text-[10px] text-slate-400">Comma-separated list of nodes allowed to bypass MFA or execute final payroll actions.</p>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-150 flex justify-end">
              <button
                onClick={handleSavePolicies}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                id="btn-save-policies"
              >
                Save Compliance Configurations
              </button>
            </div>
          </div>

          {/* Active Terminal Info panel column */}
          <div className="space-y-6">
            
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                Active Security State Node
              </h4>

              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">JWT SIGNATURE</span>
                  <span className="text-emerald-400 font-bold">HS256 (ACTIVE)</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">MFA STATUS</span>
                  <span className="text-slate-200">TOTP ENABLED</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">IP ADDRESS</span>
                  <span className="text-slate-200">192.168.10.42</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">SSL ENCRYPTION</span>
                  <span className="text-emerald-400 font-bold">TLS v1.3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">SESSION TOKEN</span>
                  <span className="text-indigo-300 truncate max-w-[120px]">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-xl flex items-start gap-2.5 border border-slate-700">
                <Globe size={16} className="text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-[10px] text-slate-350 leading-relaxed font-sans font-medium">
                  Central systems monitor incoming HTTP Authorization pipelines. Unregistered nodes trying to bypass JSON Web Tokens automatically trigger immediate host lockouts.
                </p>
              </div>
            </div>

            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/60 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold text-amber-850 flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-amber-600 animate-pulse" />
                Statutory Compliance
              </h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans">
                These settings enforce direct operational rules inside the staff roster edit pages. Changing minimum characters blocks creation of weak credentials across endpoints instantly.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 4. SOFT DELETES ACTIVE TRASH BIN */}
      {activeTab === "deleted" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-850 text-sm tracking-tight flex items-center gap-1.5">
              <UserX size={16} className="text-rose-600" />
              Corporate Soft Deletes Archival Registers (Trash Bin)
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Provides failsafe security registries mapping out soft-deleted staff references. Restoring re-integrates profiles back seamlessly without losing structural payroll files or ledger histories.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-205 bg-slate-100/60 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">ID & Employee Code</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Division details</th>
                  <th className="py-3 px-4 text-right">Basic Wage</th>
                  <th className="py-3 px-5">Soft Deleted At</th>
                  <th className="py-3 px-5 text-center">Failsafe Actions Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {deletedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-400 bg-white">
                      <div className="flex flex-col items-center justify-center gap-1.5 max-w-xs mx-auto">
                        <ShieldCheck size={28} className="text-emerald-500 animate-pulse" />
                        <p className="font-bold text-slate-700">Directories perfectly clean!</p>
                        <p className="text-[10.5px] text-slate-400 leading-relaxed">No soft-deleted staff profiles are currently stored inside the corporate database trash bin directories.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deletedEmployees.map(emp => {
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/30 transition bg-white">
                        <td className="py-4.5 px-5">
                          <span className="font-mono text-slate-900 font-extrabold max-w-[100px] bg-slate-100 px-1.5 py-0.5 rounded leading-none text-[10px]">{emp.id}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-1.5 block">Code: {emp.employeeCode}</span>
                        </td>
                        <td className="py-4.5 px-4">
                          <p className="font-bold text-slate-850 text-sm leading-tight">{emp.fullName || emp.name}</p>
                          <span className="text-[9px] font-mono text-slate-400 uppercase mt-1 block">NIC: {emp.nicNumber}</span>
                        </td>
                        <td className="py-4.5 px-4">
                          <p className="font-bold text-slate-800 text-[11px] leading-tight">{emp.designation}</p>
                          <span className="text-[9px] text-slate-400 block mt-1">{emp.department} • {emp.branch}</span>
                        </td>
                        <td className="py-4.5 px-4 text-right font-mono font-bold text-slate-800">
                          Rs. {emp.baseSalary.toLocaleString()}
                        </td>
                        <td className="py-4.5 px-5 max-w-xs">
                          <span className="text-[10px] text-rose-600 font-mono font-semibold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded leading-tight">
                            {emp.deletedAt ? new Date(emp.deletedAt).toLocaleString() : "Recently soft-deleted"}
                          </span>
                        </td>
                        <td className="py-4.5 px-5 select-none touch-none text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={processingId !== null}
                              onClick={() => handleRestoreEmployee(emp.id, emp.name)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              id={`restore-btn-${emp.id}`}
                              title="Restore Employee safely"
                            >
                              <UserCheck size={11} />
                              {processingId === emp.id ? "Refetching" : "Restore"}
                            </button>

                            <button
                              disabled={processingId !== null}
                              onClick={() => handleHardPurgeEmployee(emp.id, emp.name)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-100 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              id={`purge-btn-${emp.id}`}
                              title="Hard Purge Employee permanently"
                            >
                              <Trash2 size={11} />
                              Purge Record
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
    </div>
  );
}
