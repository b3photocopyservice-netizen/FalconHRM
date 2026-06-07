/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Employee,
  Attendance,
  LeaveRequest,
  SalaryAdvance,
  StorePurchaseRecovery,
  WelfareClaim,
  Bonus,
  LedgerEntry,
  PerformanceAppraisal,
  Payslip,
  Announcement,
  Role
} from "../types";

export const BRAND_NAME = "Falcon HRM";

export const BRANCHES = ["Colombo HQ", "Kandy Branch", "Galle Hub", "Jaffna Office", "Negombo Branch"];
export const DEPARTMENTS = ["Engineering", "Human Resources", "Finance & Accounts", "Operations", "R&D", "Sales & Marketing"];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
    employeeCode: "ESP-001",
    firstName: "Marcus",
    lastName: "Aurelius",
    name: "Marcus Aurelius",
    fullName: "Marcus Aurelius Antoninus",
    nicNumber: "123456789V",
    passportNumber: "N8912345",
    dob: "1980-04-26",
    age: 46,
    gender: "Male",
    maritalStatus: "Married",
    address: "No. 12, Flower Road",
    city: "Colombo 07",
    district: "Colombo",
    province: "Western Province",
    country: "Sri Lanka",
    mobileNumber: "+94 77 123 4567",
    phone: "+94 11 230 4567",
    email: "marcus.aurelius@synergy.lk",
    department: "Operations",
    designation: "Executive Director",
    branch: "Colombo HQ",
    location: "Main HQ Complex",
    role: Role.SUPER_ADMIN,
    joinDate: "2020-01-15",
    employmentType: "Full-Time",
    baseSalary: 450000,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Faustina Aurelia",
      relationship: "Spouse",
      phone: "+94 77 987 6543"
    },
    bankInformation: {
      bankName: "Bank of Ceylon (BOC)",
      branch: "Cinnamon Gardens",
      accountNumber: "000123456789",
      accountHolderName: "Marcus Aurelius Antoninus"
    },
    bankName: "Bank of Ceylon (BOC)",
    accountNumber: "000123456789",
    epfNumber: "EPF/COL/41029",
    etfNumber: "ETF/COL/41029",
    tinNumber: "TIN-99102456",
    status: "Active"
  },
  {
    id: "EMP-002",
    employeeCode: "ESP-002",
    firstName: "Jane",
    lastName: "Doe",
    name: "Jane Doe",
    fullName: "Jane Amanda Doe",
    nicNumber: "857123904V",
    passportNumber: "N8109234",
    dob: "1985-11-12",
    age: 40,
    gender: "Female",
    maritalStatus: "Single",
    address: "34B, Galle Road",
    city: "Kollupitina",
    district: "Colombo",
    province: "Western Province",
    country: "Sri Lanka",
    mobileNumber: "+94 77 234 5678",
    phone: "+94 11 230 4568",
    email: "jane.doe@synergy.lk",
    department: "Human Resources",
    designation: "HR Director",
    branch: "Colombo HQ",
    location: "Corporate Offices, Floor 4",
    role: Role.HR_MANAGER,
    joinDate: "2021-03-10",
    employmentType: "Full-Time",
    baseSalary: 280000,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Robert Doe",
      relationship: "Brother",
      phone: "+94 71 223 3445"
    },
    bankInformation: {
      bankName: "Commercial Bank of Ceylon",
      branch: "Kollupitina",
      accountNumber: "1002345678",
      accountHolderName: "Jane Amanda Doe"
    },
    bankName: "Commercial Bank of Ceylon",
    accountNumber: "1002345678",
    epfNumber: "EPF/COL/41030",
    etfNumber: "ETF/COL/41030",
    tinNumber: "TIN-99102457",
    status: "Active"
  },
  {
    id: "EMP-003",
    employeeCode: "ESP-003",
    firstName: "John",
    lastName: "Smith",
    name: "John Smith",
    fullName: "Johnathan David Smith",
    nicNumber: "881230491V",
    passportNumber: "N8801293",
    dob: "1988-06-21",
    age: 38,
    gender: "Male",
    maritalStatus: "Married",
    address: "No. 4, Hill Street",
    city: "Kandy",
    district: "Kandy",
    province: "Central Province",
    country: "Sri Lanka",
    mobileNumber: "+94 71 567 8901",
    phone: "+94 81 222 3456",
    email: "john.smith@synergy.lk",
    department: "Finance & Accounts",
    designation: "Chief Accountant",
    branch: "Kandy Branch",
    location: "Kandy Town Office",
    role: Role.ACCOUNTANT,
    joinDate: "2021-08-22",
    employmentType: "Full-Time",
    baseSalary: 310000,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Mary Smith",
      relationship: "Mother",
      phone: "+94 81 991 2233"
    },
    bankInformation: {
      bankName: "Sampath Bank",
      branch: "Kandy Main",
      accountNumber: "001234567890",
      accountHolderName: "Johnathan David Smith"
    },
    bankName: "Sampath Bank",
    accountNumber: "001234567890",
    epfNumber: "EPF/KAN/12993",
    etfNumber: "ETF/KAN/12993",
    tinNumber: "TIN-99103441",
    status: "Active"
  },
  {
    id: "EMP-004",
    employeeCode: "ESP-004",
    firstName: "Alan",
    lastName: "Turing",
    name: "Alan Turing",
    fullName: "Alan Mathison Turing",
    nicNumber: "910245679V",
    passportNumber: "N9101294",
    dob: "1991-06-23",
    age: 35,
    gender: "Male",
    maritalStatus: "Single",
    address: "56, Torrington Avenue",
    city: "Colombo 07",
    district: "Colombo",
    province: "Western Province",
    country: "Sri Lanka",
    mobileNumber: "+94 77 987 1122",
    phone: "+94 11 230 4569",
    email: "alan.turing@synergy.lk",
    department: "Engineering",
    designation: "Principal Cryptography Engineer",
    branch: "Colombo HQ",
    location: "Vantage House, Engineering",
    role: Role.EMPLOYEE,
    joinDate: "2019-11-01",
    employmentType: "Full-Time",
    baseSalary: 360000,
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Sarah Turing",
      relationship: "Mother",
      phone: "+94 77 111 2222"
    },
    bankInformation: {
      bankName: "Hatton National Bank (HNB)",
      branch: "Green Path",
      accountNumber: "003456789012",
      accountHolderName: "Alan Mathison Turing"
    },
    bankName: "Hatton National Bank (HNB)",
    accountNumber: "003456789012",
    epfNumber: "EPF/COL/40212",
    etfNumber: "ETF/COL/40212",
    tinNumber: "TIN-99102111",
    status: "Active"
  },
  {
    id: "EMP-005",
    employeeCode: "ESP-005",
    firstName: "Ada",
    lastName: "Lovelace",
    name: "Ada Lovelace",
    fullName: "Augusta Ada King-Noel",
    nicNumber: "951567123V",
    passportNumber: "N9509823",
    dob: "1995-12-10",
    age: 30,
    gender: "Female",
    maritalStatus: "Married",
    address: "No. 89, Ward Place",
    city: "Colombo 07",
    district: "Colombo",
    province: "Western Province",
    country: "Sri Lanka",
    mobileNumber: "+94 77 444 5566",
    phone: "+94 11 230 4570",
    email: "ada.lovelace@synergy.lk",
    department: "Engineering",
    designation: "Lead Systems Architect",
    branch: "Colombo HQ",
    location: "Vantage House, Engineering",
    role: Role.PAYROLL_OFFICER,
    joinDate: "2020-04-18",
    employmentType: "Full-Time",
    baseSalary: 365000,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "William King",
      relationship: "Spouse",
      phone: "+94 77 666 7777"
    },
    bankInformation: {
      bankName: "People's Bank",
      branch: "Town Hall",
      accountNumber: "024567890123",
      accountHolderName: "Augusta Ada King-Noel"
    },
    bankName: "People's Bank",
    accountNumber: "024567890123",
    epfNumber: "EPF/COL/40422",
    etfNumber: "ETF/COL/40422",
    tinNumber: "TIN-99102555",
    status: "Active"
  },
  {
    id: "EMP-006",
    employeeCode: "ESP-006",
    firstName: "Charles",
    lastName: "Babbage",
    name: "Charles Babbage",
    fullName: "Charles Philip Babbage",
    nicNumber: "731245903V",
    passportNumber: "N7301293",
    dob: "1973-12-26",
    age: 52,
    gender: "Male",
    maritalStatus: "Widowed",
    address: "No. 7, Fort View",
    city: "Galle",
    district: "Galle",
    province: "Southern Province",
    country: "Sri Lanka",
    mobileNumber: "+94 72 321 0987",
    phone: "+94 91 223 4567",
    email: "charles.babbage@synergy.lk",
    department: "Engineering",
    designation: "Senior Hardware Engineer",
    branch: "Galle Hub",
    location: "Galle Fort Complex",
    role: Role.BRANCH_MANAGER,
    joinDate: "2022-02-14",
    employmentType: "Full-Time",
    baseSalary: 250000,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Georgiana Whitmore",
      relationship: "Daughter",
      phone: "+94 72 101 2023"
    },
    bankInformation: {
      bankName: "Commercial Bank of Ceylon",
      branch: "Galle Fort",
      accountNumber: "1009876543",
      accountHolderName: "Charles Philip Babbage"
    },
    bankName: "Commercial Bank of Ceylon",
    accountNumber: "1009876543",
    epfNumber: "EPF/GAL/28102",
    etfNumber: "ETF/GAL/28102",
    tinNumber: "TIN-99108192",
    status: "Active"
  },
  {
    id: "EMP-007",
    employeeCode: "ESP-007",
    firstName: "Grace",
    lastName: "Hopper",
    name: "Grace Hopper",
    fullName: "Grace Brewster Hopper",
    nicNumber: "840567123V",
    passportNumber: "N8409123",
    dob: "1984-12-09",
    age: 41,
    gender: "Female",
    maritalStatus: "Single",
    address: "No. 45/1, Alfred House Gardens",
    city: "Colombo 03",
    district: "Colombo",
    province: "Western Province",
    country: "Sri Lanka",
    mobileNumber: "+94 77 112 2334",
    phone: "+94 11 230 4571",
    email: "grace.hopper@synergy.lk",
    department: "R&D",
    designation: "VP of Research",
    branch: "Colombo HQ",
    location: "R&D Lab 1, Floor 2",
    role: Role.EMPLOYEE,
    joinDate: "2020-09-01",
    employmentType: "Full-Time",
    baseSalary: 420000,
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Alexander Hopper",
      relationship: "Brother",
      phone: "+94 77 999 5555"
    },
    bankInformation: {
      bankName: "Bank of Ceylon (BOC)",
      branch: "Super Grade Branch",
      accountNumber: "000987654321",
      accountHolderName: "Grace Brewster Hopper"
    },
    bankName: "Bank of Ceylon (BOC)",
    accountNumber: "000987654321",
    epfNumber: "EPF/COL/40455",
    etfNumber: "ETF/COL/40455",
    tinNumber: "TIN-99102999",
    status: "Active"
  },
  {
    id: "EMP-008",
    employeeCode: "ESP-008",
    firstName: "Nikola",
    lastName: "Tesla",
    name: "Nikola Tesla",
    fullName: "Nikola Tesla",
    nicNumber: "860490123V",
    passportNumber: "N8601245",
    dob: "1986-07-10",
    age: 39,
    gender: "Male",
    maritalStatus: "Single",
    address: "Electrical Labs Estate",
    city: "Kandy",
    district: "Kandy",
    province: "Central Province",
    country: "Sri Lanka",
    mobileNumber: "+94 71 888 2233",
    phone: "+94 81 222 3457",
    email: "nikola.tesla@synergy.lk",
    department: "R&D",
    designation: "Lead Electrical Inventor",
    branch: "Kandy Branch",
    location: "Power Lab 2",
    role: Role.CASHIER,
    joinDate: "2023-01-10",
    employmentType: "Full-Time",
    baseSalary: 265000,
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Milutin Tesla",
      relationship: "Father",
      phone: "+94 81 441 2341"
    },
    bankInformation: {
      bankName: "Hatton National Bank (HNB)",
      branch: "Kandy Town",
      accountNumber: "003987654321",
      accountHolderName: "Nikola Tesla"
    },
    bankName: "Hatton National Bank (HNB)",
    accountNumber: "003987654321",
    epfNumber: "EPF/KAN/13101",
    etfNumber: "ETF/KAN/13101",
    tinNumber: "TIN-99103888",
    status: "On Leave"
  },
  {
    id: "EMP-009",
    employeeCode: "ESP-009",
    firstName: "Marie",
    lastName: "Curie",
    name: "Marie Curie",
    fullName: "Marie Salomea Skłodowska Curie",
    nicNumber: "895123456V",
    passportNumber: "N8909121",
    dob: "1989-11-07",
    age: 36,
    gender: "Female",
    maritalStatus: "Married",
    address: "44, Beach Road",
    city: "Galle",
    district: "Galle",
    province: "Southern Province",
    country: "Sri Lanka",
    mobileNumber: "+94 77 333 4444",
    phone: "+94 91 223 4568",
    email: "marie.curie@synergy.lk",
    department: "Operations",
    designation: "EHS Officer",
    branch: "Galle Hub",
    location: "Safety Depot Room B",
    role: Role.EMPLOYEE,
    joinDate: "2021-05-15",
    employmentType: "Full-Time",
    baseSalary: 240000,
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Pierre Curie",
      relationship: "Spouse",
      phone: "+94 77 782 1102"
    },
    bankInformation: {
      bankName: "Sampath Bank",
      branch: "Galle Town",
      accountNumber: "001987654321",
      accountHolderName: "Marie Salomea Skłodowska Curie"
    },
    bankName: "Sampath Bank",
    accountNumber: "001987654321",
    epfNumber: "EPF/GAL/28114",
    etfNumber: "ETF/GAL/28114",
    tinNumber: "TIN-99108333",
    status: "Active"
  },
  {
    id: "EMP-010",
    employeeCode: "ESP-010",
    firstName: "Albert",
    lastName: "Einstein",
    name: "Albert Einstein",
    fullName: "Albert Einstein",
    nicNumber: "790123456V",
    passportNumber: "N7910245",
    dob: "1979-03-14",
    age: 47,
    gender: "Male",
    maritalStatus: "Married",
    address: "10, Temple Road",
    city: "Jaffna",
    district: "Jaffna",
    province: "Northern Province",
    country: "Sri Lanka",
    mobileNumber: "+94 71 443 2234",
    phone: "+94 21 222 3456",
    email: "albert.einstein@synergy.lk",
    department: "Operations",
    designation: "Theoretical Physics Advisor",
    branch: "Jaffna Office",
    location: "Jaffna Town Hub",
    role: Role.EMPLOYEE,
    joinDate: "2022-07-20",
    employmentType: "Full-Time",
    baseSalary: 320000,
    photo: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&auto=format&fit=crop&q=80",
    emergencyContact: {
      name: "Elsa Einstein",
      relationship: "Spouse",
      phone: "+94 71 998 1122"
    },
    bankInformation: {
      bankName: "People's Bank",
      branch: "Jaffna Main Office",
      accountNumber: "024987654321",
      accountHolderName: "Albert Einstein"
    },
    bankName: "People's Bank",
    accountNumber: "024987654321",
    epfNumber: "EPF/JAF/90123",
    etfNumber: "ETF/JAF/90123",
    tinNumber: "TIN-99109444",
    status: "Active"
  }
];

