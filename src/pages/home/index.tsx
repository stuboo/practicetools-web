export default function Home() {
  return (
    <div>
      <div className="h-36 flex justify-center items-center bg-gray-100">
        <input
          type="text"
          placeholder="Enter Zip"
          className="px-8 py-4 text-gray-900 text-2xl font-bold outline-4 transition-[outline] duration-200 outline-gray-600/20 focus:outline focus:rounded-md "
        />
      </div>
    </div>
  )
}
