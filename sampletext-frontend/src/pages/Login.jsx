import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useRequest } from '../hooks/useRequest'
import './Login.css'

// Para onde ir depois de entrar: a tela de busca.
const DESTINO_APOS_LOGIN = '/inicio'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { entrar: iniciarSessao, status } = useAuth()
  const pedido = useRequest()
  const origem = location.state?.from
  const destino = typeof origem === 'string' && origem.startsWith('/') && !origem.startsWith('//') && origem !== '/' ? origem : DESTINO_APOS_LOGIN
  const [nome, setNome] = useState('')
  const [erroLocal, setErro] = useState('')
  const erro = erroLocal || pedido.error?.message || ''
  const enviando = pedido.loading

  async function entrar(evento) {
    evento.preventDefault()
    const nomeLimpo = nome.trim().replace(/\s+/g, ' ')
    if (nomeLimpo.length < 2) {
      setErro('Digite um nome com pelo menos 2 caracteres.')
      return
    }

    setErro('')
    try {
      await pedido.executar((signal) => iniciarSessao(nomeLimpo, signal))
      navigate(destino, { replace: true })
    } catch {
      // O hook apresenta o erro e libera uma nova tentativa.
    }
  }

  if (status === 'checking') return <main role="status">Verificando sua sessão…</main>
  if (status === 'authenticated') return <Navigate to={destino} replace />

  return (
    <div className="login">
      <header className="login__marca">SampleText</header>
      <main className="login__centro">
        <form className="login__form" onSubmit={entrar} noValidate>
          <label className="login__rotulo" htmlFor="nome">
            Nome:
          </label>
          <input
            id="nome"
            className="login__campo"
            type="text"
            name="nome"
            autoComplete="name"
            maxLength={50}
            placeholder="Ex: João"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            aria-invalid={erro ? 'true' : undefined}
            aria-describedby={erro ? 'login-erro' : undefined}
          />
          {erro && (
            <p id="login-erro" className="login__erro" role="alert">
              {erro}
            </p>
          )}
          <button type="submit" className="login__entrar" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  )
}
