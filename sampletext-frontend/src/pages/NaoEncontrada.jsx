import { Link } from 'react-router-dom'

export default function NaoEncontrada() {
  return (
    <main style={{ padding: 32, color: 'var(--cor-texto-sobre-fundo)' }}>
      <h1 style={{ fontFamily: 'var(--fonte-titulo)', fontWeight: 400 }}>Página não encontrada</h1>
      <p>
        <Link to="/" style={{ color: 'inherit' }}>
          Voltar para o início
        </Link>
      </p>
    </main>
  )
}