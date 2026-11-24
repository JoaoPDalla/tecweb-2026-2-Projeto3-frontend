import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ProtectedRoute() {
  const { status, erro, restaurar, esquecerSessao } = useAuth()
  const location = useLocation()
  if (status === 'checking') return <main role="status">Verificando sua sessão…</main>
  if (status === 'error') return (
    <main>
      <p role="alert">{erro}</p>
      <button type="button" onClick={restaurar}>Tentar novamente</button>
      <button type="button" onClick={esquecerSessao}>Voltar ao login</button>
    </main>
  )
  if (status !== 'authenticated') return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
