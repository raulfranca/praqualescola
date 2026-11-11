import { useMemo } from "react";

interface DistanceHistogramProps {
  distances: number[];
  minDistance: number;
  maxDistance: number;
  globalMax: number;
  /** Limite escolhido no controle deslizante: barras até ele ficam cheias, as de fora, claras. */
  selected: number;
}

export function DistanceHistogram({ distances, minDistance, maxDistance, globalMax, selected }: DistanceHistogramProps) {
  const bucketCount = 25;
  const bucketSize = (maxDistance - minDistance) / bucketCount;

  const buckets = useMemo(() => {
    const bucketArray = new Array(bucketCount).fill(0);

    distances.forEach((distance) => {
      const bucketIndex = Math.min(Math.floor((distance - minDistance) / bucketSize), bucketCount - 1);
      if (bucketIndex >= 0) {
        bucketArray[bucketIndex]++;
      }
    });

    return bucketArray;
  }, [distances, minDistance, bucketSize]);

  return (
    <div className="w-full h-11 flex items-end gap-[3px] mb-3" aria-hidden="true">
      {buckets.map((count, index) => {
        // Use globalMax for absolute scaling instead of local max
        const heightPercent = (count / globalMax) * 100;
        // Ensure minimum visibility for non-zero buckets
        const minHeight = count > 0 ? Math.max(heightPercent, 8) : 0;
        const dentro = minDistance + (index + 0.5) * bucketSize <= selected;
        return (
          <div
            key={index}
            data-dentro={dentro}
            className={`flex-1 rounded-t-sm transition-colors ${dentro ? "bg-primary" : "bg-primary/20"}`}
            style={{ height: `${minHeight}%` }}
          />
        );
      })}
    </div>
  );
}
