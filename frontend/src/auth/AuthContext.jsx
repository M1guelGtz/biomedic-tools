// Contexto de autenticación: mantiene el usuario en sesión y expone login/logout.
// El token se guarda en localStorage (ver tokenStore en api/client.js).

import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../api/client.js';
import { authApi } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al cargar la app, si hay token, recuperar el perfil.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setCargando(false);
      return;
    }
    authApi
      .me()
      .then(setUsuario)
      .catch(() => tokenStore.clear())
      .finally(() => setCargando(false));
  }, []);

  async function login(email, password) {
    const { token, usuario: u } = await authApi.login(email, password);
    tokenStore.set(token);
    api.defaults.headers.Authorization = `Bearer ${token}`;
    setUsuario(u);
    return u;
  }

  function logout() {
    tokenStore.clear();
    setUsuario(null);
    window.location.href = '/login';
  }

  const value = {
    usuario,
    cargando,
    login,
    logout,
    estaAutenticado: !!usuario,
    esAdmin: usuario?.rol === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
