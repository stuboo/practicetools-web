import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import Button from '../../components/button'
import Container from '../../components/container'
import ListFiles from './modules/ListFiles'
import { DndProvider } from 'react-dnd'
import PDFSelections from './modules/PDFCombine'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Link } from 'react-router-dom'

export default function CombinePDF() {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <Container className="h-full" bgColor="bg-gray-50">
      <div className="h-full mx-auto md:container">
        <div className="flex items-center justify-between mt-6">
          {/* Header/Breadcrumb */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Link to={'/'}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 lg:w-6 lg:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75"
                />
              </svg>
            </Link>

            <h1 className="font-light text-md lg:text-2xl">
              Patient Educational Materials
            </h1>
          </div>
          <Button size="sm" title="About" onClick={() => setIsOpen(true)} />
        </div>

        <ListFiles />

        <DndProvider backend={HTML5Backend}>
          <PDFSelections />
        </DndProvider>
      </div>

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
          <Dialog.Panel className="max-w-3xl px-6 py-6 mx-auto bg-white rounded">
            <Dialog.Description className="mt-2 mb-6 transition">
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
              className="inline-flex justify-center w-full px-3 py-2 mt-3 text-sm font-semibold text-gray-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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
