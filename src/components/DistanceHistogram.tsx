import { useMemo } from "react";

interface DistanceHistogramProps {
  distances: number[];
  minDistance: number;
  maxDistance: number;
}

export function DistanceHistogram({
  distances,
  minDistance,
  maxDistance,
}: DistanceHistogramProps) {
  const buckets = useMemo(() => {
    const bucketCount = 25;
    const bucketSize = (maxDistance - minDistance) / bucketCount;
    const bucketArray = new Array(bucketCount).fill(0);

    distances.forEach((distance) => {
      const bucketIndex = Math.min(
        Math.floor((distance - minDistance) / bucketSize),
        bucketCount - 1
      );
      if (bucketIndex >= 0) {
        bucketArray[bucketIndex]++;
      }
    });

    return bucketArray;
  }, [distances, minDistance, maxDistance]);

  const maxCount = Math.max(...buckets, 1);

  return (
    <div className="w-full h-16 flex items-end gap-[1px] px-2 mb-2">
      {buckets.map((count, index) => {
        const heightPercent = (count / maxCount) * 100;
        // Ensure minimum visibility for non-zero buckets
        const minHeight = count > 0 ? Math.max(heightPercent, 8) : 0;
        return (
          <div
            key={index}
            className="flex-1 bg-primary/20 rounded-t-sm transition-all"
            style={{ height: `${minHeight}%` }}
          />
        );
      })}
    </div>
  );
}
