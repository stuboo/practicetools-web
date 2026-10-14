import { lazy, Suspense } from 'react'
import NotFound from '../pages/not-found'
import { AuthProvider } from '../context/AuthContext'
import { ProtectedRoute } from '../components/common/ProtectedRoute'
import { isPrevisitEnabled } from './flags'

// Lazy so the patient app and crypto code stay out of the main bundle.
const PacketPage = lazy(() => import('./patient/PacketPage'))
const ClinicViewerPage = lazy(() => import('./clinic/ClinicViewerPage'))
const ClinicSetupPage = lazy(() => import('./clinic/ClinicSetupPage'))

type Props = { page: 'packet' | 'clinic' | 'clinic-setup' }

// Gate for every pre-visit route (spec M6): the feature flag is checked at
// render so a build without VITE_PREVISIT_ENABLED="true" shows NotFound.
export function PrevisitRoute({ page }: Props) {
  if (!isPrevisitEnabled()) return <NotFound />

  if (page === 'packet') {
    return (
      <Suspense fallback={null}>
        <PacketPage />
      </Suspense>
    )
  }

  const Page = page === 'clinic' ? ClinicViewerPage : ClinicSetupPage
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Suspense fallback={null}>
          <Page />
        </Suspense>
      </ProtectedRoute>
    </AuthProvider>
  )
}