export const INITIAL_ATTENDANCE: Attendance[] = [
  { id: "A-1", employeeId: "EMP-001", employeeName: "Marcus Aurelius", date: "2026-06-04", clockIn: "08:45", clockOut: "17:15", status: "Present" },
  { id: "A-2", employeeId: "EMP-002", employeeName: "Jane Doe", date: "2026-06-04", clockIn: "08:55", clockOut: "17:30", status: "Present" },
  { id: "A-3", employeeId: "EMP-003", employeeName: "John Smith", date: "2026-06-04", clockIn: "09:05", clockOut: "17:05", status: "Present" },
  { id: "A-4", employeeId: "EMP-004", employeeName: "Alan Turing", date: "2026-06-04", clockIn: "08:30", clockOut: "18:00", status: "Present" },
  { id: "A-5", employeeId: "EMP-005", employeeName: "Ada Lovelace", date: "2026-06-04", clockIn: "08:40", clockOut: "17:45", status: "Present" },
  { id: "A-6", employeeId: "EMP-006", employeeName: "Charles Babbage", date: "2026-06-04", clockIn: "09:20", clockOut: "17:00", status: "Late", notes: "Train delays" },
  { id: "A-7", employeeId: "EMP-007", employeeName: "Grace Hopper", date: "2026-06-04", clockIn: "08:45", clockOut: "17:30", status: "Present" },
  { id: "A-8", employeeId: "EMP-008", employeeName: "Nikola Tesla", date: "2026-06-04", status: "Absent", notes: "Medical appointment (Sick Leave Approved)" },
  { id: "A-9", employeeId: "EMP-009", employeeName: "Marie Curie", date: "2026-06-04", clockIn: "08:50", clockOut: "17:10", status: "Present" },
  { id: "A-10", employeeId: "EMP-010", employeeName: "Albert Einstein", date: "2026-06-04", clockIn: "10:15", clockOut: "15:30", status: "Half-Day", notes: "Academic speech in Jaffna" }
];

