export default function Loading() {
  return (
    <main className="p-8 max-w-xl mx-auto animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded mb-8" />
      <div className="border rounded-xl p-6 flex flex-col gap-4">
        <div className="h-4 w-56 bg-gray-200 rounded" />
        <div className="h-32 w-full bg-gray-100 rounded-lg" />
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>
    </main>
  );
}
