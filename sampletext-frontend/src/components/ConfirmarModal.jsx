import { useId } from 'react'
import { useRequest } from '../hooks/useRequest'
import Modal from './Modal'

// Pede confirmação antes de uma ação que não dá para desfazer (excluir).
// `aoConfirmar(signal)` faz o pedido; se der certo chama `aoConcluir()`.
export default function ConfirmarModal({ titulo, mensagem, confirmar = 'Excluir', aoConfirmar, aoConcluir, aoFechar }) {
  const idErro = useId()
  const pedido = useRequest()

  async function confirmarAcao() {
    try {
      await pedido.executar((signal) => aoConfirmar(signal))
      aoConcluir()
    } catch {
      // O motivo já está em `pedido.error`; cancelamentos não mostram nada.
    }
  }

  return (
    <Modal titulo={titulo} aoFechar={aoFechar} fecharBloqueado={pedido.loading}>
      <p className="modal__texto">{mensagem}</p>
      {pedido.error && (
        <p id={idErro} className="modal__erro" role="alert">
          {pedido.error.message}
        </p>
      )}
      <div className="modal__acoes">
        <button type="button" className="botao botao--claro" onClick={aoFechar} disabled={pedido.loading} autoFocus>
          Cancelar
        </button>
        <button type="button" className="botao botao--perigo" onClick={confirmarAcao} disabled={pedido.loading}>
          {pedido.loading ? 'Excluindo…' : confirmar}
        </button>
      </div>
    </Modal>
  )
}
