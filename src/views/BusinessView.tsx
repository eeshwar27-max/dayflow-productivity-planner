import React, { useState } from 'react';
import {
  Briefcase,
  Lightbulb,
  Plus,
  Trash2,
  Edit2,
  Wallet,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  FinanceRecord,
  ProjectArea,
  VentureIdea,
  VentureStatus,
  WorkspaceProject,
} from '../types';
import { BRAND_CONFIG } from '../config/brandConfig';
import { formatReadableDate } from '../utils/dateUtils';
import { DemoBadge } from '../components/Badge';

const IDEA_STATUSES: VentureStatus[] = [
  'Idea',
  'Researching',
  'Testing',
  'Active',
  'Paused',
  'Archived',
];

export const BusinessView: React.FC = () => {
  const {
    db,
    todayDate,
    saveProject,
    deleteProject,
    saveVentureIdea,
    deleteVentureIdea,
    addFinanceRecord,
    deleteFinanceRecord,
    openNewTaskModal,
  } = useApp();

  const currency = db.settings.currencySymbol || '$';
  const [subTab, setSubTab] = useState<'projects' | 'ventures' | 'finances'>('projects');

  // Workspace Project Form
  const [isProjFormOpen, setIsProjFormOpen] = useState(false);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [projName, setProjName] = useState('');
  const [projArea, setProjArea] = useState<ProjectArea>('Product & Engineering');
  const [projObjective, setProjObjective] = useState('');
  const [projStatus, setProjStatus] = useState<WorkspaceProject['status']>('In progress');
  const [projTargetDate, setProjTargetDate] = useState('');
  const [projNotes, setProjNotes] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');

  // Venture / Side-Project Idea Form
  const [isIdeaFormOpen, setIsIdeaFormOpen] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [ideaName, setIdeaName] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaWhy, setIdeaWhy] = useState('');
  const [ideaNextStep, setIdeaNextStep] = useState('');
  const [ideaEstCost, setIdeaEstCost] = useState<number>(0);
  const [ideaTargetDate, setIdeaTargetDate] = useState('');
  const [ideaStatus, setIdeaStatus] = useState<VentureStatus>('Idea');
  const [ideaNotes, setIdeaNotes] = useState('');
  const [ideaRev, setIdeaRev] = useState<number>(0);
  const [ideaExp, setIdeaExp] = useState<number>(0);

  // Finance Entry Form
  const [finTitle, setFinTitle] = useState('');
  const [finSource, setFinSource] = useState<FinanceRecord['source']>('Primary Work');
  const [finType, setFinType] = useState<'revenue' | 'expense'>('revenue');
  const [finAmount, setFinAmount] = useState<string>('');
  const [finDate, setFinDate] = useState<string>(todayDate);

  const openProjectEditor = (proj?: WorkspaceProject) => {
    if (proj) {
      setEditingProjId(proj.id);
      setProjName(proj.name);
      setProjArea((proj.area as ProjectArea) || 'Product & Engineering');
      setProjObjective(proj.objective);
      setProjStatus(proj.status);
      setProjTargetDate(proj.targetDate || '');
      setProjNotes(proj.notes || '');
    } else {
      setEditingProjId(null);
      setProjName('');
      setProjArea('Product & Engineering');
      setProjObjective('');
      setProjStatus('In progress');
      setProjTargetDate('');
      setProjNotes('');
    }
    setIsProjFormOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    saveProject({
      id: editingProjId || `proj_${Date.now()}`,
      name: projName.trim(),
      area: projArea,
      objective: projObjective.trim(),
      status: projStatus,
      targetDate: projTargetDate || undefined,
      notes: projNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setIsProjFormOpen(false);
  };

  const openIdeaEditor = (idea?: VentureIdea) => {
    if (idea) {
      setEditingIdeaId(idea.id);
      setIdeaName(idea.name);
      setIdeaDesc(idea.description);
      setIdeaWhy(idea.rationale);
      setIdeaNextStep(idea.nextActionableStep);
      setIdeaEstCost(idea.estimatedBudget || 0);
      setIdeaTargetDate(idea.targetDate || '');
      setIdeaStatus(idea.status);
      setIdeaNotes(idea.resultsAndNotes || '');
      setIdeaRev(idea.actualRevenue || 0);
      setIdeaExp(idea.actualExpenses || 0);
    } else {
      setEditingIdeaId(null);
      setIdeaName('');
      setIdeaDesc('');
      setIdeaWhy('');
      setIdeaNextStep('');
      setIdeaEstCost(0);
      setIdeaTargetDate('');
      setIdeaStatus('Idea');
      setIdeaNotes('');
      setIdeaRev(0);
      setIdeaExp(0);
    }
    setIsIdeaFormOpen(true);
  };

  const handleSaveIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaName.trim()) return;
    saveVentureIdea({
      id: editingIdeaId || `idea_${Date.now()}`,
      name: ideaName.trim(),
      description: ideaDesc.trim(),
      rationale: ideaWhy.trim(),
      nextActionableStep: ideaNextStep.trim(),
      estimatedBudget: Number(ideaEstCost) || 0,
      targetDate: ideaTargetDate || undefined,
      status: ideaStatus,
      resultsAndNotes: ideaNotes.trim() || undefined,
      actualRevenue: Number(ideaRev) || 0,
      actualExpenses: Number(ideaExp) || 0,
      createdAt: new Date().toISOString(),
    });
    setIsIdeaFormOpen(false);
  };

  const handleAddFinance = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(finAmount);
    if (!finTitle.trim() || isNaN(num) || num <= 0) return;
    addFinanceRecord({
      title: finTitle.trim(),
      source: finSource,
      type: finType,
      amount: num,
      date: finDate || todayDate,
    });
    setFinTitle('');
    setFinAmount('');
  };

  const filteredProjects = db.projects.filter(
    (p) => areaFilter === 'ALL' || p.area === areaFilter
  );

  const totalRevenue =
    db.financeRecords
      .filter((r) => r.type === 'revenue')
      .reduce((s, r) => s + r.amount, 0) +
    db.ventureIdeas.reduce((s, i) => s + (i.actualRevenue || 0), 0);

  const totalExpenses =
    db.financeRecords
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + r.amount, 0) +
    db.ventureIdeas.reduce((s, i) => s + (i.actualExpenses || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Projects, Side Ventures & Finance Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize active initiatives, evaluate side-project hypotheses, and track real income & expenses
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSubTab('projects');
              openProjectEditor();
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab('ventures');
              openIdeaEditor();
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Lightbulb className="w-4 h-4" /> + Venture / Side Idea
          </button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 ${
            subTab === 'projects'
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Active Projects ({db.projects.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('ventures')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 ${
            subTab === 'ventures'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Lightbulb className="w-4 h-4" /> Side Ventures & Experiments ({db.ventureIdeas.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('finances')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 ${
            subTab === 'finances'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" /> Income & Expense Ledger
        </button>
      </div>

      {/* TAB 1: WORKSPACE PROJECTS */}
      {subTab === 'projects' && (
        <div className="space-y-5">
          {/* Area Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAreaFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                areaFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              All Areas ({db.projects.length})
            </button>
            {BRAND_CONFIG.projectAreas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setAreaFilter(area)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  areaFilter === area
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {area}
              </button>
            ))}
          </div>

          {isProjFormOpen && (
            <form
              onSubmit={handleSaveProject}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-md space-y-3 text-xs"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingProjId ? 'Edit Project' : 'New Workspace Project'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Project Name *</label>
                  <input
                    type="text"
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    placeholder="e.g., Website Redesign v2.0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Project Domain</label>
                  <select
                    value={projArea}
                    onChange={(e) => setProjArea(e.target.value as ProjectArea)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {BRAND_CONFIG.projectAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={projStatus}
                    onChange={(e) =>
                      setProjStatus(e.target.value as WorkspaceProject['status'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Not started">Not started</option>
                    <option value="In progress">In progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Date</label>
                  <input
                    type="date"
                    value={projTargetDate}
                    onChange={(e) => setProjTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Clear Objective</label>
                  <input
                    type="text"
                    value={projObjective}
                    onChange={(e) => setProjObjective(e.target.value)}
                    placeholder="Measurable outcome or deliverable..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Links / Context</label>
                <textarea
                  rows={2}
                  value={projNotes}
                  onChange={(e) => setProjNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProjFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                >
                  Save Project
                </button>
              </div>
            </form>
          )}

          {filteredProjects.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No projects in this view yet.
              </p>
              <button
                type="button"
                onClick={() => openProjectEditor()}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                + Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => {
                const relatedTasks = db.tasks.filter(
                  (t) => !t.archived && t.projectId === proj.id
                );
                return (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold">
                            {proj.area}
                          </span>
                          {proj.isDemo && <DemoBadge />}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {proj.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => openProjectEditor(proj)}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProject(proj.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {proj.name}
                      </h3>
                      {proj.objective && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong>Objective:</strong> {proj.objective}
                        </p>
                      )}
                      {proj.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {proj.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Related Tasks ({relatedTasks.length})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openNewTaskModal({
                              category: 'Work & Projects',
                              projectId: proj.id,
                              dueDate: todayDate,
                            })
                          }
                          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          + Add Project Task
                        </button>
                      </div>

                      {relatedTasks.length > 0 && (
                        <div className="space-y-1">
                          {relatedTasks.slice(0, 3).map((rt) => (
                            <div
                              key={rt.id}
                              className="text-xs flex items-center justify-between py-1 px-2 rounded bg-slate-50 dark:bg-slate-800/50"
                            >
                              <span
                                className={
                                  rt.status === 'Completed'
                                    ? 'line-through text-slate-400 truncate'
                                    : 'text-slate-800 dark:text-slate-200 truncate'
                                }
                              >
                                • {rt.title}
                              </span>
                              <span className="text-[10px] text-slate-500 shrink-0">
                                {rt.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIDE VENTURES & EXPERIMENTS */}
      {subTab === 'ventures' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 text-xs text-emerald-950 dark:text-emerald-200">
            <strong>Validation & Experiment Lab:</strong> Evaluate new side projects, freelance offerings, or product ideas with clear next actionable steps before committing major time or budget.
          </div>

          {isIdeaFormOpen && (
            <form
              onSubmit={handleSaveIdea}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-md space-y-3 text-xs"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingIdeaId ? 'Edit Venture / Side Project' : 'Capture New Venture / Experiment'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Venture / Idea Name *</label>
                  <input
                    type="text"
                    value={ideaName}
                    onChange={(e) => setIdeaName(e.target.value)}
                    placeholder="e.g., Open-Source UI Component Starter Kit"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Stage / Status</label>
                  <select
                    value={ideaStatus}
                    onChange={(e) => setIdeaStatus(e.target.value as VentureStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {IDEA_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Description / Value Proposition</label>
                  <input
                    type="text"
                    value={ideaDesc}
                    onChange={(e) => setIdeaDesc(e.target.value)}
                    placeholder="What problem does it solve and for whom?"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Why It Might Work</label>
                  <input
                    type="text"
                    value={ideaWhy}
                    onChange={(e) => setIdeaWhy(e.target.value)}
                    placeholder="Unfair advantage, skill synergy, or low validation cost..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block font-semibold mb-1">Next Actionable Step</label>
                  <input
                    type="text"
                    value={ideaNextStep}
                    onChange={(e) => setIdeaNextStep(e.target.value)}
                    placeholder="Smallest validation step..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Est. Budget ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={ideaEstCost}
                    onChange={(e) => setIdeaEstCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Validation Date</label>
                  <input
                    type="date"
                    value={ideaTargetDate}
                    onChange={(e) => setIdeaTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Actual Revenue Earned ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={ideaRev}
                    onChange={(e) => setIdeaRev(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Actual Expenses Spent ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={ideaExp}
                    onChange={(e) => setIdeaExp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Experiment Results & Notes</label>
                  <input
                    type="text"
                    value={ideaNotes}
                    onChange={(e) => setIdeaNotes(e.target.value)}
                    placeholder="Key learnings or feedback..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIdeaFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                >
                  Save Venture Idea
                </button>
              </div>
            </form>
          )}

          {db.ventureIdeas.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No venture or side-project ideas recorded yet.
              </p>
              <button
                type="button"
                onClick={() => openIdeaEditor()}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                + Add First Venture Idea
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {db.ventureIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                          {idea.status}
                        </span>
                        {idea.isDemo && <DemoBadge />}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openIdeaEditor(idea)}
                          className="p-1 text-slate-400 hover:text-indigo-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteVentureIdea(idea.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {idea.name}
                    </h3>
                    {idea.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>Hypothesis:</strong> {idea.description}
                      </p>
                    )}
                    {idea.rationale && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        <strong>Rationale:</strong> {idea.rationale}
                      </p>
                    )}
                    {idea.nextActionableStep && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                        <span>
                          <strong>Next Step:</strong> {idea.nextActionableStep}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openNewTaskModal({
                              title: idea.nextActionableStep,
                              category: 'Work & Projects',
                              projectId: idea.id,
                              dueDate: todayDate,
                            })
                          }
                          className="px-2 py-1 rounded bg-indigo-600 text-white font-semibold shrink-0 inline-flex items-center gap-1"
                        >
                          + Make Task <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <span>
                      Est. Budget: {currency}
                      {idea.estimatedBudget || 0}
                    </span>
                    <span>
                      Actual Rev:{' '}
                      <strong className="text-emerald-600">
                        {currency}
                        {idea.actualRevenue}
                      </strong>{' '}
                      • Exp:{' '}
                      <strong className="text-rose-600">
                        {currency}
                        {idea.actualExpenses}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTUAL REVENUE & EXPENSES LEDGER */}
      {subTab === 'finances' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">ACTUAL REVENUE ENTERED</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {currency}
                {totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">ACTUAL EXPENSES ENTERED</div>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {currency}
                {totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500">NET RECORDED RESULT</div>
              <div
                className={`text-2xl font-extrabold mt-1 ${
                  totalRevenue - totalExpenses >= 0 ? 'text-indigo-600' : 'text-rose-600'
                }`}
              >
                {currency}
                {(totalRevenue - totalExpenses).toLocaleString()}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleAddFinance}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs"
          >
            <input
              type="text"
              value={finTitle}
              onChange={(e) => setFinTitle(e.target.value)}
              placeholder="Entry description (e.g., Client milestone invoice #104)"
              className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              required
            />
            <select
              value={finSource}
              onChange={(e) => setFinSource(e.target.value as FinanceRecord['source'])}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="Primary Work">Primary Work</option>
              <option value="Side Project">Side Project</option>
              <option value="General">General</option>
            </select>
            <input
              type="date"
              value={finDate}
              onChange={(e) => setFinDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <div className="flex gap-2">
              <select
                value={finType}
                onChange={(e) => setFinType(e.target.value as 'revenue' | 'expense')}
                className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="revenue">Income (+)</option>
                <option value="expense">Expense (-)</option>
              </select>
              <input
                type="number"
                min={1}
                value={finAmount}
                onChange={(e) => setFinAmount(e.target.value)}
                placeholder={`Amount (${currency})`}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
            >
              + Log Entry
            </button>
          </form>

          {db.financeRecords.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-500">
              No manual income or expense entries logged yet. All figures reflect real entries only.
            </div>
          ) : (
            <div className="space-y-2">
              {db.financeRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {rec.title}
                    </span>{' '}
                    <span className="text-slate-500">
                      ({rec.source} • {formatReadableDate(rec.date)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold ${
                        rec.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {rec.type === 'revenue' ? '+' : '-'}
                      {currency}
                      {rec.amount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteFinanceRecord(rec.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
