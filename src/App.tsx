/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Role, Permission, AuditLog, Employee, Attendance, LeaveRequest, SalaryAdvance, StorePurchaseRecovery, WelfareClaim, Bonus, LedgerEntry, PerformanceAppraisal, Payslip, Announcement } from "./types";
import { BRAND_NAME } from "./data/mockData";
import EmployeeModule from "./components/EmployeeModule";
import AttendanceModule from "./components/AttendanceModule";
import LeaveModule from "./components/LeaveModule";
import PayrollModule from "./components/PayrollModule";
import FinancialsModule from "./components/FinancialsModule";
import PerformanceModule from "./components/PerformanceModule";
import ReportingModule from "./components/ReportingModule";
import NotificationsModule from "./components/NotificationsModule";
import SecurityModule from "./components/SecurityModule";
import EmployeePortal from "./components/EmployeePortal";
import LedgerModule from "./components/LedgerModule";
import SrsSpecsModule from "./components/SrsSpecsModule";
import AdminDashboardModule from "./components/AdminDashboardModule";
import FalconLogo from "./components/FalconLogo";

import {
  Users,
  Clock,
  CalendarDays,
  Coins,
  Receipt,
  BookOpen,
  Star,
  AreaChart,
  Megaphone,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Loader2,
  ListRestart,
  FileText,
  Compass
} from "lucide-react";

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>(Role.SUPER_ADMIN);
  const [activeTab, setActiveTab] = useState<"dashboard" | "employees" | "attendance" | "leaves" | "payroll" | "financials" | "appraisals" | "reports" | "bulletins" | "security" | "ledger" | "srs">("dashboard");

  // State data representing absolute tables
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [recoveries, setRecoveries] = useState<StorePurchaseRecovery[]>([]);
  const [claims, setClaims] = useState<WelfareClaim[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [appraisals, setAppraisals] = useState<PerformanceAppraisal[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [rbacMatrix, setRbacMatrix] = useState<Record<Role, Permission[]>>({} as any);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Function to load entire database state from Express server memory
  const loadStateData = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setAttendance(data.attendance || []);
        setLeaves(data.leaves || []);
        setAdvances(data.advances || []);
        setRecoveries(data.recoveries || []);
        setClaims(data.claims || []);
        setBonuses(data.bonuses || []);
        setLedger(data.ledger || []);
        setAppraisals(data.appraisals || []);
        setPayslips(data.payslips || []);
        setAnnouncements(data.announcements || []);
        setRbacMatrix(data.rbacMatrix || {});
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("State loading failed. Ensure development Express server is online", err);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission) => {
    if (currentRole === Role.SUPER_ADMIN) return true;
    const permissions = rbacMatrix[currentRole] || [];
    return permissions.includes(permission);
  };

  const logAuditAction = async (
    moduleName: string,
    actionName: string,
    details: string,
    oldValue?: string,
    newValue?: string,
    status: "Success" | "Failure" = "Success"
  ) => {
    try {
      const activeEmployeeName = employees.find(e => e.role === currentRole)?.name || "System Admin";
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorRole: currentRole,
          actorName: activeEmployeeName,
          module: moduleName,
          action: actionName,
          details,
          status,
          oldValue,
          newValue
        })
      });
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMatrix = async (updatedMatrix: Record<Role, Permission[]>) => {
    try {
      const activeEmployeeName = employees.find(e => e.role === currentRole)?.name || "System Admin";
      const res = await fetch("/api/rbac/matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rbacMatrix: updatedMatrix,
          actorRole: currentRole,
          actorName: activeEmployeeName
        })
      });
      if (res.ok) {
        const d = await res.json();
        setRbacMatrix(d.rbacMatrix || {});
        loadStateData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearLogs = async () => {
    try {
      const activeEmployeeName = employees.find(e => e.role === currentRole)?.name || "System Admin";
      const res = await fetch("/api/audit-logs/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorRole: currentRole,
          actorName: activeEmployeeName
        })
      });
      if (res.ok) {
        setAuditLogs([]);
        loadStateData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStateData();
  }, []);

  // Compute key KPI metrics
  const activeStaffCount = employees.filter(e => e.status === "Active").length;
  const pendingLeavesCount = leaves.filter(l => l.status === "Pending").length;
  const pendingAdvancesCount = advances.filter(a => a.status === "Pending").length;
  const draftPayslipsCount = payslips.filter(p => p.status === "Draft").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 font-sans">
        <Loader2 className="animate-spin text-indigo-600 mb-3" size={36} />
        <p className="text-sm font-semibold heading-display tracking-tight text-slate-700">Booting high-performance HRMS engine...</p>
        <p className="text-xs text-slate-400 mt-1">Acquiring database schemas & roster records safely.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans overflow-x-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 lg:sticky lg:top-0 lg:h-screen shadow-xl">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 shrink-0">
          <FalconLogo size="md" variant="full" />
        </div>

        {/* Systems Nav Index */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-3 tracking-widest">Core Modules</div>
          {[
            { id: "dashboard", label: "Operations Dashboard", icon: Compass, desc: "HQ real-time control metrics", visible: currentRole !== Role.EMPLOYEE },
            { id: "employees", label: currentRole === Role.EMPLOYEE ? "My Portal Home" : "Employee Management", icon: Users, desc: currentRole === Role.EMPLOYEE ? "Self-service dashboard" : "Personnel roster & base salary" },
            { id: "attendance", label: "Attendance Core", icon: Clock, desc: "Today's check punches & clockings", visible: hasPermission(Permission.ATTENDANCE_CREATE) || hasPermission(Permission.ATTENDANCE_APPROVE) },
            { id: "leaves", label: "Leaves & Furloughs", icon: CalendarDays, desc: "Scheduler & manager reviews", count: pendingLeavesCount, visible: hasPermission(Permission.LEAVE_APPROVE) || currentRole === Role.EMPLOYEE },
            { id: "payroll", label: "Automated Payroll", icon: Coins, desc: "Calculations, EPF, APIT tax", count: draftPayslipsCount, visible: hasPermission(Permission.PAYROLL_GENERATE) || hasPermission(Permission.PAYROLL_APPROVE) || hasPermission(Permission.PAYROLL_LOCK) },
            { id: "financials", label: "Financial Tools", icon: Receipt, desc: "Advances, store purchase, welfare", count: pendingAdvancesCount, visible: hasPermission(Permission.BONUS_CREATE) || hasPermission(Permission.BONUS_APPROVE) || currentRole === Role.EMPLOYEE },
            { id: "ledger", label: "Employee Ledger", icon: BookOpen, desc: "Transaction history & vouchers" },
            { id: "appraisals", label: "Appraisals & OKRs", icon: Star, desc: "Reviews & AI coaching directives", visible: hasPermission(Permission.EMPLOYEE_VIEW) },
            { id: "reports", label: "Intelligence Reports", icon: AreaChart, desc: "Branch levels & payout trends", visible: hasPermission(Permission.REPORTS_VIEW) },
            { id: "bulletins", label: "Bulletin Directive", icon: Megaphone, desc: "Corporate notifications feed" },
            { id: "security", label: "Security & RBAC", icon: ShieldAlert, desc: "Matrix gates & audit logger", visible: hasPermission(Permission.USER_MANAGEMENT) || hasPermission(Permission.AUDIT_LOG_VIEW) },
            { id: "srs", label: "Interactive System SRS", icon: FileText, desc: "Database logic & API contracts" }
          ].filter(tab => tab.visible === undefined || tab.visible).map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-2.5 rounded-lg flex items-start gap-3 transition-all duration-155 cursor-pointer ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border-l-4 border-blue-600 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                }`}
                id={`side-tab-${tab.id}`}
              >
                <TabIcon
                  size={16}
                  className={`mt-0.5 shrink-0 ${
                    isActive ? "text-blue-400" : "text-slate-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs transition-colors">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="bg-rose-500 text-white min-w-4 text-[9px] font-bold text-center rounded-full px-1.5 py-0.5 font-mono animate-pulse">{tab.count}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-normal mt-0.5 truncate">{tab.desc}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Connected Status Block */}
        <div className="m-4 p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3 shrink-0 hidden lg:block">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-amber-500" /> Operational status
          </p>
          <div className="space-y-2 font-semibold text-[11px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Duty:</span>
              <span className="font-mono text-slate-200">{activeStaffCount} personnel</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Unresolved:</span>
              <span className="font-mono text-slate-200">{pendingLeavesCount + pendingAdvancesCount} pending</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Audit Status:</span>
              <span className="text-emerald-400 font-bold">✓ Complete (May)</span>
            </div>
          </div>
        </div>

        {/* User profile footer inside sidebar */}
        <div className="p-4 border-t border-slate-800 mt-auto shrink-0 hidden lg:block">
          <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-bold font-mono">
              {currentRole === Role.SUPER_ADMIN ? "SA" :
               currentRole === Role.HR_MANAGER ? "HR" :
               currentRole === Role.PAYROLL_OFFICER ? "PO" :
               currentRole === Role.BRANCH_MANAGER ? "BM" :
               currentRole === Role.ACCOUNTANT ? "AC" :
               currentRole === Role.CASHIER ? "CA" : "EM"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white leading-tight truncate">
                {currentRole === Role.SUPER_ADMIN ? "Super Admin" :
                 currentRole === Role.HR_MANAGER ? "HR Manager" :
                 currentRole === Role.PAYROLL_OFFICER ? "Payroll Officer" :
                 currentRole === Role.BRANCH_MANAGER ? "Branch Manager" :
                 currentRole === Role.ACCOUNTANT ? "Accountant" :
                 currentRole === Role.CASHIER ? "Cashier" : "Employee"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wide truncate">Global Head Office</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-xs">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight heading-display">
            {activeTab === "dashboard" && "Central Operations Command Center"}
            {activeTab === "employees" && (currentRole === Role.EMPLOYEE ? "My Employee Portal Dashboard" : "Employee Management")}
            {activeTab === "attendance" && "Attendance Audit & Clocking"}
            {activeTab === "leaves" && "Leaves & Furloughs Board"}
            {activeTab === "payroll" && "Automated Payroll Engine"}
            {activeTab === "financials" && "Financial Assistance & Recoveries"}
            {activeTab === "appraisals" && "Performance Evaluation & Coaching"}
            {activeTab === "reports" && "Corporate Intelligence & Reporting"}
            {activeTab === "bulletins" && "Corporate Bulletin Broadcast"}
            {activeTab === "security" && "Security Gates & Audit Logs Ledger"}
            {activeTab === "srs" && "Interactive System SRS Specification Board"}
          </h1>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <UserCheck size={14} className="text-slate-500 ml-2" />
              <select
                className="bg-transparent text-slate-700 text-xs font-semibold py-1 pr-6 pl-1 focus:outline-hidden cursor-pointer border-none"
                value={currentRole}
                onChange={async (e) => {
                  const previousRole = currentRole;
                  const targetRole = e.target.value as Role;
                  const activeEmployeeName = employees.find(e => e.role === previousRole)?.name || "System Admin";
                  const targetEmployeeName = employees.find(e => e.role === targetRole)?.name || "System Admin";
                  
                  try {
                    // 1. Log Logout for Previous Role
                    await fetch("/api/audit-logs", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        actorRole: previousRole,
                        actorName: activeEmployeeName,
                        module: "User Session",
                        action: "Logout",
                        details: `User session exited for role profile ${previousRole}`,
                        status: "Success",
                        oldValue: `Active Role Session: ${previousRole}`,
                        newValue: "No Active Session"
                      })
                    });

                    // 2. Set Current Role
                    setCurrentRole(targetRole);
                    if (targetRole === Role.EMPLOYEE) {
                      setActiveTab("employees");
                    } else {
                      setActiveTab("dashboard");
                    }

                    // 3. Log Login for Target Role
                    await fetch("/api/audit-logs", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        actorRole: targetRole,
                        actorName: targetEmployeeName,
                        module: "User Session",
                        action: "Login",
                        details: `User session authenticated for role profile ${targetRole}`,
                        status: "Success",
                        oldValue: "No Active Session",
                        newValue: `Active Role Session: ${targetRole}`
                      })
                    });

                    loadStateData();
                  } catch (err) {
                    console.error("Auth audit failed", err);
                    setCurrentRole(targetRole);
                  }
                }}
                id="global-role-switcher"
              >
                <option value={Role.SUPER_ADMIN}>Super Admin</option>
                <option value={Role.HR_MANAGER}>HR Manager</option>
                <option value={Role.PAYROLL_OFFICER}>Payroll Officer</option>
                <option value={Role.BRANCH_MANAGER}>Branch Manager</option>
                <option value={Role.ACCOUNTANT}>Accountant</option>
                <option value={Role.CASHIER}>Cashier</option>
                <option value={Role.EMPLOYEE}>Employee</option>
              </select>
            </div>

            <button
              onClick={loadStateData}
              title="Refresh ledger state data"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              id="refresh-state-btn"
            >
              <ListRestart size={15} />
            </button>
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-slate-50/50 flex flex-col gap-6">
          <div className="w-full max-w-7xl mx-auto flex-1">
            {activeTab === "dashboard" && (
              <AdminDashboardModule
                employees={employees}
                attendance={attendance}
                leaves={leaves}
                payslips={payslips}
                advances={advances}
                ledger={ledger}
                auditLogs={auditLogs}
                currentRole={currentRole}
                onTabChange={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === "employees" && (
              currentRole === Role.EMPLOYEE ? (
                <EmployeePortal
                  employee={employees.find(e => e.role === Role.EMPLOYEE) || employees[0]}
                  employees={employees}
                  attendance={attendance}
                  leaves={leaves}
                  advances={advances}
                  payslips={payslips}
                  announcements={announcements}
                  onUpdateState={loadStateData}
                  logAuditAction={logAuditAction}
                />
              ) : (
                <EmployeeModule employees={employees} currentRole={currentRole} onUpdateState={loadStateData} />
              )
            )}
            {activeTab === "attendance" && (
              <AttendanceModule attendanceData={attendance} employees={employees} currentRole={currentRole} onUpdateState={loadStateData} />
            )}
            {activeTab === "leaves" && (
              <LeaveModule leaves={leaves} employees={employees} currentRole={currentRole} onUpdateState={loadStateData} />
            )}
            {activeTab === "payroll" && (
              <PayrollModule payslips={payslips} employees={employees} currentRole={currentRole} onUpdateState={loadStateData} />
            )}
            {activeTab === "financials" && (
              <FinancialsModule
                advances={advances}
                recoveries={recoveries}
                claims={claims}
                bonuses={bonuses}
                employees={employees}
                currentRole={currentRole}
                onUpdateState={loadStateData}
              />
            )}
            {activeTab === "ledger" && (
              <LedgerModule
                ledger={ledger}
                employees={employees}
                currentRole={currentRole}
                onUpdateState={loadStateData}
              />
            )}
            {activeTab === "appraisals" && (
              <PerformanceModule appraisals={appraisals} employees={employees} currentRole={currentRole} onUpdateState={loadStateData} />
            )}
            {activeTab === "reports" && (
              <ReportingModule
                employees={employees}
                payslips={payslips}
                attendance={attendance}
                leaves={leaves}
                advances={advances}
                recoveries={recoveries}
                claims={claims}
                bonuses={bonuses}
                ledger={ledger}
              />
            )}
            {activeTab === "bulletins" && (
              <NotificationsModule announcements={announcements} employees={employees} currentRole={currentRole} onUpdateState={loadStateData} />
            )}
            {activeTab === "security" && (
              <SecurityModule
                employees={employees}
                rbacMatrix={rbacMatrix}
                auditLogs={auditLogs}
                currentRole={currentRole}
                onUpdateMatrix={handleUpdateMatrix}
                onClearLogs={handleClearLogs}
                logAuditAction={logAuditAction}
                onUpdateState={loadStateData}
              />
            )}
            {activeTab === "srs" && (
              <SrsSpecsModule />
            )}
          </div>
        </div>

        {/* Bottom Status Rail */}
        <footer className="h-9 bg-white border-t border-slate-200 px-6 sm:px-8 flex items-center justify-between text-[10px] font-semibold text-slate-400 shrink-0 font-mono tracking-wide">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
              CORE LEDGER SERVICE ONLINE
            </span>
            <span className="hidden md:inline text-slate-400">SYSTEM VERSION: v12.4.1</span>
            <span className="text-slate-400">BRANCH: MALAYSIA (HQ)</span>
          </div>
          <div>&copy; 2026 {BRAND_NAME} Executive</div>
        </footer>
      </div>
    </div>
  );
}
