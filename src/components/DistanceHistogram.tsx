import { useMemo } from "react";

interface DistanceHistogramProps {
  distances: number[];
  minDistance: number;
  maxDistance: number;
  globalMax: number;
  metric?: "distance" | "time";
}

export function DistanceHistogram({
  distances,
  minDistance,
  maxDistance,
  globalMax,
  metric = "distance",
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

  const barColor = metric === "time" 
    ? "bg-purple/20 dark:bg-purple/20" 
    : "bg-primary/20";

  return (
    <div className="w-full h-16 flex items-end gap-[1px] px-2 mb-2">
      {buckets.map((count, index) => {
        // Use globalMax for absolute scaling instead of local max
        const heightPercent = (count / globalMax) * 100;
        // Ensure minimum visibility for non-zero buckets
        const minHeight = count > 0 ? Math.max(heightPercent, 8) : 0;
        return (
          <div
            key={index}
            className={`flex-1 ${barColor} rounded-t-sm transition-all`}
            style={{ height: `${minHeight}%` }}
          />
        );
      })}
    </div>
  );
}