export const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: "L-001",
    employeeId: "EMP-008",
    employeeName: "Nikola Tesla",
    leaveType: "Sick",
    startDate: "2026-06-03",
    endDate: "2026-06-05",
    reason: "Flu diagnostics & rest",
    status: "Approved",
    approvedBy: "Jane Doe"
  },
  {
    id: "L-002",
    employeeId: "EMP-006",
    employeeName: "Charles Babbage",
    leaveType: "Annual",
    startDate: "2026-06-15",
    endDate: "2026-06-25",
    reason: "Family trip to Nuwara Eliya country side",
    status: "Pending"
  },
  {
    id: "L-003",
    employeeId: "EMP-005",
    employeeName: "Ada Lovelace",
    leaveType: "Casual",
    startDate: "2026-05-12",
    endDate: "2026-05-13",
    reason: "Personal banking and division land paperwork",
    status: "Approved",
    approvedBy: "Jane Doe"
  },
  {
    id: "L-004",
    employeeId: "EMP-010",
    employeeName: "Albert Einstein",
    leaveType: "Unpaid",
    startDate: "2026-07-01",
    endDate: "2026-07-15",
    reason: "Special lecture circuit at University of Peradeniya",
    status: "Pending"
  }
];

export const INITIAL_ADVANCES: SalaryAdvance[] = [
  {
    id: "S-ADV-001",
    employeeId: "EMP-006",
    employeeName: "Charles Babbage",
    requestAmount: 120000,
    reason: "Home mechanical workshop refurbishment, tool acquisitions",
    installmentPeriod: 10,
    monthlyDeduction: 12000,
    status: "Disbursed",
    requestDate: "2026-05-10",
    recoveryMethod: "Installment",
    recoveredSoFar: 0,
    disbursedDate: "2026-05-11",
    disbursedBy: "Security Admin"
  },
  {
    id: "S-ADV-002",
    employeeId: "EMP-009",
    employeeName: "Marie Curie",
    requestAmount: 50000,
    reason: "In-home safety monitoring equipment install",
    installmentPeriod: 5,
    monthlyDeduction: 10000,
    status: "Pending",
    requestDate: "2026-06-01",
    recoveryMethod: "Installment",
    recoveredSoFar: 0
  }
];

