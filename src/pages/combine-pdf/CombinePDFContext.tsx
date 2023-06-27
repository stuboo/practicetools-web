import { ReactNode, createContext } from 'react'
import { PDFState } from './types'

const initialState: PDFState = {
  pdfs: [],
  selectedPdfs: [],
  languages: [],
  filter: 'English',
  searchterm: '',
  status: 'idle',
  error: null,
  combinePDFStatus: 'idle',
  combinedPDF: null,
}

export const CombinePDFContext = createContext<PDFState>(initialState)

interface CombinePDFContextProps {
  children: ReactNode
}

export const CombinePDFContextProvider = ({
  children,
}: CombinePDFContextProps) => (
  <CombinePDFContext.Provider value={initialState}>
    {children}
  </CombinePDFContext.Provider>
)
