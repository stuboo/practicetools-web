import { useCallback, useEffect, useState } from 'react'
import BookCard from '@/components/combine-pdf/BookCard'
import {
  fetchPDFs,
  selectPDF,
  setFilter,
  setSearchTerm,
  unSelectPDF,
} from './pdfsSlice'
import Skeleton from '@/components/combine-pdf/Skeleton'
import { PDF } from '../../types'
import Input from '@/components/input'
import {
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
} from '@/components/select'
import { useAppDispatch, useAppSelector } from '@/libs/store'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

const DEFAULT_FILTER = 'All'

const searchFor = (needle: string, haystack: string) => {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

const ListFiles = () => {
  const [showQRCode, setShowQRCode] = useState(false)
  const pdfFiles = useAppSelector((state) => state.pdfs.pdfs)
  const languages = useAppSelector((state) => state.pdfs.languages)
  const filter = useAppSelector((state) => state.pdfs.filter)
  const searchterm = useAppSelector((state) => state.pdfs.searchterm)
  const status = useAppSelector((state) => state.pdfs.status)
  const dispatch = useAppDispatch()
  const [copiedText, copy] = useCopyToClipboard()
  const [copying, setCopying] = useState(false)

  const [filteredPDFs, setFilteredPDFs] = useState<PDF[]>([])
  const [selectedPDF, setSelectedPDF] = useState<PDF>()

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

  const handleShowQRCode = (pdf: PDF) => {
    setSelectedPDF(pdf)

    setShowQRCode(true)
  }

  const copyQRCodeToClipboard = async () => {
    if (!selectedPDF) {
      return toast.error('Failed to copy QR code. Please try again.')
    }

    try {
      setCopying(true)
      const response = await fetch(selectedPDF.short_url_qr)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ])
      toast('The QR code has been copied to your clipboard.')
    } catch (err) {
      console.error('Failed to copy QR code:', err)
      toast.error('Failed to copy QR code. Please try again.')
    } finally {
      setCopying(false)
    }
  }

  if (status === 'loading') return <Skeleton />
  return (
    <>
      <form className="flex flex-col items-end justify-between gap-3 py-6 mb-3 md:flex-row lg:gap-6">
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

      <div className="grid gap-6 pb-10 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 m">
        {filteredPDFs.map((pdf: PDF) => (
          <BookCard
            key={pdf.filename}
            pdf={pdf}
            onBookSelected={onSelected}
            onBookRemoved={onRemoved}
            onShowQRCode={handleShowQRCode}
          />
        ))}
      </div>

      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent className="flex flex-col items-center justify-center">
          <img
            src={selectedPDF?.short_url_qr}
            alt={`QR Code for ${selectedPDF?.title}`}
            width={300}
            height={300}
            className="cursor-pointer"
            onClick={copyQRCodeToClipboard}
          />
          <Button disabled={copying}>Copy</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ListFiles
