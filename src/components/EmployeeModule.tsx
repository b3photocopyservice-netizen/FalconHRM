/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Employee, Role } from "../types";
import { BRAND_NAME, BRANCHES, DEPARTMENTS } from "../data/mockData";
import { Search, UserPlus, SlidersHorizontal, MapPin, Building2, Phone, Mail, DollarSign, Calendar, Landmark, CheckCircle, Edit3, X, Eye, FileText, ArrowRight, Printer, ShieldCheck, Clipboard } from "lucide-react";

interface EmployeeModuleProps {
  employees: Employee[];
  currentRole: Role;
  onUpdateState: () => void;
}

export default function EmployeeModule({ employees, currentRole, onUpdateState }: EmployeeModuleProps) {
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [formTab, setFormTab] = useState<"basic" | "address" | "corporate" | "emergency" | "bank">("basic");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState(Role.EMPLOYEE);
  const [baseSalary, setBaseSalary] = useState("120000");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [status, setStatus] = useState<Employee["status"]>("Active");
  const [error, setError] = useState("");

  // Master Employee Profile Fields
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [nicNumber, setNicNumber] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number>(0);
  const [gender, setGender] = useState("Male");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("Sri Lanka");
  const [mobileNumber, setMobileNumber] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState<"Full-Time" | "Part-Time" | "Contract" | "Intern">("Full-Time");
  const [photo, setPhoto] = useState("");
  
  // Emergency Contact Info
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Bank Info Extras & Statutory
  const [bankBranch, setBankBranch] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [epfNumber, setEpfNumber] = useState("");
  const [etfNumber, setEtfNumber] = useState("");
  const [tinNumber, setTinNumber] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                        (emp.fullName && emp.fullName.toLowerCase().includes(search.toLowerCase())) ||
                        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(search.toLowerCase())) ||
                        emp.email.toLowerCase().includes(search.toLowerCase()) ||
                        emp.designation.toLowerCase().includes(search.toLowerCase());
    const matchBranch = selectedBranch === "all" || emp.branch === selectedBranch;
    const matchDept = selectedDept === "all" || emp.department === selectedDept;
    return matchSearch && matchBranch && matchDept;
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setBranch(BRANCHES[0]);
    setDepartment(DEPARTMENTS[0]);
    setDesignation("");
    setRole(Role.EMPLOYEE);
    setBaseSalary("120000");
    setBankName("");
    setAccountNumber("");
    setStatus("Active");
    setError("");
    setFormTab("basic");

    // Reset extended fields
    setEmployeeCode("");
    setFirstName("");
    setLastName("");
    setFullName("");
    setNicNumber("");
    setPassportNumber("");
    setDob("");
    setAge(0);
    setGender("Male");
    setMaritalStatus("Single");
    setAddress("");
    setCity("");
    setDistrict("");
    setProvince("");
    setCountry("Sri Lanka");
    setMobileNumber("");
    setLocation("");
    setEmploymentType("Full-Time");
    setPhoto("");
    setEmergencyName("");
    setEmergencyRelationship("");
    setEmergencyPhone("");
    setBankBranch("");
    setAccountHolderName("");
    setEpfNumber("");
    setEtfNumber("");
    setTinNumber("");
  };

  const calculateAge = (dobVal: string) => {
    setDob(dobVal);
    if (!dobVal) {
      setAge(0);
      return;
    }
    const birthDate = new Date(dobVal);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    setAge(isNaN(calculatedAge) ? 0 : calculatedAge);
  };

  const handleFirstNameChange = (firstVal: string) => {
    setFirstName(firstVal);
    const combined = `${firstVal} ${lastName}`.trim();
    setName(combined);
    setFullName(combined);
  };

  const handleLastNameChange = (lastVal: string) => {
    setLastName(lastVal);
    const combined = `${firstName} ${lastVal}`.trim();
    setName(combined);
    setFullName(combined);
  };

  const validateMasterProfile = (): string | null => {
    if (!firstName || !lastName || !email || !designation || !bankName || !accountNumber) {
      return "Please complete all strictly required fields labeled with *";
    }

    // Sri Lankan National Identity Card (NIC) Check
    if (nicNumber) {
      const nicUpper = nicNumber.trim().toUpperCase();
      const oldNicRegex = /^[0-9]{9}[VX]$/;
      const newNicRegex = /^[0-9]{12}$/;
      if (!oldNicRegex.test(nicUpper) && !newNicRegex.test(nicUpper)) {
        return "Invalid Sri Lankan NIC number. Format must be 9 digits with a trailing V/X (e.g. 199024567V) or modern 12-digit format (e.g. 200054321098).";
      }
    }

    // Passport format check (7 to 12 alphanumeric)
    if (passportNumber && passportNumber.trim()) {
      const passRegex = /^[A-Z0-9]{7,12}$/i;
      if (!passRegex.test(passportNumber.trim())) {
        return "Invalid Passport number. Format specifies 7 to 12 alphanumeric characters.";
      }
    }

    // Phone / Mobile format validation
    if (mobileNumber && mobileNumber.trim()) {
      const phoneRegex = /^[+0-9\s-]{9,15}$/;
      if (!phoneRegex.test(mobileNumber.trim())) {
        return "Invalid mobile phone format. Use valid digit sequence optionally starting with + (9-15 char).";
      }
    }

    return null;
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const formError = validateMasterProfile();
    if (formError) {
      setError(formError);
      return;
    }

    try {
      const payload: Partial<Employee> = {
        employeeCode: employeeCode || `ESP-${Math.floor(100+Math.random()*900)}`,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        fullName: fullName || `${firstName} ${lastName}`.trim(),
        nicNumber,
        passportNumber,
        dob,
        age,
        gender,
        maritalStatus,
        address,
        city,
        district,
        province,
        country,
        mobileNumber,
        phone: phone || mobileNumber,
        email,
        department,
        designation,
        branch,
        location,
        joinDate: new Date().toISOString().split("T")[0],
        employmentType,
        photo: photo || `https://images.unsplash.com/photo-${["1534528741775-53994a69daeb", "1507003211169-0a1dd7228f2d", "1500648767791-00dcc994a43e", "1544005313-94ddf0286df2"][Math.floor(Math.random() * 4)]}?w=150&auto=format&fit=crop&q=80`,
        emergencyContact: {
          name: emergencyName,
          relationship: emergencyRelationship,
          phone: emergencyPhone
        },
        bankInformation: {
          bankName,
          branch: bankBranch,
          accountNumber,
          accountHolderName: accountHolderName || `${firstName} ${lastName}`.trim()
        },
        bankName,
        accountNumber,
        epfNumber: epfNumber || "EPF-PENDING",
        etfNumber: etfNumber || "ETF-PENDING",
        tinNumber: tinNumber || "TIN-PENDING",
        role,
        baseSalary: parseFloat(baseSalary) || 0,
        status: "Active"
      };

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowAddForm(false);
        resetForm();
        onUpdateState();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to appoint personnel");
      }
    } catch {
      setError("Server communication failure");
    }
  };

  const startEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name || emp.fullName || "");
    setEmail(emp.email);
    setPhone(emp.phone);
    setBranch(emp.branch);
    setDepartment(emp.department);
    setDesignation(emp.designation);
    setRole(emp.role);
    setBaseSalary(emp.baseSalary.toString());
    setBankName(emp.bankName);
    setAccountNumber(emp.accountNumber);
    setStatus(emp.status);
    setError("");
    setFormTab("basic");

    // Populate expanded profile attributes
    setEmployeeCode(emp.employeeCode || "");
    setFirstName(emp.firstName || "");
    setLastName(emp.lastName || "");
    setFullName(emp.fullName || "");
    setNicNumber(emp.nicNumber || "");
    setPassportNumber(emp.passportNumber || "");
    setDob(emp.dob || "");
    setAge(emp.age || 0);
    setGender(emp.gender || "Male");
    setMaritalStatus(emp.maritalStatus || "Single");
    setAddress(emp.address || "");
    setCity(emp.city || "");
    setDistrict(emp.district || "");
    setProvince(emp.province || "");
    setCountry(emp.country || "Sri Lanka");
    setMobileNumber(emp.mobileNumber || "");
    setLocation(emp.location || "");
    setEmploymentType(emp.employmentType || "Full-Time");
    setPhoto(emp.photo || "");
    setEmergencyName(emp.emergencyContact?.name || "");
    setEmergencyRelationship(emp.emergencyContact?.relationship || "");
    setEmergencyPhone(emp.emergencyContact?.phone || "");
    setBankBranch(emp.bankInformation?.branch || "");
    setAccountHolderName(emp.bankInformation?.accountHolderName || "");
    setEpfNumber(emp.epfNumber || "");
    setEtfNumber(emp.etfNumber || "");
    setTinNumber(emp.tinNumber || "");
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const formError = validateMasterProfile();
    if (formError) {
      setError(formError);
      return;
    }

    try {
      const payload = {
        employeeCode,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        fullName: fullName || `${firstName} ${lastName}`.trim(),
        nicNumber,
        passportNumber,
        dob,
        age,
        gender,
        maritalStatus,
        address,
        city,
        district,
        province,
        country,
        mobileNumber,
        phone: phone || mobileNumber,
        email,
        branch,
        department,
        designation,
        location,
        role,
        baseSalary: parseFloat(baseSalary) || 0,
        employmentType,
        photo,
        emergencyContact: {
          name: emergencyName,
          relationship: emergencyRelationship,
          phone: emergencyPhone
        },
        bankInformation: {
          bankName,
          branch: bankBranch,
          accountNumber,
          accountHolderName: accountHolderName || `${firstName} ${lastName}`.trim()
        },
        bankName,
        accountNumber,
        epfNumber,
        etfNumber,
        tinNumber,
        status
      };

      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditingEmployee(null);
        resetForm();
        onUpdateState();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to save profile changes");
      }
    } catch {
      setError("Server communication failure");
    }
  };

  const copyToClipboard = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isPrivileged = currentRole === Role.SUPER_ADMIN || currentRole === Role.HR_MANAGER;

  return (
    <div className="space-y-6">
      {/* Upper header action area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 heading-display">Employee Roster</h2>
          <p className="text-sm text-slate-500 mt-1">Manage corporate appointments, branches, and finance settings.</p>
        </div>
        {isPrivileged && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition duration-150 cursor-pointer text-sm self-start md:self-auto"
            id="appoint-emp-btn"
          >
            <UserPlus size={16} />
            Add Employee
          </button>
        )}
      </div>

      {/* Roster Controls and Search Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, or designation..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-emp-input"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <MapPin size={16} className="text-slate-400" />
              <select
                className="bg-transparent border-0 text-slate-600 text-xs font-medium focus:outline-hidden cursor-pointer"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                id="filter-branch-select"
              >
                <option value="all">All Branches</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Building2 size={16} className="text-slate-400" />
              <select
                className="bg-transparent border-0 text-slate-600 text-xs font-medium focus:outline-hidden cursor-pointer"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                id="filter-dept-select"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Counts summary bar */}
        <div className="text-xs text-slate-500 flex items-center justify-between">
          <p>Showing <strong>{filteredEmployees.length}</strong> out of {employees.length} corporate assets.</p>
        </div>
      </div>

      {/* Grid of Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition duration-200 flex flex-col justify-between">
            {/* Upper profile header decoration with Portrait Photo */}
            <div className="p-5 pb-4 border-b border-slate-50 flex items-start gap-4">
              <img 
                src={emp.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"} 
                alt={emp.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-100 flex-shrink-0 bg-slate-100 shadow-inner"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] uppercase font-bold tracking-wider font-mono">{emp.id}</span>
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[9px] uppercase font-bold tracking-wider font-mono">{emp.employeeCode || "ESP-CODE"}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 heading-display truncate" title={emp.fullName || emp.name}>{emp.name}</h3>
                <p className="text-xs text-slate-500 font-semibold truncate">{emp.designation}</p>
              </div>
            </div>

            {/* Profile Metrics body - clickable to open complete Dossier */}
            <div 
              onClick={() => setViewingEmployee(emp)}
              className="p-5 py-4 space-y-3 flex-1 cursor-pointer hover:bg-slate-50/50 transition duration-150 relative group"
              title="Click to view complete Employee Master Profile Dossier"
            >
              <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <Eye size={10} /> Inspect Profile
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-0.5">
                  <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Branch</p>
                  <p className="text-slate-700 font-semibold flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{emp.branch}</span>
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Department</p>
                  <p className="text-slate-700 font-semibold flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{emp.department}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-50 pt-3 text-xs">
                <p className="text-slate-700 flex items-center gap-2">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate font-mono text-[11px]">{emp.email}</span>
                </p>
                <p className="text-slate-700 flex items-center gap-2">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px]">{emp.mobileNumber || emp.phone || "No phone added"}</span>
                </p>
              </div>

              <div className="bg-indigo-50/40 p-3 rounded-xl grid grid-cols-2 gap-2 text-xs border border-indigo-100/20">
                <div>
                  <p className="text-indigo-600/70 font-semibold text-[10px] uppercase tracking-wider mb-0.5">Base Salary</p>
                  <p className="text-slate-950 font-bold mono-display">Rs. {(emp.baseSalary || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-indigo-600/70 font-semibold text-[10px] uppercase tracking-wider mb-0.5">Joined</p>
                  <p className="text-slate-800 font-semibold font-mono">{emp.joinDate || "N/A"}</p>
                </div>
              </div>

              {/* Status & Systems summary line */}
              <div className="flex items-center justify-between text-[11px] border-t border-slate-50 pt-2.5">
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wide ${
                  emp.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  emp.status === "On Leave" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  emp.status === "Suspended" ? "bg-red-50 text-red-700 border border-red-200" :
                  "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {emp.status}
                </span>

                <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded font-bold font-mono text-[9px]">
                  {emp.employmentType || "Full-Time"}
                </span>

                <span className="text-[10px] text-slate-400 font-semibold font-mono">{emp.role}</span>
              </div>
            </div>

            {/* Profile actions footer */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setViewingEmployee(emp)}
                className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 text-xs font-semibold cursor-pointer"
              >
                <FileText size={13} />
                Dossier File
              </button>
              {isPrivileged && (
                <button
                  onClick={() => startEdit(emp)}
                  className="flex items-center gap-1 hover:bg-white text-indigo-600 font-semibold text-xs py-1.5 px-3 rounded-lg transition duration-150 border border-slate-200/60 shadow-xs cursor-pointer"
                  id={`edit-emp-${emp.id}`}
                >
                  <Edit3 size={13} />
                  Amend Profile
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Appoint / Amend Form Modal */}
      {(showAddForm || editingEmployee) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-100 my-8">
            <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
              <h3 className="heading-display font-medium text-lg text-white">
                {editingEmployee ? `Amend Profiles: ${editingEmployee.name}` : "Add Corporate Employee"}
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingEmployee(null); resetForm(); }}
                className="text-indigo-200 hover:text-white cursor-pointer"
                id="close-modal-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Sectional Tab Selectors */}
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none font-sans">
              <button
                type="button"
                onClick={() => setFormTab("basic")}
                className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition ${
                  formTab === "basic" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setFormTab("address")}
                className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition ${
                  formTab === "address" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                2. Contact & Home
              </button>
              <button
                type="button"
                onClick={() => setFormTab("corporate")}
                className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition ${
                  formTab === "corporate" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                3. Company Placement
              </button>
              <button
                type="button"
                onClick={() => setFormTab("emergency")}
                className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition ${
                  formTab === "emergency" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                4. Emergency
              </button>
              <button
                type="button"
                onClick={() => setFormTab("bank")}
                className={`py-3 px-5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition ${
                  formTab === "bank" ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                5. Bank & Taxes
              </button>
            </div>

            <form onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee} className="p-6 space-y-5">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* TAB 1: BASIC INFO */}
              {formTab === "basic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Employee Code *</label>
                    <input
                      type="text"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-sm"
                      placeholder="e.g. ESP-011 (Auto-seeded if empty)"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">First Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={firstName}
                      onChange={(e) => handleFirstNameChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Last Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={lastName}
                      onChange={(e) => handleLastNameChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Full Legal Name</label>
                    <input
                      type="text"
                      disabled
                      className="w-full p-2 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                      value={fullName}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">NIC Number (National Identity) *</label>
                    <input
                      type="text"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      placeholder="9-digit + V/X or modern 12-digit"
                      value={nicNumber}
                      onChange={(e) => setNicNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Passport Number</label>
                    <input
                      type="text"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      placeholder="e.g. N1092348"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono cursor-pointer"
                      value={dob}
                      onChange={(e) => calculateAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Calculated Age</label>
                    <input
                      type="number"
                      disabled
                      className="w-full p-2 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm font-semibold cursor-not-allowed"
                      value={age}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gender</label>
                    <select
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm cursor-pointer"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Marital Status</label>
                    <select
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm cursor-pointer"
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Photo URL</label>
                    <input
                      type="text"
                      placeholder="Paste image portrait URL (e.g. Unsplash link)"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      value={photo}
                      onChange={(e) => setPhoto(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: ADDRESS & CONTACT */}
              {formTab === "address" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Home Address *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      placeholder="Street, District, Apartment Number"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">City *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">District *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Colombo / Kandy / Galle"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Province *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Western / Central / Southern"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Country</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mobile Number (Primary) *</label>
                    <input
                      type="text"
                      required
                      placeholder="+94 7X XXX XXXX"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: COMPANY PLACEMENT */}
              {formTab === "corporate" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Corporate Designation *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Branch Assigned</label>
                    <select
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm cursor-pointer"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    >
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Location (Desk/Floor)</label>
                    <input
                      type="text"
                      placeholder="e.g. Finance desk block A"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Department</label>
                    <select
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm cursor-pointer"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">System RBAC Role</label>
                    <select
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm cursor-pointer"
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                    >
                      <option value={Role.EMPLOYEE}>Employee</option>
                      <option value={Role.CASHIER}>Cashier</option>
                      <option value={Role.ACCOUNTANT}>Accountant</option>
                      <option value={Role.BRANCH_MANAGER}>Branch Manager</option>
                      <option value={Role.PAYROLL_OFFICER}>Payroll Officer</option>
                      <option value={Role.HR_MANAGER}>HR Manager</option>
                      <option value={Role.SUPER_ADMIN}>Super Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Employment Type</label>
                    <select
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm cursor-pointer"
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value as any)}
                    >
                      <option value="Full-Time">Full-Time (Contract)</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Project Contract</option>
                      <option value="Intern">Internship</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monthly Base Salary (Rs.) *</label>
                    <input
                      type="number"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono font-bold text-indigo-700"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                    />
                  </div>
                  {editingEmployee && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Staff Status</label>
                      <select
                        className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm cursor-pointer"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                      >
                        <option value="Active">Active Duty</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">Standard Leave</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Resigned">Resigned</option>
                        <option value="Retired">Retired</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EMERGENCY CONTACTS */}
              {formTab === "emergency" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Contact Person Name *</label>
                    <input
                      type="text"
                      required={formTab === "emergency"}
                      placeholder="Primary guardian / spouse"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Relationship *</label>
                    <input
                      type="text"
                      required={formTab === "emergency"}
                      placeholder="e.g. Spouse / Mother / Brother"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={emergencyRelationship}
                      onChange={(e) => setEmergencyRelationship(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">Emergency Phone Line *</label>
                    <input
                      type="text"
                      required={formTab === "emergency"}
                      placeholder="+94 7X XXX XXXX"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: BANKING & STATUTORY */}
              {formTab === "bank" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in font-sans">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Disbursement Bank *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sampath Bank / BOC"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bank Branch Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Colombo Fort / Kollupitina"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">Account Routing Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Account Holder Legal Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm"
                      placeholder="Auto-synced with name"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 border-t border-slate-100 pt-3 md:col-span-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-sans">Sri Lanka HR Statutory Compliance Numbers</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">EPF Registry Number</label>
                    <input
                      type="text"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      placeholder="EPF/XXX/XXXXX"
                      value={epfNumber}
                      onChange={(e) => setEpfNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">ETF Registry Number</label>
                    <input
                      type="text"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      placeholder="ETF/XXX/XXXXX"
                      value={etfNumber}
                      onChange={(e) => setEtfNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">TIN (Taxpayer Identification Number)</label>
                    <input
                      type="text"
                      className="w-full p-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-mono"
                      placeholder="e.g. TIN-XXXXXXXX"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Form Navigation Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-1">
                  {formTab !== "basic" && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<typeof formTab> = ["basic", "address", "corporate", "emergency", "bank"];
                        const prev = tabs[tabs.indexOf(formTab) - 1];
                        setFormTab(prev);
                      }}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  {formTab !== "bank" && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<typeof formTab> = ["basic", "address", "corporate", "emergency", "bank"];
                        const next = tabs[tabs.indexOf(formTab) + 1];
                        setFormTab(next);
                      }}
                      className="px-4 py-2 bg-slate-100 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-slate-200 cursor-pointer inline-flex items-center gap-1"
                    >
                      Next Step <ArrowRight size={12} />
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setEditingEmployee(null); resetForm(); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-150 cursor-pointer"
                    id="cancel-modal-btn"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition duration-150 cursor-pointer shadow-sm shadow-indigo-200"
                    id="submit-modal-btn"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED MASTER FILE PROFILE DOSSIER DIALOG (READ ONLY VIEW) */}
      {viewingEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print-transparent">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 my-8 print-no-shadow print-w-full">
            {/* Header Area */}
            <div className="px-6 py-5 bg-indigo-950 text-white flex items-center justify-between print-bg-indigo font-sans">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-indigo-400 font-mono" />
                <div>
                  <h3 className="heading-display font-semibold text-base text-white">Employee Master Record</h3>
                  <p className="text-indigo-300 text-[11px] font-mono leading-none mt-1">Dossier File Ledger Verified: {viewingEmployee.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-indigo-900 hover:bg-indigo-850 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-100 hover:text-white transition cursor-pointer"
                >
                  <Printer size={13} /> Print File
                </button>
                <button
                  onClick={() => setViewingEmployee(null)}
                  className="text-indigo-200 hover:text-white bg-indigo-900 hover:bg-indigo-850 p-1.5 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Dossier Body content */}
            <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto print-overflow-visible">
              
              {/* Primary Identity Segment Card */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left print-bg-light">
                <img 
                  src={viewingEmployee.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"} 
                  alt={viewingEmployee.name}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0"
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start mb-2">
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wide">{viewingEmployee.id}</span>
                      <span className="bg-slate-200 text-slate-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wide">{viewingEmployee.employeeCode}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                        viewingEmployee.status === "Active" ? "bg-emerald-100 text-emerald-800" :
                        viewingEmployee.status === "On Leave" ? "bg-amber-100 text-amber-800" :
                        viewingEmployee.status === "Suspended" ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-800"
                      }`}>
                        {viewingEmployee.status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 heading-display">{viewingEmployee.fullName || viewingEmployee.name}</h2>
                    <p className="text-indigo-600 font-bold text-sm tracking-wide mt-0.5">{viewingEmployee.designation}</p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs pt-2 text-slate-700">
                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Date of Birth</p>
                      <p className="font-semibold font-mono">{viewingEmployee.dob || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Calculated Age</p>
                      <p className="font-semibold">{viewingEmployee.age ? `${viewingEmployee.age} yrs` : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Gender</p>
                      <p className="font-semibold">{viewingEmployee.gender || "Not Provided"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Marital status</p>
                      <p className="font-semibold">{viewingEmployee.maritalStatus || "Not Provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Address, Placement, Emergency, Banks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Home Placement & Contacts */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Home & Correspondence Contact</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Home Residence Address:</span>
                      <p className="text-slate-800 font-semibold mt-0.5">{viewingEmployee.address || "No address listed"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 font-medium">City:</span>
                        <p className="text-slate-800 font-semibold">{viewingEmployee.city || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">District:</span>
                        <p className="text-slate-800 font-semibold">{viewingEmployee.district || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Province:</span>
                        <p className="text-slate-800 font-semibold">{viewingEmployee.province || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Country:</span>
                        <p className="text-slate-800 font-semibold">{viewingEmployee.country || "N/A"}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-50 pt-2 space-y-1">
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-mono text-[11px]">
                        <span className="text-slate-500">Mobile: {viewingEmployee.mobileNumber || viewingEmployee.phone}</span>
                        <button 
                          type="button"
                          onClick={() => copyToClipboard("mobile", viewingEmployee.mobileNumber || viewingEmployee.phone)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 text-[10px] cursor-pointer"
                        >
                          <Clipboard size={10} /> {copiedField === "mobile" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-mono text-[11px]">
                        <span className="text-slate-500">Corporate Email: {viewingEmployee.email}</span>
                        <button 
                          type="button"
                          onClick={() => copyToClipboard("email", viewingEmployee.email)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 text-[10px] cursor-pointer"
                        >
                          <Clipboard size={10} /> {copiedField === "email" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company & Placement Segment */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Corporate Placement & Financials</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 font-medium">Staff Role Type:</span>
                        <p className="text-indigo-700 font-bold uppercase tracking-wider text-[10px] bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">{viewingEmployee.role}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Employment Contract:</span>
                        <p className="text-slate-800 font-semibold mt-0.5">{viewingEmployee.employmentType || "Full-Time (Contract)"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Assigned Branch:</span>
                        <p className="text-slate-800 font-semibold mt-0.5">{viewingEmployee.branch}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Office Location:</span>
                        <p className="text-slate-800 font-semibold mt-0.5">{viewingEmployee.location || "Principal HQ Campus"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Department:</span>
                        <p className="text-slate-800 font-semibold mt-0.5">{viewingEmployee.department}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Appointment Date:</span>
                        <p className="text-slate-800 font-semibold font-mono mt-0.5">{viewingEmployee.joinDate}</p>
                      </div>
                    </div>
                    <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/20 text-indigo-950 flex justify-between items-center">
                      <div>
                        <span className="text-indigo-900/60 font-semibold block text-[10px]">Monthly Contract base salary</span>
                        <span className="text-base font-bold mono-display">Rs. {(viewingEmployee.baseSalary || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency contact */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Primary Emergency Contact</h4>
                  
                  <div className="space-y-3 text-xs">
                    <div className="bg-red-50/40 p-3 rounded-xl border border-red-100/10 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 font-medium">Guardian Name:</span>
                        <p className="text-slate-800 font-bold mt-0.5">{viewingEmployee.emergencyContact?.name || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Emergency Relationship:</span>
                        <p className="text-slate-800 font-semibold mt-0.5">{viewingEmployee.emergencyContact?.relationship || "Not specified"}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Emergency Phone Line:</span>
                      <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg font-mono text-[11px] mt-1">
                        <span className="text-red-700 font-bold">{viewingEmployee.emergencyContact?.phone || "N/A"}</span>
                        {viewingEmployee.emergencyContact?.phone && (
                          <button 
                            type="button"
                            onClick={() => copyToClipboard("emerg", viewingEmployee.emergencyContact.phone)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 text-[10px] cursor-pointer"
                          >
                            <Clipboard size={10} /> {copiedField === "emerg" ? "Copied" : "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bank Routing Details */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Direct Bank routing credentials</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Transfer bank:</span>
                        <p className="text-slate-800 font-semibold mt-0.5">{viewingEmployee.bankInformation?.bankName || viewingEmployee.bankName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Bank Branch location:</span>
                        <p className="text-slate-800 font-semibold mt-0.5">{viewingEmployee.bankInformation?.branch || "Colombo Main Hub"}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-medium">Account Holder of Record:</span>
                        <p className="text-slate-800 font-semibold mt-0.5 truncate">{viewingEmployee.bankInformation?.accountHolderName || viewingEmployee.name}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[9px] uppercase font-bold block">Savings/Current Account Number</span>
                        <span className="text-slate-700 font-bold text-sm tracking-wide">{viewingEmployee.bankInformation?.accountNumber || viewingEmployee.accountNumber}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => copyToClipboard("bankAcc", viewingEmployee.bankInformation?.accountNumber || viewingEmployee.accountNumber)}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 text-[10px] cursor-pointer"
                      >
                        <Clipboard size={11} /> {copiedField === "bankAcc" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sri Lanka Statutory Compliance Segment (Span both on wider screens) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3 shadow-xs md:col-span-2">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Sri Lanka HR Statutory registries
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono pt-1">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-semibold">EPF (Employee Provident Fund)</span>
                      <p className="text-slate-800 font-bold text-xs mt-1">{viewingEmployee.epfNumber || "EPF-PENDING"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-semibold">ETF (Employee Trust Fund)</span>
                      <p className="text-slate-800 font-bold text-xs mt-1">{viewingEmployee.etfNumber || "ETF-PENDING"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-semibold">TIN (Taxpayer Identification No)</span>
                      <p className="text-slate-800 font-bold text-xs mt-1">{viewingEmployee.tinNumber || "TIN-PENDING"}</p>
                    </div>
                  </div>
                  
                  {/* National IDs & Passports row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-1">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">NIC Identification Number</span>
                        <span className="text-slate-800 font-bold text-xs mt-1 block">{viewingEmployee.nicNumber || "Not Provided"}</span>
                      </div>
                      {viewingEmployee.nicNumber && (
                        <button 
                          type="button"
                          onClick={() => copyToClipboard("nic", viewingEmployee.nicNumber)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          {copiedField === "nic" ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Passport Identifier Number</span>
                        <span className="text-slate-800 font-bold text-xs mt-1 block">{viewingEmployee.passportNumber || "Not Provided"}</span>
                      </div>
                      {viewingEmployee.passportNumber && (
                        <button 
                          type="button"
                          onClick={() => copyToClipboard("pass", viewingEmployee.passportNumber)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          {copiedField === "pass" ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Dossier footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setViewingEmployee(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl text-xs transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
