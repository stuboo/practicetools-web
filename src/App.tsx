import { BrowserRouter, Route, Routes } from "react-router-dom"
import Layout from "./layout"
import Home from "./pages/home"
import NotFound from "./pages/not-found"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
