import { useEffect, useState } from 'react'
import { useInRouterContext } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import './Layout.css'

const CHAVE_MENU = 'sampletext.menu'
const ID_MENU = 'menu-livros'

// O menu continua aberto (ou fechado) ao trocar de tela: cada página monta o seu próprio Layout.
function lerMenuAberto() {
  try {
    return sessionStorage.getItem(CHAVE_MENU) === 'aberto'
  } catch {
    return false
  }
}

function guardarMenuAberto(aberto) {
  try {
    sessionStorage.setItem(CHAVE_MENU, aberto ? 'aberto' : 'fechado')
  } catch {
    // Sem sessionStorage: o menu só não lembra o estado entre telas.
  }
}

// Estrutura das telas logadas: barra no topo, menu lateral opcional e o conteúdo da tela.
export default function Layout({ children }) {
  // Fora de um Router (a prévia estática, por exemplo) não há como navegar: sem menu.
  const temRouter = useInRouterContext()
  const [aberto, setAberto] = useState(lerMenuAberto)
  const menuVisivel = temRouter && aberto

  function definirMenu(proximo) {
    setAberto(proximo)
    guardarMenuAberto(proximo)
  }

  // Esc fecha o menu e devolve o foco ao botão que o abriu.
  useEffect(() => {
    if (!menuVisivel) return undefined
    function aoTeclar(evento) {
      if (evento.key !== 'Escape') return
      setAberto(false)
      guardarMenuAberto(false)
      document.getElementById('botao-menu')?.focus()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [menuVisivel])

  return (
    <>
      <TopBar
        menuAberto={menuVisivel}
        menuId={ID_MENU}
        onMenuClick={temRouter ? () => definirMenu(!aberto) : undefined}
      />
      <div className="layout">
        {menuVisivel && <Sidebar id={ID_MENU} />}
        <div className="layout__conteudo">{children}</div>
      </div>
    </>
  )
}
