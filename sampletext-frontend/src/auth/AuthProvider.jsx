import { useCallback, useEffect, useRef, useState } from 'react'
import { login, request } from '../services/api.js'
import { EVENTO_SESSAO_EXPIRADA, eventoDeSessao, lerSessao, limparSessao, salvarSessao } from '../services/auth.js'
import { AuthContext } from './AuthContext'

const anonimo = { status: 'anonymous', usuario: null, erro: null }

export default function AuthProvider({ children }) {
  const [estado, setEstado] = useState({ status: 'checking', usuario: null, erro: null })
  const revisao = useRef(0)
  const pendente = useRef(null)

  const cancelarPendente = useCallback(() => {
    revisao.current++
    pendente.current?.abort()
  }, [])

  const esquecerSessao = useCallback(() => {
    revisao.current++
    pendente.current?.abort()
    limparSessao()
    setEstado(anonimo)
  }, [])

  const restaurar = useCallback(async () => {
    const versao = ++revisao.current
    pendente.current?.abort()
    const sessao = lerSessao()
    if (!sessao) { setEstado(anonimo); return }
    const controlador = new AbortController()
    pendente.current = controlador
    setEstado({ status: 'checking', usuario: null, erro: null })
    try {
      const usuario = await request('/auth/me/', { token: sessao.token, signal: controlador.signal })
      if (revisao.current !== versao || controlador.signal.aborted) return
      salvarSessao({ token: sessao.token, usuario })
      setEstado({ status: 'authenticated', usuario, erro: null })
    } catch (erro) {
      if (revisao.current !== versao || controlador.signal.aborted) return
      if (erro.status === 401) esquecerSessao()
      else setEstado({ status: 'error', usuario: null, erro: erro.message })
    }
  }, [esquecerSessao])

  useEffect(() => {
    let ativo = true
    // A verificação consulta o servidor; no StrictMode, ignora a montagem descartada.
    queueMicrotask(() => { if (ativo) restaurar() })
    const mudou = (evento) => { if (eventoDeSessao(evento)) restaurar() }
    window.addEventListener('storage', mudou)
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, esquecerSessao)
    return () => {
      ativo = false
      cancelarPendente()
      window.removeEventListener('storage', mudou)
      window.removeEventListener(EVENTO_SESSAO_EXPIRADA, esquecerSessao)
    }
  }, [restaurar, esquecerSessao, cancelarPendente])

  const entrar = useCallback(async (nome, signal) => {
    const versao = ++revisao.current
    pendente.current?.abort()
    const sessao = await login(nome, { signal })
    if (versao !== revisao.current || signal?.aborted) throw new DOMException('Operação cancelada.', 'AbortError')
    salvarSessao(sessao)
    setEstado({ status: 'authenticated', usuario: sessao.usuario, erro: null })
  }, [])

  const sair = useCallback(async (signal) => {
    const token = lerSessao()?.token
    try {
      await request('/auth/logout/', { method: 'POST', token, signal })
    } catch (erro) {
      if (erro.status !== 401) throw erro
    }
    if (!lerSessao() || lerSessao()?.token === token) esquecerSessao()
  }, [esquecerSessao])

  return <AuthContext.Provider value={{ ...estado, entrar, sair, restaurar, esquecerSessao }}>{children}</AuthContext.Provider>
}
