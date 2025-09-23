import { FiTrendingUp, FiTrendingDown, FiBarChart2, FiAlertTriangle } from 'react-icons/fi';

const iconMap = {
  'Max Value': <FiTrendingUp className="h-6 w-6 text-green-400" />,
  'Min Value': <FiTrendingDown className="h-6 w-6 text-red-400" />,
  'Average': <FiBarChart2 className="h-6 w-6 text-blue-400" />,
  'Exceed Count': <FiAlertTriangle className="h-6 w-6 text-yellow-400" />,
};

export default function StatCard({ title, value, unit = '' }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-4">
      <div className="bg-gray-700 p-3 rounded-lg">
        {iconMap[title] || <FiBarChart2 className="h-6 w-6 text-blue-400" />}
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-semibold text-white">{value} {unit}</p>
      </div>
    </div>
  );
}