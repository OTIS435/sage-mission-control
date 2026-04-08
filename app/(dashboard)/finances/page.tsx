"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Target, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SubProject = {
  id: string;
  name: string;
  priority: "high" | "medium" | "low";
  status: "not started" | "in progress" | "complete";
  description: string;
};

const SUB_PROJECTS: SubProject[] = [
  {
    id: "debt-elimination",
    name: "Debt Elimination Strategy",
    priority: "high",
    status: "in progress",
    description: "Strategic payoff plan for all outstanding debts",
  },
  {
    id: "capital-protection",
    name: "Capital Protection Plan",
    priority: "high",
    status: "in progress",
    description: "Insurance and asset protection strategies",
  },
  {
    id: "cash-flow",
    name: "Cash Flow Optimization",
    priority: "high",
    status: "in progress",
    description: "Maximize monthly income and minimize leaks",
  },
  {
    id: "net-worth",
    name: "Net Worth Growth Strategy",
    priority: "medium",
    status: "not started",
    description: "Long-term wealth accumulation plan",
  },
  {
    id: "legacy",
    name: "Legacy Planning",
    priority: "medium",
    status: "not started",
    description: "Estate planning and generational wealth",
  },
];

type FinancialData = {
  assets: number;
  debts: number;
  monthlyIncome: number;
  monthlyExpenses: number;
};

const DEFAULT_FINANCIAL_DATA: FinancialData = {
  assets: 1500000,
  debts: 450000,
  monthlyIncome: 30000,
  monthlyExpenses: 12000,
};

function maskNumber(value: number, hidden: boolean): string {
  if (!hidden) {
    return `$${value.toLocaleString("en-US")}`;
  }
  return "$•••••";
}

