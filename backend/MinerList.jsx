import React from "react";
import MinerCard from "./MinerCard";

/**
 * data = { host1: { perAsic: [...] }, host2: {...} }
 */
export default function MinerList({ data }) {
  return (
    <div className="grid-list">
      {Object.entries(data).map(([host, stats]) => {
        if (host === "__error") return null;
        const asics = stats.perAsic || [];
        return asics.map((asic, i) => (
          <MinerCard key={host + "-" + (asic.id ?? i)} host={host} asic={asic} index={i} />
        ));
      })}
    </div>
  );
}
