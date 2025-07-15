import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CarbonCreditsBarChartProps {
  data: Array<{ 
    name: string; 
    purchased: number; 
    retired: number; 
    available: number; 
  }>;
  className?: string;
}

export const CarbonCreditsBarChart: React.FC<CarbonCreditsBarChartProps> = ({ 
  data, 
  className = '' 
}) => {
  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ value: number; name: string; color: string }>; 
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} credits
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">No carbon credits data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name" 
            className="text-sm"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-sm"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
          <Bar dataKey="purchased" fill="#3B82F6" name="Purchased" />
          <Bar dataKey="retired" fill="#10B981" name="Retired" />
          <Bar dataKey="available" fill="#F59E0B" name="Available" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
