import { useCallback, useState } from 'react'
import {
  clearSelection,
  combinePDFs,
  reorderSelection,
} from '../ListFiles/pdfsSlice'
import PDFFileItem from './PDFFileItem'
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard'
import { useAppDispatch, useAppSelector } from '../../../../main/hooks'
import { PDF } from '../../types'
import { toast } from 'react-hot-toast'
import Button from '../../../../components/button'
import { MdOutlineDownload } from 'react-icons/md'

const PDFSelections = () => {
  const [showSelectedPDFs, setShowSelectedPDFs] = useState<boolean>(false)
  const pdfFiles = useAppSelector((state) => state.pdfs.selectedPdfs)
  const status = useAppSelector((state) => state.pdfs.combinePDFStatus)
  // const readyToDownloadFile = useAppSelector((state) => state.pdfs.combinedPDF);
  const dispatch = useAppDispatch()

  const [_, copyTextToClipboard] = useCopyToClipboard()

  const combineFiles = () => {
    dispatch(combinePDFs(pdfFiles))
      .unwrap()
      .then(() => {
        // extract the filenames
        let textToBeCopied = ``
        pdfFiles.forEach((pdfFile, index) => {
          textToBeCopied += `${pdfFile.description}\n`
        })

        copyTextToClipboard(textToBeCopied).then(() => {
          toast('Combined file names copied to clipboard!')
        })
      })
  }

  const clearSelectionList = () => {
    dispatch(clearSelection())
  }

  const movePDF = useCallback((sourcePDF: PDF, targetPDF: PDF) => {
    dispatch(reorderSelection({ sourcePDF, targetPDF }))
  }, [])

  return (
    <div className="fixed  flex flex-col items-end bottom-4 right-4">
      {showSelectedPDFs && (
        <div className="transition ease-in duration-1000 shadow-lg rounded-xl w-96 max-h-fit p-4 bg-white dark:bg-gray-800 relative">
          <div className="w-full flex items-center justify-between mb-6">
            <button className="flex items-center hover:text-black dark:text-gray-50 dark:hover:text-white text-gray-800 border-0 focus:outline-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </button>

            <p className="text-gray-800 dark:text-white text-xl font-medium">
              Selected PDF's
            </p>

            {pdfFiles.length > 0 && (
              <Button
                onClick={clearSelectionList}
                title="Clear"
                colorScheme="red"
                type="button"
              />
            )}
          </div>

          {(!pdfFiles || pdfFiles.length < 1) && (
            <p className="text-gray-400 mb-3">No File Selected!</p>
          )}

          <div className={`transition overflow-y-auto max-h-96`}>
            {pdfFiles.map((pdf) => (
              <PDFFileItem key={pdf.filename} movePDF={movePDF} pdf={pdf} />
            ))}
          </div>

          <Button
            disabled={pdfFiles.length < 1}
            onClick={combineFiles}
            type="button"
            title="Combine Files"
            className="w-full"
            colorScheme="green"
            iconLeft={<MdOutlineDownload />}
            isLoading={status === 'loading'}
          />
        </div>
      )}

      <button
        onClick={() => setShowSelectedPDFs(!showSelectedPDFs)}
        className="mt-2 flex relative items-center p-4  transition ease-in duration-200 uppercase rounded-full hover:bg-gray-800 hover:text-white border-2 border-gray-900 focus:outline-none w-fit"
      >
        {!showSelectedPDFs ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
        {pdfFiles.length > 0 && (
          <span className="absolute -top-2 -right-2 w-8 h-8 text-base  rounded-full text-white bg-red-500 p-1">
            {pdfFiles.length}
          </span>
        )}
      </button>
    </div>
  )
}

export default PDFSelections
