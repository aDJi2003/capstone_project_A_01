'use client';

import { useDashboard } from '@/context/DashboardContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiZap, FiWind, FiFilter } from 'react-icons/fi';

const ActuatorCard = ({ icon, name, index, onCommand, activeLevel }) => {
  const levels = ['Off', 'Low', 'Medium', 'High'];

  const handleCommand = (level) => {
    const levelLowerCase = level.toLowerCase();
    onCommand(name.toLowerCase().replace(' ', ''), index, levelLowerCase);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gray-700 rounded-lg mr-4">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{name} #{index}</h3>
      </div>
      <div className="flex justify-between gap-2">
        {levels.map(level => {
          const isSelected = activeLevel === level.toLowerCase();
          return (
            <button
              key={level}
              onClick={() => handleCommand(level)}
              disabled={isSelected}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer
                ${isSelected 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }
                disabled:opacity-75 disabled:cursor-not-allowed
              `}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
};


export default function SystemControlPage() {
  const { actuatorStates, updateActuatorState } = useDashboard();

  const sendActuatorCommand = async (actuatorType, index, level) => {
    const actuatorKey = `${actuatorType.charAt(0).toUpperCase() + actuatorType.slice(1)}-${index}`
      .replace('Lampuled', 'Lampu LED').replace('Airpurifier', 'Air Purifier');
    
    if (actuatorStates[actuatorKey] === level) return;
    
    updateActuatorState(actuatorKey, level);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ actuatorType, index, level }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to send command.');
    }
  };
  
  const actuators = [
    { name: 'Lampu LED', index: 1, icon: <FiZap className="text-yellow-400" /> },
    { name: 'Lampu LED', index: 2, icon: <FiZap className="text-yellow-400" /> },
    { name: 'Air Purifier', index: 1, icon: <FiFilter className="text-green-400" /> },
    { name: 'Air Purifier', index: 2, icon: <FiFilter className="text-green-400" /> },
    { name: 'Kipas', index: 1, icon: <FiWind className="text-blue-400" /> },
    { name: 'Kipas', index: 2, icon: <FiWind className="text-blue-400" /> },
  ];

  return (
    <div>
      <ToastContainer theme="dark" position="top-right" autoClose={2000} />
      <h1 className="text-2xl font-semibold text-white mb-6">System Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actuators.map(actuator => {
          const actuatorKey = `${actuator.name}-${actuator.index}`;
          return (
            <ActuatorCard 
              key={actuatorKey}
              name={actuator.name}
              index={actuator.index}
              icon={actuator.icon}
              onCommand={sendActuatorCommand}
              activeLevel={actuatorStates[actuatorKey]}
            />
          );
        })}
      </div>
    </div>
  );
}