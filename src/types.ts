/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  HR_MANAGER = "HR_MANAGER",
  PAYROLL_OFFICER = "PAYROLL_OFFICER",
  BRANCH_MANAGER = "BRANCH_MANAGER",
  ACCOUNTANT = "ACCOUNTANT",
  CASHIER = "CASHIER",
  EMPLOYEE = "EMPLOYEE"
}

export enum Permission {
  EMPLOYEE_CREATE = "EMPLOYEE_CREATE",
  EMPLOYEE_EDIT = "EMPLOYEE_EDIT",
  EMPLOYEE_DELETE = "EMPLOYEE_DELETE",
  EMPLOYEE_VIEW = "EMPLOYEE_VIEW",
  ATTENDANCE_CREATE = "ATTENDANCE_CREATE",
  ATTENDANCE_EDIT = "ATTENDANCE_EDIT",
  ATTENDANCE_APPROVE = "ATTENDANCE_APPROVE",
  LEAVE_APPROVE = "LEAVE_APPROVE",
  LEAVE_REJECT = "LEAVE_REJECT",
  PAYROLL_GENERATE = "PAYROLL_GENERATE",
  PAYROLL_APPROVE = "PAYROLL_APPROVE",
  PAYROLL_LOCK = "PAYROLL_LOCK",
  BONUS_CREATE = "BONUS_CREATE",
  BONUS_APPROVE = "BONUS_APPROVE",
  REPORTS_VIEW = "REPORTS_VIEW",
  REPORTS_EXPORT = "REPORTS_EXPORT",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  AUDIT_LOG_VIEW = "AUDIT_LOG_VIEW"
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorRole: Role;
  actorName: string;
  module: string;
  action: string;
  details: string;
  status: "Success" | "Failure";
  ipAddress?: string;
  oldValue?: string;
  newValue?: string;
}


export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  name: string; // Compatibility (Full Name)
  fullName: string;
  nicNumber: string;
  passportNumber: string;
  dob: string;
  age: number;
  gender: string;
  maritalStatus: string;
  address: string;
  city: string;
  district: string;
  province: string;
  country: string;
  mobileNumber: string;
  phone: string; // Compatibility
  email: string;
  department: string;
  designation: string;
  branch: string;
  location: string;
  role: Role;
  baseSalary: number;
  joinDate: string; // Date Joined
  employmentType: "Full-Time" | "Part-Time" | "Contract" | "Intern";
  photo?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankInformation: {
    bankName: string;
    branch: string;
    accountNumber: string;
    accountHolderName: string;
  };
  bankName: string; // Compatibility
  accountNumber: string; // Compatibility
  epfNumber: string;
  etfNumber: string;
  tinNumber: string;
  status: "Active" | "Inactive" | "Resigned" | "Retired" | "Terminated" | "On Leave" | "Suspended";
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn?: string; // Legacy/Compability
  clockOut?: string; // Legacy/Compability
  checkIn1?: string;
  checkOut1?: string;
  checkIn2?: string;
  checkOut2?: string;
  checkIn3?: string;
  checkOut3?: string;
  checkIn4?: string;
  checkOut4?: string;
  status: "Present" | "Absent" | "Half Day" | "Leave" | "Holiday" | "Weekend" | "Half-Day" | "Late"; // Includes compatibility
  notes?: string;
  lateMinutes?: number;
  overtimeMinutes?: number;
  totalWorkedMinutes?: number;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId?: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn1?: string;
  checkOut1?: string;
  checkIn2?: string;
  checkOut2?: string;
  checkIn3?: string;
  checkOut3?: string;
  checkIn4?: string;
  checkOut4?: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  comments?: string;
  requestedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 
    | "Annual Leave"
    | "Casual Leave"
    | "Medical Leave"
    | "Maternity Leave"
    | "Special Leave"
    | "No Pay Leave"
    | "Annual"
    | "Sick"
    | "Casual"
    | "Maternity"
    | "Unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected"; // Overall final status
  approvedBy?: string;
  comments?: string;
  durationDays?: number;

  // Multi-stage approval workflow: Employee Request -> Manager Approval -> HR Approval -> Payroll Impact
  managerApproval?: "Pending" | "Approved" | "Rejected";
  managerApprovedBy?: string;
  managerApprovedAt?: string;

  hrApproval?: "Pending" | "Approved" | "Rejected";
  hrApprovedBy?: string;
  hrApprovedAt?: string;

  payrollImpacted?: boolean;
}

export interface EmployeeLeaveBalance {
  id: string; // Balance entry ID
  employeeId: string;
  employeeName: string;
  year: number; // e.g. 2026
  
  // Total allocations (base + carried forward)
  annualAllocation: number; // base e.g. 14
  annualCarriedForward: number; // carry forward from last year
  annualUsed: number;
  
  casualAllocation: number; // base e.g. 7
  casualUsed: number;
  
  medicalAllocation: number; // base e.g. 14
  medicalUsed: number;
  
  maternityAllocation: number; // base e.g. 84
  maternityUsed: number;
  
  specialAllocation: number; // base e.g. 5
  specialUsed: number;
  
