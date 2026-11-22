import TopBar from './TopBar'

// Estrutura das telas logadas: barra no topo e o conteúdo da tela embaixo.
export default function Layout({ children, onMenuClick }) {
  return (
    <>
      <TopBar onMenuClick={onMenuClick} />
      {children}
    </>
  )
}