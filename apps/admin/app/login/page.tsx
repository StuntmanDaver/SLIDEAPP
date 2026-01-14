"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("No user found");

      // Verify admin role
      const { data: staff, error: staffError } = await supabase
        .from("staff_users")
        .select("role, is_active")
        .eq("user_id", data.user.id)
        .single();

      if (staffError || !staff) {
        await supabase.auth.signOut();
        throw new Error("Unauthorized access");
      }

      if (staff.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Only admins can access this dashboard");
      }

      if (!staff.is_active) {
        await supabase.auth.signOut();
        throw new Error("Account is disabled");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-surface p-8 rounded-2xl shadow-card w-full max-w-md">
        <h1 className="text-3xl font-bold text-text-primary mb-2 text-center">Slide Admin</h1>
        <p className="text-text-secondary text-center mb-8">Sign in to manage the platform</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-border-hair bg-white focus:outline-none focus:ring-2 focus:ring-lavender-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-border-hair bg-white focus:outline-none focus:ring-2 focus:ring-lavender-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-text-primary text-white py-3 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
