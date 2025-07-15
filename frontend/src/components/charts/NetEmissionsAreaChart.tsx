import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface NetEmissionsAreaChartProps {
  data: Array<{ 
    month: string; 
    emissions: number; 
    offsets: number; 
    net: number; 
  }>;
  className?: string;
}

export const NetEmissionsAreaChart: React.FC<NetEmissionsAreaChartProps> = ({ 
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
              {entry.name}: {(entry.value / 1000).toFixed(3)} tonnes CO₂e
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
        <p className="text-gray-500">No net emissions data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="offsetsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            className="text-sm"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-sm"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)} t`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="5 5" />
          <Area 
            type="monotone" 
            dataKey="emissions" 
            stackId="1" 
            stroke="#EF4444" 
            fill="url(#emissionsGradient)"
            name="Emissions"
          />
          <Area 
            type="monotone" 
            dataKey="offsets" 
            stackId="2" 
            stroke="#10B981" 
            fill="url(#offsetsGradient)"
            name="Offsets"
          />
          <Area 
            type="monotone" 
            dataKey="net" 
            stackId="3" 
            stroke="#3B82F6" 
            fill="url(#netGradient)"
            name="Net Emissions"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
