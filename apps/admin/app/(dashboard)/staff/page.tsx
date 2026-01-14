"use client";

import { useEffect, useState } from "react";
import { adminListStaff, adminUpdateStaff } from "../../../lib/api";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const data = await adminListStaff();
      setStaff(data || []);
    } catch (err: any) {
      console.error("Error fetching staff:", err);
      setError("Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (staffMember: any) => {
    setActionLoading(staffMember.user_id);
    setError(null);
    try {
      await adminUpdateStaff(staffMember.user_id, !staffMember.is_active);
      await fetchStaff();
    } catch (err: any) {
      console.error("Error updating staff status:", err);
      setError("Failed to update staff status.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Staff Management</h1>
        <a href="/staff/invite" className="bg-text-primary text-white px-4 py-2 rounded-lg font-bold">
          Invite Staff
        </a>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border-hair">
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Staff Member</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Role</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Status</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Joined</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">Loading...</td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">No staff found</td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member.user_id} className="border-b border-border-hair last:border-0 hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="font-medium text-text-primary">{member.email}</div>
                    <div className="text-xs text-text-secondary font-mono">{member.user_id}</div>
                  </td>
                  <td className="p-4 capitalize font-bold">{member.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-text-secondary text-sm">{new Date(member.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(member)}
                      disabled={actionLoading === member.user_id}
                      className={`text-sm font-medium disabled:opacity-50 ${member.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {actionLoading === member.user_id ? "Updating..." : (member.is_active ? 'Disable' : 'Enable')}
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
