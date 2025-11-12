'use client';

import { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import SensorChart from '@/components/SensorChart';
import StatCard from '@/components/StatCard';
import { FiChevronDown, FiPause, FiPlay, FiCpu } from 'react-icons/fi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const API_URL = `${API_BASE_URL}/api/latest-data`;
const IKE_API_URL = `${API_BASE_URL}/api/data/ike`;

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

const IkeCard = ({ data }) => {
  const [colorClass, setColorClass] = useState('text-gray-300');

  useEffect(() => {
    switch (data?.classification) {
      case 'Sangat Efisien':
      case 'Efisien':
        setColorClass('text-green-400'); break;
      case 'Cukup Efisien':
        setColorClass('text-blue-400'); break;
      case 'Agak Boros':
        setColorClass('text-yellow-400'); break;
      case 'Boros':
      case 'Sangat Boros':
        setColorClass('text-red-400'); break;
      default:
        setColorClass('text-gray-300');
    }
  }, [data]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-4">
      <div className="bg-gray-700 p-3 rounded-lg">
        <FiCpu className="h-6 w-6 text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-400">Intensitas Konsumsi Energi (IKE)</p>
        {!data ? (
          <p className="text-xl font-semibold text-white animate-pulse">Loading...</p>
        ) : (
          <p className="text-xl font-semibold text-white break-words">
            {data.ikeValue} <span className="text-sm">Wh/m²/jam</span>
            <span className={`ml-2 text-lg ${colorClass}`}>({data.classification})</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { activeMenu } = useDashboard();

  const [ikeData, setIkeData] = useState(null);

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

  const formatChartData = (data) => {
    const labels = data.map((d) => new Date(d.timestamp).toLocaleTimeString());

    const createDataset = (label, dataKey, colors) => {
      const datasets = [];
      
      const maxSensors = data[0] && data[0][dataKey] ? data[0][dataKey].length : 0;
      
      for (let i = 0; i < maxSensors; i++) {
        if (data.some(d => d[dataKey] && d[dataKey][i] != null)) {
          datasets.push({
            label: `${label} Sensor ${i + 1}`,
            data: data.map((d) => d[dataKey] ? d[dataKey][i] : null),
            borderColor: colors[i % colors.length],
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
      "Intensitas Cahaya": createDataset("Intensitas Cahaya", "cahaya", ['#ffd700', '#fde68a', '#fbbf24', '#fef3c7']),
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
      const combinedData = (chartData[selectedChart].datasets || []).flatMap(
        (ds) => ds.data.filter(val => val != null)
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

  useEffect(() => {
    const fetchIkeData = async () => {
      console.log("Fetching IKE data...");
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(IKE_API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Failed to fetch IKE data");
        const data = await response.json();
        setIkeData(data);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchIkeData(); 
    const ikeInterval = setInterval(fetchIkeData, 300000); 
    return () => clearInterval(ikeInterval);
  }, []);

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
    <div className="w-full">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold text-white mb-4">
          Dashboard Overview
        </h1>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
          >
            {isRunning ? <FiPause size={16} /> : <FiPlay size={16} />}
            <span className="text-sm font-medium">
              {isRunning ? "Pause" : "Resume"}
            </span>
          </button>

          {/* Dropdown */}
          <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full sm:w-56 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="truncate mr-2">View: {displaySelectedChart}</span>
              <FiChevronDown
                className={`transition-transform flex-shrink-0 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 sm:right-auto sm:left-auto sm:w-56 mt-2 bg-gray-700 rounded-lg shadow-xl z-10 cursor-pointer max-h-80 overflow-y-auto">
                <ul>
                  <li
                    onClick={() => {
                      setSelectedChart("all");
                      setIsDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-600 cursor-pointer rounded-t-lg text-white"
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
                      className="px-4 py-2 hover:bg-gray-600 cursor-pointer last:rounded-b-lg text-white"
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* IKE Card */}
      <div className="mb-6">
        <IkeCard data={ikeData} />
      </div>

      {/* Charts Section */}
      {selectedChart === "all" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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