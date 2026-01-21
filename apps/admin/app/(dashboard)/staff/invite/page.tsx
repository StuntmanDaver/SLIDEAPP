"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateStaff } from "../../../../lib/api";

export default function InviteStaffPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("scanner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await adminCreateStaff(email, password, role);
      setSuccess(true);
      setTimeout(() => router.push("/staff"), 1500);
    } catch (err: any) {
      console.error("Error creating staff:", err);
      setError(err?.message || "Failed to create staff account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Invite Staff</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 border border-green-100">
          Staff account created successfully! Redirecting...
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-border-hair bg-white"
              required
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-border-hair bg-white"
              required
              minLength={6}
              disabled={loading || success}
            />
            <p className="text-xs text-text-secondary mt-1">Must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 rounded-lg border border-border-hair bg-white"
              disabled={loading || success}
            >
              <option value="scanner">Scanner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-bold border border-border-hair text-text-secondary hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-3 rounded-lg font-bold bg-text-primary text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating..." : success ? "Created!" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
