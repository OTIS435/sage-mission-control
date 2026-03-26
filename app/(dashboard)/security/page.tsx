import fs from "fs";
import path from "path";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

type ScanEntry = {
  id: string;
  timestamp: string;
  status: string;
  duration: string;
  findings: number;
  details: string;
  checkedPaths: string[];
};

export default function SecurityPage() {
  let scans: ScanEntry[] = [];
  try {
    const p = path.join(process.cwd(), "data", "security-log.json");
    scans = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    scans = [];
  }

  const lastScan = scans[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Security</h2>
        <p className="text-zinc-400 text-sm mt-1">Automated scan results and history</p>
      </div>

      {/* Last scan status */}
      {lastScan && (
        <div className={`border rounded-xl p-5 ${lastScan.status === "clean" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
          <div className="flex items-start gap-3">
            {lastScan.status === "clean" ? (
              <CheckCircle className="text-emerald-400 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-red-400 mt-0.5" size={20} />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${lastScan.status === "clean" ? "text-emerald-400" : "text-red-400"}`}>
                  {lastScan.status === "clean" ? "All Clear" : "Issues Found"}
                </h3>
                <span className="text-zinc-500 text-xs">{new Date(lastScan.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-zinc-300 text-sm mt-1">{lastScan.details}</p>
              <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                <span>Duration: {lastScan.duration}</span>
                <span>Findings: {lastScan.findings}</span>
                <span>Scan ID: {lastScan.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan history */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Clock size={14} />
          Scan History
        </h3>
        <div className="space-y-3">
          {scans.map((scan) => (
            <div key={scan.id} className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {scan.status === "clean" ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                  )}
                  <span className={`text-xs font-medium ${scan.status === "clean" ? "text-emerald-400" : "text-red-400"}`}>
                    {scan.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-zinc-500 text-xs">{new Date(scan.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-zinc-400 text-xs">{scan.details}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {scan.checkedPaths.map((checkedPath) => (
                  <span key={checkedPath} className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded font-mono">{checkedPath}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security cron setup */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Automated Scans</h3>
        <div className="space-y-2 text-xs text-zinc-400">
          <p>• Silent 4-hour scan: configured via openclaw cron (systemEvent to agent)</p>
          <p>• 8 AM MST daily full report: configured for Telegram delivery</p>
          <p>• See README.md for setup instructions</p>
        </div>
      </div>
    </div>
  );
}
