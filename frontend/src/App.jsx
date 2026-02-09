import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EvidenceListPage from './pages/EvidenceListPage'
import EvidenceDetailPage from './pages/EvidenceDetailPage'
import UploadEvidencePage from './pages/UploadEvidencePage'
import CasesPage from './pages/CasesPage'
import CaseDetailPage from './pages/CaseDetailPage'
import TransfersPage from './pages/TransfersPage'
import AuditLogPage from './pages/AuditLogPage'
import RetentionPage from './pages/RetentionPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/evidence" element={<EvidenceListPage />} />
              <Route path="/evidence/upload" element={<UploadEvidencePage />} />
              <Route path="/evidence/:id" element={<EvidenceDetailPage />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/:id" element={<CaseDetailPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/audit" element={<AuditLogPage />} />
              <Route path="/retention" element={<RetentionPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
