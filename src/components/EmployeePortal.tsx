import React, { useState } from "react";
import { Employee, Attendance, LeaveRequest, SalaryAdvance, Payslip, Announcement, Role } from "../types";
import { Clock, Calendar, Coins, User, HardDrive, Bell, CheckCircle2, AlertCircle, Eye, LogIn, ArrowRight } from "lucide-react";
import InteractivePayslipView from "./InteractivePayslipView";

interface EmployeePortalProps {
  employee: Employee;
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  advances: SalaryAdvance[];
  payslips: Payslip[];
  announcements: Announcement[];
  onUpdateState: () => Promise<void>;
  logAuditAction: (module: string, action: string, details: string) => void;
}

export default function EmployeePortal({
  employee,
  employees,
  attendance,
  leaves,
  advances,
  payslips,
  announcements,
  onUpdateState,
  logAuditAction
}: EmployeePortalProps) {
  const [activePortalTab, setActivePortalTab] = useState<"dashboard" | "leaves" | "payslips">("dashboard");
  const [clockInNotes, setClockInNotes] = useState("");
  const [punching, setPunching] = useState(false);
  const [addingLeave, setAddingLeave] = useState(false);
  
  // New Leave Request State
  const [leaveType, setLeaveType] = useState<any>("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSuccess, setLeaveSuccess] = useState("");
  const [leaveError, setLeaveError] = useState("");

  // Payslip detail state
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Check today's punch state
  const todayStr = new Date().toISOString().split("T")[0];
  const todayPunch = attendance.find(a => a.employeeId === employee.id && a.date === todayStr);

  // Filter lists for only this employee
  const myLeaves = leaves.filter(l => l.employeeId === employee.id);
  const myAdvances = advances.filter(a => a.employeeId === employee.id);
  const myPayslips = payslips.filter(p => p.employeeId === employee.id);

  // Bulletins filtered by target department
  const filteredBulletins = announcements.filter(
    a => !a.targetDepartment || a.targetDepartment === "ALL" || a.targetDepartment === employee.department
  );

  const handlePunch = async (status: "Present" | "Absent" | "Half-Day" | "Late") => {
    setPunching(true);
    try {
      const res = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          status,
          notes: clockInNotes || `Clock ${status === "Present" ? "In" : "Out"} via ESS Mobile portal`
        })
      });
      if (res.ok) {
        logAuditAction("Attendance Logging", `Employee Shift ${status}`, `Self logged attendance session status as ${status}`);
        setClockInNotes("");
        await onUpdateState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPunching(false);
    }
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError("");
    setLeaveSuccess("");

    if (!startDate || !endDate || !leaveReason) {
      setLeaveError("Please complete all fields to submit furlough application.");
      return;
    }

    setAddingLeave(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.id,
          leaveType,
          startDate,
          endDate,
          reason: leaveReason
        })
      });
      if (res.ok) {
        setLeaveSuccess("Leave application submitted successfully for review!");
        setLeaveReason("");
        setStartDate("");
        setEndDate("");
        logAuditAction("Leaves Core", "Submit Leave Furlough", `Submitted a ${leaveType} leave request from ${startDate} to ${endDate}`);
        await onUpdateState();
      } else {
        const d = await res.json();
        setLeaveError(d.error || "Failed submit.");
      }
    } catch {
      setLeaveError("Server connection lost");
    } finally {
      setAddingLeave(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto md:max-w-4xl p-1">
      {/* Mobile-centric Profile Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-extrabold text-lg shadow-sm font-mono tracking-tighter">
              EP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold tracking-tight heading-display">{employee.name}</h2>
                <span className="bg-indigo-505 text-indigo-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-indigo-600">Active Duty</span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">{employee.designation} • {employee.department}</p>
              <p className="text-[10px] text-indigo-350 font-mono tracking-wider mt-1">OPERATIONAL HQ: {employee.branch}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-white/10 self-start md:self-auto flex items-center gap-3 font-mono text-xs">
            <Coins size={15} className="text-indigo-300" />
            <div>
              <span className="text-[9px] text-indigo-300 uppercase font-bold block leading-none">Monthly Base Pay</span>
              <span className="text-sm font-extrabold text-white">Rs. {employee.baseSalary.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Dynamic portal sub-tabs menu (Highly mobile responsive) */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mt-6 max-w-sm">
          <button
            onClick={() => setActivePortalTab("dashboard")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
              activePortalTab === "dashboard" ? "bg-white text-slate-900 shadow-xs" : "text-slate-350 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActivePortalTab("leaves")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
              activePortalTab === "leaves" ? "bg-white text-slate-900 shadow-xs" : "text-slate-350 hover:text-white"
            }`}
          >
            My Leaves
          </button>
          <button
            onClick={() => setActivePortalTab("payslips")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
              activePortalTab === "payslips" ? "bg-white text-slate-900 shadow-xs" : "text-slate-350 hover:text-white"
            }`}
          >
            My Payslips
          </button>
        </div>
      </div>

      {activePortalTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Quick Clocking Attendance core widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">Today's Shift Clock</h3>
              </div>
              <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">{todayStr}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Duty Status:</span>
              {todayPunch ? (
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                  ✓ Registered Present
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold uppercase text-[10px] animate-pulse">
                  ● Pending Punch
                </span>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clock Duty Notes (Optional)</label>
              <input
                type="text"
                placeholder="Declare shift remarks, late reasons or branch details..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                value={clockInNotes}
                onChange={(e) => setClockInNotes(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handlePunch("Present")}
                disabled={punching || !!todayPunch}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition duration-150 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <LogIn size={13} />
                Clock In Present
              </button>
              <button
                onClick={() => handlePunch("Late")}
                disabled={punching || !!todayPunch}
                className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition duration-150 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                Clock In Late
              </button>
            </div>
          </div>

          {/* Quick Stats Grid & Advances */}
          <div className="space-y-5">
            {/* My Active Advances Summary Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                <Coins size={15} className="text-slate-500" />
                Active Advances & Welfare
              </h3>
              {myAdvances.length === 0 ? (
                <p className="text-xs text-slate-400 leading-relaxed text-center py-2">
                  No active salary cash advance outstanding.
                </p>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {myAdvances.map(adv => (
                    <div key={adv.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 border border-slate-100/80 rounded-lg">
                      <div>
                        <p className="font-extrabold text-slate-800">Rs. {adv.requestAmount.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Deduction: Rs. {adv.monthlyDeduction.toLocaleString()}/mo</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                        adv.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        adv.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse" :
                        "bg-slate-100 text-slate-400"
                      }`}>
                        {adv.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Bulletins & Notifications feed */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                <Bell size={15} className="text-slate-500" />
                Office Broadcast Bulletins
              </h3>
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {filteredBulletins.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No announcement bulletins for your department at this time.</p>
                ) : (
                  filteredBulletins.map(bull => (
                    <div key={bull.id} className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl space-y-1">
                      <div className="flex justify-between items-start">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          bull.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
                        }`}>
                          {bull.priority} Priority
                        </span>
                        <span className="text-[8px] font-mono text-slate-400">{bull.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-1 leading-snug">{bull.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">{bull.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activePortalTab === "leaves" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Apply Furlough form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Calendar size={15} className="text-indigo-600" />
              Apply Leave Furlough
            </h3>

            {leaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={15} />
                {leaveSuccess}
              </div>
            )}
            {leaveError && (
              <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} />
                {leaveError}
              </div>
            )}

            <form onSubmit={handleRequestLeave} className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Leave Type selection</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Furlough Reason</label>
                <textarea
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Type details or reason for vacation, emergency, or hospital leave..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-xs leading-normal font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={addingLeave}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                {addingLeave ? "Registering Leave Request..." : "Submit Application"}
              </button>
            </form>
          </div>

          {/* Leave records list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">My Leave Application Registry</h3>
            {myLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No leave applications recorded in database registry.</p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {myLeaves.map(lev => (
                  <div key={lev.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800">{lev.leaveType} Furlough</span>
                        <span className="text-[10px] text-slate-400 font-mono">({lev.id})</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{lev.startDate} to {lev.endDate}</p>
                      <p className="text-[10.5px] italic text-slate-400 leading-normal mt-1 max-w-[200px] truncate">{lev.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        lev.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        lev.status === "Rejected" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                        "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                      }`}>
                        {lev.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activePortalTab === "payslips" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">My Certified Digital Payslips</h3>
          {myPayslips.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-205">No monthly pay cycle slips processed in central payroll yet.</p>
          ) : (
            <div className="space-y-3">
              {myPayslips.map(ps => (
                <div key={ps.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Monthly Payslip Block • {ps.month}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Cert ID: {ps.id}</p>
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-500 font-mono">
                      <span>Salary Base: Rs. {ps.baseSalary.toLocaleString()}</span>
                      <span>Allowances: Rs. {(ps.allowances.medical + ps.allowances.housing + ps.allowances.performance).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right shrink-0">
                    <div className="font-mono">
                      <p className="text-slate-900 font-black text-sm">Rs. {ps.netSalary.toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-600 uppercase font-black tracking-wider block mt-0.5">✓ {ps.status}</span>
                    </div>
                    <button
                      onClick={() => setSelectedPayslip(ps)}
                      className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100 bg-white rounded-lg transition cursor-pointer"
                      title="Inspect payslip ledger details"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal View Payslip detail breakdown */}
      {selectedPayslip && (
        <InteractivePayslipView
          payslip={selectedPayslip}
          employees={employees}
          onClose={() => setSelectedPayslip(null)}
          isPrivileged={false}
        />
      )}
    </div>
  );
}
