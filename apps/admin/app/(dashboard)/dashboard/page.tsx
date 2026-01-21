"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { adminGetDashboardStats } from "../../../lib/api";
import { SCAN_RESULTS } from "@slide/shared";

// Dynamically import charts to avoid SSR issues with Chart.js
const ScanVolumeChart = dynamic(
  () => import("../../../components/ScanChart").then((mod) => mod.ScanVolumeChart),
  { ssr: false }
);
const ResultDistributionChart = dynamic(
  () => import("../../../components/ScanChart").then((mod) => mod.ResultDistributionChart),
  { ssr: false }
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalScans: 0,
    invalidScans: 0,
    avgLatency: 0,
  });
  const [chartData, setChartData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const scans = await adminGetDashboardStats();

      if (scans) {
        // Summary Stats
        const total = scans.length;
        const invalid = scans.filter((s: any) => s.result !== SCAN_RESULTS.VALID).length;
        const latencySum = scans.reduce((sum: number, s: any) => sum + (s.latency_ms || 0), 0);
        
        setStats({
          totalScans: total,
          invalidScans: invalid,
          avgLatency: total ? Math.round(latencySum / total) : 0,
        });

        // Chart Data - Scans per Hour
        const hours = Array(24).fill(0);
        scans.forEach((s: any) => {
          const hour = new Date(s.ts).getHours();
          hours[hour]++;
        });

        setChartData({
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          datasets: [
            {
              label: 'Scans',
              data: hours,
              borderColor: 'rgb(147, 51, 234)', // Lavender
              backgroundColor: 'rgba(147, 51, 234, 0.5)',
            },
          ],
        });

        // Result Distribution
        const results = scans.reduce((acc: any, s: any) => {
          acc[s.result] = (acc[s.result] || 0) + 1;
          return acc;
        }, {});

        setResultData({
          labels: Object.keys(results),
          datasets: [
            {
              data: Object.values(results),
              backgroundColor: [
                '#22c55e', // Green (Valid)
                '#eab308', // Yellow (Used)
                '#ef4444', // Red (Invalid/Expired)
                '#ef4444',
                '#ef4444',
              ],
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const invalidRatio = stats.totalScans ? Math.round((stats.invalidScans / stats.totalScans) * 100) : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Scans (Today)" 
          value={stats.totalScans.toString()} 
          loading={loading}
        />
        <StatCard 
          title="Invalid Ratio" 
          value={`${invalidRatio}%`} 
          subtext={`${stats.invalidScans} invalid scans`}
          loading={loading}
          alert={invalidRatio > 10}
        />
        <StatCard 
          title="Avg Latency" 
          value={`${stats.avgLatency}ms`} 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-surface rounded-xl p-6 shadow-card h-80 flex items-center justify-center">
          {chartData ? <ScanVolumeChart data={chartData} /> : <div className="text-text-secondary">No data</div>}
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-card flex justify-center h-80 items-center">
          <div className="w-2/3 h-full flex items-center justify-center">
            {resultData ? <ResultDistributionChart data={resultData} /> : <div className="text-text-secondary">No data</div>}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-6 shadow-card">
        <h2 className="text-xl font-bold text-text-primary mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a href="/logs" className="bg-lavender-primary text-text-primary px-4 py-2 rounded-lg font-medium">
            View Live Logs
          </a>
          <a href="/staff" className="bg-surface border border-border-hair px-4 py-2 rounded-lg font-medium">
            Manage Staff
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtext, loading, alert }: any) {
  return (
    <div className={`bg-surface p-6 rounded-xl shadow-card border-l-4 ${alert ? 'border-red-500' : 'border-lavender-primary'}`}>
      <h3 className="text-text-secondary text-sm font-bold uppercase tracking-wider mb-2">{title}</h3>
      {loading ? (
        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
      ) : (
        <>
          <div className="text-3xl font-bold text-text-primary">{value}</div>
          {subtext && <div className="text-text-secondary text-sm mt-1">{subtext}</div>}
        </>
      )}
    </div>
  );
}
