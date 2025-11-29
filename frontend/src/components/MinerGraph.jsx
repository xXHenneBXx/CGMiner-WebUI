import React, { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale } from 'chart.js';
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

export default function MinerGraph({ miner }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Hashrate (GH/s)',
          data: [],
          borderColor: 'green',
          tension: 0.3,
        }],
      },
      options: { responsive: true, plugins: { legend: { display: true } } },
    });

    const ws = new WebSocket('ws://localhost:8080/ws/logs');
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.stats && msg.stats.STATS) {
        const s = msg.stats.STATS.find(s => s.Serial === miner.Serial);
        if (s) {
          chart.data.labels.push(new Date().toLocaleTimeString());
          chart.data.datasets[0].data.push(s.GHGHs);
          if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
          }
          chart.update();
        }
      }
    };

    return () => ws.close();
  }, [miner.Serial]);

  return <canvas ref={canvasRef}></canvas>;
}
