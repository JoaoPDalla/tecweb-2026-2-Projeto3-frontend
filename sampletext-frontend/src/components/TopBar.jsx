import { lerSessao } from '../services/auth'
import './TopBar.css'

// Barra superior: botão do menu, nome do app e saudação.
// O menu lateral ainda não existe: quem o criar passa o `onMenuClick`.
export default function TopBar({ onMenuClick }) {
  const nome = lerSessao()?.nome

  return (
    <header className="topbar">
      <div className="topbar__esquerda">
        <button type="button" className="topbar__menu" aria-label="Abrir menu" onClick={onMenuClick}>
          <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true">
            <path d="M0 1h24M0 8h24M0 15h24" stroke="#55635f" strokeWidth="2" />
          </svg>
        </button>
        <span className="topbar__marca">SampleText</span>
      </div>
      <p className="topbar__saudacao">Olá{nome ? ` ${nome}` : ''}</p>
    </header>
  )
}