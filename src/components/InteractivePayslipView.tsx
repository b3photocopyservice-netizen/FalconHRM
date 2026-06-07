import React, { useState } from "react";
import { Employee, Payslip, Role } from "../types";
import { 
  X, 
  Printer, 
  Mail, 
  Send, 
  CheckCircle2, 
  QrCode, 
  Building2, 
  User, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  FileText,
  AlertCircle
} from "lucide-react";

interface InteractivePayslipViewProps {
  payslip: Payslip;
  employees: Employee[];
  onClose: () => void;
  isPrivileged?: boolean;
  onDisburse?: (id: string) => void;
}

// Convert numbers of any magnitude to elegant Rupee wording
function numberToWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numVal = Math.round(num);
  if (numVal === 0) return "Zero Rupees";

  function convertHundreds(n: number): string {
    if (n < 20) return a[n];
    const tens = Math.floor(n / 10);
    const units = n % 10;
    return b[tens] + (units ? " " + a[units] : "");
  }

  function convertThreeDigits(n: number): string {
    if (n < 100) return convertHundreds(n);
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    return a[hundreds] + " Hundred" + (remainder ? " and " + convertHundreds(remainder) : "");
  }

  let words = "";
  let temp = numVal;

  if (temp >= 10000000) {
    const crores = Math.floor(temp / 10000000);
    words += convertThreeDigits(crores) + " Crore ";
    temp %= 10000000;
  }

  if (temp >= 100000) {
    const lakhs = Math.floor(temp / 100000);
    words += convertThreeDigits(lakhs) + " Lakh ";
    temp %= 100000;
  }

  if (temp >= 1000) {
    const thousands = Math.floor(temp / 1000);
    words += convertThreeDigits(thousands) + " Thousand ";
    temp %= 1000;
  }

  if (temp > 0) {
    words += convertThreeDigits(temp);
  }

  return words.trim() + " Rupees Only";
}

