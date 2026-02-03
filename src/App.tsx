import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './layout'
import Home from './pages/home'
import NotFound from './pages/not-found'
import PhysicalTherapistLists from './pages/admin/physical-therapists'
import AdminShell from './admin-shell'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import SearchTherapists from './pages/search-therapists'
import CombinePDF from './pages/combine-pdf'
import { Provider } from 'react-redux'
import { store } from './libs/store'
import ConsentFormGenerator from './pages/consent-form-generator'
import Quid6 from './pages/quid6'
import Scheduling from './pages/scheduling'
import AuditLookup from './pages/scheduling/audit'
import {
  CoverageLayout,
  CoveragePublicLayout,
  LoginPage,
  SearchPage,
  DocumentsPage,
  UploadPage,
} from './pages/coverage'

const queryClient = new QueryClient()

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="search-therapists" element={<SearchTherapists />} />
              <Route path="combine-pdfs" element={<CombinePDF />} />
              <Route
                path="consent-form-generator"
                element={<ConsentFormGenerator />}
              />
              <Route path="quid6" element={<Quid6 />} />
              <Route path="scheduling" element={<Scheduling />} />
              <Route path="scheduling/audit" element={<AuditLookup />} />
            </Route>

            {/* Administration/Backend Routes */}
            <Route path="/physical-therapists" element={<AdminShell />}>
              <Route index element={<PhysicalTherapistLists />} />
            </Route>

            {/* Coverage Routes */}
            <Route path="/login" element={<CoveragePublicLayout />}>
              <Route index element={<LoginPage />} />
            </Route>
            <Route path="/coverage" element={<CoverageLayout />}>
              <Route index element={<SearchPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="upload" element={<UploadPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </Provider>
  )
}

export default App
