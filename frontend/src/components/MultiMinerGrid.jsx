import React from 'react';
import MinerCard from './MinerCard';

export default function MultiMinerGrid({ miners }) {
  return (
    <div className="miner-grid">
      {miners.map(miner => (
        <MinerCard key={miner.Serial || miner.ID} miner={miner} />
      ))}
    </div>
  );
}
