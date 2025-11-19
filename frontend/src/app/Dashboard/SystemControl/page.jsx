"use client";

import { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiZap, FiWind, FiFilter } from "react-icons/fi";
import Dropdown from "@/components/Dropdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const ActuatorCard = ({
  icon,
  name,
  index,
  onCommand,
  activeLevel,
  levels,
}) => {
  const handleCommand = (level) => {
    const levelLowerCase = level.toLowerCase();
    onCommand(name.toLowerCase().replace(" ", ""), index, levelLowerCase);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-gray-700 rounded-lg mr-4">{icon}</div>
        <h3 className="text-lg font-semibold text-white">
          {name} #{index}
        </h3>
      </div>
      <div className="flex justify-between gap-2">
        {levels.map((level) => {
          const isSelected = activeLevel === level.toLowerCase();
          return (
            <button
              key={level}
              onClick={() => handleCommand(level)}
              disabled={isSelected}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer
                ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 hover:bg-gray-500 text-gray-300"
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
  const { activeMenu, actuatorStates, updateActuatorState, user } =
    useDashboard();
  const [filterType, setFilterType] = useState("Semua");

  const sendActuatorCommand = async (actuatorType, index, level) => {
    const actuatorKey = `${
      actuatorType.charAt(0).toUpperCase() + actuatorType.slice(1)
    }-${index}`
      .replace("Lampuled", "Lampu LED")
      .replace("Exhaustfan", "Exhaust Fan");

    if (actuatorStates[actuatorKey] === level) return;

    updateActuatorState(actuatorKey, level);

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ actuatorType, index, level }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to send command.");
    }
  };

  const actuators = [
    {
      name: "Lampu LED",
      index: 1,
      icon: <FiZap className="text-yellow-400" />,
      levels: ["Off", "Low", "High", "Auto"],
    },
    {
      name: "Lampu LED",
      index: 2,
      icon: <FiZap className="text-yellow-400" />,
      levels: ["Off", "Low", "High", "Auto"],
    },
    {
      name: "Lampu LED",
      index: 3,
      icon: <FiZap className="text-yellow-400" />,
      levels: ["Off", "Low", "High", "Auto"],
    },
    {
      name: "Lampu LED",
      index: 4,
      icon: <FiZap className="text-yellow-400" />,
      levels: ["Off", "Low", "High", "Auto"],
    },
    {
      name: "Exhaust Fan",
      index: 1,
      icon: <FiFilter className="text-green-400" />,
      levels: ["Off", "On", "Auto"],
    },
    {
      name: "Exhaust Fan",
      index: 2,
      icon: <FiFilter className="text-green-400" />,
      levels: ["Off", "On", "Auto"],
    },
    {
      name: "Kipas",
      index: 1,
      icon: <FiWind className="text-blue-400" />,
      levels: ["Off", "On", "Auto"],
    },
    {
      name: "Kipas",
      index: 2,
      icon: <FiWind className="text-blue-400" />,
      levels: ["Off", "On", "Auto"],
    },
  ];

  const filteredActuators = actuators.filter((actuator) => {
    if (filterType === "Semua") return true;
    return actuator.name === filterType;
  });

  const filterOptions = ["Semua", "Lampu LED", "Exhaust Fan", "Kipas"];

  return (
    <div>
      <ToastContainer theme="dark" position="top-right" autoClose={2000} />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-white">System Control</h1>
        <Dropdown
          label="Filter"
          options={filterOptions}
          selectedValue={filterType}
          onSelect={setFilterType}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActuators.map((actuator) => {
          const actuatorKey = `${actuator.name}-${actuator.index}`;
          return (
            <ActuatorCard
              key={actuatorKey}
              name={actuator.name}
              index={actuator.index}
              icon={actuator.icon}
              onCommand={sendActuatorCommand}
              activeLevel={actuatorStates[actuatorKey]}
              levels={actuator.levels}
            />
          );
        })}
      </div>
    </div>
  );
}
