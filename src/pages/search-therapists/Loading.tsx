export default function Loading() {
  return (
    <div role="status" className="animate-pulse flex gap-3.5 px-4 lg:px-5 py-3.5 border-b border-[#eef2f6]">
      <div className="shrink-0 w-[26px] h-[26px] mt-0.5 rounded-md bg-gray-200"></div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2.5 mb-2">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-100 rounded w-24 ml-auto"></div>
        </div>
        <div className="h-3 bg-gray-100 rounded max-w-[320px] mb-1.5"></div>
        <div className="h-3 bg-gray-100 rounded max-w-[240px]"></div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
