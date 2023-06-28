import { CombinePDFContextProvider } from './CombinePDFContext'
import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import Button from '../../components/button'
import Container from '../../components/container'
import ListFiles from './features/ListFiles'

export default function CombinePDF() {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <Container className="">
      <CombinePDFContextProvider>
        <Button title="About" onClick={() => setIsOpen(true)} />
        <div className="md:container mx-auto">
          <ListFiles />

          {/* <DndProvider backend={HTML5Backend}>
            <PDFSelections />
          </DndProvider> */}
        </div>
      </CombinePDFContextProvider>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <div
          className="fixed inset-0 bg-black/80"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />

        {/* Full-screen container to center the panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl rounded bg-white px-6 py-6">
            <Dialog.Description className="transition mt-2 mb-6">
              <p className="pb-4">
                This app was created to help make it easier for you to share
                patient education materials with your patients. With this app,
                you can select from a list of PDF files and combine them into a
                single PDF for downloading and printing.
              </p>

              <p className="pb-4">
                Using the app is simple: just choose the PDF files you want to
                combine by clicking on them, and then click the "Combine Files"
                button. The app will then create a single PDF file containing
                all of the selected documents, which you can download and print
                for your patients.
              </p>

              <p className="pb-4">
                We hope that this app helps you streamline your practice and
                provide better care for your patients. We welcome any feedback.
              </p>
            </Dialog.Description>

            <button
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={() => setIsOpen(false)}
            >
              Ok
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Container>
  )
}