export const INITIAL_RECOVERIES: StorePurchaseRecovery[] = [
  {
    id: "REC-001",
    employeeId: "EMP-004",
    employeeName: "Alan Turing",
    itemName: "Staff Store Laptop Upgrade Contribution",
    purchaseDate: "2026-02-15",
    totalCost: 45000,
    monthlyRecovery: 4500,
    recoveredSoFar: 13500,
    status: "Active"
  },
  {
    id: "REC-002",
    employeeId: "EMP-008",
    employeeName: "Nikola Tesla",
    itemName: "Tesla Coil Auxiliary Spares (Staff Store Clearance)",
    purchaseDate: "2026-04-10",
    totalCost: 30000,
    monthlyRecovery: 3000,
    recoveredSoFar: 6000,
    status: "Active"
  }
];

export const INITIAL_CLAIMS: WelfareClaim[] = [
  {
    id: "CLM-001",
    employeeId: "EMP-009",
    employeeName: "Marie Curie",
    claimType: "Medical Reimbursement",
    amount: 25000,
    description: "Lab test suite and chemical exposure safety checkup in Colombo",
    status: "Approved",
    actionDate: "2026-05-20"
  },
  {
    id: "CLM-002",
    employeeId: "EMP-005",
    employeeName: "Ada Lovelace",
    claimType: "Medical Reimbursement",
    amount: 8500,
    description: "Executive eye-strain and prescription lens change",
    status: "Pending"
  },
  {
    id: "CLM-003",
    employeeId: "EMP-006",
    employeeName: "Charles Babbage",
    claimType: "Welfare Emergency Support",
    amount: 45000,
    description: "Severe basement flooding restoration assistance",
    status: "Pending"
  }
];

