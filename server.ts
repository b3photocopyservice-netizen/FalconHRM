/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_ADVANCES,
  INITIAL_RECOVERIES,
  INITIAL_CLAIMS,
  INITIAL_BONUSES,
  INITIAL_LEDGER,
  INITIAL_APPRAISALS,
  INITIAL_PAYSLIPS,
  INITIAL_ANNOUNCEMENTS
} from "./src/data/mockData";
import { Employee, Attendance, AttendanceCorrection, LeaveRequest, SalaryAdvance, StorePurchaseRecovery, WelfareClaim, Bonus, LedgerEntry, PerformanceAppraisal, Payslip, Announcement, Role, Permission, AuditLog, EmployeeLeaveBalance, LeaveEncashment, NotificationLog, NotificationChannelSetting } from "./src/types";

const DEFAULT_RBAC_MATRIX: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_EDIT,
    Permission.EMPLOYEE_DELETE,
    Permission.EMPLOYEE_VIEW,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_EDIT,
    Permission.ATTENDANCE_APPROVE,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_REJECT,
    Permission.PAYROLL_GENERATE,
    Permission.PAYROLL_APPROVE,
    Permission.PAYROLL_LOCK,
    Permission.BONUS_CREATE,
    Permission.BONUS_APPROVE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.USER_MANAGEMENT,
    Permission.AUDIT_LOG_VIEW
  ],
  [Role.HR_MANAGER]: [
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_EDIT,
    Permission.EMPLOYEE_VIEW,
    Permission.ATTENDANCE_CREATE,
    Permission.ATTENDANCE_EDIT,
    Permission.ATTENDANCE_APPROVE,
    Permission.LEAVE_APPROVE,
    Permission.LEAVE_REJECT,
    Permission.BONUS_CREATE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.AUDIT_LOG_VIEW
  ],
  [Role.PAYROLL_OFFICER]: [
    Permission.EMPLOYEE_VIEW,
    Permission.PAYROLL_GENERATE,
    Permission.PAYROLL_APPROVE,
    Permission.BONUS_CREATE,
    Permission.REPORTS_VIEW
  ],
  [Role.BRANCH_MANAGER]: [
    Permission.EMPLOYEE_VIEW,
    Permission.ATTENDANCE_APPROVE,
    Permission.REPORTS_VIEW
  ],
  [Role.ACCOUNTANT]: [
    Permission.EMPLOYEE_VIEW,
    Permission.PAYROLL_GENERATE,
    Permission.PAYROLL_APPROVE,
    Permission.BONUS_CREATE,
    Permission.BONUS_APPROVE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT
  ],
  [Role.CASHIER]: [
    Permission.EMPLOYEE_VIEW,
    Permission.PAYROLL_LOCK,
    Permission.REPORTS_VIEW
  ],
  [Role.EMPLOYEE]: [
    Permission.EMPLOYEE_VIEW,
    Permission.ATTENDANCE_CREATE
  ]
};

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "AUD-901452",
    timestamp: "2026-06-04T08:30:15Z",
    actorRole: Role.SUPER_ADMIN,
    actorName: "John Doe",
    module: "Core Database",
    action: "System Initialization",
    details: "Bootstrapped Enterprise RBAC security modules. Ledger verified clean.",
    status: "Success",
    ipAddress: "127.0.0.1"
  },
  {
    id: "AUD-812390",
    timestamp: "2026-06-04T09:15:42Z",
    actorRole: Role.HR_MANAGER,
    actorName: "Nisha Wickramasinghe",
    module: "Employee Directory",
    action: "Employee Onboarding",
    details: "Created employee account for Saman Kumara (EMP-410022)",
    status: "Success",
    ipAddress: "192.168.10.45"
  },
  {
    id: "AUD-710239",
    timestamp: "2026-06-04T10:02:11Z",
    actorRole: Role.PAYROLL_OFFICER,
    actorName: "Roshan Perera",
    module: "Automated Payroll",
    action: "Payroll Generation",
    details: "Initiated salary calculation drafts for May - Colombo Branch",
    status: "Success",
    ipAddress: "192.168.20.12"
  },
  {
    id: "AUD-602931",
    timestamp: "2026-06-04T11:45:00Z",
    actorRole: Role.EMPLOYEE,
    actorName: "Saman Kumara",
    module: "Attendance Logger",
    action: "Web Clock Punch",
    details: "Clock In processed successfully on terminal Mobile-Applet",
    status: "Success",
    ipAddress: "172.16.5.99"
  }
];

const app = express();
const PORT = 3000;

app.use(express.json());

// Main In-Memory Storage holding state
let db = {
  employees: [...INITIAL_EMPLOYEES],
  attendance: [...INITIAL_ATTENDANCE],
  corrections: [] as AttendanceCorrection[],
  leaves: [...INITIAL_LEAVES],
  advances: [...INITIAL_ADVANCES],
  recoveries: [...INITIAL_RECOVERIES],
  claims: [...INITIAL_CLAIMS],
  bonuses: [...INITIAL_BONUSES],
  ledger: [...INITIAL_LEDGER],
  appraisals: [...INITIAL_APPRAISALS],
  payslips: [...INITIAL_PAYSLIPS],
  announcements: [...INITIAL_ANNOUNCEMENTS],
  auditLogs: [...INITIAL_AUDIT_LOGS],
  rbacMatrix: { ...DEFAULT_RBAC_MATRIX },
  leaveBalances: [] as EmployeeLeaveBalance[],
  encashments: [] as LeaveEncashment[],
  notificationLogs: [
    {
      id: "NTF-001",
      timestamp: "2026-06-05T09:12:00.000Z",
      employeeId: "EMP-004",
      employeeName: "Alan Turing",
      event: "Leave Approval",
      channels: ["Email", "SMS", "WhatsApp", "In-App Notifications"],
      recipientAddress: "alan.turing@b3enterprise.com / +94771234567",
      bodyText: "Dear Alan Turing, your Casual Leave request for 2026-06-10 to 2026-06-12 has been Approved by HR. Enjoy your break!",
      status: "Simulated"
    },
    {
      id: "NTF-002",
      timestamp: "2026-06-05T14:45:00.000Z",
      employeeId: "EMP-008",
      employeeName: "Nikola Tesla",
      event: "Advance Approval",
      channels: ["Email", "In-App Notifications"],
      recipientAddress: "nikola.tesla@b3enterprise.com",
      bodyText: "Dear Nikola Tesla, your Salary Advance request of Rs. 25,000 reference ADV-102 has been Approved. Funds are queued for next payroll cycle.",
      status: "Simulated"
    },
    {
      id: "NTF-003",
      timestamp: "2026-06-04T08:00:00.000Z",
      employeeId: "EMP-005",
      employeeName: "Ada Lovelace",
      event: "Payslip Ready",
      channels: ["Email", "SMS", "WhatsApp"],
      recipientAddress: "ada.lovelace@b3enterprise.com / +94771112222",
      bodyText: "Dear Ada Lovelace, your Payslip for June 2026 is ready for viewing. Net payout: Rs. 165,400. Direct credited via Bank.",
      status: "Simulated"
    }
  ] as NotificationLog[],
  notificationSettings: [
    { event: "Leave Request", email: true, sms: false, whatsapp: false, inApp: true },
    { event: "Leave Approval", email: true, sms: true, whatsapp: true, inApp: true },
    { event: "Advance Request", email: true, sms: false, whatsapp: false, inApp: true },
    { event: "Advance Approval", email: true, sms: true, whatsapp: true, inApp: true },
    { event: "Payroll Generated", email: true, sms: false, whatsapp: false, inApp: true },
    { event: "Payslip Ready", email: true, sms: true, whatsapp: true, inApp: true }
  ] as NotificationChannelSetting[]
};

