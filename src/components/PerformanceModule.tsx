/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PerformanceAppraisal, Employee, Role } from "../types";
import { Award, Zap, Brain, Sparkles, Star, CheckSquare, Save, Loader2, UserCircle2 } from "lucide-react";

interface PerformanceModuleProps {
  appraisals: PerformanceAppraisal[];
  employees: Employee[];
  currentRole: Role;
  onUpdateState: () => void;
}

export default function PerformanceModule({ appraisals, employees, currentRole, onUpdateState }: PerformanceModuleProps) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [period, setPeriod] = useState("FY 2026 H1");
  const [prod, setProd] = useState(4);
  const [comm, setComm] = useState(4);
  const [team, setTeam] = useState(4);
  const [rel, setRel] = useState(4);
  
  // Module 10 extended criteria state variables
  const [attendance, setAttendance] = useState(4);
  const [discipline, setDiscipline] = useState(4);
  const [knowledge, setKnowledge] = useState(4);
  const [leadership, setLeadership] = useState(4);

  const [evalComments, setEvalComments] = useState("");
  const [aiDocAdvice, setAiDocAdvice] = useState("");

  const [loadingAi, setLoadingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const requestAiCoachingFeedback = async () => {
    setErrorMsg("");
    setAiDocAdvice("");
    setLoadingAi(true);

    const empObj = employees.find(e => e.id === employeeId);
    try {
      const res = await fetch("/api/appraisal/generate-ai-fb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: empObj ? empObj.name : "Team Member",
          ratings: { 
            productivity: prod, 
            communication: comm, 
            teamwork: team, 
            reliability: rel,
            attendance,
            discipline,
            knowledge,
            leadership
          },
          evaluatorComments: evalComments
        })
      });

      if (res.ok) {
        const d = await res.json();
        setAiDocAdvice(d.advice);
        setSuccessMsg("Gemini-3.5-Flash HR Coach compiled action-oriented feedback suggestions!");
      } else {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Failed loading AI recommendations");
      }
    } catch {
      setErrorMsg("Coaching pipeline failed. Ensure backend connection active.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!evalComments) {
      setErrorMsg("Please provide manager comments before saving evaluation.");
      return;
    }

    try {
      const payload = {
        employeeId,
        appraisalPeriod: period,
        ratings: { 
          productivity: prod, 
          communication: comm, 
          teamwork: team, 
          reliability: rel,
          attendance,
          discipline,
          knowledge,
          leadership
        },
        evaluatorComments: evalComments,
        evaluatorName: currentRole
      };

      const res = await fetch("/api/appraisals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg("Appraisal scorecard drafted successfully.");
        setEvalComments("");
        setAiDocAdvice("");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Scorecard saving failed.");
      }
    } catch {
      setErrorMsg("Server error");
    }
  };

  const handleFinalizeAppraisal = async (id: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/appraisals/${id}/finalize`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        setSuccessMsg("Performance evaluation finalized.");
        onUpdateState();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Finalize failed");
      }
    } catch {
      setErrorMsg("Server connection lost");
    }
  };

  const isHrOrAdmin = currentRole === Role.SUPER_ADMIN || currentRole === Role.HR_MANAGER || currentRole === Role.BRANCH_MANAGER;

  return (
    <div className="space-y-6">
      {/* Informational Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 heading-display">Appraisal & OKR Performance Roster</h2>
          <p className="text-sm text-slate-500 mt-1">Review core employee scorecards, calculate performance averages, and generate AI-driven action feedback.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Scorecard form */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 h-fit space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 heading-display">Formulate Performance Scorecard</h3>
            <p className="text-xs text-slate-500 mt-0.5">Rate core parameters on a scale of 1 to 5.</p>
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

          <form onSubmit={handleSaveAppraisal} className="space-y-4 text-xs font-semibold text-slate-600">
            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold uppercase tracking-wider">Employee evaluated</label>
              <select
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                id="perf-emp-select"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold uppercase tracking-wider">Appraisal Cycle Period</label>
              <input
                type="text"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                id="perf-period-input"
              />
            </div>

            {/* Dynamic Scoring Engine & Live Rating Indicators */}
            <div className="space-y-4 pt-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <Star size={12} /> Scorecard parameters (1-5)
              </p>
              
              {[
                { label: "Productivity", value: prod, set: setProd },
                { label: "Communication / Presentation", value: comm, set: setComm },
                { label: "Team Collaboration / Alignment", value: team, set: setTeam },
                { label: "Attendance & Punctuality", value: attendance, set: setAttendance },
                { label: "Discipline & Company Standards", value: discipline, set: setDiscipline },
                { label: "Job Knowledge & Expertise", value: knowledge, set: setKnowledge },
                { label: "Leadership & Initiative", value: leadership, set: setLeadership }
              ].map((p, ix) => (
                <div key={ix} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{p.label}</span>
                    <span className="font-mono text-indigo-600 font-bold">{p.value}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    className="w-full accent-indigo-600 cursor-pointer bg-slate-200 h-1.5 rounded-lg appearance-none"
                    value={p.value}
                    onChange={(e) => p.set(parseInt(e.target.value))}
                    id={`perf-slider-${ix}`}
                  />
                </div>
              ))}

              {/* LIVE rating values projection */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Live Average Score:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {((prod + comm + team + attendance + discipline + knowledge + leadership) / 7).toFixed(2)} / 5.00
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Performance Level:</span>
                  {(() => {
                    const avg = (prod + comm + team + attendance + discipline + knowledge + leadership) / 7;
                    let text = "Meets Expectations";
                    let classes = "text-amber-700 bg-amber-50 border-amber-200";
                    if (avg >= 4.5) {
                      text = "Outstanding";
                      classes = "text-emerald-700 bg-emerald-50 border-emerald-200";
                    } else if (avg >= 4.0) {
                      text = "Exceeds Expectations";
                      classes = "text-blue-700 bg-blue-50 border-blue-200";
                    } else if (avg >= 3.0) {
                      text = "Meets Expectations";
                      classes = "text-amber-700 bg-amber-50 border-amber-200";
                    } else if (avg >= 2.0) {
                      text = "Needs Improvement";
                      classes = "text-orange-700 bg-orange-50 border-orange-200";
                    } else {
                      text = "Poor Quality / Concern";
                      classes = "text-rose-700 bg-rose-50 border-rose-200";
                    }
                    return <span className={`px-2 py-0.5 border rounded-md text-[9px] font-bold ${classes}`}>{text}</span>;
                  })()}
                </div>

                <div className="flex flex-col gap-1 pt-1.5 border-t border-dashed border-slate-100">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Live Promotion Recommendation:</span>
                  {(() => {
                    const avg = (prod + comm + team + attendance + discipline + knowledge + leadership) / 7;
                    const ldr = leadership;
                    const prd = prod;
                    let text = "Maintain Current Role (Steady State)";
                    let classes = "text-slate-700 bg-slate-100 border-slate-200";
                    if (avg >= 4.5 && ldr >= 4 && prd >= 4) {
                      text = "Highly Recommended for Promotion";
                      classes = "text-emerald-700 bg-emerald-100/50 border-emerald-200";
                    } else if (avg >= 3.8) {
                      text = "Recommended for Progression";
                      classes = "text-blue-700 bg-blue-100/50 border-blue-200";
                    } else if (avg >= 2.8) {
                      text = "Maintain Current Role (Steady State)";
                      classes = "text-slate-700 bg-slate-100 border-slate-200";
                    } else {
                      text = "Structured Growth Plan / Guidance Required";
                      classes = "text-rose-700 bg-rose-100/50 border-rose-200";
                    }
                    return <span className={`px-2 py-1 text-center font-bold border rounded-lg text-[9px] ${classes}`}>{text}</span>;
                  })()}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold uppercase tracking-wider">Manager comments & observations</label>
              <textarea
                placeholder="Insert details on achievements, technical hurdles overcome..."
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 h-20 placeholder-slate-400 font-medium"
                value={evalComments}
                onChange={(e) => setEvalComments(e.target.value)}
                id="perf-comments-textarea"
              />
            </div>

            {/* AI Generator feedback module */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={requestAiCoachingFeedback}
                disabled={loadingAi}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                id="perf-ai-coach-btn"
              >
                {loadingAi ? <Loader2 size={15} className="animate-spin text-indigo-300" /> : <Brain size={15} className="text-indigo-400" />}
                Ask Gemini HR Coach
              </button>

              {aiDocAdvice && (
                <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl space-y-1 text-[11px] leading-relaxed text-indigo-900 font-medium shadow-xs">
                  <p className="font-bold flex items-center gap-1 uppercase tracking-wider text-[9px] text-indigo-600">
                    <Sparkles size={11} /> Suggested SMART Objectives:
                  </p>
                  <p className="italic">"{aiDocAdvice}"</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!isHrOrAdmin}
              className={`w-full font-bold py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 ${
                isHrOrAdmin 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              id="perf-save-scorecard"
            >
              <Save size={15} />
              Save Scorecard Draft
            </button>
            {!isHrOrAdmin && (
              <p className="text-[10px] text-amber-600 font-bold text-center">⚠ HR Manager or Admin authorization required to evaluate appraisals.</p>
            )}
          </form>
        </div>

        {/* Existing evaluation scorecards */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800 heading-display">Corporate Assessment History</h3>

          <div className="space-y-4">
            {appraisals.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">No corporate scorecards archived.</p>
            ) : (
              appraisals.map(ap => (
                <div key={ap.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition duration-200 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-800">{ap.employeeName}</h4>
                        <span className="text-[10px] text-slate-450 font-mono bg-slate-100 px-1.5 py-0.5 rounded">({ap.employeeId})</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Cycle: {ap.appraisalPeriod} | Created: {ap.dateCreated}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Average Score</p>
                        <p className="text-base font-black text-indigo-600 font-mono">{ap.overallScore.toFixed(2)} / 5</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${
                          ap.status === "Finalized" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {ap.status}
                        </span>
                        {(() => {
                          const avg = ap.overallScore;
                          let text = "Meets Expectations";
                          let classes = "text-amber-600 bg-amber-50/50";
                          if (avg >= 4.5) {
                            text = "Outstanding";
                            classes = "text-emerald-600 bg-emerald-50/50";
                          } else if (avg >= 4.0) {
                            text = "Exceeds Expectations";
                            classes = "text-blue-600 bg-blue-50/50";
                          } else if (avg >= 3.0) {
                            text = "Meets Expectations";
                            classes = "text-amber-600 bg-amber-50/50";
                          } else if (avg >= 2.0) {
                            text = "Needs Improvement";
                            classes = "text-orange-600 bg-orange-50/50";
                          } else {
                            text = "Poor Quality";
                            classes = "text-rose-600 bg-rose-50/50";
                          }
                          return <span className={`text-[9px] font-bold px-1.5 rounded uppercase tracking-wide ${classes}`}>{text}</span>;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Ratings parameters badges - Display all 7 indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-semibold text-slate-600 font-mono">
                    <div>Productivity: <span className="text-indigo-600 font-bold">{ap.ratings.productivity || 3}/5</span></div>
                    <div>Comm: <span className="text-indigo-600 font-bold">{ap.ratings.communication || 3}/5</span></div>
                    <div>Teamwork: <span className="text-indigo-600 font-bold">{ap.ratings.teamwork || 3}/5</span></div>
                    {ap.ratings.attendance !== undefined && (
                      <div>Attendance: <span className="text-indigo-600 font-bold">{ap.ratings.attendance}/5</span></div>
                    )}
                    {ap.ratings.discipline !== undefined && (
                      <div>Discipline: <span className="text-indigo-600 font-bold">{ap.ratings.discipline}/5</span></div>
                    )}
                    {ap.ratings.knowledge !== undefined && (
                      <div>Knowledge: <span className="text-indigo-600 font-bold">{ap.ratings.knowledge}/5</span></div>
                    )}
                    {ap.ratings.leadership !== undefined && (
                      <div>Leadership: <span className="text-indigo-600 font-bold">{ap.ratings.leadership}/5</span></div>
                    )}
                    {ap.ratings.reliability !== undefined && (
                      <div>Reliability: <span className="text-indigo-600 font-bold">{ap.ratings.reliability}/5</span></div>
                    )}
                  </div>

                  {/* Promotion Recommendation display row */}
                  {ap.promotionRecommendation ? (
                    <div className="bg-indigo-50/30 border border-indigo-100/50 px-3 py-2 rounded-xl flex items-center justify-between text-[11px] font-semibold text-indigo-900">
                      <span>🚀 Promotion Progression Recommendation:</span>
                      <strong className="text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md font-extrabold">
                        {ap.promotionRecommendation}
                      </strong>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span>🚀 Promotion Progression Recommendation:</span>
                      <span className="font-mono text-slate-600 font-bold">
                        {(() => {
                          const avg = ap.overallScore;
                          const ldr = ap.ratings.leadership || ap.ratings.reliability || 3;
                          const prd = ap.ratings.productivity;
                          if (avg >= 4.5 && ldr >= 4 && prd >= 4) return "Highly Recommended for Promotion";
                          if (avg >= 3.8) return "Recommended for Progression";
                          if (avg >= 2.8) return "Maintain Current Role";
                          return "Structured Growth & Advisory Plan Required";
                        })()}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-slate-600 text-xs italic bg-slate-50/60 p-3 rounded-lg font-medium border-l-2 border-indigo-500 font-sans">" {ap.evaluatorComments} "</p>

                    {ap.aiSuggestedImprovements && (
                      <div className="bg-gradient-to-r from-indigo-50 to-pink-50/30 border border-indigo-100/50 p-3.5 rounded-xl text-[11px] leading-relaxed text-indigo-950 font-medium">
                        <p className="font-extrabold flex items-center gap-1 uppercase tracking-wider text-[9px] text-indigo-600 mb-1">
                          <Zap size={11} className="text-amber-500 shrink-0" /> Gemini AI Developmental Guidance
                        </p>
                        <p>{ap.aiSuggestedImprovements}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1 font-mono"><UserCircle2 size={12} /> Assessed by: <strong>{ap.evaluatorName}</strong></span>

                    {ap.status === "Draft" && isHrOrAdmin && (
                      <button
                        onClick={() => handleFinalizeAppraisal(ap.id)}
                        className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold py-1.5 px-3.5 rounded-lg border border-indigo-150 transition cursor-pointer text-[10px]"
                        id={`finalize-apr-${ap.id}`}
                      >
                        <CheckSquare size={11} /> Finalize evaluation
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
