"use client";

import { useEffect, useState } from "react";
import { adminListPlans, adminUpdatePlan } from "../../../lib/api";
import type { Plan } from "@slide/shared";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await adminListPlans();
      setPlans(data || []);
    } catch (err: any) {
      console.error("Error fetching plans:", err);
      setError("Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    setActionLoading(plan.plan_id);
    setError(null);
    try {
      await adminUpdatePlan(plan.plan_id, !plan.is_active, undefined);
      // Optimistic update or refetch
      await fetchPlans();
    } catch (err: any) {
      console.error("Error updating plan:", err);
      setError("Failed to update plan status.");
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (plan: Plan) => {
    setEditingId(plan.plan_id);
    setEditValue(plan.passes_per_period);
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setActionLoading(editingId);
    setError(null);

    try {
      await adminUpdatePlan(editingId, undefined, editValue);
      setEditingId(null);
      await fetchPlans();
    } catch (err: any) {
      console.error("Error updating passes:", err);
      setError("Failed to update pass allowance.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-8">Membership Plans</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border-hair">
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Name</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Stripe Price ID</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Passes / Period</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Status</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">Loading...</td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">No plans found</td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.plan_id} className="border-b border-border-hair last:border-0 hover:bg-gray-50 transition">
                  <td className="p-4 text-text-primary font-medium">{plan.name}</td>
                  <td className="p-4 text-text-secondary font-mono text-sm">{plan.stripe_price_id}</td>
                  <td className="p-4">
                    {editingId === plan.plan_id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-16 p-1 border rounded"
                          disabled={actionLoading === plan.plan_id}
                        />
                        <button 
                          onClick={saveEdit} 
                          className="text-green-600 font-bold disabled:opacity-50"
                          disabled={actionLoading === plan.plan_id}
                        >
                          {actionLoading === plan.plan_id ? "Saving..." : "Save"}
                        </button>
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="text-gray-500 disabled:opacity-50"
                          disabled={actionLoading === plan.plan_id}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-bold">{plan.passes_per_period}</span>
                        <button 
                          onClick={() => startEdit(plan)} 
                          className="text-lavender-primary hover:text-text-primary text-xs disabled:opacity-50"
                          disabled={actionLoading === plan.plan_id}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(plan)}
                      disabled={actionLoading === plan.plan_id}
                      className={`text-sm font-medium disabled:opacity-50 ${
                        plan.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {actionLoading === plan.plan_id ? "Updating..." : (plan.is_active ? 'Disable' : 'Enable')}
                    </button>
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