export const INITIAL_BONUSES: Bonus[] = [
  {
    id: "BNS-001",
    employeeId: "EMP-004",
    employeeName: "Alan Turing",
    bonusType: "Performance",
    amount: 50000,
    cycleDate: "2026-05-25",
    performanceScore: 4.8,
    status: "Disbursed"
  },
  {
    id: "BNS-002",
    employeeId: "EMP-005",
    employeeName: "Ada Lovelace",
    bonusType: "Performance",
    amount: 60000,
    cycleDate: "2026-05-25",
    performanceScore: 4.9,
    status: "Disbursed"
  },
  {
    id: "BNS-003",
    employeeId: "EMP-007",
    employeeName: "Grace Hopper",
    bonusType: "Annual",
    amount: 80000,
    cycleDate: "2026-06-30",
    status: "Pending"
  }
];

export const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: "LDG-001",
    employeeId: "EMP-006",
    employeeName: "Charles Babbage",
    postDate: "2026-05-10",
    referenceType: "Salary Advance",
    referenceId: "S-ADV-001",
    debit: 120000,
    credit: 0,
    balance: -120000
  },
  {
    id: "LDG-002",
    employeeId: "EMP-004",
    employeeName: "Alan Turing",
    postDate: "2026-05-25",
    referenceType: "Bonus Credit",
    referenceId: "BNS-001",
    debit: 50000,
    credit: 0,
    balance: 50000
  },
  {
    id: "LDG-003",
    employeeId: "EMP-009",
    employeeName: "Marie Curie",
    postDate: "2026-05-20",
    referenceType: "Medical Reimbursement",
    referenceId: "CLM-001",
    debit: 25000,
    credit: 0,
    balance: 25000
  },
  {
    id: "LDG-004",
    employeeId: "EMP-004",
    employeeName: "Alan Turing",
    postDate: "2026-05-31",
    referenceType: "Staff Store Recovery",
    referenceId: "REC-001",
    debit: 0,
    credit: 4500,
    balance: 45500
  }
];

