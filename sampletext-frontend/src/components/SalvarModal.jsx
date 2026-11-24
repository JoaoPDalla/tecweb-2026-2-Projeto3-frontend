import { useEffect, useId, useState } from 'react'
import { useRequest } from '../hooks/useRequest'
import { criarLivro, listarLivros } from '../services/livros'
import Modal from './Modal'

const NOVO = 'novo'

// Pergunta em qual livro guardar o resumo: um que já existe ou um novo.
// `aoSalvar(livroId, signal)` faz o pedido; se der certo chama `aoConcluir({ livroId, conteudo })`.
export default function SalvarModal({ aoSalvar, aoConcluir, aoFechar }) {
  const idLivro = useId()
  const idNome = useId()
  const idErro = useId()
  const [livros, setLivros] = useState({ status: 'carregando' }) // carregando | erro | pronto
  const [tentativa, setTentativa] = useState(0)
  const [escolha, setEscolha] = useState('') // id de um livro ou NOVO
  const [nome, setNome] = useState('')
  const [avisoLocal, setAvisoLocal] = useState('')
  const pedido = useRequest()

  useEffect(() => {
    let cancelado = false
    listarLivros()
      .then((lista) => {
        if (cancelado) return
        setLivros({ status: 'pronto', lista })
        setEscolha((atual) => atual || (lista[0] ? String(lista[0].id) : NOVO))
      })
      .catch((erro) => !cancelado && setLivros({ status: 'erro', mensagem: erro.message }))
    return () => {
      cancelado = true
    }
  }, [tentativa])

  async function enviar(evento) {
    evento.preventDefault()
    const nomeNovo = nome.trim().replace(/\s+/g, ' ')
    if (escolha === NOVO && !nomeNovo) {
      setAvisoLocal('Digite o nome do livro.')
      return
    }
    setAvisoLocal('')
    try {
      const resultado = await pedido.executar(async (signal) => {
        let livroId = escolha
        if (escolha === NOVO) {
          const livro = await criarLivro(nomeNovo, { signal })
          livroId = String(livro.id)
          // Se salvar falhar, tentar de novo usa este livro em vez de criar outro com o mesmo nome.
          setLivros((atual) => ({ ...atual, lista: [...atual.lista, livro] }))
          setEscolha(livroId)
        }
        const conteudo = await aoSalvar(livroId, signal)
        return { livroId, conteudo }
      })
      aoConcluir(resultado)
    } catch {
      // O motivo já está em `pedido.error`; cancelamentos não mostram nada.
    }
  }

  const erro = avisoLocal || pedido.error?.message || ''

  return (
    <Modal titulo="Salvar em um livro" aoFechar={aoFechar} fecharBloqueado={pedido.loading}>
      {livros.status === 'carregando' && (
        <p className="modal__texto" role="status">
          Carregando seus livros…
        </p>
      )}

      {livros.status === 'erro' && (
        <>
          <p className="modal__erro" role="alert">
            {livros.mensagem}
          </p>
          <div className="modal__acoes">
            <button type="button" className="botao botao--claro" onClick={aoFechar}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--escuro"
              onClick={() => {
                setLivros({ status: 'carregando' })
                setTentativa((n) => n + 1)
              }}
            >
              Tentar de novo
            </button>
          </div>
        </>
      )}

      {livros.status === 'pronto' && (
        <form className="modal__form" onSubmit={enviar} noValidate>
          <label className="modal__rotulo" htmlFor={idLivro}>
            Em qual livro?
          </label>
          <select
            id={idLivro}
            className="modal__campo"
            value={escolha}
            onChange={(e) => {
              setEscolha(e.target.value)
              setAvisoLocal('')
            }}
            disabled={pedido.loading}
            autoFocus
          >
            {livros.lista.map((livro) => (
              <option key={livro.id} value={String(livro.id)}>
                {livro.nome}
              </option>
            ))}
            <option value={NOVO}>Criar novo livro…</option>
          </select>

          {escolha === NOVO && (
            <>
              <label className="modal__rotulo" htmlFor={idNome}>
                Nome do novo livro
              </label>
              <input
                id={idNome}
                className="modal__campo"
                type="text"
                autoComplete="off"
                maxLength={100}
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  setAvisoLocal('')
                }}
                readOnly={pedido.loading}
                aria-invalid={erro ? 'true' : undefined}
                aria-describedby={erro ? idErro : undefined}
              />
            </>
          )}

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
              {pedido.loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
