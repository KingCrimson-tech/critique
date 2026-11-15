// Loading skeleton for a report — hairline blocks, never shimmer.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6" aria-busy="true" aria-label="Loading report">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="h-24 w-32 animate-pulse bg-hairline" />
          <div className="mt-4 h-3 w-64 bg-hairline" />
          <div className="mt-2 h-3 w-40 bg-hairline" />
        </div>
        <div className="h-8 w-28 bg-hairline" />
      </div>
      <div className="mt-8 h-px bg-hairline" />
      <div className="mt-6 flex flex-col gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-baseline gap-4">
            <div className="h-3 w-8 bg-hairline" />
            <div className="h-3 w-28 bg-hairline" />
            <div className="h-3 w-1/2 bg-hairline" />
          </div>
        ))}
      </div>
    </div>
  );
}