export const INITIAL_APPRAISALS: PerformanceAppraisal[] = [
  {
    id: "APR-001",
    employeeId: "EMP-004",
    employeeName: "Alan Turing",
    appraisalPeriod: "FY 2026 H1",
    ratings: {
      productivity: 5,
      communication: 4,
      teamwork: 4,
      reliability: 5
    },
    overallScore: 4.5,
    evaluatorComments: "Alan has delivered unmatched value in encryption speed improvements. His work on core crypto modules remains flawless. He could participate more actively in company all-hands.",
    evaluatorName: "Jane Doe",
    status: "Finalized",
    aiSuggestedImprovements: "To score higher in communication & teamwork, schedule bi-weekly technical show-and-tells, write concise documentation guides for colleagues, and take direct ownership of mentorship for junior engineering staff.",
    dateCreated: "2026-05-20"
  },
  {
    id: "APR-002",
    employeeId: "EMP-006",
    employeeName: "Charles Babbage",
    appraisalPeriod: "FY 2026 H1",
    ratings: {
      productivity: 3,
      communication: 3,
      teamwork: 4,
      reliability: 3
    },
    overallScore: 3.25,
    evaluatorComments: "Charles has great ambition but is occasionally slowed down by overcomplicating initial architecture phases. Sticking to agile milestones will help timely completion.",
    evaluatorName: "Marcus Aurelius",
    status: "Draft",
    dateCreated: "2026-05-28"
  }
];

