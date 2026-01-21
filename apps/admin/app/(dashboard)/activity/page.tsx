"use client";

import { useEffect, useState } from "react";
import {
  adminListPassActivity,
  adminRevokePass,
  adminListScanEvents,
  PassActivity,
  PassActivityStats,
  FraudIndicators,
} from "../../../lib/api";
import { SCAN_RESULTS } from "@slide/shared";

type ActiveTab = "passes" | "scans";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "created", label: "Created (Issued)" },
  { value: "claimed", label: "Claimed" },
  { value: "redeemed", label: "Redeemed (Used)" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

const STATUS_COLORS: Record<string, string> = {
  created: "bg-blue-100 text-blue-800",
  claimed: "bg-purple-100 text-purple-800",
  redeemed: "bg-green-100 text-green-800",
  expired: "bg-gray-200 text-gray-600",
  revoked: "bg-red-100 text-red-800",
};

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("passes");

  // Pass activity state
  const [passes, setPasses] = useState<PassActivity[]>([]);
  const [stats, setStats] = useState<PassActivityStats | null>(null);
  const [fraudIndicators, setFraudIndicators] = useState<FraudIndicators | null>(null);
  const [passesLoading, setPassesLoading] = useState(true);

  // Scan logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [scansLoading, setScansLoading] = useState(false);
  const [scansLoaded, setScansLoaded] = useState(false);

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Shared filters
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Tab-specific filters
  const [statusFilter, setStatusFilter] = useState("");
  const [searchPassId, setSearchPassId] = useState("");
  const [resultFilter, setResultFilter] = useState("");

  // Fraud view
  const [showFraudPanel, setShowFraudPanel] = useState(false);

  // Fetch passes on mount and when filters change
  useEffect(() => {
    if (activeTab === "passes") {
      fetchActivity();
    }
  }, [statusFilter, dateFrom, dateTo, limit, offset, activeTab]);

  // Lazy load scans when switching to scans tab
  useEffect(() => {
    if (activeTab === "scans" && !scansLoaded) {
      fetchLogs();
    }
  }, [activeTab]);

  // Refetch scans when filters change (only if already loaded)
  useEffect(() => {
    if (activeTab === "scans" && scansLoaded) {
      fetchLogs();
    }
  }, [resultFilter, dateFrom, dateTo, limit]);

  const fetchActivity = async () => {
    setPassesLoading(true);
    setError(null);
    try {
      const data = await adminListPassActivity({
        limit,
        offset,
        status: statusFilter || undefined,
        dateFrom,
        dateTo,
        searchPassId: searchPassId || undefined,
      });
      setPasses(data.passes || []);
      setStats(data.stats);
      setFraudIndicators(data.fraud_indicators);
    } catch (err: any) {
      console.error("Error fetching activity:", err);
      setError("Failed to load activity log.");
    } finally {
      setPassesLoading(false);
    }
  };

  const fetchLogs = async () => {
    setScansLoading(true);
    try {
      const data = await adminListScanEvents(limit, resultFilter || undefined, dateFrom, dateTo);
      setLogs(data || []);
      setScansLoaded(true);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setError("Failed to load scan logs.");
    } finally {
      setScansLoading(false);
    }
  };

  const handleSearch = () => {
    setOffset(0);
    fetchActivity();
  };

  const handleRevokePass = async (passId: string) => {
    if (!confirm("Are you sure you want to revoke this pass?")) return;

    try {
      await adminRevokePass(passId);
      setSuccess("Pass revoked successfully.");
      fetchActivity();
    } catch (err) {
      console.error("Error revoking pass:", err);
      setError("Failed to revoke pass.");
    }
  };

  const handleExport = () => {
    if (activeTab === "passes") {
      exportPasses();
    } else {
      exportScans();
    }
  };

  const exportPasses = () => {
    if (!passes.length) return;

    const headers = [
      "Pass ID",
      "Status",
      "Created At",
      "Claimed At",
      "Redeemed At",
      "Issuer Email",
      "Owner Email",
      "Device ID",
    ];
    const rows = passes.map((p) => [
      p.pass_id,
      p.status,
      new Date(p.created_at).toISOString(),
      p.claimed_at ? new Date(p.claimed_at).toISOString() : "",
      p.redeemed_at ? new Date(p.redeemed_at).toISOString() : "",
      p.issuer_email || "",
      p.owner_email || "",
      p.redeemed_device_id || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pass_activity_${new Date().toISOString()}.csv`;
    a.click();
  };

  const exportScans = () => {
    if (!logs.length) return;

    const headers = ["ID", "Time", "Pass ID", "Result", "Staff ID", "Device ID", "Latency (ms)"];
    const rows = logs.map((log) => [
      log.scan_id,
      new Date(log.ts).toISOString(),
      log.pass_id || "",
      log.result,
      log.scanner_staff_id,
      log.device_id || "",
      log.latency_ms || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan_logs_${new Date().toISOString()}.csv`;
    a.click();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  // Scan stats calculations
  const latencies = logs.map((l) => l.latency_ms).filter(Boolean).sort((a: number, b: number) => a - b);
  const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
  const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;

  const deviceCounts = logs.reduce((acc: Record<string, number>, log) => {
    const device = log.device_id || "unknown";
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Activity</h1>
        <div className="flex gap-3">
          {activeTab === "passes" && (
            <button
              onClick={() => setShowFraudPanel(!showFraudPanel)}
              className={`px-4 py-2 text-sm font-medium border rounded-lg ${
                showFraudPanel
                  ? "bg-red-500 text-white border-red-500"
                  : "text-red-600 border-red-300 hover:bg-red-50"
              }`}
            >
              Fraud Alerts{" "}
              {fraudIndicators && fraudIndicators.reuse_attempts_count > 0 && (
                <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {fraudIndicators.reuse_attempts_count}
                </span>
              )}
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-hair rounded-lg hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("passes")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === "passes"
              ? "bg-text-primary text-white"
              : "bg-surface text-text-secondary border border-border-hair hover:bg-gray-50"
          }`}
        >
          Passes
        </button>
        <button
          onClick={() => setActiveTab("scans")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === "scans"
              ? "bg-text-primary text-white"
              : "bg-surface text-text-secondary border border-border-hair hover:bg-gray-50"
          }`}
        >
          Scans
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 border border-green-100">
          {success}
        </div>
      )}

      {activeTab === "passes" ? (
        <PassesContent
          passes={passes}
          stats={stats}
          fraudIndicators={fraudIndicators}
          loading={passesLoading}
          showFraudPanel={showFraudPanel}
          dateFrom={dateFrom}
          dateTo={dateTo}
          statusFilter={statusFilter}
          searchPassId={searchPassId}
          limit={limit}
          offset={offset}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          setStatusFilter={setStatusFilter}
          setSearchPassId={setSearchPassId}
          setLimit={setLimit}
          setOffset={setOffset}
          handleSearch={handleSearch}
          handleRevokePass={handleRevokePass}
          formatDate={formatDate}
        />
      ) : (
        <ScansContent
          logs={logs}
          loading={scansLoading}
          dateFrom={dateFrom}
          dateTo={dateTo}
          resultFilter={resultFilter}
          limit={limit}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          setResultFilter={setResultFilter}
          setLimit={setLimit}
          p50={p50}
          p95={p95}
          deviceCounts={deviceCounts}
        />
      )}
    </div>
  );
}

// Passes Tab Content
interface PassesContentProps {
  passes: PassActivity[];
  stats: PassActivityStats | null;
  fraudIndicators: FraudIndicators | null;
  loading: boolean;
  showFraudPanel: boolean;
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  searchPassId: string;
  limit: number;
  offset: number;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setStatusFilter: (v: string) => void;
  setSearchPassId: (v: string) => void;
  setLimit: (v: number) => void;
  setOffset: (v: number) => void;
  handleSearch: () => void;
  handleRevokePass: (passId: string) => void;
  formatDate: (dateStr: string | null) => string;
}

function PassesContent({
  passes,
  stats,
  fraudIndicators,
  loading,
  showFraudPanel,
  dateFrom,
  dateTo,
  statusFilter,
  searchPassId,
  limit,
  offset,
  setDateFrom,
  setDateTo,
  setStatusFilter,
  setSearchPassId,
  setLimit,
  setOffset,
  handleSearch,
  handleRevokePass,
  formatDate,
}: PassesContentProps) {
  return (
    <>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-surface rounded-xl shadow-card p-4">
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-xs text-text-secondary uppercase font-medium mt-1">Total Passes</div>
          </div>
          <div className="bg-surface rounded-xl shadow-card p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.created}</div>
            <div className="text-xs text-text-secondary uppercase font-medium mt-1">Issued</div>
          </div>
          <div className="bg-surface rounded-xl shadow-card p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.claimed}</div>
            <div className="text-xs text-text-secondary uppercase font-medium mt-1">Claimed</div>
          </div>
          <div className="bg-surface rounded-xl shadow-card p-4">
            <div className="text-2xl font-bold text-green-600">{stats.redeemed}</div>
            <div className="text-xs text-text-secondary uppercase font-medium mt-1">Redeemed</div>
          </div>
          <div className="bg-surface rounded-xl shadow-card p-4">
            <div className="text-2xl font-bold text-gray-500">{stats.expired}</div>
            <div className="text-xs text-text-secondary uppercase font-medium mt-1">Expired</div>
          </div>
          <div className="bg-surface rounded-xl shadow-card p-4">
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
            <div className="text-xs text-text-secondary uppercase font-medium mt-1">Revoked</div>
          </div>
        </div>
      )}

      {/* Today's Activity */}
      {stats && (
        <div className="bg-surface rounded-xl shadow-card p-6 mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-4">Today&apos;s Activity</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600">{stats.issued_today}</div>
              <div className="text-sm text-text-secondary">Passes Issued</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{stats.redeemed_today}</div>
              <div className="text-sm text-text-secondary">Passes Redeemed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-500">{stats.expired_today}</div>
              <div className="text-sm text-text-secondary">Passes Expired</div>
            </div>
          </div>
        </div>
      )}

      {/* Fraud Panel */}
      {showFraudPanel && fraudIndicators && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-red-800 mb-4">Fraud Detection Alerts</h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {fraudIndicators.reuse_attempts_count}
              </div>
              <div className="text-sm text-text-secondary">Reuse Attempts Detected</div>
              <p className="text-xs text-text-secondary mt-1">
                Passes that were scanned after already being redeemed
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {fraudIndicators.multi_device_passes.length}
              </div>
              <div className="text-sm text-text-secondary">Multi-Device Passes</div>
              <p className="text-xs text-text-secondary mt-1">
                Passes scanned from multiple different devices
              </p>
            </div>
          </div>

          {fraudIndicators.multi_device_passes.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-red-700 uppercase mb-3">
                Suspicious Passes (Multiple Devices)
              </h3>
              <div className="bg-white rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-text-secondary font-medium">Pass ID</th>
                      <th className="p-3 text-left text-text-secondary font-medium">Device Count</th>
                      <th className="p-3 text-left text-text-secondary font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudIndicators.multi_device_passes.map((fp) => (
                      <tr key={fp.pass_id} className="border-t border-gray-100">
                        <td className="p-3 font-mono text-xs">{fp.pass_id.slice(0, 12)}...</td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                            {fp.device_count} devices
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleRevokePass(fp.pass_id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
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
            <label className="block text-sm font-bold text-text-secondary mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 rounded-lg border border-border-hair bg-white min-w-[180px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">Pass ID</label>
            <input
              type="text"
              value={searchPassId}
              onChange={(e) => setSearchPassId(e.target.value)}
              placeholder="Search by ID..."
              className="p-3 rounded-lg border border-border-hair bg-white w-48"
            />
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
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-3 bg-text-primary text-white rounded-lg font-medium hover:opacity-90"
          >
            Search
          </button>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-surface rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border-hair">
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Pass ID</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Status</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Issuer</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Owner</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Created</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Redeemed</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : passes.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary">
                  No passes found
                </td>
              </tr>
            ) : (
              passes.map((pass) => (
                <tr
                  key={pass.pass_id}
                  className="border-b border-border-hair last:border-0 hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-mono text-xs text-text-primary">
                    {pass.pass_id.slice(0, 8)}...
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        STATUS_COLORS[pass.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {pass.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">{pass.issuer_email || "-"}</td>
                  <td className="p-4 text-sm text-text-secondary">{pass.owner_email || "-"}</td>
                  <td className="p-4 text-sm text-text-secondary whitespace-nowrap">
                    {formatDate(pass.created_at)}
                  </td>
                  <td className="p-4 text-sm text-text-secondary whitespace-nowrap">
                    {formatDate(pass.redeemed_at)}
                  </td>
                  <td className="p-4">
                    {pass.status !== "revoked" && pass.status !== "redeemed" && (
                      <button
                        onClick={() => handleRevokePass(pass.pass_id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {passes.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t border-border-hair bg-gray-50">
            <div className="text-sm text-text-secondary">
              Showing {offset + 1} - {offset + passes.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1 text-sm border border-border-hair rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={passes.length < limit}
                className="px-3 py-1 text-sm border border-border-hair rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Scans Tab Content
interface ScansContentProps {
  logs: any[];
  loading: boolean;
  dateFrom: string;
  dateTo: string;
  resultFilter: string;
  limit: number;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setResultFilter: (v: string) => void;
  setLimit: (v: number) => void;
  p50: number;
  p95: number;
  deviceCounts: Record<string, number>;
}

function ScansContent({
  logs,
  loading,
  dateFrom,
  dateTo,
  resultFilter,
  limit,
  setDateFrom,
  setDateTo,
  setResultFilter,
  setLimit,
  p50,
  p95,
  deviceCounts,
}: ScansContentProps) {
  return (
    <>
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
          <div className={`text-2xl font-bold ${p95 > 800 ? "text-red-600" : "text-text-primary"}`}>
            {p95}ms
          </div>
        </div>
        <div className="bg-surface rounded-xl p-4 shadow-card">
          <div className="text-sm font-bold text-text-secondary uppercase mb-1">Devices</div>
          <div className="text-2xl font-bold text-text-primary">
            {Object.keys(deviceCounts).length}
          </div>
        </div>
      </div>

      {/* Filters */}
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
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="p-3 rounded-lg border border-border-hair bg-white min-w-[200px]"
            >
              <option value="">All Results</option>
              {Object.values(SCAN_RESULTS).map((res) => (
                <option key={res} value={res}>
                  {res}
                </option>
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
              <option value={250}>250</option>
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

      {/* Scans Table */}
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
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.scan_id}
                  className="border-b border-border-hair last:border-0 hover:bg-gray-50 transition"
                >
                  <td className="p-4 text-text-secondary text-sm whitespace-nowrap">
                    {new Date(log.ts).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        log.result === SCAN_RESULTS.VALID
                          ? "bg-green-100 text-green-800"
                          : log.result === SCAN_RESULTS.USED
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-text-secondary">
                    {log.pass_id ? log.pass_id.slice(0, 8) + "..." : "-"}
                  </td>
                  <td className="p-4 text-sm text-text-primary">{log.device_id || "-"}</td>
                  <td className="p-4 text-sm text-text-secondary">{log.latency_ms}ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
