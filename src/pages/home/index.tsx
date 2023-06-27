import Card from '../../components/card'
import { AiOutlineFilePdf, AiOutlineSearch } from 'react-icons/ai'

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-10">
      <h1 className="text-4xl font-bold">Office Tools</h1>
      <div className="grid grid-cols-4 gap-10 px-10 py-10 w-full">
        <Card
          title="Combine PDF"
          description={
            'Merge multiple PDF documents into a single file effortlessly'
          }
          icon={<AiOutlineFilePdf size={58} />}
          href="/combine-pdfs"
        />
        <Card
          title="Search Therapists"
          description={
            'Merge multiple PDF documents into a single file effortlessly'
          }
          icon={<AiOutlineSearch size={58} />}
          href="/search-therapists"
        />
      </div>
    </div>
  )
}
