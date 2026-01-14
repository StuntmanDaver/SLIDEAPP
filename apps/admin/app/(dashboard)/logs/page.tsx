"use client";

import { useEffect, useState } from "react";
import { adminListScanEvents } from "../../../lib/api";
import { SCAN_RESULTS } from "@slide/shared";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState<string>("");
  const [limit, setLimit] = useState(50);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchLogs();
  }, [filterResult, limit, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminListScanEvents(limit, filterResult || undefined, dateFrom, dateTo);
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate p50/p95 latency
  const latencies = logs.map(l => l.latency_ms).filter(Boolean).sort((a, b) => a - b);
  const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
  const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;

  // Count by device
  const deviceCounts = logs.reduce((acc: Record<string, number>, log) => {
    const device = log.device_id || "unknown";
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  const handleExport = () => {
    if (!logs.length) return;

    const headers = ["ID", "Time", "Pass ID", "Result", "Staff ID", "Device ID", "Latency (ms)"];
    const rows = logs.map(log => [
      log.scan_id,
      new Date(log.ts).toISOString(),
      log.pass_id || "",
      log.result,
      log.scanner_staff_id,
      log.device_id || "",
      log.latency_ms || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan_logs_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Scan Logs</h1>
        <button 
          onClick={handleExport}
          className="bg-surface border border-border-hair text-text-primary px-4 py-2 rounded-lg font-bold hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface rounded-xl p-4 shadow-card">
          <div className="text-sm font-bold text-text-secondary uppercase mb-1">Total Scans</div>
          <div className="text-2xl font-bold text-text-primary">{logs.length}</div>
        </div>
        <div className="bg-surface rounded-xl p-4 shadow-card">
          <div className="text-sm font-bold text-text-secondary uppercase mb-1">Latency p50</div>
          <div className="text-2xl font-bold text-text-primary">{p50}ms</div>
        </div>
        <div className="bg-surface rounded-xl p-4 shadow-card">
          <div className="text-sm font-bold text-text-secondary uppercase mb-1">Latency p95</div>
          <div className={`text-2xl font-bold ${p95 > 800 ? 'text-red-600' : 'text-text-primary'}`}>{p95}ms</div>
        </div>
        <div className="bg-surface rounded-xl p-4 shadow-card">
          <div className="text-sm font-bold text-text-secondary uppercase mb-1">Devices</div>
          <div className="text-2xl font-bold text-text-primary">{Object.keys(deviceCounts).length}</div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-card p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="p-3 rounded-lg border border-border-hair bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="p-3 rounded-lg border border-border-hair bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">Result Filter</label>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="p-3 rounded-lg border border-border-hair bg-white min-w-[200px]"
            >
              <option value="">All Results</option>
              {Object.values(SCAN_RESULTS).map((res) => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">Limit</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="p-3 rounded-lg border border-border-hair bg-white"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Breakdown */}
      {Object.keys(deviceCounts).length > 0 && (
        <div className="bg-surface rounded-xl shadow-card p-6 mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-4">Scans per Device</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(deviceCounts).map(([device, count]) => (
              <div key={device} className="bg-gray-100 rounded-lg px-3 py-2">
                <span className="text-sm font-mono text-text-secondary">{device.slice(0, 12)}...</span>
                <span className="ml-2 font-bold text-text-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border-hair">
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Time</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Result</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Pass ID</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Device</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Latency</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">No logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.scan_id} className="border-b border-border-hair last:border-0 hover:bg-gray-50 transition">
                  <td className="p-4 text-text-secondary text-sm whitespace-nowrap">
                    {new Date(log.ts).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      log.result === SCAN_RESULTS.VALID ? 'bg-green-100 text-green-800' :
                      log.result === SCAN_RESULTS.USED ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.result}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-text-secondary">
                    {log.pass_id ? log.pass_id.slice(0, 8) + '...' : '-'}
                  </td>
                  <td className="p-4 text-sm text-text-primary">
                    {log.device_id || '-'}
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {log.latency_ms}ms
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
