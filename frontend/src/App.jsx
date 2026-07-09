import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import EquiposPage from './pages/EquiposPage.jsx';
import EquipoDetailPage from './pages/EquipoDetailPage.jsx';
import AsistentePage from './pages/AsistentePage.jsx';
import DocumentosListadoPage from './pages/DocumentosListadoPage.jsx';
import AcercaPage from './pages/AcercaPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';
import AreasPage from './pages/AreasPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="equipos" element={<EquiposPage />} />
            <Route path="equipos/:id" element={<EquipoDetailPage />} />
            <Route
              path="manuales"
              element={
                <DocumentosListadoPage
                  titulo="Manuales y datasheets"
                  descripcion="Documentación técnica de todos los equipos. Haz clic en un equipo para ver su detalle."
                  tipos={['manual', 'datasheet']}
                />
              }
            />
            <Route
              path="normativas"
              element={
                <DocumentosListadoPage
                  titulo="Normativas"
                  descripcion="Normativas, estándares y regulaciones cargadas en la plataforma."
                  tipos={['normativa']}
                />
              }
            />
            <Route path="asistente" element={<AsistentePage />} />
            <Route path="acerca" element={<AcercaPage />} />
            <Route
              path="areas"
              element={
                <ProtectedRoute soloAdmin>
                  <AreasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="usuarios"
              element={
                <ProtectedRoute soloAdmin>
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
