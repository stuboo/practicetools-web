import { ReactNode, createContext } from 'react'
import { CombinePDFState } from './types'

const initialState: CombinePDFState = {
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

export const CombinePDFContext = createContext<CombinePDFState>(initialState)

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
