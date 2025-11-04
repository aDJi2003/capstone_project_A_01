'use client';

import { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import SensorChart from '@/components/SensorChart';
import StatCard from '@/components/StatCard';
import { FiChevronDown, FiPause, FiPlay } from 'react-icons/fi';

// URL API Anda sudah benar (karena Anda revert backend)
const API_URL = 'http://localhost:5000/api/latest-data';

const thresholds = {
  Suhu: { upper: 27, lower: 25 },
  Kelembapan: { upper: 62, lower: 58 },
  "Intensitas Cahaya": { upper: 650, lower: 250 },
  "Kualitas Udara": { upper: 400, lower: 200 },
  "Penggunaan Arus": { upper: 2.5, lower: 0.2 },
};

const chartOptions = [
  "Suhu",
  "Kelembapan",
  "Intensitas Cahaya",
  "Kualitas Udara",
  "Penggunaan Arus",
];

export default function DashboardPage() {
  const { activeMenu } = useDashboard();

  const [chartData, setChartData] = useState({});
  const [stats, setStats] = useState({});

  const [selectedChart, setSelectedChart] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef(null);

  const calculateStats = (dataArray = [], threshold) => {
    const validData = dataArray.filter((val) => val != null);
    if (validData.length === 0)
      return { min: 0, max: 0, avg: 0, exceedCount: 0 };

    const sum = validData.reduce((acc, val) => acc + val, 0);
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const avg = (sum / validData.length).toFixed(2);
    const exceedCount = validData.filter(
      (val) => val > threshold.upper || val < threshold.lower
    ).length;
    return { min, max, avg, exceedCount };
  };

  // --- FUNGSI UTAMA YANG DIPERBAIKI ---
  const formatChartData = (data) => {
    const labels = data.map((d) => new Date(d.timestamp).toLocaleTimeString());

    const createDataset = (label, dataKey, colors) => {
      const datasets = [];
      
      // Temukan jumlah sensor maksimum untuk dataKey ini
      // Cek data pertama, asumsi jumlah sensor konsisten
      const maxSensors = data[0] && data[0][dataKey] ? data[0][dataKey].length : 0;
      
      for (let i = 0; i < maxSensors; i++) {
        // Cek apakah ada data valid untuk sensor ini (indeks i)
        if (data.some(d => d[dataKey] && d[dataKey][i] != null)) {
          datasets.push({
            label: `${label} Sensor ${i + 1}`,
            data: data.map((d) => d[dataKey] ? d[dataKey][i] : null), // Ambil data dari array
            borderColor: colors[i % colors.length], // Ulangi warna jika sensor > 2
            backgroundColor: `${colors[i % colors.length]}33`,
            fill: true,
            tension: 0.3,
          });
        }
      }
      return { labels, datasets };
    };

    const newChartData = {
      Suhu: createDataset("Suhu", "suhu", ["#34d399", "#a7f3d0"]),
      Kelembapan: createDataset("Kelembapan", "kelembapan", ["#60a5fa", "#a5b4fc"]),
      "Intensitas Cahaya": createDataset("Intensitas Cahaya", "cahaya", ["#facc15", "#fde68a"]),
      "Kualitas Udara": createDataset("Kualitas Udara", "gas", ["#f87171", "#fca5a5"]),
      "Penggunaan Arus": createDataset("Penggunaan Arus", "arus", ["#c084fc", "#d8b4fe"]),
    };

    setChartData(newChartData);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        formatChartData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isRunning) {
      fetchData();
      intervalRef.current = setInterval(fetchData, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  useEffect(() => {
    if (selectedChart !== "all" && chartData[selectedChart]) {
      // Gabungkan data dari semua dataset yang ada
      const combinedData = (chartData[selectedChart].datasets || []).flatMap(
        (ds) => ds.data.filter(val => val != null) // Filter nulls
      );
      const currentThresholds = thresholds[selectedChart];

      if (combinedData.length > 0 && currentThresholds) {
        setStats(calculateStats(combinedData, currentThresholds));
      }
    }
  }, [chartData, selectedChart]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Mengaktifkan kembali pengecekan menu
  // if (activeMenu !== "Dashboard") {
  //   return (
  //     <div>
  //       <h1 className="text-2xl font-semibold text-white">{activeMenu}</h1>
  //       <p className="mt-2 text-gray-300">
  //         This is the main content area for the{" "}
  //         <span className="font-bold">{activeMenu}</span> page.
  //       </p>
  //     </div>
  //   );
  // }

  const getUnit = (chartName) => {
    const units = {
      Suhu: "°C",
      Kelembapan: "%",
      "Intensitas Cahaya": "lux",
      "Kualitas Udara": "ppm",
      "Penggunaan Arus": "A",
    };
    return units[chartName] || "";
  };

  const dropdownOptions = ["all", ...chartOptions];
  const displaySelectedChart =
    selectedChart === "all" ? "All Charts" : selectedChart;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-white">
            Dashboard Overview
          </h1>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isRunning ? <FiPause size={16} /> : <FiPlay size={16} />}
            <span className="text-sm font-medium">
              {isRunning ? "Pause" : "Resume"}
            </span>
          </button>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-56 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>View: {displaySelectedChart}</span>
            <FiChevronDown
              className={`transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-lg shadow-xl z-10">
              <ul>
                <li
                  onClick={() => {
                    setSelectedChart("all");
                    setIsDropdownOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-600 cursor-pointer rounded-t-lg"
                >
                  All Charts
                </li>
                {chartOptions.map((option) => (
                  <li
                    key={option}
                    onClick={() => {
                      setSelectedChart(option);
                      setIsDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-600 cursor-pointer last:rounded-b-lg"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {selectedChart === "all" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartOptions.map((option) => (
            <SensorChart
              key={option}
              title={option}
              chartData={chartData[option] || { labels: [], datasets: [] }}
              unit={getUnit(option)}
              thresholds={thresholds[option]}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SensorChart
              title={selectedChart}
              chartData={
                chartData[selectedChart] || { labels: [], datasets: [] }
              }
              unit={getUnit(selectedChart)}
              thresholds={thresholds[selectedChart]}
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Max Value"
                value={stats.max}
                unit={getUnit(selectedChart)}
              />
              <StatCard
                title="Min Value"
                value={stats.min}
                unit={getUnit(selectedChart)}
              />
            </div>
            <StatCard
              title="Average"
              value={stats.avg}
              unit={getUnit(selectedChart)}
            />
            <StatCard title="Exceed Count" value={stats.exceedCount} />
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <p className="text-sm text-gray-400">Normal Threshold</p>
              <p className="text-lg font-semibold text-white">
                {thresholds[selectedChart]?.lower} {getUnit(selectedChart)} -{" "}
                {thresholds[selectedChart]?.upper} {getUnit(selectedChart)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}