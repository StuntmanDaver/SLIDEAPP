"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminGetUser, adminUpdateUser, adminRevokePass } from "../../../../lib/api";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const userId = params.id as string;

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await adminGetUser(userId);
      setUser(data);
    } catch (error) {
      console.error("Failed to fetch user", error);
      alert("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async () => {
    if (!confirm(`Are you sure you want to ${user.banned_until ? 'unban' : 'ban'} this user?`)) return;

    setProcessing(true);
    try {
      await adminUpdateUser(userId, user.banned_until ? 'unban' : 'ban');
      await fetchUser();
    } catch (error) {
      alert("Failed to update user status");
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokePass = async (passId: string) => {
    if (!confirm("Are you sure you want to revoke this pass? This cannot be undone.")) return;

    setProcessing(true);
    try {
      await adminRevokePass(passId);
      await fetchUser();
    } catch (error) {
      alert("Failed to revoke pass");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;
  if (!user) return <div className="p-8 text-center text-text-secondary">User not found</div>;

  const isBanned = !!user.banned_until && new Date(user.banned_until) > new Date();

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-lavender-primary hover:text-text-primary">
          &larr; Back
        </button>
        <h1 className="text-3xl font-bold text-text-primary">User Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Profile Card */}
        <div className="bg-surface rounded-xl shadow-card p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-text-primary">Profile</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${isBanned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {isBanned ? 'Banned' : 'Active'}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary uppercase font-bold">Email</label>
              <div className="text-text-primary font-medium">{user.email}</div>
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase font-bold">User ID</label>
              <div className="text-text-primary font-mono text-sm">{user.id}</div>
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase font-bold">Name</label>
              <div className="text-text-primary">{user.profile?.display_name || '-'}</div>
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase font-bold">Created</label>
              <div className="text-text-primary">{new Date(user.created_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-8 border-t border-border-hair pt-6">
            <button
              onClick={handleBanToggle}
              disabled={processing}
              className={`w-full py-2 rounded-lg font-bold border ${
                isBanned 
                  ? 'border-green-600 text-green-600 hover:bg-green-50' 
                  : 'border-red-600 text-red-600 hover:bg-red-50'
              }`}
            >
              {isBanned ? 'Unban User' : 'Ban User'}
            </button>
          </div>
        </div>

        {/* Subscription & Balance */}
        <div className="space-y-8">
          <div className="bg-surface rounded-xl shadow-card p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6">Subscription</h2>
            {user.subscription ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Status</span>
                  <span className="font-bold text-text-primary capitalize">{user.subscription.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Plan ID</span>
                  <span className="font-mono text-sm">{user.subscription.plan_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Current Period End</span>
                  <span className="text-text-primary">{new Date(user.subscription.current_period_end).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-text-secondary italic">No active subscription</div>
            )}
          </div>

          <div className="bg-surface rounded-xl shadow-card p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6">Pass Balance</h2>
            {user.balance ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-text-primary mb-2">
                  {user.balance.passes_allowed - user.balance.passes_used}
                </div>
                <div className="text-text-secondary text-sm">Passes Remaining</div>
                <div className="mt-4 text-xs text-text-secondary">
                  Used: {user.balance.passes_used} | Allowed: {user.balance.passes_allowed}
                </div>
              </div>
            ) : (
              <div className="text-text-secondary italic">No balance record</div>
            )}
          </div>
        </div>
      </div>

      {/* Pass History */}
      <div className="bg-surface rounded-xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border-hair">
          <h2 className="text-xl font-bold text-text-primary">Pass History</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border-hair">
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Pass ID</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Created</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Status</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Redeemed At</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!user.passes || user.passes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">No passes found</td>
              </tr>
            ) : (
              user.passes.map((pass: any) => (
                <tr key={pass.pass_id} className="border-b border-border-hair last:border-0 hover:bg-gray-50 transition">
                  <td className="p-4 font-mono text-sm text-text-secondary">{pass.pass_id.slice(0, 8)}...</td>
                  <td className="p-4 text-text-primary">{new Date(pass.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      pass.status === 'claimed' ? 'bg-green-100 text-green-800' :
                      pass.status === 'redeemed' ? 'bg-gray-200 text-gray-600' :
                      pass.status === 'revoked' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {pass.status}
                    </span>
                  </td>
                  <td className="p-4 text-text-secondary">
                    {pass.redeemed_at ? new Date(pass.redeemed_at).toLocaleString() : '-'}
                  </td>
                  <td className="p-4">
                    {['created', 'claimed'].includes(pass.status) && (
                      <button
                        onClick={() => handleRevokePass(pass.pass_id)}
                        disabled={processing}
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
      </div>
    </div>
  );
}
