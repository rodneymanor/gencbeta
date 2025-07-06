export default function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-muted aspect-video animate-pulse rounded-lg" />
      ))}
    </div>
  );
}
