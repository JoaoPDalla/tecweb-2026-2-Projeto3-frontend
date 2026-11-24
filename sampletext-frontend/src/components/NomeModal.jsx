import { useId, useState } from 'react'
import { useRequest } from '../hooks/useRequest'
import Modal from './Modal'

// Pede um nome (novo livro, renomear livro ou conteúdo) e o envia com `aoEnviar(nome, signal)`.
// Depois de dar certo chama `aoConcluir(resultado)`; quem usa o modal decide o que fazer em seguida.
export default function NomeModal({
  titulo,
  rotulo,
  valorInicial = '',
  confirmar = 'Salvar',
  limite = 100,
  aoEnviar,
  aoConcluir,
  aoFechar,
}) {
  const idCampo = useId()
  const idErro = useId()
  const [nome, setNome] = useState(valorInicial)
  const [avisoLocal, setAvisoLocal] = useState('')
  const pedido = useRequest()

  async function enviar(evento) {
    evento.preventDefault()
    const limpo = nome.trim().replace(/\s+/g, ' ')
    if (!limpo) {
      setAvisoLocal('Digite um nome.')
      return
    }
    if (limpo === valorInicial) {
      aoFechar() // nada mudou: não há o que enviar
      return
    }
    setAvisoLocal('')
    try {
      const resultado = await pedido.executar((signal) => aoEnviar(limpo, signal))
      aoConcluir(resultado)
    } catch {
      // O motivo já está em `pedido.error`; cancelamentos não mostram nada.
    }
  }

  const erro = avisoLocal || pedido.error?.message || ''

  return (
    <Modal titulo={titulo} aoFechar={aoFechar} fecharBloqueado={pedido.loading}>
      <form className="modal__form" onSubmit={enviar} noValidate>
        <label className="modal__rotulo" htmlFor={idCampo}>
          {rotulo}
        </label>
        <input
          id={idCampo}
          className="modal__campo"
          type="text"
          autoComplete="off"
          autoFocus
          maxLength={limite}
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setAvisoLocal('')
          }}
          readOnly={pedido.loading}
          aria-invalid={erro ? 'true' : undefined}
          aria-describedby={erro ? idErro : undefined}
        />
        {erro && (
          <p id={idErro} className="modal__erro" role="alert">
            {erro}
          </p>
        )}
        <div className="modal__acoes">
          <button type="button" className="botao botao--claro" onClick={aoFechar} disabled={pedido.loading}>
            Cancelar
          </button>
          <button type="submit" className="botao botao--escuro" disabled={pedido.loading}>
            {pedido.loading ? 'Salvando…' : confirmar}
          </button>
        </div>
      </form>
    </Modal>
  )
}
