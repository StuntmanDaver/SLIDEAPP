import React, { ReactNode } from "react";
import Link from "next/link";

interface AdminLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

export function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-surface shadow-card border-r border-border-hair overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary mb-8">Slide Admin</h1>
          <nav className="space-y-2">
            <NavLink href="/dashboard" label="Dashboard" active={currentPage === "dashboard"} />
            <NavLink href="/plans" label="Plans" active={currentPage === "plans"} />
            <NavLink href="/users" label="Users" active={currentPage === "users"} />
            <NavLink href="/staff" label="Staff" active={currentPage === "staff"} />
            <NavLink href="/logs" label="Scan Logs" active={currentPage === "logs"} />
          </nav>
        </div>

        {/* Logout button */}
        <div className="p-6 border-t border-border-hair">
          <button className="w-full bg-text-primary text-white rounded-lg p-2 text-sm font-medium">
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
    <Link href={href}>
      <a
        className={`block px-4 py-2 rounded-md text-sm font-medium transition ${
          active
            ? "bg-lavender-primary text-text-primary"
            : "text-text-secondary hover:bg-surface-alt"
        }`}
      >
        {label}
      </a>
    </Link>
  );
}
