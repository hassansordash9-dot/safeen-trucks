export default function TrucksLoading() {
  return (
    <div className="container-page py-6">
      <div className="h-8 w-40 animate-pulse rounded bg-[var(--color-surface)]" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="card h-64 animate-pulse bg-[var(--color-surface)]" />
        ))}
      </div>
    </div>
  );
}