export const INITIAL_PAYSLIPS: Payslip[] = [
  {
    id: "PS-202605-001",
    employeeId: "EMP-001",
    employeeName: "Marcus Aurelius",
    month: "2026-05",
    baseSalary: 450000,
    allowances: { 
      medical: 15000, 
      housing: 35000, 
      performance: 20000,
      attendanceAllowance: 5000,
      fuelAllowance: 12000,
      telephoneAllowance: 4000,
      mealAllowance: 10000,
      budgetReliefAllowance: 3500,
      interimAllowance: 0,
      incentiveAllowance: 15000,
      customAllowances: 0
    },
    overtime: {
      holidayOt: 0,
      fridayOt: 0,
      holidayOtMinutes: 0,
      fridayOtMinutes: 0
    },
    deductions: { 
      tax: 113699, 
      providentFund: 36000, 
      etfDeduction: 0,
      advanceRecovery: 0, 
      storePurchaseRecovery: 0,
      latePenalty: 0,
      otherDeductions: 0
    },
    employerEpf: 54000, // 12% of 450,000 basic
    employerEtf: 13500, // 3% of 450,000 basic
    bonusAmount: 0,
    grossSalary: 564500,
    netSalary: 370301, // 520,000 Gross - 113699 APIT - 36,000 EPF (8%)
    status: "Paid",
    paymentDate: "2026-05-31"
  },
  {
    id: "PS-202605-002",
    employeeId: "EMP-004",
    employeeName: "Alan Turing",
    month: "2026-05",
    baseSalary: 360000,
    allowances: { 
      medical: 10000, 
      housing: 25000, 
      performance: 15000,
      attendanceAllowance: 5000,
      fuelAllowance: 10000,
      telephoneAllowance: 3000,
      mealAllowance: 8000,
      budgetReliefAllowance: 3500,
      interimAllowance: 0,
      incentiveAllowance: 0,
      customAllowances: 0
    },
    overtime: {
      holidayOt: 0,
      fridayOt: 0,
      holidayOtMinutes: 0,
      fridayOtMinutes: 0
    },
    deductions: { 
      tax: 92099, 
      providentFund: 28800, 
      etfDeduction: 0,
      advanceRecovery: 0, 
      storePurchaseRecovery: 4500,
      latePenalty: 1200,
      otherDeductions: 0
    },
    employerEpf: 43200, // 12% of 360,000 basic
    employerEtf: 10800, // 3% of 360,000 basic
    bonusAmount: 50000, // Festive/Performance Bonus Disbursed
    grossSalary: 485700,
    netSalary: 334601, // 410,000 Gross + 50,000 bonus - 92099 Tax - 28800 PF - 4500 store recovery
    status: "Paid",
    paymentDate: "2026-05-31"
  },
  {
    id: "PS-202605-003",
    employeeId: "EMP-006",
    employeeName: "Charles Babbage",
    month: "2026-05",
    baseSalary: 250000,
    allowances: { 
      medical: 8000, 
      housing: 18000, 
      performance: 0,
      attendanceAllowance: 4000,
      fuelAllowance: 8000,
      telephoneAllowance: 2000,
      mealAllowance: 6000,
      budgetReliefAllowance: 3500,
      interimAllowance: 0,
      incentiveAllowance: 0,
      customAllowances: 0
    },
    overtime: {
      holidayOt: 5400,
      fridayOt: 3100,
      holidayOtMinutes: 240,
      fridayOtMinutes: 180
    },
    deductions: { 
      tax: 27800, 
      providentFund: 20000, 
      etfDeduction: 0,
      advanceRecovery: 12000, 
      storePurchaseRecovery: 0,
      latePenalty: 0,
      otherDeductions: 0
    },
    employerEpf: 30000, // 12% of 250,000 basic
    employerEtf: 7500, // 3% of 250,000 basic
    bonusAmount: 0,
    grossSalary: 305000,
    netSalary: 216200, // 276,000 Gross - 27800 Tax - 20000 PF (8%) - 12000 advance
    status: "Paid",
    paymentDate: "2026-05-31"
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ANC-001",
    title: "FY26 Wellness Program Rollout",
    body: "We are introducing expanded medical assistance parameters starting this month, including 100% reimbursement on dental checkups and stress-management workshops in all regional hubs. Claims may be submitted via the Medical & Welfare tab.",
    date: "2026-06-02",
    priority: "High"
  },
  {
    id: "ANC-002",
    title: "Staff Store Sri Lankan Regional Clearance",
    body: "The employee purchase store is running clearance discounts on corporate assets. Recoveries will be directly amortized through your monthly salary ledger over selected cycle structures.",
    date: "2026-05-28",
    priority: "Medium"
  }
];
