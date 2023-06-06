import PhysicalTherapyCard from './PhysicalTherapyCard'

export default function Home() {
  return (
    <div className="h-full flex flex-col bg-red">
      <div className="h-36 flex justify-center items-center bg-gray-100">
        <input
          type="text"
          placeholder="Enter Zip"
          className="px-8 py-4 text-gray-900 text-2xl font-bold outline-4 transition-[outline] duration-200 outline-gray-600/20 focus:outline focus:rounded-md "
        />
      </div>

      {/* <div className="px-10 py-12 grid grid-cols-2 gap-4">
        <PhysicalTherapyCard />
        <PhysicalTherapyCard />
        <PhysicalTherapyCard />
        <PhysicalTherapyCard />
      </div> */}

      <div className="flex justify-center items-center h-80">
        <p className="text-2xl">Not Found!</p>
      </div>
    </div>
  )
}