  noPayUsed: number; // unlimited allocation, but tracked for pay deduction
}

export interface LeaveEncashment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g., "2026-06"
  daysToEncash: number;
  dailyRate: number; // e.g., baseSalary / 30
  amountPaid: number;
  status: "Pending" | "Approved" | "Rejected";
  requestedDate: string;
  processedBy?: string;
  comments?: string;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  requestAmount: number;
  reason: string;
  installmentPeriod: number; // months
  monthlyDeduction: number;
  status: "Pending" | "Approved" | "Rejected" | "Disbursed" | "Fully Recovered" | "Cancelled";
  requestDate: string;
  recoveryMethod?: "Single" | "Installment";
  recoveredSoFar?: number;
  disbursedDate?: string;
  disbursedBy?: string;
  comments?: string;
}

export interface StorePurchaseRecovery {
  id: string;
  employeeId: string;
  employeeName: string;
  itemName: string;
  purchaseDate: string;
  totalCost: number;
  monthlyRecovery: number;
  recoveredSoFar: number;
  status: "Active" | "Fully Recovered" | "Cancelled";
}

export interface WelfareClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  claimType: "Medical" | "House Rent" | "House Construction" | "Education Assistance" | "Emergency Assistance" | "Medical Reimbursement" | "Welfare Emergency Support" | "Death/Disability Aid" | string;
  amount: number;
  description: string;
  billAttachedUrl?: string;
  status: "Pending" | "Approved" | "Rejected";
  actionDate?: string;
  approvedBy?: string;
  requestedBy?: string;
}

export interface Bonus {
  id: string;
  employeeId: string;
  employeeName: string;
  bonusType: "Festive" | "Performance" | "Annual" | "Referral" | "Festival Bonus" | "Year End Bonus" | "Performance Bonus" | "Special Bonus" | string;
  amount: number;
  cycleDate: string;
  performanceScore?: number;
  status: "Pending" | "Approved" | "Rejected" | "Disbursed" | string;
  description?: string;
  approvedBy?: string;
  requestedBy?: string;
}

export interface LedgerEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  postDate: string;
  referenceType: string;
  referenceId: string; // ID of the underlying transaction/payslip/advance
  branch?: string;
  description?: string;
  debit: number;  // Company payouts or money going to employee
  credit: number; // Deductions or payments received from employee
  balance: number; // Cumulative balance
}

export interface PerformanceAppraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  appraisalPeriod: string;
  ratings: {
    productivity: number; // 1-5
    communication: number; // 1-5
    teamwork: number; // 1-5
    reliability: number; // 1-5
    attendance?: number; // 1-5
    discipline?: number; // 1-5
    knowledge?: number; // 1-5
    leadership?: number; // 1-5
  };
  overallScore: number; // Calculated average
  evaluatorComments: string;
  aiSuggestedImprovements?: string; // Generated using Gemini
  evaluatorName: string;
  status: "Draft" | "Finalized";
  dateCreated: string;
  promotionRecommendation?: string; // e.g., "Highly Recommended", "Recommended", "Maintain Role", etc.
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g., "2026-05"
  baseSalary: number;
  allowances: {
    medical: number;
    housing: number;
    performance: number;
    leaveEncashment?: number; // Paid out Annual Leave
    // New allowances required by Module 6:
    attendanceAllowance: number;
    fuelAllowance: number;
    telephoneAllowance: number;
    mealAllowance: number;
    budgetReliefAllowance: number;
    interimAllowance: number;
    incentiveAllowance: number;
    customAllowances: number;
  };
  overtime: {
    holidayOt: number;
    fridayOt: number;
    holidayOtMinutes?: number;
    fridayOtMinutes?: number;
  };
  deductions: {
    tax: number;
    providentFund: number; // EPF (Employee contribution)
    etfDeduction: number;  // ETF deduction if applicable or empty
    advanceRecovery: number;
    storePurchaseRecovery: number;
    unpaidLeaveDeduction?: number; // Unpaid / No Pay Leave reduction
    latePenalty: number;
    otherDeductions: number;
  };
  employerEpf?: number; // 12% Employer Contribution (Sri Lanka standard)
  employerEtf?: number; // 3% Employer Contribution (Sri Lanka standard)
  bonusAmount: number;
  grossSalary?: number;
  netSalary: number;
  status: "Draft" | "Approved" | "Paid" | "Locked";
  paymentDate?: string;
  lockedDate?: string;
  lockedBy?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  priority: "High" | "Medium" | "Low";
  targetDepartment?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  event: "Leave Request" | "Leave Approval" | "Advance Request" | "Advance Approval" | "Payroll Generated" | "Payslip Ready" | string;
  channels: ("Email" | "SMS" | "WhatsApp" | "In-App Notifications" | string)[];
  recipientAddress: string;
  bodyText: string;
  status: "Sent" | "Failed" | "Simulated" | string;
}

export interface NotificationChannelSetting {
  event: "Leave Request" | "Leave Approval" | "Advance Request" | "Advance Approval" | "Payroll Generated" | "Payslip Ready" | string;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  inApp: boolean;
}

