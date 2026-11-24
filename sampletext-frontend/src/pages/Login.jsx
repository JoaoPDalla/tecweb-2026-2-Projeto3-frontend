import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { salvarSessao } from '../services/auth'
import './Login.css'

// Para onde ir depois de entrar: a tela de busca.
const DESTINO_APOS_LOGIN = '/inicio'

export default function Login() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(evento) {
    evento.preventDefault()
    const nomeLimpo = nome.trim().replace(/\s+/g, ' ')
    if (nomeLimpo.length < 2) {
      setErro('Digite um nome com pelo menos 2 caracteres.')
      return
    }

    setEnviando(true)
    setErro('')
    try {
      salvarSessao(await login(nomeLimpo))
      navigate(DESTINO_APOS_LOGIN)
    } catch (e) {
      setErro(e.status === 400 ? 'Use um nome com 2 a 50 caracteres.' : e.message)
      setEnviando(false)
    }
  }

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