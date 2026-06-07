/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Announcement, Role, Employee, NotificationLog, NotificationChannelSetting } from "../types";
import { 
  Megaphone, MessageSquare, AlertCircle, Calendar, PlusCircle, Check, 
  Settings2, Sliders, Send, Mail, Phone, ShieldCheck, Zap, 
  RefreshCw, ClipboardList, Play, HelpCircle, CheckCircle2, UserCheck
} from "lucide-react";

interface NotificationsModuleProps {
  announcements: Announcement[];
  employees: Employee[];
  currentRole: Role;
  onUpdateState: () => void;
}

export default function NotificationsModule({ announcements, employees, currentRole, onUpdateState }: NotificationsModuleProps) {
  // Tabs: "bulletins" | "channels" | "outbox" | "sandbox"
  const [activeSubTab, setActiveSubTab] = useState<"bulletins" | "channels" | "outbox" | "sandbox">("bulletins");

  // State for announcments post
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Announcement["priority"]>("Medium");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // States for notifications configs & log data
  const [settings, setSettings] = useState<NotificationChannelSetting[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // States for manual simulator (Sandbox)
  const [sandboxEmployeeId, setSandboxEmployeeId] = useState("");
  const [sandboxEvent, setSandboxEvent] = useState("Leave Request");
  const [sandboxDetails, setSandboxDetails] = useState("");
  const [sandboxSuccess, setSandboxSuccess] = useState("");
  const [sandboxError, setSandboxError] = useState("");

  // Log filter
  const [logSearch, setLogSearch] = useState("");

  // Fetch notification settings and log histories
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [settingsRes, logsRes] = await Promise.all([
          fetch("/api/notifications/settings"),
          fetch("/api/notifications/logs")
        ]);
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          setSettings(sData);
        }
        if (logsRes.ok) {
          const lData = await logsRes.json();
          setLogs(lData);
        }
      } catch (err) {
        console.error("Failed fetching notifications context:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [refreshKey]);

  // Set default employee for sandbox once employees is loaded
  useEffect(() => {
    if (employees && employees.length > 0 && !sandboxEmployeeId) {
      setSandboxEmployeeId(employees[0].id);
    }
  }, [employees, sandboxEmployeeId]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!title || !body) {
      setErrorMsg("Please complete all blank required fields");
      return;
    }

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, priority })
      });

      if (res.ok) {
        setSuccessMsg("Announcement published instantly in corporate channels.");
        setTitle("");
        setBody("");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed loading data");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleToggleChannel = async (eventKey: string, channelType: "email" | "sms" | "whatsapp" | "inApp") => {
    const isUnprivileged = currentRole !== Role.SUPER_ADMIN && currentRole !== Role.HR_MANAGER;
    if (isUnprivileged) {
      alert("Unauthorized. Requires Super Admin or HR Director credentials.");
      return;
    }

    const updated = settings.map(item => {
      if (item.event === eventKey) {
        return {
          ...item,
          [channelType]: !item[channelType]
        };
      }
      return item;
    });

    setSettings(updated);

    try {
      const res = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updated })
      });
      if (res.ok) {
        // Refresh
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed persisting notification settings:", err);
    }
  };

  const handleTriggerSandboxTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSandboxSuccess("");
    setSandboxError("");

    if (!sandboxEmployeeId || !sandboxEvent || !sandboxDetails) {
      setSandboxError("Requires active Employee target, Event selection, and custom log details.");
      return;
    }

    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: sandboxEmployeeId,
          event: sandboxEvent,
          details: sandboxDetails
        })
      });

      if (res.ok) {
        setSandboxSuccess("Real-time notification dispatch generated. Delivery entries buffered below.");
        setSandboxDetails("");
        setRefreshKey(prev => prev + 1);
      } else {
        const err = await res.json();
        setSandboxError(err.error || "Failed sandbox transmission testing.");
      }
    } catch {
      setSandboxError("Server exception.");
    }
  };

  const isPrivileged = currentRole === Role.SUPER_ADMIN || currentRole === Role.HR_MANAGER || currentRole === Role.BRANCH_MANAGER;
  const isHrOrAdmin = currentRole === Role.SUPER_ADMIN || currentRole === Role.HR_MANAGER;

  // Filter outbox logs
  const filteredLogs = logs.filter(log => {
    const q = logSearch.toLowerCase();
    if (!q) return true;
    return (
      log.employeeId.toLowerCase().includes(q) ||
      log.employeeName.toLowerCase().includes(q) ||
      log.event.toLowerCase().includes(q) ||
      log.bodyText.toLowerCase().includes(q) ||
      log.recipientAddress.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 heading-display flex items-center gap-2">
            <Megaphone size={22} className="text-indigo-600 shrink-0" />
            Corporate Notification Control & Bulletin System
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure active notification dispatch engines, broadcast corporate bulletins, and audit the output outbox logs feed.</p>
        </div>
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl transition font-semibold self-start md:self-auto flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
          Sync Outbox Stream
        </button>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50 w-fit">
        {[
          { id: "bulletins", label: "Bulletin Broadcasts", icon: Megaphone },
          { id: "channels", label: "Notification Channels Matrix", icon: Settings2 },
          { id: "outbox", label: "Dispatched Outbox Log", icon: ClipboardList },
          { id: "sandbox", label: "Real-time Sandbox Simulator", icon: Send }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setSandboxSuccess("");
                setSandboxError("");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                active 
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/40" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
              id={`ntf-tab-${tab.id}`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* RENDER BULLETINS BROADCASTS */}
      {activeSubTab === "bulletins" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Publish form */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 h-fit space-y-4 font-sans">
            <div>
              <h3 className="text-base font-bold text-slate-800 heading-display">Publish Directive</h3>
              <p className="text-xs text-slate-500 mt-0.5">Broadcasting instantly mirrors on employee portal dash feeds.</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Broadcaster Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Audit preparation instructions"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  id="ann-title-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">System Priority Level</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Announcement["priority"])}
                  id="ann-priority-select"
                >
                  <option value="Low">Low - Informational Update</option>
                  <option value="Medium">Medium - Department Directive</option>
                  <option value="High">High - Mandatory Action Item</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider">Message Description Body</label>
                <textarea
                  placeholder="Declare details so employees may comply securely..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 h-24 placeholder-slate-400 font-medium"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  id="ann-body-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={!isPrivileged}
                className={`w-full font-bold py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 ${
                  isPrivileged 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
                id="ann-post-btn"
              >
                <PlusCircle size={15} />
                Publish Directive Feed
              </button>
              {!isPrivileged && (
                <p className="text-[10px] text-amber-600 font-bold text-center">⚠ HR Manager or Admin authorization required to broadcast announcements.</p>
              )}
            </form>
          </div>

          {/* Existing announcements stream */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-800 heading-display flex items-center gap-2">
              <Megaphone size={18} className="text-indigo-600" />
              Active Directive Streams
            </h3>

            <div className="space-y-4">
              {announcements.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-xs">No corporate directives posted.</p>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200/60 hover:bg-slate-50/40 transition duration-150 flex items-start gap-4 bg-slate-50/20">
                    <div className={`p-3 rounded-xl shrink-0 ${
                      item.priority === "High" ? "bg-rose-50 text-rose-600" :
                      item.priority === "Medium" ? "bg-amber-50 text-amber-600" :
                      "bg-sky-50 text-sky-600"
                    }`}>
                      {item.priority === "High" ? <AlertCircle size={20} /> : <Megaphone size={20} />}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{item.title}</h4>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                          <span className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                            item.priority === "High" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                            item.priority === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            "bg-sky-50 text-sky-700 border border-sky-100"
                          }`}>
                            {item.priority} Priority
                          </span>
                          <span className="text-slate-400 flex items-center gap-1"><Calendar size={11} /> {item.date}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans">{item.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER CHANNELS CONFIGURATION MATRIX */}
      {activeSubTab === "channels" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 heading-display flex items-center gap-2">
                <Sliders size={18} className="text-indigo-600" />
                Notification Event Channel Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Toggle live channels to automatically route transmittals for each action event below.</p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50/70 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-indigo-100/50">
              <ShieldCheck size={14} />
              {isHrOrAdmin ? "Authorative Write Mode Active" : "Read-Only View Mode Mode"}
            </div>
          </div>

          {settings.length === 0 ? (
            <div className="text-center p-8 text-xs text-slate-400">Loading configurations...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings.map((item, idx) => (
                <div key={idx} className="p-5 border border-slate-250 bg-slate-50/20 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono">
                        Event Action Trigger
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-800 mt-2 mb-1">{item.event}</h4>
                    </div>
                    <Zap size={18} className="text-amber-500 shrink-0" />
                  </div>

                  <p className="text-xs text-slate-400 leading-normal font-sans">
                    Automatically triggers dispatch pipelines as soon as a {item.event} state changes.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-semibold">
                    {/* EMAIL TOGGLE */}
                    <button
                      onClick={() => handleToggleChannel(item.event, "email")}
                      disabled={!isHrOrAdmin}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        item.email 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/80" 
                          : "bg-white border-slate-200/75 text-slate-500 hover:bg-slate-50"
                      } ${!isHrOrAdmin ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <Mail size={13} /> Email
                      </span>
                      <span className={`w-2 h-2 rounded-full ${item.email ? "bg-indigo-600 animate-pulse" : "bg-slate-350"}`} />
                    </button>

                    {/* SMS TOGGLE */}
                    <button
                      onClick={() => handleToggleChannel(item.event, "sms")}
                      disabled={!isHrOrAdmin}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        item.sms 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/80" 
                          : "bg-white border-slate-200/75 text-slate-500 hover:bg-slate-50"
                      } ${!isHrOrAdmin ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <Phone size={13} /> SMS Text
                      </span>
                      <span className={`w-2 h-2 rounded-full ${item.sms ? "bg-emerald-600 animate-pulse" : "bg-slate-350"}`} />
                    </button>

                    {/* WHATSAPP TOGGLE */}
                    <button
                      onClick={() => handleToggleChannel(item.event, "whatsapp")}
                      disabled={!isHrOrAdmin}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        item.whatsapp 
                          ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100/80" 
                          : "bg-white border-slate-200/75 text-slate-500 hover:bg-slate-50"
                      } ${!isHrOrAdmin ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                    >
                      <span className="flex items-center gap-1.5 font-bold font-mono">
                        💬 WhatsApp
                      </span>
                      <span className={`w-2 h-2 rounded-full ${item.whatsapp ? "bg-green-600 animate-pulse" : "bg-slate-350"}`} />
                    </button>

                    {/* IN APP PANEL TOGGLE */}
                    <button
                      onClick={() => handleToggleChannel(item.event, "inApp")}
                      disabled={!isHrOrAdmin}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        item.inApp 
                          ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/80" 
                          : "bg-white border-slate-200/75 text-slate-500 hover:bg-slate-50"
                      } ${!isHrOrAdmin ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <MessageSquare size={13} /> In-App Feed
                      </span>
                      <span className={`w-2 h-2 rounded-full ${item.inApp ? "bg-purple-600 animate-pulse" : "bg-slate-350"}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isHrOrAdmin && (
            <p className="text-center text-[11px] text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100 font-sans">
              ⚠ Read-only security restriction is active. Reconfiguring matrix routes requires SUPER_ADMIN or HR_MANAGER authentication scopes.
            </p>
          )}
        </div>
      )}

      {/* RENDER OUTGOING OUTBOX LOG Audit Tracker */}
      {activeSubTab === "outbox" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 heading-display flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-600" />
                Active Outbox Logs Audit Tracker
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Audit central notifications feed and delivery receipts history captured by standard gateways.</p>
            </div>
            
            <input
              type="text"
              placeholder="Filter logs by employee name, ID or event..."
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-xs w-full max-w-xs font-semibold font-sans"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              id="log-search-input"
            />
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-slate-150 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-150 text-[11px] font-sans">
                  <thead className="bg-slate-50 font-black tracking-wider uppercase text-slate-550 text-[10px] font-mono">
                    <tr>
                      <th className="px-4 py-3 text-left">TS / ID</th>
                      <th className="px-4 py-3 text-left">Recipient Staff</th>
                      <th className="px-4 py-3 text-left">Trigger Event</th>
                      <th className="px-4 py-3 text-left">Activated Channels</th>
                      <th className="px-4 py-3 text-left">Target Recipient Address</th>
                      <th className="px-4 py-3 text-left">Dispatched Text</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 font-medium text-slate-600">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
                          No notification outbox logs captured. Try triggering a sandbox test notification!
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/40 transition">
                          <td className="px-4 py-3.5 font-mono text-[9px] whitespace-nowrap shrink-0">
                            <span className="text-slate-400 block">{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="text-slate-700 font-bold font-mono">{log.id}</span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-extrabold text-slate-800 block">{log.employeeName}</span>
                            <span className="text-slate-400 font-mono text-[9px]">({log.employeeId})</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-block px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                              {log.event}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {log.channels.map((chan, chIdx) => (
                                <span 
                                  key={chIdx} 
                                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${
                                    chan === "Email" ? "bg-indigo-50 border-indigo-100 text-indigo-700" :
                                    chan === "SMS" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                                    chan === "WhatsApp" ? "bg-green-50 border-green-100 text-green-700 font-mono" :
                                    "bg-purple-50 border-purple-100 text-purple-700"
                                  }`}
                                >
                                  {chan}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[9px] text-slate-500">
                            {log.recipientAddress}
                          </td>
                          <td className="px-4 py-3.5 max-w-md font-sans text-xs font-semibold text-slate-800 whitespace-normal">
                            "{log.bodyText}"
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 font-bold font-mono text-[9px] uppercase px-2 py-0.5 rounded border ${
                              log.status === "Sent" ? "bg-indigo-100/50 text-indigo-800 border-indigo-200" :
                              log.status === "Simulated" ? "bg-sky-50 text-sky-800 border-sky-200" :
                              "bg-rose-50 text-rose-850 border-rose-150"
                            }`}>
                              <CheckCircle2 size={10} className="shrink-0" />
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER REAL-TIME SANDBOX SIMULATOR */}
      {activeSubTab === "sandbox" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 heading-display flex items-center gap-2">
              <Zap size={18} className="text-indigo-600 animate-pulse shrink-0" />
              Real-Time Channel Simulation Sandbox Intercom
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any staff member, specify one of the six standard HRM events, provide a custom notification message, and instantly fire simulator pipelines to test configuration matrix triggers.
            </p>
          </div>

          {sandboxSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold font-sans">
              {sandboxSuccess}
            </div>
          )}

          {sandboxError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-650 rounded-xl text-xs font-bold font-sans">
              {sandboxError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handleTriggerSandboxTest} className="space-y-4 text-xs font-semibold text-slate-600 font-sans">
              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider block">Target Recipient Employee</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 cursor-pointer text-xs font-semibold font-sans"
                  value={sandboxEmployeeId}
                  onChange={(e) => setSandboxEmployeeId(e.target.value)}
                  id="sandbox-employee-select"
                >
                  <option value="ALL">📢 ALL BRANCH ASSOCIATES (Company Broadcast)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName || emp.name} - ID: {emp.id} [{emp.department || "No Department"}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500 font-bold uppercase tracking-wider block">Event Trigger Scenario Action</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 cursor-pointer text-xs font-semibold font-sans"
                  value={sandboxEvent}
                  onChange={(e) => setSandboxEvent(e.target.value)}
                  id="sandbox-event-select"
                >
                  <option value="Leave Request">Leave Request</option>
                  <option value="Leave Approval">Leave Approval</option>
                  <option value="Advance Request">Advance Request</option>
                  <option value="Advance Approval">Advance Approval</option>
                  <option value="Payroll Generated">Payroll Generated</option>
                  <option value="Payslip Ready">Payslip Ready</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-500 font-bold uppercase tracking-wider">Simulated Message Payload Context</label>
                  <span className="text-[10px] text-slate-400 font-normal">Use <strong className="font-bold text-indigo-600">{"{name}"}</strong> as token to auto Inject full name</span>
                </div>
                <textarea
                  required
                  placeholder="Dear {name}, we verified your records and approved the transaction. Thank you."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 h-28 font-medium font-sans"
                  value={sandboxDetails}
                  onChange={(e) => setSandboxDetails(e.target.value)}
                  id="sandbox-details-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={!isHrOrAdmin}
                className={`w-full font-bold py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 ${
                  isHrOrAdmin 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
                id="sandbox-trigger-btn"
              >
                <Play size={14} className="fill-current shrink-0" />
                Fire Simulator Dispatch Trigger
              </button>
              {!isHrOrAdmin && (
                <p className="text-[10px] text-amber-600 font-bold text-center">⚠ Admin or Human Resource manager status required to evaluate live sandbox transmitters.</p>
              )}
            </form>

            {/* Sandbox Simulation specs helper */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4 font-sans text-xs">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1">
                <HelpCircle size={15} className="text-indigo-600" />
                Integration Trace Details
              </h4>
              
              <div className="space-y-2 text-slate-600 font-medium">
                <p>The system simulator triggers a multi-channel transmission dispatch based on settings currently configured inside your Event Channel Matrix:</p>
                <ul className="list-disc pl-4 space-y-1.5 leading-relaxed text-[11px]">
                  <li>
                    <strong>Email Pipeline:</strong> Queries employee email and delivers standard layout via SMTP (fallback sandbox tracer).
                  </li>
                  <li>
                    <strong>SMS text pipeline:</strong> Directs text formatting to the employee's registered mobile number using localized gateways.
                  </li>
                  <li>
                    <strong>WhatsApp pipeline:</strong> Maps automated CRM dialogue prompts directly to the profile's cellular phone.
                  </li>
                  <li>
                    <strong>In-App panel:</strong> Instantly locks alerts into the individual worker's user dashboard interface.
                  </li>
                </ul>

                <div className="pt-3 border-t border-slate-200 mt-2">
                  <h5 className="font-bold text-slate-800 mb-1.5 uppercase text-[9px] tracking-wider text-slate-500">Live Recipient profile status</h5>
                  {sandboxEmployeeId && sandboxEmployeeId !== "ALL" ? (() => {
                    const profile = employees.find(e => e.id === sandboxEmployeeId);
                    if (!profile) return <div className="text-[10px] text-slate-400">Loading profile stats...</div>;
                    return (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-150 space-y-1.5 font-mono text-[10px] text-slate-600">
                        <div>Email: <span className="text-indigo-600 font-bold">{profile.email}</span></div>
                        <div>Contact: <span className="text-indigo-600 font-bold">{profile.mobileNumber || profile.phone || "+94771234567"}</span></div>
                        <div>Current Status: <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold">{profile.status}</span></div>
                      </div>
                    );
                  })() : (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150 font-mono text-[10px] text-indigo-600 font-bold">
                      📢 Broadcast queue selected: Submitting text triggers simultaneous delivery to ALL registered staff profiles in active rosters.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
