'use client';

import { useState, useEffect, useCallback } from "react";
import { useDashboard } from "@/context/DashboardContext";
import SensorChart from "@/components/SensorChart";
import StatCard from "@/components/StatCard";
import Dropdown from "@/components/Dropdown";
import { FiRefreshCw, FiAlertCircle } from "react-icons/fi";

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
  Kelembapan: { upper: 60, lower: 40 },
  'Intensitas Cahaya': { upper: 500, lower: 350 },
  'Kualitas Udara': { upper: 1000, lower: 0 },
  'Penggunaan Arus': { upper: 1.2, lower: 0.2 },
};

export default function HistoryPage() {
  const { activeMenu } = useDashboard();
  const [selectedRange, setSelectedRange] = useState("Last 1 Hour");
  const [selectedSensor, setSelectedSensor] = useState("Suhu");
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Token autentikasi tidak ditemukan");
      setLoading(false);
      return;
    }

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
        fetch(`${API_BASE_URL}/api/history/stats?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        }),
        fetch(`${API_BASE_URL}/api/history/chart?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        }),
      ]);

      if (!statsRes.ok) {
        if (statsRes.status === 401) {
          throw new Error("Sesi telah berakhir, silakan login kembali");
        } else if (statsRes.status === 503) {
          throw new Error("Sumber data sedang tidak tersedia");
        } else {
          throw new Error(`Error mengambil statistik (${statsRes.status})`);
        }
      }

      if (!chartRes.ok) {
        if (chartRes.status === 401) {
          throw new Error("Sesi telah berakhir, silakan login kembali");
        } else if (chartRes.status === 503) {
          throw new Error("Sumber data sedang tidak tersedia");
        } else {
          throw new Error(`Error mengambil data chart (${chartRes.status})`);
        }
      }

      const statsData = await statsRes.json();
      const chartRawData = await chartRes.json();

      if (!statsData || typeof statsData !== 'object') {
        throw new Error("Format data statistik tidak valid");
      }

      if (!Array.isArray(chartRawData)) {
        throw new Error("Format data chart tidak valid");
      }

      setStats({
        maxValue: statsData.maxValue ?? null,
        minValue: statsData.minValue ?? null,
        avgValue: statsData.avgValue ?? null,
      });

      if (chartRawData.length === 0) {
        setChartData({ labels: [], datasets: [] });
      } else {
        const labels = chartRawData.map((d) => {
          try {
            return new Date(d._id?.min || d._id).toLocaleTimeString([], { 
              hour: "2-digit", 
              minute: "2-digit" 
            });
          } catch {
            return "Invalid Time";
          }
        });
        
        const datasets = [];
        const sensorKeys = ['avgSensor1', 'avgSensor2', 'avgSensor3', 'avgSensor4'];

        sensorKeys.forEach((key, index) => {
          if (chartRawData.some(d => d[key] != null && !isNaN(d[key]))) {
            datasets.push({
              label: `${selectedSensor} Sensor ${index + 1} (Avg)`,
              data: chartRawData.map((d) => {
                const value = d[key];
                return (value != null && !isNaN(value)) ? value : null;
              }),
              borderColor: sensorInfo.colors[index % sensorInfo.colors.length],
              backgroundColor: `${sensorInfo.colors[index % sensorInfo.colors.length]}33`,
              fill: true,
              tension: 0.3,
            });
          }
        });

        setChartData({ labels, datasets });
      }

    } catch (error) {
      console.error("Failed to fetch history data", error);
      
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        setError("Koneksi timeout. Sumber data mungkin sedang tidak tersedia.");
      } else if (error.message.includes('fetch')) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
      } else {
        setError(error.message || "Terjadi kesalahan saat mengambil data");
      }
      
      setStats(null);
      setChartData({ labels: [], datasets: [] });
    } finally {
      setLoading(false);
    }
  }, [selectedRange, selectedSensor]);

  useEffect(() => {
    fetchData();
  }, [activeMenu, fetchData]);

  const currentUnit = sensorOptions[selectedSensor]?.unit || '';
  const currentThresholds = thresholds[selectedSensor] || { upper: 0, lower: 0 };

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
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait transition-colors"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading historical data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              title="Max Value"
              value={stats?.maxValue != null ? stats.maxValue.toFixed(2) : "N/A"}
              unit={currentUnit}
            />
            <StatCard
              title="Min Value"
              value={stats?.minValue != null ? stats.minValue.toFixed(2) : "N/A"}
              unit={currentUnit}
            />
            <StatCard
              title="Average"
              value={stats?.avgValue != null ? stats.avgValue.toFixed(2) : "N/A"}
              unit={currentUnit}
            />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-96">
            {chartData.datasets.length === 0 && !error ? (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-400">Tidak ada data tersedia untuk rentang waktu ini</p>
              </div>
            ) : (
              <SensorChart
                title={`${selectedSensor} - ${selectedRange}`}
                chartData={chartData}
                unit={currentUnit}
                thresholds={currentThresholds}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}