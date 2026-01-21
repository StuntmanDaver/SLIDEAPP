"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function ScanVolumeChart({ data }: { data: any }) {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Scans per Hour" },
    },
  };

  return <Line options={options} data={data} />;
}

export function ResultDistributionChart({ data }: { data: any }) {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "right" as const },
      title: { display: true, text: "Scan Results" },
    },
  };

  return <Doughnut options={options} data={data} />;
}

export function TopDevicesChart({ data }: { data: any }) {
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Top Devices by Invalid Scans" },
    },
  };

  return <Bar options={options} data={data} />;
}
