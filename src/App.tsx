import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './layout'
import Home from './pages/home'
import NotFound from './pages/not-found'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       refetchOnWindowFocus: false,
//       refetchOnMount: false,
//       refetchOnReconnect: false,
//       retry: 3,
//       staleTime: 5 * 60 * 1000,
//       refetchInterval: 3 * 60 * 1000,
//     },
//   },
// });
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
