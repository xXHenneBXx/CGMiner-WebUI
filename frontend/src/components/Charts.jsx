import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Charts({ stats }) {
  const chartData = [];

  Object.entries(stats).forEach(([ip, miners]) => {
    miners.forEach((miner) => {
      chartData.push({
        name: `Miner ${miner.ASC}`,
        hashrate: miner['MHS av'] || 0,
        accepted: miner.Accepted || 0
      });
    });
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="hashrate" stroke="#8884d8" />
        <Line type="monotone" dataKey="accepted" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}
