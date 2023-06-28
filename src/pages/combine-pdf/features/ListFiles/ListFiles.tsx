import { useCallback, useEffect, useState } from 'react'
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
import Input from '../../../../components/input'
import {
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
} from '../../../../components/select'
import { useAppDispatch, useAppSelector } from '../../../../main/hooks'

const DEFAULT_FILTER = 'All'

const searchFor = (needle: string, haystack: string) => {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

const ListFiles = () => {
  const pdfFiles = useAppSelector((state) => state.pdfs.pdfs)
  const languages = useAppSelector((state) => state.pdfs.languages)
  const filter = useAppSelector((state) => state.pdfs.filter)
  const searchterm = useAppSelector((state) => state.pdfs.searchterm)
  const status = useAppSelector((state) => state.pdfs.status)
  const dispatch = useAppDispatch()

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

  useEffect(() => {
    setFilteredPDFs(pdfFiles)
    if (pdfFiles.length === 0) {
      dispatch(fetchPDFs())
    }
  }, [dispatch, pdfFiles])

  useEffect(() => {
    filterSearch()
  }, [filterSearch])

  const onSelected = (pdf: PDF) => {
    dispatch(selectPDF(pdf))
  }

  const onRemoved = (toBeRemovedPDF: PDF) => {
    dispatch(unSelectPDF(toBeRemovedPDF))
  }

  if (status === 'loading') return <Skeleton />
  return (
    <>
      <form className="flex flex-col md:flex-row justify-between items-end mb-3 gap-6 py-6">
        <Input
          // label="Search PDFs"
          type="text"
          placeholder="Enter Search Keyword"
          value={searchterm}
          onChange={(e) => {
            dispatch(setSearchTerm(e.target.value))
          }}
        />

        <Select
          value={filter}
          onChange={(value) => {
            const filter = value as string
            dispatch(setFilter(filter))
          }}
        >
          <SelectTrigger>
            Language: <span className="font-bold">{filter}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectOption value={DEFAULT_FILTER}>All</SelectOption>
            {languages.map((language) => (
              <SelectOption key={language} value={language}>
                {language}
              </SelectOption>
            ))}
          </SelectContent>
        </Select>
      </form>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 m gap-6 pb-10">
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
