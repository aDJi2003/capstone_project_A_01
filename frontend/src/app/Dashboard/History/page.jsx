'use client';

import { useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/context/DashboardContext";
import SensorChart from "@/components/SensorChart";
import StatCard from "@/components/StatCard";
import Dropdown from "@/components/Dropdown";
import { FiRefreshCw } from "react-icons/fi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const timeRanges = {
  "Last 20 Minutes": 20 * 60 * 1000,
  "Last 1 Hour": 1 * 60 * 60 * 1000,
  "Last 3 Hours": 3 * 60 * 60 * 1000,
  "Last 6 Hours": 6 * 60 * 60 * 1000,
};

const sensorOptions = {
  'Suhu': { key: 'suhu', unit: '°C', colors: ['#34d399', '#a7f3d0'] },
  'Kelembapan': { key: 'kelembapan', unit: '%', colors: ['#60a5fa', '#a5b4fc'] },
  'Intensitas Cahaya': { key: 'cahaya', unit: 'lux', colors: ['#facc15', '#fde68a', '#fbbf24', '#fef3c7'] },
  'Kualitas Udara': { key: 'gas', unit: 'ppm', colors: ['#f87171', '#fca5a5'] },
  'Penggunaan Arus': { key: 'arus', unit: 'A', colors: ['#c084fc', '#d8b4fe'] },
};

const thresholds = {
  Suhu: { upper: 27, lower: 25 },
  Kelembapan: { upper: 65, lower: 55 },
  'Intensitas Cahaya': { upper: 650, lower: 250 },
  'Kualitas Udara': { upper: 350, lower: 100 },
  'Penggunaan Arus': { upper: 1.2, lower: 0.2 },
};

export default function HistoryPage() {
  const { activeMenu } = useDashboard();
  const [selectedRange, setSelectedRange] = useState("Last 1 Hour");
  const [selectedSensor, setSelectedSensor] = useState("Suhu");
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeRanges[selectedRange]);
    const sensorInfo = sensorOptions[selectedSensor];

    const params = new URLSearchParams({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      sensorType: sensorInfo.key,
    });

    try {
      const [statsRes, chartRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/history/stats?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/history/chart?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!statsRes.ok || !chartRes.ok) throw new Error("Failed to fetch history data");

      const statsData = await statsRes.json();
      const chartRawData = await chartRes.json();

      setStats(statsData);

      const labels = chartRawData.map((d) => new Date(d._id.min).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      
      // --- LOGIKA DATASET DINAMIS ---
      const datasets = [];
      const sensorKeys = ['avgSensor1', 'avgSensor2', 'avgSensor3', 'avgSensor4'];

      sensorKeys.forEach((key, index) => {
        // Cek apakah ada data valid untuk sensor ini
        if (chartRawData.some(d => d[key] != null)) {
          datasets.push({
            label: `${selectedSensor} Sensor ${index + 1} (Avg)`,
            data: chartRawData.map((d) => d[key]),
            borderColor: sensorInfo.colors[index % sensorInfo.colors.length],
            backgroundColor: `${sensorInfo.colors[index % sensorInfo.colors.length]}33`,
            fill: true,
            tension: 0.3,
          });
        }
      });

      setChartData({ labels, datasets });

    } catch (error) {
      console.error("Failed to fetch history data", error);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, selectedSensor]);

  useEffect(() => {
      fetchData();
  }, [activeMenu, fetchData]);

  const currentUnit = sensorOptions[selectedSensor].unit;
  const currentThresholds = thresholds[selectedSensor];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-white">History Overview</h1>
        <div className="flex flex-wrap items-center gap-4">
          <Dropdown
            label="Sensor"
            options={Object.keys(sensorOptions)}
            selectedValue={selectedSensor}
            onSelect={setSelectedSensor}
          />
          <Dropdown
            label="Time"
            options={Object.keys(timeRanges)}
            selectedValue={selectedRange}
            onSelect={setSelectedRange}
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-400">Loading historical data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              title="Max Value"
              value={stats?.maxValue?.toFixed(2) || "N/A"}
              unit={currentUnit}
            />
            <StatCard
              title="Min Value"
              value={stats?.minValue?.toFixed(2) || "N/A"}
              unit={currentUnit}
            />
            <StatCard
              title="Average"
              value={stats?.avgValue?.toFixed(2) || "N/A"}
              unit={currentUnit}
            />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-96">
            <SensorChart
              title={`${selectedSensor} - ${selectedRange}`}
              chartData={chartData}
              unit={currentUnit}
              thresholds={currentThresholds}
            />
          </div>
        </>
      )}
    </div>
  );
}
