import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './layout'
import Home from './pages/home'
import NotFound from './pages/not-found'
import { QueryClient, QueryClientProvider } from 'react-query'
import PhysicalTherapistLists from './pages/physical-therapists'
import AdminShell from './admin-shell'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
          </Route>
          {/* Route for physical therapists */}
          <Route path="/physical-therapists" element={<AdminShell />}>
            <Route index element={<PhysicalTherapistLists />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
