export default function Loading() {
  return (
    <main className="p-8 max-w-2xl mx-auto animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <div className="h-7 w-32 bg-gray-200 rounded" />
      </div>
      <div className="mb-8 pb-8 border-b flex flex-col gap-2">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-40 bg-gray-100 rounded" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
      </div>
      <div className="flex flex-col gap-6">
        <div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
          <div className="h-24 w-full bg-gray-100 rounded-lg" />
        </div>
        <div>
          <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-full bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg" />
      </div>
    </main>
  );
}
