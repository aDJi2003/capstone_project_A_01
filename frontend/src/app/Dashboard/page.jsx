'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import SensorChart from '@/components/SensorChart';

const API_URL = 'http://localhost:5000/api/latest-data';

export default function DashboardPage() {
  const { activeMenu } = useDashboard();

  const [suhuData, setSuhuData] = useState({ labels: [], datasets: [] });
  const [kelembapanData, setKelembapanData] = useState({ labels: [], datasets: [] });
  const [cahayaData, setCahayaData] = useState({ labels: [], datasets: [] });
  const [gasData, setGasData] = useState({ labels: [], datasets: [] });
  const [arusData, setArusData] = useState({ labels: [], datasets: [] });

  const formatChartData = (data) => {
    const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString());
    
    const createDataset = (label, dataKey, color) => ({
      labels,
      datasets: [{
        label,
        data: data.map(d => d[dataKey]),
        borderColor: color,
        backgroundColor: `${color}33`,
        fill: true,
        tension: 0.3,
      }]
    });
    
    setSuhuData(createDataset('Suhu', 'suhu', '#34d399'));
    setKelembapanData(createDataset('Kelembapan', 'kelembapan', '#60a5fa'));
    setCahayaData(createDataset('Cahaya', 'cahaya', '#facc15'));
    setGasData(createDataset('Kualitas Udara', 'gas', '#f87171'));
    setArusData(createDataset('Arus Listrik', 'arus', '#c084fc'));
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log("Fetched data from backend:", data);
        formatChartData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData(); 

    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (activeMenu !== 'Dashboard') {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-white">{activeMenu}</h1>
        <p className="mt-2 text-gray-300">
          This is the main content area for the <span className="font-bold">{activeMenu}</span> page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SensorChart title="Suhu" chartData={suhuData} unit="°C" />
        <SensorChart title="Kelembapan" chartData={kelembapanData} unit="%" />
        <SensorChart title="Intensitas Cahaya" chartData={cahayaData} unit="lux" />
        <SensorChart title="Kualitas Udara" chartData={gasData} unit="ppm" />
        <SensorChart title="Penggunaan Arus" chartData={arusData} unit="A" />
      </div>
    </div>
  );
}