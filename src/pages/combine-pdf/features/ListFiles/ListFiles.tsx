import { useCallback, useContext, useEffect, useState } from 'react'
import BookCard from '../../components/BookCard'
import {
  fetchPDFs,
  selectPDF,
  setFilter,
  setSearchTerm,
  unSelectPDF,
} from './pdfsSlice'
import Skeleton from '../../components/Skeleton'
import { PDF } from '../../types'
import { CombinePDFContext } from '../../CombinePDFContext'
import Input from '../../../../components/input'
import {
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
} from '../../../../components/select'

const DEFAULT_FILTER = 'any'

const searchFor = (needle: string, haystack: string) => {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

const ListFiles = () => {
  const {
    pdfs: pdfFiles,
    languages,
    filter,
    searchterm,
    status,
  } = useContext(CombinePDFContext)

  const [filteredPDFs, setFilteredPDFs] = useState<PDF[]>([])

  const filterSearch = useCallback(() => {
    let _filtered

    // Filter
    if (filter === DEFAULT_FILTER) _filtered = pdfFiles
    else _filtered = pdfFiles.filter((pdf) => pdf.language === filter)

    // Search
    if (searchterm) {
      // _filtered = _filtered.filter((pdf) => pdf.title.toLowerCase().includes(searchterm.toLowerCase()))
      _filtered = _filtered.filter((pdf) => {
        return searchterm.split(' ').every((q) => {
          return (
            searchFor(q, pdf.title) ||
            pdf.category.map((c) => c.toLowerCase()).includes(q.toLowerCase())
          )
        })
      })
    }

    setFilteredPDFs(_filtered)
  }, [filter, pdfFiles, searchterm])

  // useEffect(() => {
  //   setFilteredPDFs(pdfFiles)
  //   if (pdfFiles.length === 0) {
  //     dispatch(fetchPDFs())
  //   }
  // }, [dispatch, pdfFiles])

  useEffect(() => {
    filterSearch()
  }, [filterSearch])

  const onSelected = (pdf: PDF) => {
    // dispatch(selectPDF(pdf))
  }

  const onRemoved = (toBeRemovedPDF: PDF) => {
    // dispatch(unSelectPDF(toBeRemovedPDF))
  }

  if (status === 'loading') return <Skeleton />
  return (
    <>
      <form className="flex flex-col md:flex-row justify-between items-end mb-3 gap-6">
        <Input
          // label="Search PDFs"
          type="text"
          placeholder="Enter Search Keyword"
          value={searchterm}
          onChange={(e) => {
            // dispatch(setSearchTerm(e.target.value))
          }}
        />

        <Select value={filter} onChange={() => console.log('E choke')}>
          <SelectTrigger>
            Language: <span className="font-bold">{filter}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectOption value={'yoruba'}>Yoruba</SelectOption>
            <SelectOption value={'English'}>English</SelectOption>
          </SelectContent>
        </Select>
      </form>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 m gap-5">
        {filteredPDFs.map((pdf: PDF) => (
          <BookCard
            key={pdf.filename}
            pdf={pdf}
            onBookSelected={onSelected}
            onBookRemoved={onRemoved}
          />
        ))}
      </div>
    </>
  )
}

export default ListFiles