// Initialize leave balances for existing employees
function initLeaveBalances(): EmployeeLeaveBalance[] {
  return db.employees.map(emp => {
    const isTesla = emp.id === "EMP-008"; // Nikola Tesla has an approved sick leave in initial data
    const isAda = emp.id === "EMP-005"; // Ada Lovelace has casual leave approved
    return {
      id: `BAL-${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.name,
      year: 2026,
      annualAllocation: 14,
      annualCarriedForward: emp.id === "EMP-001" ? 4 : emp.id === "EMP-002" ? 2 : 0, 
      annualUsed: emp.id === "EMP-001" ? 2 : 0,
      casualAllocation: 7,
      casualUsed: isAda ? 2 : 0,
      medicalAllocation: 14,
      medicalUsed: isTesla ? 3 : 0,
      maternityAllocation: 84,
      maternityUsed: 0,
      specialAllocation: 5,
      specialUsed: 0,
      noPayUsed: 0
    };
  });
}
db.leaveBalances = initLeaveBalances();

function triggerNotification(
  employeeId: string,
  event: "Leave Request" | "Leave Approval" | "Advance Request" | "Advance Approval" | "Payroll Generated" | "Payslip Ready",
  details: string
) {
  const setting = db.notificationSettings.find(s => s.event === event);
  if (!setting) return;

  const channels: string[] = [];
  if (setting.email) channels.push("Email");
  if (setting.sms) channels.push("SMS");
  if (setting.whatsapp) channels.push("WhatsApp");
  if (setting.inApp) channels.push("In-App Notifications");

  if (channels.length === 0) return;

  if (employeeId === "ALL") {
    db.employees.forEach(emp => {
      const emailAddr = emp.email;
      const mobileAddr = emp.mobileNumber || emp.phone || "+94770000000";
      
      const addresses: string[] = [];
      if (setting.email) addresses.push(emailAddr);
      if (setting.sms || setting.whatsapp) addresses.push(mobileAddr);
      if (setting.inApp) addresses.push("In-App Panel");
      const recipientAddress = addresses.join(" / ");

      const id = `NTF-${Math.floor(100 + Math.random() * 900)}`;
      const newLog: NotificationLog = {
        id,
        timestamp: new Date().toISOString(),
        employeeId: emp.id,
        employeeName: emp.fullName || emp.name,
        event,
        channels,
        recipientAddress,
        bodyText: details.replace("{name}", emp.fullName || emp.name),
        status: "Simulated"
      };
      db.notificationLogs.unshift(newLog);
    });
  } else {
    const emp = db.employees.find(e => e.id === employeeId);
    if (!emp) return;
    const employeeName = emp.fullName || emp.name;
    const emailAddr = emp.email || "employee@b3enterprise.com";
    const mobileAddr = emp.mobileNumber || emp.phone || "+94770000000";

    const addresses: string[] = [];
    if (setting.email) addresses.push(emailAddr);
    if (setting.sms || setting.whatsapp) addresses.push(mobileAddr);
    if (setting.inApp) addresses.push("In-App Panel");
    const recipientAddress = addresses.join(" / ");

    const id = `NTF-${Math.floor(100 + Math.random() * 900)}`;
    const newLog: NotificationLog = {
      id,
      timestamp: new Date().toISOString(),
      employeeId,
      employeeName,
      event,
      channels,
      recipientAddress,
      bodyText: details.replace("{name}", employeeName),
      status: "Simulated"
    };

    db.notificationLogs.unshift(newLog);
  }
}



// Help helper for transaction logging
function writeAudit(
  actorRole: Role,
  actorName: string,
  module: string,
  action: string,
  details: string,
  status: "Success" | "Failure" = "Success",
  oldValue?: string,
  newValue?: string,
  ipAddress?: string
) {
  const newLog: AuditLog = {
    id: `AUD-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    actorRole,
    actorName,
    module,
    action,
    details,
    status,
    ipAddress: ipAddress || "192.168.1." + Math.floor(2 + Math.random() * 253),
    oldValue: oldValue || "",
    newValue: newValue || ""
  };
  db.auditLogs.unshift(newLog);
  return newLog;
}

function logToLedger(employeeId: string, referenceType: LedgerEntry["referenceType"], referenceId: string, debit: number, credit: number) {
  const employee = db.employees.find(e => e.id === employeeId);
  const employeeName = employee ? employee.name : "Unknown Employee";
  const postDate = new Date().toISOString().split("T")[0];
  
  // Calculate running balance for this employee
  const employeeHistory = db.ledger.filter(l => l.employeeId === employeeId);
  const currentTotalDebit = employeeHistory.reduce((sum, item) => sum + item.debit, 0);
  const currentTotalCredit = employeeHistory.reduce((sum, item) => sum + item.credit, 0);
  const currentBalance = currentTotalDebit - currentTotalCredit;
  const newBalance = currentBalance + debit - credit;

  const newEntry: LedgerEntry = {
    id: `LDG-${Math.floor(100000 + Math.random() * 900000)}`,
    employeeId,
    employeeName,
    postDate,
    referenceType,
    referenceId,
    branch: employee ? (employee.branch || "Head Office") : "Head Office",
    description: `${referenceType} transaction logged under reference ID ${referenceId}`,
    debit,
    credit,
    balance: newBalance
  };

  db.ledger.push(newEntry);
}

// REST GET full system state
app.get("/api/state", (req, res) => {
  res.json(db);
});

// REST POST Save custom RBAC permissions matrix
app.post("/api/rbac/matrix", (req, res) => {
  const { rbacMatrix, actorRole, actorName } = req.body;
  if (rbacMatrix) {
    db.rbacMatrix = rbacMatrix;
    writeAudit(
      actorRole || Role.SUPER_ADMIN,
      actorName || "Admin Executive",
      "User Management / RBAC",
      "Configure Permissions Matrix",
      "Customized system permission matrices across all Roles",
      "Success"
    );
    res.json({ success: true, rbacMatrix: db.rbacMatrix });
  } else {
    res.status(400).json({ error: "rbacMatrix is required" });
  }
});

// REST POST Create custom Audit Log
app.post("/api/audit-logs", (req, res) => {
  const { actorRole, actorName, module, action, details, status, oldValue, newValue, ipAddress } = req.body;
  
  const resolvedIp = ipAddress || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
  const cleanedIp = typeof resolvedIp === 'string' ? resolvedIp.replace(/^.*:/, '') : "127.0.0.1";
  const randomNodeSegment = Math.floor(2 + Math.random() * 253);
  const finalIp = (cleanedIp === "127.0.0.1" || cleanedIp === "::1" || cleanedIp === "localhost") 
    ? `192.168.10.${randomNodeSegment}` 
    : cleanedIp;

  const newLog = writeAudit(
    actorRole || Role.EMPLOYEE,
    actorName || "Staff User",
    module || "Core",
    action || "Access Portal",
    details || "",
    status || "Success",
    oldValue || "",
    newValue || "",
    finalIp
  );
  res.json({ success: true, log: newLog });
});

// REST POST Clear Audit Log History
app.post("/api/audit-logs/clear", (req, res) => {
  const { actorRole, actorName } = req.body;
  db.auditLogs = [];
  writeAudit(
    actorRole || Role.SUPER_ADMIN,
    actorName || "Super Admin",
    "Audit System",
    "Clear Logs Data",
    "Purged core system authorization and operational audit logs",
    "Success"
  );
  res.json({ success: true });
});

// REST POST Create a custom Transaction Ledger entry
app.post("/api/ledger/transaction", (req, res) => {
  const { employeeId, postDate, referenceType, referenceId, branch, description, debit, credit, actorRole, actorName } = req.body;
  
  if (!employeeId) {
    return res.status(400).json({ error: "employeeId is required" });
  }
  
  const employee = db.employees.find(e => e.id === employeeId);
  const employeeName = employee ? employee.name : "Unknown Employee";
  const finalBranch = branch || (employee ? employee.branch : "Unknown Branch");
  const finalPostDate = postDate || new Date().toISOString().split("T")[0];
  const finalDebit = Number(debit) || 0;
  const finalCredit = Number(credit) || 0;

  // Calculate balance for this employee
  const employeeHistory = db.ledger.filter(l => l.employeeId === employeeId);
  const currentTotalDebit = employeeHistory.reduce((sum, item) => sum + item.debit, 0);
  const currentTotalCredit = employeeHistory.reduce((sum, item) => sum + item.credit, 0);
  const currentBalance = currentTotalDebit - currentTotalCredit;
  const newBalance = currentBalance + finalDebit - finalCredit;

  const newEntry: LedgerEntry = {
    id: `LDG-${Math.floor(100000 + Math.random() * 900000)}`,
    employeeId,
    employeeName,
    postDate: finalPostDate,
    referenceType: referenceType || "Manual Adjustment",
    referenceId: referenceId || `TX-${Math.floor(10000 + Math.random() * 90000)}`,
    branch: finalBranch,
    description: description || "",
    debit: finalDebit,
    credit: finalCredit,
    balance: newBalance
  };

  db.ledger.push(newEntry);

  writeAudit(
    actorRole || Role.ACCOUNTANT,
    actorName || "Accountant Core",
    "Employee Ledger",
    "Post Transaction",
    `Recorded transaction of type ${newEntry.referenceType} for employee ${employeeName} (${employeeId}) with Debit: Rs. ${finalDebit.toLocaleString()} & Credit: Rs. ${finalCredit.toLocaleString()}`,
    "Success"
  );

  res.json({ success: true, entry: newEntry, ledger: db.ledger });
});

// REST DELETE Delete/Reverse a Ledger transaction
app.delete("/api/ledger/transaction/:id", (req, res) => {
  const { id } = req.params;
  const actorRole = req.query.actorRole || Role.SUPER_ADMIN;
  const actorName = req.query.actorName || "System Admin";
  
  const idx = db.ledger.findIndex(l => l.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Ledger entry not found" });
  }

  const removed = db.ledger[idx];
  db.ledger.splice(idx, 1);

  // Recalculate balances for that employee to keep ledger integrity!
  const empEntries = db.ledger.filter(l => l.employeeId === removed.employeeId);
  let running = 0;
  empEntries.forEach(l => {
    running = running + l.debit - l.credit;
    l.balance = running;
  });

  writeAudit(
    actorRole as Role,
    actorName as string,
    "Employee Ledger",
    "Reverse Transaction",
    `Reversed ledger entry ${id} of type ${removed.referenceType} for employee ${removed.employeeName} (${removed.employeeId})`,
    "Success"
  );

  res.json({ success: true, ledger: db.ledger });
});

// Create Employee
app.post("/api/employees", (req, res) => {
  const newEmp: Employee = {
    ...req.body,
    id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
    status: "Active"
  };
  db.employees.push(newEmp);

  // Write audit for employee creation
  const oldValueStr = "None (New Staff Entry Created)";
  const newValueStr = JSON.stringify({
    id: newEmp.id,
    name: newEmp.name,
    designation: newEmp.designation,
    department: newEmp.department,
    baseSalary: newEmp.baseSalary,
    status: newEmp.status
  }, null, 2);

  writeAudit(
    req.body.actorRole || Role.HR_MANAGER,
    req.body.actorName || "HR Admin",
    "Employee Registry",
    "Create",
    `Appointed employee ${newEmp.name} under unique identifier ${newEmp.id}`,
    "Success",
    oldValueStr,
    newValueStr
  );

  res.status(201).json({ message: "Employee appointed successfully", employee: newEmp });
});

// Update Employee
app.put("/api/employees/:id", (req, res) => {
  const index = db.employees.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    const originalEmp = db.employees[index];
    const prevEmpStr = JSON.stringify({
      id: originalEmp.id,
      name: originalEmp.name,
      designation: originalEmp.designation,
      department: originalEmp.department,
      baseSalary: originalEmp.baseSalary,
      status: originalEmp.status
    }, null, 2);

    db.employees[index] = { ...db.employees[index], ...req.body };
    
    // Synchronize lookup names in other records
    const updatedName = db.employees[index].name;
    const empId = req.params.id;
    db.attendance.forEach(a => { if (a.employeeId === empId) a.employeeName = updatedName; });
    db.leaves.forEach(l => { if (l.employeeId === empId) l.employeeName = updatedName; });
    db.advances.forEach(a => { if (a.employeeId === empId) a.employeeName = updatedName; });
    db.recoveries.forEach(r => { if (r.employeeId === empId) r.employeeName = updatedName; });
    db.claims.forEach(c => { if (c.employeeId === empId) c.employeeName = updatedName; });
    db.bonuses.forEach(b => { if (b.employeeId === empId) b.employeeName = updatedName; });
    db.ledger.forEach(l => { if (l.employeeId === empId) l.employeeName = updatedName; });
    db.appraisals.forEach(a => { if (a.employeeId === empId) a.employeeName = updatedName; });
    db.payslips.forEach(p => { if (p.employeeId === empId) p.employeeName = updatedName; });

    const updatedEmp = db.employees[index];
    const nextEmpStr = JSON.stringify({
      id: updatedEmp.id,
      name: updatedEmp.name,
      designation: updatedEmp.designation,
      department: updatedEmp.department,
      baseSalary: updatedEmp.baseSalary,
      status: updatedEmp.status
    }, null, 2);

    writeAudit(
      req.body.actorRole || Role.HR_MANAGER,
      req.body.actorName || "HR Admin",
      "Employee Registry",
      "Update",
      `Updated profile registry details for staff ${updatedEmp.name}`,
      "Success",
      prevEmpStr,
      nextEmpStr
    );

    res.json({ message: "Employee profile saved", employee: db.employees[index] });
  } else {
    res.status(404).json({ error: "Employee not found" });
  }
});

// Soft Delete Employee
app.delete("/api/employees/:id", (req, res) => {
  const employee = db.employees.find(e => e.id === req.params.id);
  if (employee) {
    const prevEmpStr = JSON.stringify({
      id: employee.id,
      name: employee.name,
      isDeleted: !!employee.isDeleted
    }, null, 2);

    employee.isDeleted = true;
    employee.deletedAt = new Date().toISOString();

    const nextEmpStr = JSON.stringify({
      id: employee.id,
      name: employee.name,
      isDeleted: true,
      deletedAt: employee.deletedAt
    }, null, 2);

    writeAudit(
      req.body.actorRole || Role.HR_MANAGER,
      req.body.actorName || "HR Admin",
      "Employee Administration",
      "Delete",
      `Employee ${employee.name} (${employee.id}) soft-deleted from active system indexes`,
      "Success",
      prevEmpStr,
      nextEmpStr
    );
    res.json({ message: "Employee soft-deleted successfully", employee });
  } else {
    res.status(404).json({ error: "Employee not found" });
  }
});

// Restore Employee
app.post("/api/employees/:id/restore", (req, res) => {
  const employee = db.employees.find(e => e.id === req.params.id);
  if (employee) {
    const prevEmpStr = JSON.stringify({
      id: employee.id,
      name: employee.name,
      isDeleted: true,
      deletedAt: employee.deletedAt
    }, null, 2);

    employee.isDeleted = false;
    delete employee.deletedAt;

    const nextEmpStr = JSON.stringify({
      id: employee.id,
      name: employee.name,
      isDeleted: false
    }, null, 2);

    writeAudit(
      req.body.actorRole || Role.SUPER_ADMIN,
      req.body.actorName || "Security Director",
      "Employee Administration",
      "Update",
      `Employee ${employee.name} (${employee.id}) restored from trash-bin back into active corporate rolls.`,
      "Success",
      prevEmpStr,
      nextEmpStr
    );
    res.json({ message: "Employee reference status restored", employee });
  } else {
    res.status(404).json({ error: "Employee not found" });
  }
});

// Permanent Purge Employee
app.delete("/api/employees/:id/purge", (req, res) => {
  const index = db.employees.findIndex(e => e.id === req.params.id);
  if (index !== -1) {
    const emp = db.employees[index];
    const prevEmpStr = JSON.stringify({
      id: emp.id,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      baseSalary: emp.baseSalary
    }, null, 2);

    db.employees.splice(index, 1);

    const nextEmpStr = "Employee Record Permanently Purged From Database Directory";

    writeAudit(
      req.body.actorRole || Role.SUPER_ADMIN,
      req.body.actorName || "Security Director",
      "Employee Administration",
      "Delete",
      `Employee ${emp.name} (${emp.id}) permanently purged from central system databases.`,
      "Success",
      prevEmpStr,
      nextEmpStr
    );
    res.json({ message: `Employee record ${emp.id} permanently purged` });
  } else {
    res.status(404).json({ error: "Employee not found in registry" });
  }
});

// Helper functions for time conversion and calculations
function getMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function calculateAttendanceMetrics(record: any) {
  let worked = 0;
  if (record.checkIn1 && record.checkOut1) worked += Math.max(0, getMinutes(record.checkOut1) - getMinutes(record.checkIn1));
  if (record.checkIn2 && record.checkOut2) worked += Math.max(0, getMinutes(record.checkOut2) - getMinutes(record.checkIn2));
  if (record.checkIn3 && record.checkOut3) worked += Math.max(0, getMinutes(record.checkOut3) - getMinutes(record.checkIn3));
  if (record.checkIn4 && record.checkOut4) worked += Math.max(0, getMinutes(record.checkOut4) - getMinutes(record.checkIn4));
  
  record.totalWorkedMinutes = worked;

  // Standard Shift Start is 09:00 (540 mins)
  const shiftStart = 540;
  let late = 0;
  if (record.checkIn1) {
    const actStart = getMinutes(record.checkIn1);
    if (actStart > shiftStart) {
      late = actStart - shiftStart;
    }
  }
  record.lateMinutes = late;

  // Overtime Calculation: total cumulative work > 8 hours (480 mins)
  const standardWorkMins = 480;
  let ot = 0;
  if (worked > standardWorkMins) {
    ot = worked - standardWorkMins;
  }
  record.overtimeMinutes = ot;

  // Backwards compatibility legacy fields
  record.clockIn = record.checkIn1 || undefined;
  record.clockOut = record.checkOut4 || record.checkOut3 || record.checkOut2 || record.checkOut1 || undefined;

  // Auto set status if worked
  if (worked > 0) {
    if (worked < 240) {
      record.status = "Half Day";
    } else if (late > 0) {
      record.status = "Late";
    } else {
      record.status = "Present";
    }
  }
}

// Toggle/Submit Attendance Clock event
app.post("/api/attendance/clock", (req, res) => {
  let { employeeId, status, clockIn, clockOut, notes } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const today = new Date().toISOString().split("T")[0];
  const existingIndex = db.attendance.findIndex(a => a.employeeId === employeeId && a.date === today);

  const now = new Date();
  const rawTimeStr = now.toTimeString().split(" ")[0].substring(0, 5); // "HH:MM"

  // Handle auto-detection check legacy/unspecified clock action
  if (!clockIn && !clockOut) {
    if (existingIndex !== -1) {
      const rec = db.attendance[existingIndex];
      if (rec.checkIn1 && !rec.checkOut1) {
        clockOut = rawTimeStr;
      } else if (rec.checkIn2 && !rec.checkOut2) {
        clockOut = rawTimeStr;
      } else if (rec.checkIn3 && !rec.checkOut3) {
        clockOut = rawTimeStr;
      } else if (rec.checkIn4 && !rec.checkOut4) {
        clockOut = rawTimeStr;
      } else {
        clockIn = rawTimeStr;
      }
    } else {
      clockIn = rawTimeStr;
    }
  }

  // Convert "true" or truthy placeholders to actual timestamp
  const targetClockIn = clockIn === "true" || clockIn === true ? rawTimeStr : clockIn;
  const targetClockOut = clockOut === "true" || clockOut === true ? rawTimeStr : clockOut;

  if (existingIndex !== -1) {
    const record = db.attendance[existingIndex];
    
    // Sequential punching
    if (targetClockIn) {
      // Find empty checkIn
      if (!record.checkIn1) record.checkIn1 = targetClockIn;
      else if (!record.checkIn2) record.checkIn2 = targetClockIn;
      else if (!record.checkIn3) record.checkIn3 = targetClockIn;
      else if (!record.checkIn4) record.checkIn4 = targetClockIn;
    } else if (targetClockOut) {
      // Find matching empty checkOut
      if (record.checkIn1 && !record.checkOut1) record.checkOut1 = targetClockOut;
      else if (record.checkIn2 && !record.checkOut2) record.checkOut2 = targetClockOut;
      else if (record.checkIn3 && !record.checkOut3) record.checkOut3 = targetClockOut;
      else if (record.checkIn4 && !record.checkOut4) record.checkOut4 = targetClockOut;
    }

    if (notes !== undefined) {
      record.notes = notes;
    }

    calculateAttendanceMetrics(record);
    if (status) record.status = status; // Overrides if supplied

    writeAudit(employee.role, employee.name, "Attendance", `Punch ${targetClockIn ? 'In' : 'Out'}`, `Punched sequential index for employee ${employeeId}`);
    res.json({ message: "Attendance card updated", entry: record });
  } else {
    // Brand new day record
    const newEntry: Attendance = {
      id: `A-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId,
      employeeName: employee.name,
      date: today,
      status: status || "Present",
      notes
    };

    if (targetClockIn) {
      newEntry.checkIn1 = targetClockIn;
    } else if (targetClockOut) {
      newEntry.checkIn1 = "09:00"; // Assume standard inception if missed checkIn
      newEntry.checkOut1 = targetClockOut;
    }

    calculateAttendanceMetrics(newEntry);
    if (status) newEntry.status = status;

    db.attendance.push(newEntry);
    writeAudit(employee.role, employee.name, "Attendance", `Shift Entry Initiated`, `First daily punch for employee ${employeeId}`);
    res.status(201).json({ message: "Clock-in record punched", entry: newEntry });
  }
});

// Admin Manual Save/Update Attendance Record
app.post("/api/attendance/save", (req, res) => {
  const { id, employeeId, date, checkIn1, checkOut1, checkIn2, checkOut2, checkIn3, checkOut3, checkIn4, checkOut4, status, notes, actorRole, actorName } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  let record: any;
  if (id) {
    record = db.attendance.find(a => a.id === id);
  } else {
    record = db.attendance.find(a => a.employeeId === employeeId && a.date === date);
  }

  if (record) {
    record.checkIn1 = checkIn1 || undefined;
    record.checkOut1 = checkOut1 || undefined;
    record.checkIn2 = checkIn2 || undefined;
    record.checkOut2 = checkOut2 || undefined;
    record.checkIn3 = checkIn3 || undefined;
    record.checkOut3 = checkOut3 || undefined;
    record.checkIn4 = checkIn4 || undefined;
    record.checkOut4 = checkOut4 || undefined;
    record.notes = notes || undefined;
    record.status = status;
    record.date = date;

    calculateAttendanceMetrics(record);
    if (status) record.status = status; // Keep user status

    writeAudit(actorRole || Role.HR_MANAGER, actorName || "Security Manager", "Attendance", "Manual Adjustment", `Manually updated attendance ledger for ${record.employeeName} on ${record.date}`);
    res.json({ message: "Attendance record adjusted manually", entry: record });
  } else {
    const newRecord: Attendance = {
      id: `A-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId,
      employeeName: employee.name,
      date,
      checkIn1,
      checkOut1,
      checkIn2,
      checkOut2,
      checkIn3,
      checkOut3,
      checkIn4,
      checkOut4,
      status: status || "Present",
      notes
    };

    calculateAttendanceMetrics(newRecord);
    if (status) newRecord.status = status; // Keep specified status

    db.attendance.push(newRecord);
    writeAudit(actorRole || Role.HR_MANAGER, actorName || "Security Manager", "Attendance", "Manual Entry", `Manually created attendance record for ${employee.name} on ${date}`);
    res.status(201).json({ message: "Attendance record appended manually", entry: newRecord });
  }
});

// Create Correction Request
app.post("/api/attendance/corrections", (req, res) => {
  const { employeeId, date, checkIn1, checkOut1, checkIn2, checkOut2, checkIn3, checkOut3, checkIn4, checkOut4, reason } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const newCorrection: AttendanceCorrection = {
    id: `COR-${Math.floor(1000 + Math.random() * 9000)}`,
    employeeId,
    employeeName: employee.name,
    date,
    checkIn1,
    checkOut1,
    checkIn2,
    checkOut2,
    checkIn3,
    checkOut3,
    checkIn4,
    checkOut4,
    reason,
    status: "Pending",
    requestedAt: new Date().toISOString()
  };

  db.corrections.push(newCorrection);
  writeAudit(employee.role, employee.name, "Attendance", "Correction Requested", `Submitted clocking correction request for ${date}`);
  res.status(201).json({ message: "Correction request filed successfully", correction: newCorrection });
});

// Approve/Reject Correction Request
app.post("/api/attendance/corrections/action", (req, res) => {
  const { id, status, comments, actorRole, actorName } = req.body;
  const correction = db.corrections.find(c => c.id === id);
  if (!correction) return res.status(404).json({ error: "Correction request not found" });

  correction.status = status;
  correction.comments = comments;
  correction.resolvedBy = actorName;
  correction.resolvedAt = new Date().toISOString();

  if (status === "Approved") {
    // Find or create attendance record
    let record = db.attendance.find(a => a.employeeId === correction.employeeId && a.date === correction.date);
    if (!record) {
      record = {
        id: `A-${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId: correction.employeeId,
        employeeName: correction.employeeName,
        date: correction.date,
        status: "Present"
      };
      db.attendance.push(record);
    }

    record.checkIn1 = correction.checkIn1 || record.checkIn1;
    record.checkOut1 = correction.checkOut1 || record.checkOut1;
    record.checkIn2 = correction.checkIn2 || record.checkIn2;
    record.checkOut2 = correction.checkOut2 || record.checkOut2;
    record.checkIn3 = correction.checkIn3 || record.checkIn3;
    record.checkOut3 = correction.checkOut3 || record.checkOut3;
    record.checkIn4 = correction.checkIn4 || record.checkIn4;
    record.checkOut4 = correction.checkOut4 || record.checkOut4;

    calculateAttendanceMetrics(record);
    
    // Auto set notes to indicate correction approval
    record.notes = `Approved Attendance Correction Request ${correction.id}. ${correction.reason}`;
  }

  writeAudit(actorRole || Role.HR_MANAGER, actorName || "Attendance Admin", "Attendance", `Correction ${status}`, `Resolved correction request ${id} as ${status}`);
  res.json({ message: `Correction request ${status.toLowerCase()} successfully`, correction });
});

// --- Leave Management Engine Helpers ---
function getDurationInDays(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function ensureEmployeeLeaveBalance(employeeId: string, name: string): EmployeeLeaveBalance {
  let bal = db.leaveBalances.find(b => b.employeeId === employeeId);
  if (!bal) {
    bal = {
      id: `BAL-${employeeId}`,
      employeeId,
      employeeName: name,
      year: 2026,
      annualAllocation: 14,
      annualCarriedForward: 0,
      annualUsed: 0,
      casualAllocation: 7,
      casualUsed: 0,
      medicalAllocation: 14,
      medicalUsed: 0,
      maternityAllocation: 84,
      maternityUsed: 0,
      specialAllocation: 5,
      specialUsed: 0,
      noPayUsed: 0
    };
    db.leaveBalances.push(bal);
  }
  return bal;
}

function hasSufficientLeaveBalance(bal: EmployeeLeaveBalance, type: string, days: number): { allowed: boolean; remaining: number } {
  const t = type.toLowerCase();
  if (t.includes("no pay") || t.includes("unpaid")) {
    return { allowed: true, remaining: 999 };
  }
  
  if (t.includes("annual")) {
    const totalAllowed = bal.annualAllocation + bal.annualCarriedForward;
    const remaining = totalAllowed - bal.annualUsed;
    return { allowed: remaining >= days, remaining };
  } else if (t.includes("casual")) {
    const remaining = bal.casualAllocation - bal.casualUsed;
    return { allowed: remaining >= days, remaining };
  } else if (t.includes("sick") || t.includes("medical")) {
    const remaining = bal.medicalAllocation - bal.medicalUsed;
    return { allowed: remaining >= days, remaining };
  } else if (t.includes("maternity")) {
    const remaining = bal.maternityAllocation - bal.maternityUsed;
    return { allowed: remaining >= days, remaining };
  } else if (t.includes("special")) {
    const remaining = bal.specialAllocation - bal.specialUsed;
    return { allowed: remaining >= days, remaining };
  }
  
  return { allowed: true, remaining: 999 };
}

function getUnpaidDaysInMonth(employeeId: string, monthStr: string): number {
  const unpaidLeaves = db.leaves.filter(l => 
    l.employeeId === employeeId && 
    l.status === "Approved" && 
    (l.leaveType.toLowerCase().includes("unpaid") || l.leaveType.toLowerCase().includes("no pay"))
  );
  
  let totalDays = 0;
  unpaidLeaves.forEach(l => {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    
    let curr = new Date(start);
    while (curr <= end) {
      const year = curr.getFullYear();
      const monthNum = curr.getMonth() + 1;
      const formattedMonth = `${year}-${monthNum < 10 ? '0' + monthNum : monthNum}`;
      if (formattedMonth === monthStr) {
        totalDays++;
      }
      curr.setDate(curr.getDate() + 1);
    }
  });
  return totalDays;
}

// REST Leave Endpoints
app.post("/api/leaves", (req, res) => {
  const { employeeId, leaveType, startDate, endDate, reason } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const durationDays = getDurationInDays(startDate, endDate);
  const bal = ensureEmployeeLeaveBalance(employeeId, employee.name);
  
  // Validate remaining balance
  const check = hasSufficientLeaveBalance(bal, leaveType, durationDays);
  if (!check.allowed) {
    return res.status(400).json({ 
      error: `Insufficient Leave Balance. You requested ${durationDays} days of '${leaveType}' but your remaining balance is only ${check.remaining} days.` 
    });
  }

  const newLeave: LeaveRequest = {
    id: `L-${Math.floor(100 + Math.random() * 900)}`,
    employeeId,
    employeeName: employee.name,
    leaveType,
    startDate,
    endDate,
    reason,
    durationDays,
    status: "Pending",
    managerApproval: "Pending",
    hrApproval: "Pending",
    payrollImpacted: false
  };

  db.leaves.push(newLeave);
  writeAudit(employee.role, employee.name, "Leave Management", "Leave Requested", `Requested ${durationDays} days of ${leaveType} starting ${startDate}`);
  
  // Trigger system notification
  triggerNotification(
    employeeId,
    "Leave Request",
    `Dear {name}, your Leave Request of ${durationDays} days (${leaveType}) starting ${startDate} to ${endDate} has been submitted for approvals.`
  );

  res.status(201).json({ message: "Leave requested successfully", leave: newLeave });
});

app.put("/api/leaves/:id", (req, res) => {
  const { status, approvedBy, comments, action, actorRole, actorName } = req.body;
  const leave = db.leaves.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ error: "Leave request not found" });

  const durationDays = leave.durationDays || getDurationInDays(leave.startDate, leave.endDate);

  // Use either multi-stage "action" parameter or fallback directly to single-action "status" override
  if (action) {
    if (action === "ManagerApprove") {
      const oldVal = JSON.stringify({ managerApproval: leave.managerApproval || "Pending", status: leave.status }, null, 2);
      leave.managerApproval = "Approved";
      leave.managerApprovedBy = actorName || actorRole;
      leave.managerApprovedAt = new Date().toISOString();
      // Leave still pending HR
      leave.status = "Pending";
      const newVal = JSON.stringify({ managerApproval: "Approved", status: "Pending" }, null, 2);
      writeAudit(actorRole || Role.BRANCH_MANAGER, actorName || "Manager", "Leave Management", "Approve", `Manager approved leave request ${leave.id} for ${leave.employeeName}`, "Success", oldVal, newVal);
    } else if (action === "ManagerReject") {
      const oldVal = JSON.stringify({ managerApproval: leave.managerApproval || "Pending", status: leave.status }, null, 2);
      leave.managerApproval = "Rejected";
      leave.status = "Rejected";
      leave.comments = comments || "Rejected by Manager";
      const newVal = JSON.stringify({ managerApproval: "Rejected", status: "Rejected", comments: leave.comments }, null, 2);
      writeAudit(actorRole || Role.BRANCH_MANAGER, actorName || "Manager", "Leave Management", "Reject", `Manager rejected leave request ${leave.id} for ${leave.employeeName}`, "Success", oldVal, newVal);
    } else if (action === "HrApprove") {
      const oldVal = JSON.stringify({ hrApproval: leave.hrApproval || "Pending", status: leave.status }, null, 2);
      leave.hrApproval = "Approved";
      leave.hrApprovedBy = actorName || actorRole;
      leave.hrApprovedAt = new Date().toISOString();
      leave.status = "Approved";
      leave.approvedBy = actorName || actorRole;
      leave.comments = comments || leave.comments;

      // Final HR Approval deducts from balance
      const bal = ensureEmployeeLeaveBalance(leave.employeeId, leave.employeeName);
      const t = leave.leaveType.toLowerCase();
      if (t.includes("annual")) {
        bal.annualUsed += durationDays;
      } else if (t.includes("casual")) {
        bal.casualUsed += durationDays;
      } else if (t.includes("sick") || t.includes("medical")) {
        bal.medicalUsed += durationDays;
      } else if (t.includes("maternity")) {
        bal.maternityUsed += durationDays;
      } else if (t.includes("special")) {
        bal.specialUsed += durationDays;
      } else if (t.includes("no pay") || t.includes("unpaid")) {
        bal.noPayUsed += durationDays;
        leave.payrollImpacted = true;
      }
      
      const employee = db.employees.find(e => e.id === leave.employeeId);
      if (employee) employee.status = "On Leave";

      const newVal = JSON.stringify({ hrApproval: "Approved", status: "Approved", comments: leave.comments }, null, 2);
      writeAudit(actorRole || Role.HR_MANAGER, actorName || "HR Admin", "Leave Management", "Approve", `HR approved and finalized leave request ${leave.id} for ${leave.employeeName} (${durationDays} days)`, "Success", oldVal, newVal);
    } else if (action === "HrReject") {
      const oldVal = JSON.stringify({ hrApproval: leave.hrApproval || "Pending", status: leave.status }, null, 2);
      leave.hrApproval = "Rejected";
      leave.status = "Rejected";
      leave.comments = comments || "Rejected by HR";
      const newVal = JSON.stringify({ hrApproval: "Rejected", status: "Rejected", comments: leave.comments }, null, 2);
      writeAudit(actorRole || Role.HR_MANAGER, actorName || "HR Admin", "Leave Management", "Reject", `HR rejected leave request ${leave.id} for ${leave.employeeName}`, "Success", oldVal, newVal);
    }
  } else {
    // Legacy support direct approval/rejection
    const oldVal = JSON.stringify({ status: leave.status, comments: leave.comments }, null, 2);
    leave.status = status;
    leave.approvedBy = approvedBy || "AdminOverride";
    leave.comments = comments;

    if (status === "Approved") {
      leave.managerApproval = "Approved";
      leave.hrApproval = "Approved";
      
      const bal = ensureEmployeeLeaveBalance(leave.employeeId, leave.employeeName);
      const t = leave.leaveType.toLowerCase();
      if (t.includes("annual")) {
        bal.annualUsed += durationDays;
      } else if (t.includes("casual")) {
        bal.casualUsed += durationDays;
      } else if (t.includes("sick") || t.includes("medical")) {
        bal.medicalUsed += durationDays;
      } else if (t.includes("maternity")) {
        bal.maternityUsed += durationDays;
      } else if (t.includes("special")) {
        bal.specialUsed += durationDays;
      } else if (t.includes("unpaid") || t.includes("no pay")) {
        bal.noPayUsed += durationDays;
        leave.payrollImpacted = true;
      }

      const employee = db.employees.find(e => e.id === leave.employeeId);
      if (employee) employee.status = "On Leave";
    } else {
      leave.managerApproval = "Rejected";
      leave.hrApproval = "Rejected";
    }
    const newVal = JSON.stringify({ status: leave.status, comments: leave.comments }, null, 2);
    const actionTag = status === "Approved" ? "Approve" : "Reject";
    writeAudit(Role.HR_MANAGER, approvedBy || "AdminOverride", "Leave Management", actionTag, `Direct override leave request ${leave.id} to ${status}`, "Success", oldVal, newVal);
  }

  // Trigger system notification if finalized (Approved or Rejected)
  if (leave.status === "Approved" || leave.status === "Rejected") {
    triggerNotification(
      leave.employeeId,
      "Leave Approval",
      `Dear {name}, your Leave Request (${leave.leaveType}) of ${durationDays} days starting ${leave.startDate} has been ${leave.status}. remarks/comments: "${leave.comments || "Reviewed"}"`
    );
  }

  res.json({ message: `Leave request ${leave.status.toLowerCase()}`, leave });
});

// Carry Forward Logic API
app.post("/api/leaves/carry-forward", (req, res) => {
  const { employeeId, actorRole, actorName } = req.body;
  let targets = db.leaveBalances;
  if (employeeId) {
    targets = db.leaveBalances.filter(b => b.employeeId === employeeId);
  }

  targets.forEach(bal => {
    const remainingAnnual = (bal.annualAllocation + bal.annualCarriedForward) - bal.annualUsed;
    const carryAmount = Math.max(0, Math.min(remainingAnnual, 7)); // max 7 days rule
    
    bal.annualCarriedForward = carryAmount;
    bal.annualUsed = 0;
    bal.casualUsed = 0;
    bal.medicalUsed = 0;
    bal.maternityUsed = 0;
    bal.specialUsed = 0;
    bal.noPayUsed = 0;
  });

  writeAudit(actorRole || Role.HR_MANAGER, actorName || "HR Admin", "Leave Management", "Carry Forward Run", `Rolled over unused leave for year-end carry forward (${employeeId ? employeeId : 'All Staff'}).`);
  res.json({ message: `Success! Carried forward unused Annual Leaves.`, balances: db.leaveBalances });
});

// Leave Encashment Request API
app.post("/api/leaves/encash", (req, res) => {
  const { employeeId, daysToEncash, month, actorRole, actorName } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const bal = ensureEmployeeLeaveBalance(employeeId, employee.name);
  const remainingAnnual = (bal.annualAllocation + bal.annualCarriedForward) - bal.annualUsed;

  if (daysToEncash > remainingAnnual) {
    return res.status(400).json({ 
      error: `Insufficient Annual Leave balance. You requested to encash ${daysToEncash} days, but you only have ${remainingAnnual} days remaining.` 
    });
  }

  const dailyRate = Math.round(employee.baseSalary / 30);
  const amountPaid = daysToEncash * dailyRate;

  const newEncash: LeaveEncashment = {
    id: `ENC-${Math.floor(100 + Math.random() * 900)}`,
    employeeId,
    employeeName: employee.name,
    month,
    daysToEncash,
    dailyRate,
    amountPaid,
    status: "Pending",
    requestedDate: new Date().toISOString().split("T")[0]
  };

  db.encashments.push(newEncash);
  writeAudit(employee.role, employee.name, "Leave Management", "Encash Requested", `Applied to encash ${daysToEncash} days in ${month} (Value: Rs. ${amountPaid.toLocaleString()})`);
  res.status(201).json({ message: "Leave encashment requested", encashment: newEncash });
});

// Leave Encashment Process API
app.put("/api/leaves/encash/:id", (req, res) => {
  const { status, actorRole, actorName, comments } = req.body;
  const encash = db.encashments.find(e => e.id === req.params.id);
  if (!encash) return res.status(404).json({ error: "Encashment request not found" });

  encash.status = status;
  encash.processedBy = actorName || actorRole;
  encash.comments = comments;

  if (status === "Approved") {
    // Deduct from remaining annual balance immediately
    const bal = ensureEmployeeLeaveBalance(encash.employeeId, encash.employeeName);
    bal.annualUsed += encash.daysToEncash;
    writeAudit(actorRole || Role.HR_MANAGER, actorName || "HR Admin", "Leave Management", "Encash Approved", `Approved encashment of ${encash.daysToEncash} days for ${encash.employeeName}. Realized payout on next payroll cycle.`);
  } else {
    writeAudit(actorRole || Role.HR_MANAGER, actorName || "HR Admin", "Leave Management", "Encash Rejected", `Rejected encashment of ${encash.daysToEncash} days for ${encash.employeeName}`);
  }

  res.json({ message: `Encashment request ${status.toLowerCase()}`, encashment: encash });
});

// Salary advances
app.post("/api/advances", (req, res) => {
  const { employeeId, requestAmount, reason, installmentPeriod, recoveryMethod, actorRole, actorName } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const finalRecoveryMethod = recoveryMethod || "Installment";
  const finalInstallmentPeriod = finalRecoveryMethod === "Single" ? 1 : (parseInt(installmentPeriod) || 6);
  const monthlyDeduction = finalRecoveryMethod === "Single" ? requestAmount : Math.round(requestAmount / finalInstallmentPeriod);

  const newAdvance: SalaryAdvance = {
    id: `S-ADV-${Math.floor(100 + Math.random() * 900)}`,
    employeeId,
    employeeName: employee.name,
    requestAmount,
    reason,
    installmentPeriod: finalInstallmentPeriod,
    monthlyDeduction,
    status: "Pending",
    requestDate: new Date().toISOString().split("T")[0],
    recoveryMethod: finalRecoveryMethod,
    recoveredSoFar: 0
  };

  db.advances.push(newAdvance);

  writeAudit(
    actorRole || Role.EMPLOYEE,
    actorName || employee.name,
    "Advance Management",
    "Advance Requested",
    `Requested salary advance of Rs. ${requestAmount.toLocaleString()} via ${finalRecoveryMethod} Recovery (${finalInstallmentPeriod} mos). Reason: ${reason}`,
    "Success"
  );

  // Trigger system notification
  triggerNotification(
    employeeId,
    "Advance Request",
    `Dear {name}, your Salary Advance request of Rs. ${requestAmount.toLocaleString()} has been queued for system review.`
  );

  res.status(201).json({ message: "Salary advance requested successfully", advance: newAdvance });
});

app.put("/api/advances/:id", (req, res) => {
  const { status, remarks, actorRole, actorName } = req.body;
  const adv = db.advances.find(a => a.id === req.params.id);
  if (!adv) return res.status(404).json({ error: "Advance request not found" });

  const oldStatus = adv.status;
  adv.status = status;
  if (remarks) {
    adv.comments = remarks;
  }

  writeAudit(
    actorRole || Role.HR_MANAGER,
    actorName || "HR Manager",
    "Advance Management",
    status === "Approved" ? "Advance Approved" : "Advance Rejected",
    `Advance request ${adv.id} for ${adv.employeeName} updated from ${oldStatus} to ${status}. Details: ${adv.reason}`,
    "Success"
  );

  // Trigger system notification
  if (status === "Approved" || status === "Rejected") {
    triggerNotification(
      adv.employeeId,
      "Advance Approval",
      `Dear {name}, your Salary Advance request of Rs. ${adv.requestAmount.toLocaleString()} has been ${status}. Remarks: "${adv.comments || "Reviewed"}"`
    );
  }

  res.json({ message: `Advance request ${status.toLowerCase()}`, advance: adv });
});

// Advance Disbursement Endpoint
app.put("/api/advances/:id/disburse", (req, res) => {
  const { actorRole, actorName } = req.body;
  const adv = db.advances.find(a => a.id === req.params.id);
  if (!adv) return res.status(404).json({ error: "Advance not found" });

  if (adv.status !== "Approved") {
    return res.status(400).json({ error: "Only approved advances can be disbursed." });
  }

  adv.status = "Disbursed";
  adv.disbursedDate = new Date().toISOString().split("T")[0];
  adv.disbursedBy = actorName || "Security Manager";
  adv.recoveredSoFar = 0;

  // Log to corporate ledger (money leaving company treasury => debit ledger for employee)
  logToLedger(
    adv.employeeId,
    "Salary Advance",
    adv.id,
    adv.requestAmount,
    0
  );

  writeAudit(
    actorRole || Role.ACCOUNTANT,
    actorName || "Accountant Core",
    "Advance Management",
    "Advance Disbursed",
    `Disbursed advance Rs. ${adv.requestAmount.toLocaleString()} to ${adv.employeeName} for request ID ${adv.id}`,
    "Success"
  );

  res.json({ message: "Salary advance successfully disbursed and recorded in company accounting ledger.", advance: adv });
});

// Advance Repayment / Settlement Endpoint (Manual Cash Recovery)
app.put("/api/advances/:id/repay", (req, res) => {
  const { amount, note, actorRole, actorName } = req.body;
  const adv = db.advances.find(a => a.id === req.params.id);
  if (!adv) return res.status(404).json({ error: "Advance not found" });

  const repayAmt = Number(amount) || 0;
  if (repayAmt <= 0) return res.status(400).json({ error: "Repayment amount must be greater than zero." });

  adv.recoveredSoFar = (adv.recoveredSoFar || 0) + repayAmt;
  if (adv.recoveredSoFar >= adv.requestAmount) {
    adv.status = "Fully Recovered";
  }

  // Log to company ledger (repayment received from employee => credit employee ledger)
  logToLedger(
    adv.employeeId,
    "Advance Recovery",
    adv.id,
    0,
    repayAmt
  );

  writeAudit(
    actorRole || Role.ACCOUNTANT,
    actorName || "Accountant",
    "Advance Management",
    "Manual Repayment",
    `Manual cash recovery of Rs. ${repayAmt.toLocaleString()} for advance ${adv.id} (${adv.employeeName}). Note: ${note || "Direct repayment"}`,
    "Success"
  );

  res.json({ message: "Repayment recorded successfully", advance: adv });
});

// Store Purchase Recovery Creation
app.post("/api/recoveries", (req, res) => {
  const { employeeId, itemName, totalCost, installmentPeriod } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const monthlyRecovery = Math.round(totalCost / installmentPeriod);
  const newRec: StorePurchaseRecovery = {
    id: `REC-${Math.floor(100 + Math.random() * 900)}`,
    employeeId,
    employeeName: employee.name,
    itemName,
    purchaseDate: new Date().toISOString().split("T")[0],
    totalCost,
    monthlyRecovery,
    recoveredSoFar: 0,
    status: "Active"
  };

  db.recoveries.push(newRec);
  // Log store purchase to ledger
  logToLedger(employeeId, "Staff Store Recovery", newRec.id, newRec.totalCost, 0);

  res.status(201).json({ message: "Employee store purchase recorded & amortized", recovery: newRec });
});

// Welfare Medical Assistance Claims
app.post("/api/claims", (req, res) => {
  const { employeeId, claimType, amount, description } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const newClaim: WelfareClaim = {
    id: `CLM-${Math.floor(100 + Math.random() * 900)}`,
    employeeId,
    employeeName: employee.name,
    claimType,
    amount,
    description,
    status: "Pending"
  };

  db.claims.push(newClaim);
  res.status(201).json({ message: "Welfare claim registered", claim: newClaim });
});

app.put("/api/claims/:id", (req, res) => {
  const { status, actorRole, actorName } = req.body;
  const claim = db.claims.find(c => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: "Claim request not found" });

  claim.status = status;
  claim.actionDate = new Date().toISOString().split("T")[0];
  claim.approvedBy = actorName || "HR Manager";

  if (status === "Approved") {
    // Paid out of company treasury (debit ledger)
    logToLedger(claim.employeeId, `${claim.claimType} Relief Aid`, claim.id, claim.amount, 0);
  }

  writeAudit(
    actorRole || Role.HR_MANAGER,
    actorName || "Administrative Dashboard",
    "Welfare & Medical Management",
    status,
    `Welfare claim request ${claim.id} of Rs. ${claim.amount.toLocaleString()} for ${claim.employeeName} (${claim.claimType}) set to ${status}`,
    "Success"
  );

  res.json({ message: `Assistance claim ${status.toLowerCase()}`, claim });
});

// Bonus management
app.post("/api/bonuses", (req, res) => {
  const { employeeId, bonusType, amount, description } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const newBonus: Bonus = {
    id: `BNS-${Math.floor(100 + Math.random() * 900)}`,
    employeeId,
    employeeName: employee.name,
    bonusType,
    amount,
    cycleDate: new Date().toISOString().split("T")[0],
    status: "Pending",
    description: description || ""
  };

  db.bonuses.push(newBonus);
  res.status(201).json({ message: "Bonus allocation scheduled", bonus: newBonus });
});

// Approve/Reject Bonus (Module 8 Approval Workflow)
app.put("/api/bonuses/:id/action", (req, res) => {
  const { status, actorRole, actorName } = req.body;
  const bonus = db.bonuses.find(b => b.id === req.params.id);
  if (!bonus) return res.status(404).json({ error: "Bonus allocation not found" });

  bonus.status = status; // "Approved" or "Rejected"
  bonus.approvedBy = actorName || "HR Manager";

  writeAudit(
    actorRole || Role.HR_MANAGER,
    actorName || "Administrative Dashboard",
    "Bonus Management",
    status,
    `Bonus incentive of Rs. ${bonus.amount.toLocaleString()} (${bonus.bonusType}) for ${bonus.employeeName} set to status ${status}`,
    "Success"
  );

  res.json({ message: `Bonus allocation ${status.toLowerCase()}`, bonus });
});

// Disburse Bonus
app.put("/api/bonuses/:id/disburse", (req, res) => {
  const bonus = db.bonuses.find(b => b.id === req.params.id);
  if (!bonus) return res.status(404).json({ error: "Bonus not found" });

  bonus.status = "Disbursed";
  // Log to ledger
  logToLedger(bonus.employeeId, "Bonus Credit", bonus.id, bonus.amount, 0);

  writeAudit(
    Role.SUPER_ADMIN,
    "Payment Gateway",
    "Bonus Management",
    "Disbursed",
    `Successfully disbursed Bonus incentive ${bonus.id} (LKR ${bonus.amount.toLocaleString()}) for ${bonus.employeeName}`,
    "Success"
  );

  res.json({ message: "Bonus disbursed and credited to salary ledger", bonus });
});

// Performance Appraisal Scorecard
app.post("/api/appraisals", (req, res) => {
  const { employeeId, appraisalPeriod, ratings, evaluatorComments, evaluatorName } = req.body;
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const values = Object.values(ratings || {}).filter((v): v is number => typeof v === 'number');
  const score = values.length > 0 ? (values.reduce((sum, v) => sum + v, 0) / values.length) : 3.0;

  // Compute rating and promotion recommendation (Module 10 Scoring Engine & Rating System)
  const ldrRating = ratings.leadership !== undefined ? ratings.leadership : 3;
  const prodRating = ratings.productivity !== undefined ? ratings.productivity : 3;
  let promoRec = "Maintain Current Role (Steady State)";
  if (score >= 4.5 && ldrRating >= 4 && prodRating >= 4) {
    promoRec = "Highly Recommended for Promotion";
  } else if (score >= 3.8) {
    promoRec = "Recommended for Progression";
  } else if (score >= 2.8) {
    promoRec = "Maintain Current Role (Steady State)";
  } else {
    promoRec = "Structured Growth & Advisory Plan Required";
  }

  const newAppraisal: PerformanceAppraisal = {
    id: `APR-${Math.floor(100 + Math.random() * 900)}`,
    employeeId,
    employeeName: employee.name,
    appraisalPeriod,
    ratings,
    overallScore: score,
    evaluatorComments,
    evaluatorName,
    status: "Draft",
    dateCreated: new Date().toISOString().split("T")[0],
    promotionRecommendation: promoRec
  };

  db.appraisals.push(newAppraisal);
  res.status(201).json({ message: "Appraisal scorecard created", appraisal: newAppraisal });
});

app.put("/api/appraisals/:id/finalize", (req, res) => {
  const appraisal = db.appraisals.find(a => a.id === req.params.id);
  if (!appraisal) return res.status(404).json({ error: "Appraisal not found" });

  appraisal.status = "Finalized";
  res.json({ message: "Performance evaluation appraisal finalized", appraisal });
});

// API endpoint for AI generating Feedback using Gemini
app.post("/api/appraisal/generate-ai-fb", async (req, res) => {
  const { employeeName, ratings, evaluatorComments } = req.body;
  if (!ratings) {
    return res.status(400).json({ error: "Ratings parameters are required for AI generation" });
  }

  const promptText = `
  You are an expert HR Development Consultant and Performance Coach.
  Generate constructive, feedback-rich, professional action-oriented improvement suggestions for our employee: ${employeeName || "Team Member"}.
  The ratings (out of 5) are:
  - Attendance: ${ratings.attendance || 4}/5
  - Discipline: ${ratings.discipline || 4}/5
  - Knowledge: ${ratings.knowledge || 4}/5
  - Communication: ${ratings.communication || 4}/5
  - Teamwork: ${ratings.teamwork || 4}/5
  - Leadership: ${ratings.leadership || 4}/5
  - Productivity: ${ratings.productivity || 4}/5

  Manager Comments: "${evaluatorComments || "Steady performance"}"

  Please write a precise, professional 3-sentence list of concrete, practical, and highly encouraging actions the employee can take to further boost their performance ratings in the next cycle. Return strictly the text response with NO markdown titles or extra fluff.
  `;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      // Fallback response when key is unconfigured or a dummy placeholder to assure robustness
      const values = Object.values(ratings || {}).filter((v): v is number => typeof v === 'number');
      const averageScore = values.length > 0 ? (values.reduce((sum, v) => sum + v, 0) / values.length) : 3.0;
      let mockSuggestion = "";
      if (averageScore >= 4.5) {
         mockSuggestion = "1. Active leadership: spearhead collaborative knowledge share panels with broader squads. 2. Quality discipline: formulate advanced engineering test models to boost velocity. 3. Communication: offer guidance and continuous mentoring to new associates.";
      } else if (averageScore >= 3.5) {
         mockSuggestion = "1. Knowledge boost: complete industry certificates corresponding to current department tasks. 2. Productivity: refine your planning routines to meet sprints predictably. 3. Attendance & discipline: join shift discussions on time to align teammate objectives.";
      } else {
         mockSuggestion = "1. Teamwork pairing: work closely with a senior staff buddy to build code confidence. 2. Discipline checks: verify and test deliverables rigorously prior to QA review. 3. Communication goals: update project progress logs daily with clear feedback.";
      }
      return res.json({ advice: mockSuggestion });
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText
    });

    res.json({ advice: response.text?.trim() || "No advice generated. Continue doing excellent work!" });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "AI coaching engine failed. Please try again soon." });
  }
});

// Sri Lankan Inland Revenue APIT calculation function (monthly slabs, effective as of recent years)
function calculateSriLankanAPIT(grossSalary: number): number {
  if (grossSalary <= 100000) return 0;
  let taxable = grossSalary - 100000;
  let tax = 0;
  const slabSize = 41667;
  const rates = [0.06, 0.12, 0.18, 0.24, 0.30];
  
  for (let i = 0; i < rates.length; i++) {
    if (taxable > slabSize) {
      tax += slabSize * rates[i];
      taxable -= slabSize;
    } else {
      tax += taxable * rates[i];
      taxable = 0;
      break;
    }
  }
  
  if (taxable > 0) {
    tax += taxable * 0.36; // excess over Rs 308,333
  }
  
  return Math.round(tax);
}

// Fully automated Calculation & Validation Engine for Sri Lankan Standards
function calculateEmployeePayroll(
  employeeId: string,
  month: string,
  overrides?: {
    performanceBonus?: number;
    allowancesOverride?: Record<string, number>;
    deductionsOverride?: Record<string, number>;
    overtimeOverride?: Record<string, number>;
  }
) {
  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }

  const baseSalary = employee.baseSalary;

  // Let's implement Attendance and Overtime calculations
  // Get attendance for the employee in this month
  const empAttendance = db.attendance.filter(a => a.employeeId === employeeId && a.date.startsWith(month));
  
  // High-fidelity calculation: Holiday OT vs Friday OT
  let holidayOtMinutes = 0;
  let fridayOtMinutes = 0;
  let lateMinutes = 0;
  let lateDays = 0;
  let presentDays = 0;

  empAttendance.forEach(a => {
    // Present/Active Days
    if (["Present", "Late", "Half Day", "Half-Day"].includes(a.status)) {
      presentDays += (a.status === "Half Day" || a.status === "Half-Day") ? 0.5 : 1;
    }
    // Late status / Minutes
    if (a.status === "Late" || (a.lateMinutes && a.lateMinutes > 0)) {
      lateDays++;
      lateMinutes += a.lateMinutes || 0;
    }
    
    // Overtime check
    const otMin = a.overtimeMinutes || 0;
    if (otMin > 0) {
      const dateObj = new Date(a.date);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6; // Sunday or Saturday
      const isHoliday = a.status === "Holiday";
      const isFriday = dateObj.getDay() === 5; // Friday

      if (isWeekend || isHoliday) {
        holidayOtMinutes += otMin;
      } else if (isFriday) {
        fridayOtMinutes += otMin;
      } else {
        fridayOtMinutes += otMin;
      }
    }
  });

  // Overtime amounts based on Sri Lankan hourly standard
  let holidayOt = Math.round((holidayOtMinutes / 60) * 350); // Holiday OT hourly rate Rs. 350
  let fridayOt = Math.round((fridayOtMinutes / 60) * 250);   // Friday OT hourly rate Rs. 250

  // Allows manual override
  if (overrides?.overtimeOverride) {
    if (overrides.overtimeOverride.holidayOt !== undefined) holidayOt = overrides.overtimeOverride.holidayOt;
    if (overrides.overtimeOverride.fridayOt !== undefined) fridayOt = overrides.overtimeOverride.fridayOt;
  }

  // Calculate leaves and unpaid deductions
  const unpaidDays = getUnpaidDaysInMonth(employeeId, month);
  const unpaidLeaveDeduction = Math.round(unpaidDays * (baseSalary / 30));

  const approvedEncashments = db.encashments.filter(
    e => e.employeeId === employeeId && e.month === month && e.status === "Approved"
  );
  const leaveEncashment = approvedEncashments.reduce((sum, e) => sum + e.amountPaid, 0);

  // Auto-calculated Allowances:
  // Attendance Allowance: Standard Rs. 5000, reduced by absent percentage or late check-ins
  const attendanceRate = empAttendance.length > 0 ? Math.min(1, presentDays / Math.max(1, empAttendance.length)) : 1;
  const autoAttendanceAllowance = Math.round(5000 * attendanceRate);
  
  const autoFuelAllowance = employee.role === Role.SUPER_ADMIN || employee.role === Role.HR_MANAGER ? 15000 : 8000;
  const autoTelephoneAllowance = 3000;
  const autoMealAllowance = 6000;
  const autoBudgetReliefAllowance = 3500; // standard allowance
  const autoInterimAllowance = 2500;
  const autoIncentiveAllowance = employee.role === Role.EMPLOYEE ? 4000 : 8000;
  const autoCustomAllowances = 0;

  // Let's merge standard overrides if provided
  let medical = Math.round(baseSalary * 0.04);
  let housing = Math.round(baseSalary * 0.08);
  let performance = overrides?.performanceBonus || 0;

  let attendanceAllowance = autoAttendanceAllowance;
  let fuelAllowance = autoFuelAllowance;
  let telephoneAllowance = autoTelephoneAllowance;
  let mealAllowance = autoMealAllowance;
  let budgetReliefAllowance = autoBudgetReliefAllowance;
  let interimAllowance = autoInterimAllowance;
  let incentiveAllowance = autoIncentiveAllowance;
  let customAllowances = autoCustomAllowances;

  if (overrides?.allowancesOverride) {
    const ao = overrides.allowancesOverride;
    if (ao.medical !== undefined) medical = ao.medical;
    if (ao.housing !== undefined) housing = ao.housing;
    if (ao.performance !== undefined) performance = ao.performance;
    if (ao.attendanceAllowance !== undefined) attendanceAllowance = ao.attendanceAllowance;
    if (ao.fuelAllowance !== undefined) fuelAllowance = ao.fuelAllowance;
    if (ao.telephoneAllowance !== undefined) telephoneAllowance = ao.telephoneAllowance;
    if (ao.mealAllowance !== undefined) mealAllowance = ao.mealAllowance;
    if (ao.budgetReliefAllowance !== undefined) budgetReliefAllowance = ao.budgetReliefAllowance;
    if (ao.interimAllowance !== undefined) interimAllowance = ao.interimAllowance;
    if (ao.incentiveAllowance !== undefined) incentiveAllowance = ao.incentiveAllowance;
    if (ao.customAllowances !== undefined) customAllowances = ao.customAllowances;
  }

  // Active bonuses - only Approved bonuses can be compiled into a payslip
  const pendingBonuses = db.bonuses.filter(b => b.employeeId === employeeId && b.status === "Approved" && b.cycleDate === month);
  const totalBonusToDisburse = pendingBonuses.reduce((sum, b) => sum + b.amount, 0);

  // Deductions: No Pay is unpaidLeaveDeduction
  // Advance Recovery:
  const activeAdvance = db.advances.find(a => a.employeeId === employeeId && a.status === "Disbursed");
  let advanceMinDeduction = 0;
  if (activeAdvance) {
    const totalToRecover = activeAdvance.requestAmount;
    const currentRecovered = activeAdvance.recoveredSoFar || 0;
    const remaining = Math.max(0, totalToRecover - currentRecovered);
    
    if (activeAdvance.recoveryMethod === "Single") {
      advanceMinDeduction = remaining;
    } else {
      advanceMinDeduction = Math.min(activeAdvance.monthlyDeduction, remaining);
    }
  }

  // Store purchase recovery
  const activeRecovery = db.recoveries.find(r => r.status === "Active" && r.employeeId === employeeId);
  let storeMinRecovery = activeRecovery ? activeRecovery.monthlyRecovery : 0;

  // Late Penalty: e.g., Rs. 100 per late arrival, or Rs. 10 per minute late
  let latePenalty = Math.round(lateMinutes * 5 + lateDays * 150);

  let otherDeductions = 0;

  if (overrides?.deductionsOverride) {
    const doOverrides = overrides.deductionsOverride;
    if (doOverrides.advanceRecovery !== undefined) advanceMinDeduction = doOverrides.advanceRecovery;
    if (doOverrides.storePurchaseRecovery !== undefined) storeMinRecovery = doOverrides.storePurchaseRecovery;
    if (doOverrides.latePenalty !== undefined) latePenalty = doOverrides.latePenalty;
    if (doOverrides.otherDeductions !== undefined) otherDeductions = doOverrides.otherDeductions;
  }

  // Calculate EPF base
  const pfBase = Math.max(0, baseSalary - unpaidLeaveDeduction);
  
  // Provident Fund (Employee EPF is 8%)
  const providentFund = Math.round(pfBase * 0.08);
  const employerEpf = Math.round(pfBase * 0.12);
  const employerEtf = Math.round(pfBase * 0.03);

  let etfDeduction = 0;
  if (overrides?.deductionsOverride?.etfDeduction !== undefined) {
    etfDeduction = overrides.deductionsOverride.etfDeduction;
  }

  // Calculate subject earnings for taxable cash (APIT)
  const totalAlls = medical + housing + performance + leaveEncashment + attendanceAllowance + fuelAllowance + telephoneAllowance + mealAllowance + budgetReliefAllowance + interimAllowance + incentiveAllowance + customAllowances;
  const subjectEarnings = Math.max(0, baseSalary - unpaidLeaveDeduction) + totalAlls + totalBonusToDisburse;
  
  const tax = calculateSriLankanAPIT(subjectEarnings);

  // Gross Salary = Basic Salary + Allowances + OT + Bonuses
  const grossSalary = baseSalary + totalAlls + holidayOt + fridayOt + totalBonusToDisburse;

  // Deductions = EPF + ETF + No Pay + Advance + Purchase + Late Penalty + Other Deductions + TAX
  const totalDeductions = tax + providentFund + etfDeduction + unpaidLeaveDeduction + advanceMinDeduction + storeMinRecovery + latePenalty + otherDeductions;

  // Net Salary = Gross Salary - Deductions
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  // Compile Validation warnings / messages
  const warnings: string[] = [];
  const infos: string[] = [];

  // check duplicate
  const duplicate = db.payslips.find(p => p.employeeId === employeeId && p.month === month);
  if (duplicate) {
    warnings.push(`CRITICAL: A payslip for ${employee.name} for the period ${month} already exists (ID: ${duplicate.id}). Please delete or modify it if needed.`);
  }

  // Active check
  if (employee.status !== "Active" && employee.status !== "On Leave") {
    warnings.push(`WARNING: Employee current status is "${employee.status}". This calculation should only be finalized for active personnel.`);
  }

  // Low Attendance check
  if (empAttendance.length < 5) {
    warnings.push(`WARNING: Minimal attendance registered for this pay cycle (${empAttendance.length} records). Please audit punch clocks.`);
  }

  // Over-recovery prevention
  if (activeAdvance) {
    const totalToRecover = activeAdvance.requestAmount;
    const currentRecovered = activeAdvance.recoveredSoFar || 0;
    const remaining = Math.max(0, totalToRecover - currentRecovered);
    if (advanceMinDeduction > remaining) {
      advanceMinDeduction = remaining;
      infos.push(`INFO: Advance recovery adjusted automatically to Rs. ${remaining.toLocaleString()} to match remaining balance of Advance ${activeAdvance.id}.`);
    }
  }

  // Capped Net Salary
  if (grossSalary < totalDeductions) {
    warnings.push(`CRITICAL: Total deductions (Rs. ${totalDeductions.toLocaleString()}) exceed gross earnings (Rs. ${grossSalary.toLocaleString()}). Net Salary has been capped at zero.`);
  }

  if (unpaidDays > 0) {
    infos.push(`INFO: ${unpaidDays} days of approved Unpaid Leave processed. Rs. ${unpaidLeaveDeduction.toLocaleString()} flat-day rate deducted.`);
  }
  if (totalBonusToDisburse > 0) {
    infos.push(`INFO: ${pendingBonuses.length} pending corporate bonuses pulled. Totaling Rs. ${totalBonusToDisburse.toLocaleString()}.`);
  }
  if (lateDays > 0) {
    infos.push(`INFO: ${lateDays} late entries clocked. Rs. ${latePenalty.toLocaleString()} late penalties compiled.`);
  }
  if (holidayOtMinutes > 0 || fridayOtMinutes > 0) {
    infos.push(`INFO: Overtime processed: Holiday OT: ${Math.round(holidayOtMinutes/60)} hrs, Friday OT: ${Math.round(fridayOtMinutes/60)} hrs.`);
  }

  return {
    employeeId,
    employeeName: employee.name,
    month,
    baseSalary,
    allowances: {
      medical,
      housing,
      performance,
      leaveEncashment,
      attendanceAllowance,
      fuelAllowance,
      telephoneAllowance,
      mealAllowance,
      budgetReliefAllowance,
      interimAllowance,
      incentiveAllowance,
      customAllowances
    },
    overtime: {
      holidayOt,
      fridayOt,
      holidayOtMinutes,
      fridayOtMinutes
    },
    deductions: {
      tax,
      providentFund,
      etfDeduction,
      advanceRecovery: advanceMinDeduction,
      storePurchaseRecovery: storeMinRecovery,
      unpaidLeaveDeduction,
      latePenalty,
      otherDeductions
    },
    employerEpf,
    employerEtf,
    bonusAmount: totalBonusToDisburse,
    grossSalary,
    netSalary,
    warnings,
    infos,
    pendingBonuses: pendingBonuses.map(b => b.id)
  };
}

// Dry-run calculation engine API
app.post("/api/payroll/calculate", (req, res) => {
  const { employeeId, month, performanceBonus, allowancesOverride, deductionsOverride, overtimeOverride } = req.body;
  if (!employeeId || !month) {
    return res.status(400).json({ error: "Employee ID and pay cycle month are required." });
  }

  try {
    const computed = calculateEmployeePayroll(employeeId, month, {
      performanceBonus,
      allowancesOverride,
      deductionsOverride,
      overtimeOverride
    });
    res.json(computed);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed computing payroll" });
  }
});

// Freeze/Lock payroll month API
app.post("/api/payroll/lock", (req, res) => {
  const { month, actorRole, actorName } = req.body;
  if (!month) return res.status(400).json({ error: "Month is required" });

  const matchingPayslips = db.payslips.filter(p => p.month === month);
  if (matchingPayslips.length === 0) {
    return res.status(400).json({ error: "No payslips found for this cycle to lock." });
  }

  let lockedCount = 0;
  matchingPayslips.forEach(p => {
    if (p.status === "Approved" || p.status === "Draft") {
      p.status = "Locked";
      p.lockedDate = new Date().toISOString().split("T")[0];
      p.lockedBy = actorName || "Security Manager";
      lockedCount++;

      // Trigger system notification
      triggerNotification(
        p.employeeId,
        "Payslip Ready",
        `Dear {name}, your Payslip for cycle ${month} is locked & ready for viewing. Net credited salary: Rs. ${p.netSalary.toLocaleString()}.`
      );
    }
  });

  writeAudit(
    actorRole || Role.HR_MANAGER,
    actorName || "HR Manager",
    "Payroll Core",
    "Lock Payroll",
    `Locked ${lockedCount} payslips for pay cycle ${month}. Standard calculations closed.`,
    "Success"
  );

  res.json({ message: `Successfully locked ${lockedCount} payslips for pay cycle ${month}.`, lockedCount });
});

// Update Payslip status / fields API
app.put("/api/payslips/:id", (req, res) => {
  const { status, actorRole, actorName } = req.body;
  const payslip = db.payslips.find(p => p.id === req.params.id);
  if (!payslip) return res.status(404).json({ error: "Payslip not found." });

  if (payslip.status === "Locked" || payslip.status === "Paid") {
    return res.status(400).json({ error: "Locked or already paid payslips cannot be transitioned." });
  }

  const oldStatus = payslip.status;
  payslip.status = status;

  writeAudit(
    actorRole || Role.HR_MANAGER,
    actorName || "HR Manager",
    "Payroll Core",
    "Payslip Status Update",
    `Updated payslip ${payslip.id} for ${payslip.employeeName} from ${oldStatus} to ${status}.`,
    "Success"
  );

  // Trigger system notification
  if (status === "Approved" || status === "Locked" || status === "Paid") {
    triggerNotification(
      payslip.employeeId,
      "Payslip Ready",
      `Dear {name}, your Payslip is now ${status} for cycle ${payslip.month}. Net payout: Rs. ${payslip.netSalary.toLocaleString()}.`
    );
  }

  res.json({ message: `Payslip status updated to ${status}`, payslip });
});

// Delete Draft Payslip API
app.delete("/api/payslips/:id", (req, res) => {
  const { id } = req.params;
  const index = db.payslips.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Payslip not found." });
  
  const ps = db.payslips[index];
  if (ps.status === "Locked" || ps.status === "Paid") {
    return res.status(400).json({ error: "Locked or paid payslips cannot be deleted or re-drafted." });
  }

  db.payslips.splice(index, 1);
  res.json({ message: "Payslip draft canceled/deleted successfully." });
});

// Save compiled draft payslip API
app.post("/api/payslips", (req, res) => {
  const { employeeId, month, performanceBonus, allowancesOverride, deductionsOverride, overtimeOverride, actorRole, actorName } = req.body;
  if (!employeeId || !month) {
    return res.status(400).json({ error: "Employee and pay cycle month are required." });
  }

  const employee = db.employees.find(e => e.id === employeeId);
  if (!employee) return res.status(404).json({ error: "Employee not found." });

  const existing = db.payslips.find(p => p.employeeId === employeeId && p.month === month);
  if (existing) return res.status(400).json({ error: "Payslip for this month already exists" });

  try {
    const computed = calculateEmployeePayroll(employeeId, month, {
      performanceBonus,
      allowancesOverride,
      deductionsOverride,
      overtimeOverride
    });

    const payslipId = `PS-${month.replace("-", "")}-${Math.floor(100 + Math.random() * 900)}`;
    const newPayslip: Payslip = {
      id: payslipId,
      employeeId,
      employeeName: employee.name,
      month,
      baseSalary: computed.baseSalary,
      allowances: computed.allowances,
      overtime: computed.overtime,
      deductions: computed.deductions,
      employerEpf: computed.employerEpf,
      employerEtf: computed.employerEtf,
      bonusAmount: computed.bonusAmount,
      grossSalary: computed.grossSalary,
      netSalary: computed.netSalary,
      status: "Draft"
    };

    db.payslips.push(newPayslip);

    // Trigger system notification
    triggerNotification(
      employeeId,
      "Payroll Generated",
      `Dear {name}, your payroll draft calculation for period ${month} has been compiled and is being processed for finalization.`
    );

    // Update bonuses
    const pendingBonuses = db.bonuses.filter(b => b.employeeId === employeeId && b.status === "Approved" && b.cycleDate === month);
    pendingBonuses.forEach(b => b.status = "Disbursed");

    writeAudit(
      actorRole || Role.PAYROLL_OFFICER,
      actorName || "Payroll Engine",
      "Automated Payroll",
      "Draft Compiled",
      `Compiled draft payslip ${payslipId} for ${employee.name} (${month}) with Net salary Rs. ${computed.netSalary.toLocaleString()}`,
      "Success"
    );

    res.status(201).json({ message: "Draft payslip compiled successfully", payslip: newPayslip, warnings: computed.warnings, infos: computed.infos });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Compilation failed" });
  }
});

// Pay Salary Payslip
app.put("/api/payslips/:id/pay", (req, res) => {
  const payslip = db.payslips.find(p => p.id === req.params.id);
  if (!payslip) return res.status(404).json({ error: "Payslip draft not found" });

  payslip.status = "Paid";
  payslip.paymentDate = new Date().toISOString().split("T")[0];

  // Log Salary to corporate Ledger
  logToLedger(payslip.employeeId, "Salary Payout", payslip.id, payslip.netSalary, 0);

  // If there was an advance recovery or store recovery deducted, reflect credit back on ledger as employee paying back!
  if (payslip.deductions.advanceRecovery > 0) {
    logToLedger(payslip.employeeId, "Advance Recovery", payslip.id, 0, payslip.deductions.advanceRecovery);
    const activeAdvance = db.advances.find(a => a.employeeId === payslip.employeeId && a.status === "Disbursed");
    if (activeAdvance) {
      activeAdvance.recoveredSoFar = (activeAdvance.recoveredSoFar || 0) + payslip.deductions.advanceRecovery;
      if (activeAdvance.recoveredSoFar >= activeAdvance.requestAmount) {
        activeAdvance.status = "Fully Recovered";
      }
    }
  }
  if (payslip.deductions.storePurchaseRecovery > 0) {
    const recoveryItem = db.recoveries.find(r => r.employeeId === payslip.employeeId && r.status === "Active");
    if (recoveryItem) {
      recoveryItem.recoveredSoFar += payslip.deductions.storePurchaseRecovery;
      if (recoveryItem.recoveredSoFar >= recoveryItem.totalCost) {
        recoveryItem.status = "Fully Recovered";
      }
    }
    logToLedger(payslip.employeeId, "Staff Store Recovery", payslip.id, 0, payslip.deductions.storePurchaseRecovery);
  }

  res.json({ message: "Salary dispatched & recorded in corporate ledger", payslip });
});

// Share Payslip via Email or WhatsApp (Module 7)
app.post("/api/payslips/share", (req, res) => {
  const { payslipId, mode, target, subject, body, hash } = req.body;
  const payslip = db.payslips.find(p => p.id === payslipId);
  if (!payslip) return res.status(404).json({ error: "Payslip statement not found" });

  writeAudit(
    Role.SUPER_ADMIN,
    "Payslip Digital Gateway",
    "Payslip System",
    `Disbursed via ${mode.toUpperCase()}`,
    `Successfully dispatched payslip certificate #${payslipId} for ${payslip.employeeName} to ${target}. Signed certification hash: ${hash}`,
    "Success"
  );

  res.json({ message: "Payslip statement shared successfully through corporate secure API gateways.", hash });
});

// Announcements
app.post("/api/announcements", (req, res) => {
  const newAnn: Announcement = {
    id: `ANC-${Math.floor(100 + Math.random() * 900)}`,
    title: req.body.title,
    body: req.body.body,
    priority: req.body.priority || "Medium",
    date: new Date().toISOString().split("T")[0]
  };
  db.announcements.unshift(newAnn);
  res.status(201).json({ message: "Announcement published", announcement: newAnn });
});

// Notification settings & logs endpoints (Module 11)
app.get("/api/notifications/settings", (req, res) => {
  res.json(db.notificationSettings);
});

app.post("/api/notifications/settings", (req, res) => {
  const updatedSettings = req.body.settings;
  if (Array.isArray(updatedSettings)) {
    db.notificationSettings = updatedSettings;
    writeAudit(Role.SUPER_ADMIN, "System Controller", "Notifications", "Update Settings", "Reconfigured notification matrix triggers.");
    return res.json({ message: "Notification routing settings updated successfully.", settings: db.notificationSettings });
  }
  res.status(400).json({ error: "Invalid settings format provided." });
});

app.get("/api/notifications/logs", (req, res) => {
  res.json(db.notificationLogs);
});

app.post("/api/notifications/test", (req, res) => {
  const { employeeId, event, details } = req.body;
  if (!employeeId || !event || !details) {
    return res.status(400).json({ error: "Employee ID, Event, and message body are required for manual testing." });
  }
  try {
    triggerNotification(employeeId, event, details);
    res.json({ message: "Manual simulation completed successfully. Delivery log logged in outbox.", logs: db.notificationLogs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Simulation failed" });
  }
});


// Serving React Application frontend with fallback
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise HRMS Server booted on http://localhost:${PORT}`);
  });
}

startServer();
