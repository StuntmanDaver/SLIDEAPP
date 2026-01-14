"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <div className="flex h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-surface shadow-card border-r border-border-hair overflow-y-auto flex flex-col">
        <div className="p-6 flex-1">
          <h1 className="text-2xl font-bold text-text-primary mb-8">Slide Admin</h1>
          <nav className="space-y-2">
            <NavLink href="/dashboard" label="Dashboard" active={isActive("/dashboard")} />
            <NavLink href="/plans" label="Plans" active={isActive("/plans")} />
            <NavLink href="/users" label="Users" active={isActive("/users")} />
            <NavLink href="/staff" label="Staff" active={isActive("/staff")} />
            <NavLink href="/logs" label="Scan Logs" active={isActive("/logs")} />
          </nav>
        </div>

        {/* Logout button */}
        <div className="p-6 border-t border-border-hair">
          <button 
            onClick={handleSignOut}
            className="w-full bg-text-primary text-white rounded-lg p-2 text-sm font-medium hover:opacity-90"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  active?: boolean;
}

function NavLink({ href, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`block px-4 py-2 rounded-md text-sm font-medium transition ${
        active
          ? "bg-lavender-primary text-text-primary"
          : "text-text-secondary hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
}
