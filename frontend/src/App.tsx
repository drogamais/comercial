import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import { AppLayout } from './components/layout/AppLayout.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { CampanhaListPage } from './pages/campanha/CampanhaListPage.tsx'
import { CampanhaUploadPage } from './pages/campanha/CampanhaUploadPage.tsx'
import { ProdutosPage } from './pages/campanhaProduto/ProdutosPage.tsx'
import { ParceiroListPage } from './pages/parceiro/ParceiroListPage.tsx'
import { MetaPage } from './pages/meta/MetaPage.tsx'

function ProtectedRoutes() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center h-screen text-gray-500">A carregar...</div>
  if (!user) return <Navigate to="/login" replace />
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="campanhas" element={<CampanhaListPage />} />
        <Route path="campanhas/:id/upload" element={<CampanhaUploadPage />} />
        <Route path="campanhas/:id/produtos" element={<ProdutosPage />} />
        <Route path="parceiros" element={<ParceiroListPage />} />
        <Route path="metas" element={<MetaPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<div className="flex items-center justify-center h-screen text-gray-500">Autenticação em curso...</div>} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
