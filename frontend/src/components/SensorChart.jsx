'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SensorChart({ title, chartData, unit }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e5e7eb',
        },
      },
      title: {
        display: true,
        text: `${title} (${unit})`,
        color: '#f9fafb',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#4b5563' },
      },
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: '#4b5563' },
      },
    },
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-72">
      <Line options={options} data={chartData} />
    </div>
  );
}