import { Link, useInRouterContext } from 'react-router-dom'
import { lerSessao } from '../services/auth'
import './TopBar.css'

// Barra superior: botão do menu, nome do app (leva ao início) e saudação.
// O Layout controla o menu: aqui só chegam o estado (`menuAberto`) e o clique.
export default function TopBar({ menuAberto = false, menuId, onMenuClick }) {
  const nome = lerSessao()?.nome
  const temRouter = useInRouterContext()
  const marca = 'SampleText'

  return (
    <header className="topbar">
      <div className="topbar__esquerda">
        <button
          id="botao-menu"
          type="button"
          className="topbar__menu"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          aria-controls={menuAberto ? menuId : undefined}
          onClick={onMenuClick}
        >
          <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true">
            <path d="M0 1h24M0 8h24M0 15h24" stroke="#55635f" strokeWidth="2" />
          </svg>
        </button>
        {temRouter ? (
          <Link to="/inicio" className="topbar__marca">
            {marca}
          </Link>
        ) : (
          <span className="topbar__marca">{marca}</span>
        )}
      </div>
      <p className="topbar__saudacao" title={nome}>
        Olá{nome ? ` ${nome}` : ''}
      </p>
    </header>
  )
}