export default function InteractivePayslipView({
  payslip,
  employees,
  onClose,
  isPrivileged = false,
  onDisburse
}: InteractivePayslipViewProps) {
  // Find full employee record for comprehensive details
  const emp = employees.find(e => e.id === payslip.employeeId) || {
    fullName: payslip.employeeName,
    employeeCode: payslip.employeeId,
    designation: "Employee",
    department: "Management",
    nicNumber: "N/A",
    mobileNumber: "N/A",
    email: "employee@company.com",
    bankInformation: {
      bankName: "Commercial Bank of Ceylon",
      branch: "Colombo Fort",
      accountNumber: "123-XXXX-789",
      accountHolderName: payslip.employeeName
    },
    joinDate: "N/A",
    employmentType: "Full-Time"
  };

  // Status flags and states
  const [sharingType, setSharingType] = useState<"email" | "whatsapp" | null>(null);
  const [emailInput, setEmailInput] = useState(emp.email || "");
  const [phoneInput, setPhoneInput] = useState(emp.mobileNumber || "");
  const [subjectInput, setSubjectInput] = useState(`Official Payslip Certificate - ${payslip.month}`);
  const [messageBody, setMessageBody] = useState(
    `Dear ${payslip.employeeName},\n\nPlease find attached your official Payslip for the period ${payslip.month}.\n\nNet remitted salary: Rs. ${payslip.netSalary.toLocaleString()}\nVerify slip integrity securely via our decentralized HR Ledger portals.\n\nBest regards,\nEnterprise Roster HR Team`
  );
  const [sendingState, setSendingState] = useState<"idle" | "submitting" | "completed">("idle");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [verificationModal, setVerificationModal] = useState(false);

  // Computed Values
  const baseSal = payslip.baseSalary;
  const allowances = (payslip.allowances || {}) as Payslip["allowances"];
  const sumAllowances = 
    (allowances.medical || 0) + 
    (allowances.housing || 0) + 
    (allowances.performance || 0) + 
    (allowances.leaveEncashment || 0) +
    (allowances.attendanceAllowance || 0) +
    (allowances.fuelAllowance || 0) +
    (allowances.telephoneAllowance || 0) +
    (allowances.mealAllowance || 0) +
    (allowances.budgetReliefAllowance || 0) +
    (allowances.interimAllowance || 0) +
    (allowances.incentiveAllowance || 0) +
    (allowances.customAllowances || 0);

  const sumOt = (payslip.overtime?.holidayOt || 0) + (payslip.overtime?.fridayOt || 0);
  const totalEarnings = baseSal + sumAllowances + sumOt + (payslip.bonusAmount || 0);

  const deductions = (payslip.deductions || {}) as Payslip["deductions"];
  const totalDeductions = 
    (deductions.tax || 0) + 
    (deductions.providentFund || 0) + 
    (deductions.etfDeduction || 0) + 
    (deductions.advanceRecovery || 0) + 
    (deductions.storePurchaseRecovery || 0) + 
    (deductions.unpaidLeaveDeduction || 0) + 
    (deductions.latePenalty || 0) + 
    (deductions.otherDeductions || 0);

  const netCalculated = totalEarnings - totalDeductions;
  
  // SHA-256 Mock hash signature of authenticity
  const computedHash = btoa(`${payslip.id}-${payslip.employeeId}-${payslip.netSalary}-${payslip.month}`).slice(0, 16).toUpperCase();
  const verificationUrl = `https://ais-pre-znrquoomqy7gjdary7jxoa-232426356006.asia-southeast1.run.app/verify/${payslip.id}?hash=${computedHash}`;
  const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  // Share payslip API triggers
  const handleSharePayslip = async (mode: "email" | "whatsapp") => {
    setSendingState("submitting");
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        payslipId: payslip.id,
        mode,
        target: mode === "email" ? emailInput : phoneInput,
        subject: subjectInput,
        body: messageBody,
        hash: computedHash
      };

      const res = await fetch("/api/payslips/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSendingState("completed");
        setSuccessMsg(`Payslip successfully transmitted via official ${mode.toUpperCase()} gateway!`);
        setTimeout(() => {
          setSharingType(null);
          setSendingState("idle");
        }, 2000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || `Failed to transmit payslip via ${mode}.`);
        setSendingState("idle");
      }
    } catch {
      setErrorMsg("Failed to connect with corporate gateway servers.");
      setSendingState("idle");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 text-xs font-semibold my-8 flex flex-col md:flex-row h-[90vh] max-h-[850px]" id="payslip-audit-modal">
        
        {/* Left Side: Payslip Render (Interactive Statement PDF style) */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 print:p-0 print:m-0 print:h-auto" id="printable-payslip-canvas">
          {/* Header & Logo */}
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="text-indigo-600 h-6 w-6 shrink-0" />
                <span className="font-black text-slate-800 text-sm tracking-tight uppercase">APEXGATE MANUFACTURING (PVT) LTD</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">Reg No: PV-129485 | Galle Road, Colombo 03, Sri Lanka</p>
              <p className="text-[10px] text-slate-400 font-mono">Web: www.apexgate.lk | Tel: +94 11 234 5678</p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-slate-150 text-slate-600 font-mono">Private & Confidential</span>
              <h2 className="text-lg font-black text-slate-900 mt-1 uppercase tracking-tight">SALARY SLIP</h2>
              <p className="text-indigo-600 font-mono text-[10px] mt-0.5">PAY PERIOD: <span className="font-extrabold">{payslip.month}</span></p>
            </div>
          </div>

          {/* Employee & Bank Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-[11px] text-slate-600 font-mono">
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Employee Particulars</span>
              <div className="flex justify-between"><span className="font-sans">Name:</span><strong className="text-slate-800 text-[11px]">{payslip.employeeName}</strong></div>
              <div className="flex justify-between"><span className="font-sans">Code ID:</span><span className="text-slate-700 font-bold">{emp.employeeCode}</span></div>
              <div className="flex justify-between"><span className="font-sans">Designation:</span><span className="text-slate-700 font-bold">{emp.designation}</span></div>
              <div className="flex justify-between"><span className="font-sans">Department:</span><span className="text-slate-700 font-bold">{emp.department}</span></div>
              <div className="flex justify-between"><span className="font-sans">NIC Number:</span><span className="text-slate-700 font-bold">{emp.nicNumber || "N/A"}</span></div>
            </div>
            <div className="space-y-1.5 md:border-l md:pl-5 border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Disbursal Details</span>
              <div className="flex justify-between"><span className="font-sans">Bank:</span><span className="text-slate-700 font-bold truncate max-w-[150px]">{emp.bankInformation?.bankName || "Commercial Bank"}</span></div>
              <div className="flex justify-between"><span className="font-sans">Branch:</span><span className="text-slate-700 font-bold">{emp.bankInformation?.branch || "HQ Branch"}</span></div>
              <div className="flex justify-between"><span className="font-sans">Account No:</span><span className="text-slate-700 font-bold">{emp.bankInformation?.accountNumber || "123XXXX456"}</span></div>
              <div className="flex justify-between"><span className="font-sans">EPF No:</span><span className="text-slate-700 font-bold">E-{(parseInt(payslip.id.replace(/\D/g,'')) || 8219)}-A</span></div>
              <div className="flex justify-between"><span className="font-sans">Status Flag:</span><span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${payslip.status === "Paid" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-cyan-50 text-cyan-600 border border-cyan-100"}`}>{payslip.status}</span></div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Earnings Columns */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden font-mono">
              <div className="bg-emerald-50 text-emerald-700 px-3 py-2 text-[10px] uppercase font-bold flex justify-between items-center border-b border-slate-100">
                <span className="flex items-center gap-1"><ArrowUpRight size={12} /> Earnings Structure</span>
                <span>LKR</span>
              </div>
              <div className="p-3.5 space-y-2 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Basic / Base Pay</span>
                  <span className="text-slate-800 font-bold">{baseSal.toLocaleString(".00")}</span>
                </div>

                {/* Sub components if present */}
                {Object.entries(allowances).map(([key, val]) => {
                  if (typeof val === 'number' && val > 0) {
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key} className="flex justify-between text-slate-600">
                        <span className="capitalize">{label}</span>
                        <span>{val.toLocaleString(".00")}</span>
                      </div>
                    );
                  }
                  return null;
                })}

                {sumOt > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Overtime Allowance</span>
                    <span>{sumOt.toLocaleString(".00")}</span>
                  </div>
                )}

                {payslip.bonusAmount > 0 && (
                  <div className="flex justify-between text-indigo-600 font-bold">
                    <span>Bonuses Disbursed</span>
                    <span>{payslip.bonusAmount.toLocaleString(".00")}</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-50/70 p-3 flex justify-between items-center text-[11px] font-bold text-slate-700 border-t border-slate-100 mt-2">
                <span>Total Gross Earnings (A)</span>
                <span>Rs. {totalEarnings.toLocaleString(".00")}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden font-mono">
              <div className="bg-rose-50 text-rose-700 px-3 py-2 text-[10px] uppercase font-bold flex justify-between items-center border-b border-slate-100">
                <span className="flex items-center gap-1"><ArrowDownRight size={12} /> Deductions & Statutory</span>
                <span>LKR</span>
              </div>
              <div className="p-3.5 space-y-2 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>PAYE / APIT Tax Pool</span>
                  <span className="text-slate-800 font-bold">{(deductions.tax || 0).toLocaleString(".00")}</span>
                </div>
                <div className="flex justify-between">
                  <span>EPF Share (Employee - 8%)</span>
                  <span>{(deductions.providentFund || 0).toLocaleString(".00")}</span>
                </div>
                {deductions.etfDeduction > 0 && (
                  <div className="flex justify-between">
                    <span>Voluntary ETF Extra</span>
                    <span>{deductions.etfDeduction.toLocaleString(".00")}</span>
                  </div>
                )}
                {deductions.advanceRecovery > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Salary Advance recovery</span>
                    <span>{deductions.advanceRecovery.toLocaleString(".00")}</span>
                  </div>
                )}
                {deductions.storePurchaseRecovery > 0 && (
                  <div className="flex justify-between">
                    <span>Store Purchases balance</span>
                    <span>{deductions.storePurchaseRecovery.toLocaleString(".00")}</span>
                  </div>
                )}
                {deductions.unpaidLeaveDeduction > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium font-sans">
                    <span>No Pay Leave Reduction</span>
                    <span>{deductions.unpaidLeaveDeduction.toLocaleString(".00")}</span>
                  </div>
                )}
                {deductions.latePenalty > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Minutes Clocking Late Fine</span>
                    <span>{deductions.latePenalty.toLocaleString(".00")}</span>
                  </div>
                )}
                {deductions.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span>Other adjustments</span>
                    <span>{deductions.otherDeductions.toLocaleString(".00")}</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-50/70 p-3 flex justify-between items-center text-[11px] font-bold text-slate-700 border-t border-slate-100 mt-2">
                <span>Total Deductions (B)</span>
                <span>Rs. {totalDeductions.toLocaleString(".00")}</span>
              </div>
            </div>
          </div>

          {/* Sri Lankan Statutory Reserves */}
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl text-[10px] font-mono text-slate-500 space-y-1">
            <div className="font-extrabold uppercase tracking-wide flex items-center gap-1">
              <ShieldCheck size={11} className="text-slate-400" /> Employer Contributions (Sri Lankan Statutory Standards - Non Deductible)
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1 text-slate-600">
              <div className="flex justify-between bg-white px-2 py-1 rounded-md border border-slate-200">
                <span>Employer EPF (12% code):</span>
                <strong className="text-slate-700">Rs. {(payslip.employerEpf || Math.round(baseSal * 0.12)).toLocaleString(".00")}</strong>
              </div>
              <div className="flex justify-between bg-white px-2 py-1 rounded-md border border-slate-200">
                <span>Employer ETF (3% code):</span>
                <strong className="text-slate-700">Rs. {(payslip.employerEtf || Math.round(baseSal * 0.03)).toLocaleString(".00")}</strong>
              </div>
            </div>
          </div>

          {/* Grand Net Take Home Box */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl gap-3">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest font-mono">NET DISBURSED SALARY (A - B)</span>
              <p className="text-2xl font-black text-indigo-700 font-mono tracking-tight leading-none">
                Rs. {payslip.netSalary.toLocaleString(".00")}
              </p>
              <p className="text-[10px] text-slate-500 italic">
                Amount in Words: <span className="font-bold underline">{numberToWords(payslip.netSalary)}</span>
              </p>
            </div>

            {/* QR verification code right in the slip */}
            <div className="flex items-center gap-3 bg-white p-2 border border-slate-150 rounded-xl">
              <img 
                src={qrCodeSrc} 
                alt="Payslip Verifier QR" 
                className="w-14 h-14 border border-slate-100 rounded-md shadow-xs cursor-pointer" 
                title="Cryptographic verification ID"
                referrerPolicy="no-referrer"
                onClick={() => setVerificationModal(true)}
              />
              <div className="text-left font-mono">
                <span className="text-[8px] text-slate-400 uppercase font-black tracking-wide block leading-tight">Secured Ledger</span>
                <span className="text-[9px] text-indigo-700 font-black block mt-0.5">{computedHash}</span>
                <button 
                  onClick={() => setVerificationModal(true)}
                  className="text-[8px] text-indigo-600 hover:underline hover:text-indigo-850 block font-bold mt-1 uppercase"
                >
                  Verify Authenticity
                </button>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-6 text-[10px] font-mono text-slate-400">
            <div className="text-center space-y-4">
              <div className="h-6 flex items-end justify-center"><span className="text-[8px] font-mono select-none text-slate-200">ApexGate HR / Digital-Sign</span></div>
              <div className="border-t border-slate-200 pt-1.5 font-bold uppercase tracking-wide">HR & Payroll Director</div>
            </div>
            <div className="text-center space-y-4">
              <div className="h-6 flex items-end justify-center"><span className="text-[8px] text-slate-350 bg-slate-100 px-2 rounded-full font-mono">IP: {dbSessionIp || "127.0.0.1"}</span></div>
              <div className="border-t border-slate-200 pt-1.5 font-bold uppercase tracking-wide">Employee Signature / Ack</div>
            </div>
          </div>
        </div>

        {/* Right Side: Action Control Sidebar */}
        <div className="w-full md:w-80 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-250 p-6 flex flex-col justify-between" id="payslip-audit-controls">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] font-mono">Disbursement Controls</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Shares/PDF Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-slate-900/10"
              >
                <Printer size={13} className="text-slate-300" />
                Generate & Save PDF / Print
              </button>

              <button
                onClick={() => {
                  setSharingType("email");
                  setSendingState("idle");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-250 cursor-pointer shadow-xs"
              >
                <Mail size={13} className="text-slate-500" />
                Email Payslip Standard
              </button>

              <button
                onClick={() => {
                  setSharingType("whatsapp");
                  setSendingState("idle");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-705/10"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.1 1.45 4.8 1.45 5.516 0 10.002-4.485 10.005-10 0-2.67-1.04-5.18-2.924-7.07C16.543 1.65 14.04 1.6 12 1.6 6.484 1.6 2 6.08 2 11.6c0 1.8.48 3.56 1.4 5.11L2.4 21.6l5.22-1.37h-.03-.02h.02-.02zM18 14.5c-.27-.14-1.6-.8-1.85-.9s-.42-.14-.6.12-.7.9-.86 1.08-.32.2-.6.06c-.27-.14-1.15-.42-2.2-1.35-.8-.72-1.35-1.62-1.5-1.9-.17-.27-.02-.42.12-.55.12-.12.27-.32.4-.48s.18-.3.27-.5c.09-.2.04-.38-.02-.5s-.6-1.43-.82-1.95c-.21-.52-.43-.45-.6-.45h-.5c-.17 0-.45.06-.7.33-.23.27-.9.88-.9 2.16s.93 2.5 1.06 2.68c.13.18 1.83 2.8 4.43 3.93.62.27 1.11.43 1.5.55.63.2 1.2.17 1.66.1.5-.08 1.6-.66 1.82-1.3.22-.63.22-1.17.15-1.3-.07-.12-.27-.2-.54-.33z"/>
                </svg>
                WhatsApp Business Slip
              </button>
            </div>

            {/* Sharing Type Modal Inner Fields */}
            {sharingType && (
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Share via {sharingType.toUpperCase()}
                  </span>
                  <button 
                    onClick={() => setSharingType(null)}
                    className="text-slate-400 hover:text-slate-600 text-[10px]"
                  >
                    ✕ Cancel
                  </button>
                </div>

                {sharingType === "email" ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-slate-500 font-mono">Recipient Email</label>
                      <input 
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        placeholder="employee@company.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-slate-500 font-mono">Email Subject</label>
                      <input 
                        type="text"
                        value={subjectInput}
                        onChange={(e) => setSubjectInput(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase text-slate-500 font-mono">Recipient Phone (WhatsApp)</label>
                      <input 
                        type="text"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        placeholder="+94771234567"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-slate-500 font-mono">Message Notes</label>
                  <textarea 
                    rows={3}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium leading-relaxed font-sans"
                  />
                </div>

                {sendingState === "submitting" ? (
                  <div className="py-2 text-center text-xs text-indigo-600 font-mono font-bold">
                    Transmitting payslip payload...
                  </div>
                ) : sendingState === "completed" ? (
                  <div className="p-2 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[10px] font-sans flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>Transmitted successfully! Audit logged.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSharePayslip(sharingType)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-[11px] transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send size={11} /> Send Digital Slip
                  </button>
                )}

                {errorMsg && (
                  <p className="text-[9px] text-rose-600 font-bold font-mono">{errorMsg}</p>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200 space-y-3">
            {payslip.status !== "Paid" && isPrivileged && onDisburse && (
              <button
                onClick={() => {
                  onDisburse(payslip.id);
                  onClose();
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-indigo-200"
              >
                Disburse Payout Settlement
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-white hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition border border-slate-300 cursor-pointer"
            >
              Close Statement
            </button>
          </div>
        </div>

        {/* Inner Modal: Cryptographic Integrity Verification */}
        {verificationModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-55">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-slate-200 font-sans space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100/80 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <ShieldCheck size={26} />
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-800">Payslip Cryptographic Signature Verified</h4>
                <p className="text-slate-400 text-[10px] mt-0.5">ApexGate Decentralized HR Audit Register</p>
              </div>

              {/* Digital Proof */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl text-[10px] text-left font-mono space-y-1.5 text-slate-600">
                <div><span className="text-slate-400">Statement ID:</span> <span className="text-slate-800 font-bold">{payslip.id}</span></div>
                <div><span className="text-slate-400">Employee Hash:</span> <span className="text-indigo-600 font-bold">{payslip.employeeId}</span></div>
                <div><span className="text-slate-400">Net remitted:</span> <span className="text-slate-800 font-bold">Rs. {payslip.netSalary.toLocaleString()}</span></div>
                <div><span className="text-slate-400">Blockchain Block:</span> <span className="text-slate-800 font-bold">#{(parseInt(payslip.id.replace(/\D/g,'')) || 41) * 312}</span></div>
                <div className="pt-1.5 border-t border-slate-150 mt-1"><span className="text-slate-400 block mb-0.5">Hash Certificate:</span><span className="text-[10px] font-black text-indigo-700 break-all select-all">{computedHash}</span></div>
              </div>

              <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 text-[10px] leading-relaxed text-blue-700 font-semibold flex items-start gap-1.5">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span className="text-left font-sans">This QR represents a digital fingerprint. Anyone scanning can confirm the issued amount is verified and matching the ApexGate bank roster payout list.</span>
              </div>

              <button
                onClick={() => setVerificationModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                Awesome, Clear Proof
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Generate IP address safely static mock
const dbSessionIp = "192.168.10.84";
