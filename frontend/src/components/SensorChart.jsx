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
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin 
);

export default function SensorChart({ title, chartData, unit, thresholds = {} }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e5e7eb' },
      },
      title: {
        display: true,
        text: `${title} (${unit})`,
        color: '#f9fafb',
        font: { size: 16 },
      },

      annotation: {
        annotations: {
          upperThreshold: {
            type: 'line',
            yMin: thresholds.upper,
            yMax: thresholds.upper,
            borderColor: 'rgb(239, 68, 68, 0.7)',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              content: `Upper Limit: ${thresholds.upper}`,
              enabled: true,
              position: 'end',
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              font: {
                size: 10
              }
            }
          },
          lowerThreshold: {
            type: 'line',
            yMin: thresholds.lower,
            yMax: thresholds.lower,
            borderColor: 'rgb(239, 68, 68, 0.7)',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              content: `Lower Limit: ${thresholds.lower}`,
              enabled: true,
              position: 'end',
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              font: {
                size: 10
              }
            }
          }
        }
      }
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
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-92">
      <Line options={options} data={chartData} />
    </div>
  );
}