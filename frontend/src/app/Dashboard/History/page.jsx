'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import SensorChart from '@/components/SensorChart';
import StatCard from '@/components/StatCard';
import Dropdown from '@/components/Dropdown';

const timeRanges = {
  'Last Hour': 1 * 60 * 60 * 1000,
  'Last 6 Hours': 6 * 60 * 60 * 1000,
  'Last 24 Hours': 24 * 60 * 60 * 1000,
  'Last 7 Days': 7 * 24 * 60 * 60 * 1000,
};

const sensorOptions = {
  'Suhu': { key: 'suhu', unit: '°C', colors: ['#34d399', '#a7f3d0'] },
  'Kelembapan': { key: 'kelembapan', unit: '%', colors: ['#60a5fa', '#a5b4fc'] },
  'Intensitas Cahaya': { key: 'cahaya', unit: 'lux', colors: ['#facc15', '#fde68a'] },
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
  const [selectedRange, setSelectedRange] = useState('Last 6 Hours');
  const [selectedSensor, setSelectedSensor] = useState('Intensitas Cahaya');
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
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
          fetch(`http://localhost:5000/api/data/history/stats?${params}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`http://localhost:5000/api/data/history/chart?${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!statsRes.ok || !chartRes.ok) throw new Error('Failed to fetch history data');

        const statsData = await statsRes.json();
        const chartRawData = await chartRes.json();

        setStats(statsData);
        
        const labels = chartRawData.map(d => new Date(d._id.min).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setChartData({
          labels,
          datasets: [
            { label: `${selectedSensor} Sensor 1 (Avg)`, data: chartRawData.map(d => d.avgSensor1), borderColor: sensorInfo.colors[0], backgroundColor: `${sensorInfo.colors[0]}33`, fill: true, tension: 0.3 },
            { label: `${selectedSensor} Sensor 2 (Avg)`, data: chartRawData.map(d => d.avgSensor2), borderColor: sensorInfo.colors[1], backgroundColor: `${sensorInfo.colors[1]}33`, fill: true, tension: 0.3 }
          ]
        });

      } catch (error) {
        console.error("Failed to fetch history data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedRange, selectedSensor, activeMenu]);

  const currentUnit = sensorOptions[selectedSensor].unit;
  const currentThresholds = thresholds[selectedSensor];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">History Overview</h1>
        
        <div className="flex gap-4">
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
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96"><p className="text-gray-400">Loading historical data...</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard title="Max Value" value={stats?.maxValue?.toFixed(2) || 'N/A'} unit={currentUnit} />
            <StatCard title="Min Value" value={stats?.minValue?.toFixed(2) || 'N/A'} unit={currentUnit} />
            <StatCard title="Average" value={stats?.avgValue?.toFixed(2) || 'N/A'} unit={currentUnit} />
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