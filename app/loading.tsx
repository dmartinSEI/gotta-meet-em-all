export default function Loading() {
  return (
    <main className="p-8 max-w-6xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-52 bg-gray-200 rounded" />
        <div className="h-4 w-28 bg-gray-200 rounded" />
      </div>
      <div className="mb-8">
        <div className="h-3 w-36 bg-gray-200 rounded mb-2" />
        <div className="w-full bg-gray-100 rounded-full h-2" />
      </div>
      <div className="flex gap-3 mb-6">
        <div className="h-10 flex-1 bg-gray-100 rounded-lg" />
        <div className="h-10 w-36 bg-gray-100 rounded-lg" />
        <div className="h-10 w-40 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-4 bg-white shadow-sm flex flex-col gap-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
            <div className="h-3 w-1/3 bg-gray-100 rounded" />
            <div className="h-8 w-full bg-gray-100 rounded-lg mt-3" />
          </div>
        ))}
      </div>
    </main>
  );
}
