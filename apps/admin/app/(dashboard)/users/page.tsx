"use client";

import { useEffect, useState } from "react";
import { adminListUsers } from "../../../lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page]); // Reload when page changes

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminListUsers(page, 20, search);
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-8">Users</h1>

      <div className="bg-surface rounded-xl shadow-card p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            placeholder="Search by email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-3 rounded-lg border border-border-hair bg-white"
          />
          <button type="submit" className="bg-text-primary text-white px-6 py-3 rounded-lg font-bold">
            Search
          </button>
        </form>
      </div>

      <div className="bg-surface rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border-hair">
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">User</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Status</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Pass Balance</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Created</th>
              <th className="p-4 font-semibold text-text-secondary text-sm uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border-hair last:border-0 hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="font-medium text-text-primary">{user.email}</div>
                    <div className="text-xs text-text-secondary font-mono">{user.id}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      user.subscription?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.subscription?.status || 'No Sub'}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.balance ? (
                      <span className="text-text-primary font-bold">{user.balance.passes_allowed - user.balance.passes_used} / {user.balance.passes_allowed}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-text-secondary text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <a href={`/users/${user.id}`} className="text-lavender-primary hover:text-text-primary font-medium text-sm">
                      View Details
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-surface border border-border-hair rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-text-secondary">Page {page}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={users.length < 20}
          className="px-4 py-2 bg-surface border border-border-hair rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
