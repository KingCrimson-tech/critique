// Hairline skeleton for the sites dashboard.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading sites">
      <div className="h-10 w-48 bg-hairline" />
      <div className="mt-2 h-3 w-56 bg-hairline" />
      <ul className="mt-8">
        {[...Array(3)].map((_, i) => (
          <li key={i} className="flex items-center justify-between border-t border-hairline py-5 last:border-b">
            <div className="flex items-center gap-6">
              <div className="h-8 w-14 bg-hairline" />
              <div>
                <div className="h-3 w-40 bg-hairline" />
                <div className="mt-2 h-3 w-24 bg-hairline" />
              </div>
            </div>
            <div className="h-8 w-20 bg-hairline" />
          </li>
        ))}
      </ul>
    </div>
  );
}
