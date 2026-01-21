"use client";

import { useEffect, useState } from "react";
import { adminListSurges, adminTriggerSurge, adminUpdateSurgeConfig } from "../../../lib/api";
import type { SurgeEvent, SurgeConfig } from "@slide/shared";

interface SurgeStats {
  active_surges: number;
  total_surges_today: number;
  total_claims_today: number;
  registered_push_tokens: number;
}

export default function SurgesPage() {
  const [surges, setSurges] = useState<SurgeEvent[]>([]);
  const [stats, setStats] = useState<SurgeStats | null>(null);
  const [config, setConfig] = useState<SurgeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Trigger surge form state
  const [showTriggerForm, setShowTriggerForm] = useState(false);
  const [triggerTitle, setTriggerTitle] = useState("SURGE: Priority Entry Available!");
  const [triggerMessage, setTriggerMessage] = useState("Claim your priority spot now!");
  const [triggerMaxClaims, setTriggerMaxClaims] = useState(50);

  // Config form state
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configForm, setConfigForm] = useState({
    surge_duration_minutes: 30,
    max_claims_per_surge: 50,
    membership_threshold: 10,
    membership_window_minutes: 60,
    usage_threshold: 20,
  });

  useEffect(() => {
    fetchSurges();
  }, []);

  useEffect(() => {
    if (config) {
      setConfigForm({
        surge_duration_minutes: config.surge_duration_minutes,
        max_claims_per_surge: config.max_claims_per_surge,
        membership_threshold: config.membership_threshold,
        membership_window_minutes: config.membership_window_minutes,
        usage_threshold: config.usage_threshold,
      });
    }
  }, [config]);

  const fetchSurges = async () => {
    try {
      const data = await adminListSurges();
      setSurges(data.surges || []);
      setStats(data.stats);
      setConfig(data.config);
    } catch (err: any) {
      console.error("Error fetching surges:", err);
      setError("Failed to load surges.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSurge = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await adminTriggerSurge({
        title: triggerTitle,
        message: triggerMessage,
        max_claims: triggerMaxClaims,
      });
      setSuccess(`Surge triggered! ${result.notifications_sent} notifications sent.`);
      setShowTriggerForm(false);
      await fetchSurges();
    } catch (err: any) {
      console.error("Error triggering surge:", err);
      setError("Failed to trigger surge.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await adminUpdateSurgeConfig(configForm);
      setSuccess("Configuration updated successfully.");
      setShowConfigForm(false);
      await fetchSurges();
    } catch (err: any) {
      console.error("Error updating config:", err);
      setError("Failed to update configuration.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Surge Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfigForm(!showConfigForm)}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-hair rounded-lg hover:bg-gray-50"
          >
            Settings
          </button>
          <button
            onClick={() => setShowTriggerForm(!showTriggerForm)}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            Trigger Surge
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 border border-green-100">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-surface rounded-xl shadow-card p-6">
            <div className="text-3xl font-bold text-orange-500">{stats.active_surges}</div>
            <div className="text-sm text-text-secondary mt-1">Active Surges</div>
          </div>
          <div className="bg-surface rounded-xl shadow-card p-6">
            <div className="text-3xl font-bold text-text-primary">{stats.total_surges_today}</div>
            <div className="text-sm text-text-secondary mt-1">Surges Today</div>
          </div>
          <div className="bg-surface rounded-xl shadow-card p-6">
            <div className="text-3xl font-bold text-text-primary">{stats.total_claims_today}</div>
            <div className="text-sm text-text-secondary mt-1">Claims Today</div>
          </div>
          <div className="bg-surface rounded-xl shadow-card p-6">
            <div className="text-3xl font-bold text-text-primary">{stats.registered_push_tokens}</div>
            <div className="text-sm text-text-secondary mt-1">Push Tokens</div>
          </div>
        </div>
      )}

      {/* Trigger Surge Form */}
      {showTriggerForm && (
        <div className="bg-surface rounded-xl shadow-card p-6 mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Trigger New Surge</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
              <input
                type="text"
                value={triggerTitle}
                onChange={(e) => setTriggerTitle(e.target.value)}
                className="w-full p-2 border border-border-hair rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Message</label>
              <input
                type="text"
                value={triggerMessage}
                onChange={(e) => setTriggerMessage(e.target.value)}
                className="w-full p-2 border border-border-hair rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Max Claims</label>
              <input
                type="number"
                value={triggerMaxClaims}
                onChange={(e) => setTriggerMaxClaims(parseInt(e.target.value) || 50)}
                className="w-32 p-2 border border-border-hair rounded-lg"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleTriggerSurge}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {actionLoading ? "Sending..." : "Send Surge Notifications"}
              </button>
              <button
                onClick={() => setShowTriggerForm(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-hair rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Form */}
      {showConfigForm && (
        <div className="bg-surface rounded-xl shadow-card p-6 mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">Surge Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Surge Duration (minutes)
              </label>
              <input
                type="number"
                value={configForm.surge_duration_minutes}
                onChange={(e) => setConfigForm({ ...configForm, surge_duration_minutes: parseInt(e.target.value) || 30 })}
                className="w-full p-2 border border-border-hair rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Max Claims per Surge
              </label>
              <input
                type="number"
                value={configForm.max_claims_per_surge}
                onChange={(e) => setConfigForm({ ...configForm, max_claims_per_surge: parseInt(e.target.value) || 50 })}
                className="w-full p-2 border border-border-hair rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Membership Threshold
              </label>
              <input
                type="number"
                value={configForm.membership_threshold}
                onChange={(e) => setConfigForm({ ...configForm, membership_threshold: parseInt(e.target.value) || 10 })}
                className="w-full p-2 border border-border-hair rounded-lg"
              />
              <p className="text-xs text-text-secondary mt-1">New memberships to trigger surge</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Membership Window (minutes)
              </label>
              <input
                type="number"
                value={configForm.membership_window_minutes}
                onChange={(e) => setConfigForm({ ...configForm, membership_window_minutes: parseInt(e.target.value) || 60 })}
                className="w-full p-2 border border-border-hair rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Usage Threshold
              </label>
              <input
                type="number"
                value={configForm.usage_threshold}
                onChange={(e) => setConfigForm({ ...configForm, usage_threshold: parseInt(e.target.value) || 20 })}
                className="w-full p-2 border border-border-hair rounded-lg"
              />
              <p className="text-xs text-text-secondary mt-1">Active passes to trigger surge</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleUpdateConfig}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save Configuration"}
            </button>
            <button
              onClick={() => setShowConfigForm(false)}
              className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-hair rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Surges Table */}
      <div className="bg-surface rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border-hair">
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Title</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Type</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Claims</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Created</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Expires</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary">Loading...</td>
              </tr>
            ) : surges.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary">No surges found</td>
              </tr>
            ) : (
              surges.map((surge) => (
                <tr key={surge.surge_id} className="border-b border-border-hair last:border-0 hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="text-text-primary font-medium">{surge.title}</div>
                    <div className="text-text-secondary text-sm">{surge.message}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {surge.trigger_type}
                    </span>
                  </td>
                  <td className="p-4 text-text-primary">
                    <span className="font-bold">{surge.claims_count}</span>
                    <span className="text-text-secondary">/{surge.max_claims}</span>
                  </td>
                  <td className="p-4 text-text-secondary text-sm">{formatDate(surge.created_at)}</td>
                  <td className="p-4 text-text-secondary text-sm">{formatDate(surge.expires_at)}</td>
                  <td className="p-4">
                    {isExpired(surge.expires_at) ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600">
                        Expired
                      </span>
                    ) : surge.claims_count >= surge.max_claims ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        Full
                      </span>
                    ) : surge.is_active ? (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600">
                        Inactive
                      </span>
                    )}
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