function StatusBadge({ status }: { status: SubProject["status"] }) {
  const styles = {
    "not started": "bg-zinc-700 text-zinc-300 border-zinc-600",
    "in progress": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    complete: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  const labels = {
    "not started": "Not Started",
    "in progress": "In Progress",
    complete: "Complete",
  };

  return (
    <Badge variant="outline" className={`${styles[status]} text-xs font-medium`}>
      {labels[status]}
    </Badge>
  );
}

export default function FinancesPage() {
  const [visionHidden, setVisionHidden] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData>(DEFAULT_FINANCIAL_DATA);
  const [loading, setLoading] = useState(true);

  // Load state from localStorage and fetch financial data
  useEffect(() => {
    const saved = localStorage.getItem("operation-freedom-vision");
    if (saved !== null) {
      setVisionHidden(JSON.parse(saved));
    }
    
    // Fetch financial data from FINANCES.md
    const fetchFinancialData = async () => {
      try {
        const response = await fetch("/api/finances");
        const data = await response.json();
        setFinancialData(data);
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
        // Keep default values on error
      }
      setLoading(false);
    };
    
    fetchFinancialData();
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("operation-freedom-vision", JSON.stringify(visionHidden));
  }, [visionHidden]);

  const netWorth = financialData.assets - financialData.debts;
  const monthlySurplus = financialData.monthlyIncome - financialData.monthlyExpenses;
  const debtRatio = ((financialData.debts / financialData.assets) * 100).toFixed(1);

  const highPriorityProjectsInProgress = SUB_PROJECTS.filter(
    (p) => p.priority === "high" && p.status === "in progress"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-emerald-400" size={24} />
            Operation Freedom
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Personal financial command center</p>
        </div>
        <button
          onClick={() => setVisionHidden(!visionHidden)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300 hover:text-white"
          title={visionHidden ? "Show numbers" : "Hide numbers"}
        >
          {visionHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="text-xs font-medium">{visionHidden ? "Hidden" : "Visible"}</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Worth */}
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Net Worth</p>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {maskNumber(netWorth, visionHidden)}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Assets: {maskNumber(financialData.assets, visionHidden)}
          </p>
          <p className="text-xs text-zinc-500">
            Debts: {maskNumber(financialData.debts, visionHidden)}
          </p>
        </Card>

        {/* Monthly Surplus */}
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Monthly Surplus</p>
            <TrendingUp size={16} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400 font-mono">
            {maskNumber(monthlySurplus, visionHidden)}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Income: {maskNumber(financialData.monthlyIncome, visionHidden)}
          </p>
          <p className="text-xs text-zinc-500">
            Expenses: {maskNumber(financialData.monthlyExpenses, visionHidden)}
          </p>
        </Card>

        {/* Debt Ratio */}
        <Card className="bg-zinc-900 border-zinc-800 p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Debt Ratio</p>
            <Target size={16} className={visionHidden ? "text-yellow-400" : monthlySurplus > 5000 ? "text-emerald-400" : "text-yellow-400"} />
          </div>
          <p className="text-2xl font-bold text-yellow-400 font-mono">
            {visionHidden ? "••%" : `${debtRatio}%`}
          </p>
          <p className="text-xs text-zinc-500 mt-2">Target: &lt;30% for financial freedom</p>
          <p className="text-xs text-zinc-600 mt-1">Goal: Debt-free + $100k/mo</p>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Current Debts */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Current Debts</p>
            <p className="text-lg font-bold text-red-400 font-mono">
              {maskNumber(financialData.debts, visionHidden)}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Elimination target</p>
          </div>

          {/* Total Assets */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Total Assets</p>
            <p className="text-lg font-bold text-emerald-400 font-mono">
              {maskNumber(financialData.assets, visionHidden)}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Growing steadily</p>
          </div>

          {/* Monthly Income */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Monthly Income</p>
            <p className="text-lg font-bold text-blue-400 font-mono">
              {maskNumber(financialData.monthlyIncome, visionHidden)}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Goal: $100k/mo</p>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Monthly Expenses</p>
            <p className="text-lg font-bold text-yellow-400 font-mono">
              {maskNumber(financialData.monthlyExpenses, visionHidden)}
            </p>
            <p className="text-xs text-zinc-600 mt-1">Optimizing</p>
          </div>
        </div>
      </Card>

      {/* Sub-Projects Tracker */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          5 Sub-Projects Tracker
        </h3>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-zinc-800/30 rounded-lg p-2">
            <p className="text-xs text-zinc-600">In Progress</p>
            <p className="text-sm font-bold text-yellow-400">{highPriorityProjectsInProgress.length}</p>
          </div>
          <div className="bg-zinc-800/30 rounded-lg p-2">
            <p className="text-xs text-zinc-600">Not Started</p>
            <p className="text-sm font-bold text-zinc-400">
              {SUB_PROJECTS.filter((p) => p.status === "not started").length}
            </p>
          </div>
          <div className="bg-zinc-800/30 rounded-lg p-2">
            <p className="text-xs text-zinc-600">Complete</p>
            <p className="text-sm font-bold text-emerald-400">
              {SUB_PROJECTS.filter((p) => p.status === "complete").length}
            </p>
          </div>
        </div>

        {/* Projects list */}
        <div className="space-y-3">
          {SUB_PROJECTS.map((project) => (
            <div
              key={project.id}
              className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex-1">
                  <h4 className="text-white text-sm font-medium">{project.name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{project.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${
                      project.priority === "high"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    {project.priority}
                  </Badge>
                  <StatusBadge status={project.status} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar for overall completion */}
        <div className="mt-4 pt-4 border-t border-zinc-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-zinc-500">Overall Progress</p>
            <p className="text-xs text-zinc-400">1/5 complete · 3/5 in progress</p>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-emerald-400 rounded-full"
              style={{ width: "20%" }}
            />
          </div>
        </div>
      </Card>

      {/* Mission Statement */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 p-6">
        <h3 className="text-white font-semibold text-sm mb-2">🎯 Mission Statement</h3>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Achieve complete financial independence: debt-free, $100k/month net income, and the freedom to do what I want, whenever I want, with whomever I want, without concern of expense.
        </p>
        <p className="text-xs text-zinc-500 mt-3">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </Card>
    </div>
  );
}
