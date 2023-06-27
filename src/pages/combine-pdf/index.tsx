import { DndProvider } from 'react-dnd'
import Navigation from './components/Navigation'
import ListFiles from './features/ListFiles'
import PDFSelections from './features/PDFCombine'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { CombinePDFContextProvider } from './CombinePDFContext'

export default function CombinePDF() {
  return (
    <div className="p-4 bg-gray-100">
      <CombinePDFContextProvider>
        <Navigation />
        <div className="md:container mx-auto p-4">
          <ListFiles />

          <DndProvider backend={HTML5Backend}>
            <PDFSelections />
          </DndProvider>
        </div>
      </CombinePDFContextProvider>
    </div>
  )
}
