import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth(opcional = false) {
  const contexto = useContext(AuthContext)
  if (!contexto && !opcional) throw new Error('Esta tela precisa de AuthProvider.')
  return contexto
}
