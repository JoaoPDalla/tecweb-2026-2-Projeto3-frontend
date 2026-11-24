import { useEffect, useId, useRef } from 'react'
import './Modal.css'

// Janela de diálogo sobre a tela. Usa o elemento <dialog>: o navegador prende o foco
// dentro dela, trata a tecla Esc e devolve o foco ao botão que a abriu.
// `fecharBloqueado` impede fechar (Esc ou clique fora) enquanto há um pedido em andamento.
export default function Modal({ titulo, aoFechar, fecharBloqueado = false, children }) {
  const dialogo = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (elemento && !elemento.open) elemento.showModal()
    return () => {
      if (elemento?.open) elemento.close()
    }
  }, [])

  function aoCancelar(evento) {
    evento.preventDefault() // quem decide fechar é o React, para o estado não ficar fora de sincronia
    if (!fecharBloqueado) aoFechar()
  }

  function aoClicar(evento) {
    // Clicar no fundo escuro dispara o clique no próprio <dialog>.
    if (evento.target === dialogo.current && !fecharBloqueado) aoFechar()
  }

  return (
    <dialog ref={dialogo} className="modal" aria-labelledby={idTitulo} onCancel={aoCancelar} onClick={aoClicar}>
      <div className="modal__corpo">
        <h2 id={idTitulo} className="modal__titulo">
          {titulo}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
