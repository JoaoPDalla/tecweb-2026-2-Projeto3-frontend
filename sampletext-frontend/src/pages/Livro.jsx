import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmarModal from '../components/ConfirmarModal'
import Layout from '../components/Layout'
import NomeModal from '../components/NomeModal'
import { excluirConteudo, renomearConteudo } from '../services/conteudos'
import { buscarLivro, excluirLivro, renomearLivro } from '../services/livros'
import './Livro.css'

// Tela do livro: os conteúdos salvos viram chips (abrem o resumo salvo) e "Novo conteúdo" abre a busca.
// "Gerenciar" mostra as ações de renomear e excluir, do livro e de cada conteúdo.
export default function Livro() {
  const { id } = useParams()
  const navigate = useNavigate()

  // `chave` identifica o pedido atual (livro + tentativa); resultados de pedidos antigos são ignorados.
  const [tentativa, setTentativa] = useState(0)
  const chave = `${id}#${tentativa}`
  const [resultado, setResultado] = useState(null) // { chave, livro } ou { chave, erro }
  const [gerenciar, setGerenciar] = useState(false)
  const [modal, setModal] = useState(null) // { tipo, conteudo? }

  useEffect(() => {
    const controlador = new AbortController()
    buscarLivro(id, { signal: controlador.signal })
      .then((livro) => setResultado({ chave, livro }))
      .catch((erro) => {
        if (erro?.name !== 'AbortError') setResultado({ chave, erro })
      })
    return () => controlador.abort()
  }, [id, chave])

  const atual = resultado?.chave === chave ? resultado : null
  const status = !atual ? 'carregando' : atual.erro ? 'erro' : 'pronto'
  const livro = atual?.livro
  const naoEncontrado = atual?.erro?.status === 404

  // Atualiza o que já está na tela, sem buscar o livro de novo.
  function alterarLivro(funcao) {
    setResultado((anterior) => (anterior?.livro ? { ...anterior, livro: funcao(anterior.livro) } : anterior))
  }

  const abrirResumo = (conteudo) => navigate(`/resumo?${new URLSearchParams({ conteudo: conteudo.id })}`)
  const novoConteudo = () => navigate('/inicio', { state: { livroId: livro.id } })
  const fecharModal = () => setModal(null)

  return (
    <Layout>
      <main className="livro" aria-busy={status === 'carregando'}>
        {status === 'carregando' && (
          <p className="livro__aviso" role="status">
            Carregando o livro…
          </p>
        )}

        {status === 'erro' && (
          <div className="livro__erro" role="alert">
            <p className="livro__aviso">{naoEncontrado ? 'Não encontramos esse livro.' : atual.erro.message}</p>
            {naoEncontrado ? (
              <button type="button" className="botao botao--escuro" onClick={() => navigate('/inicio')}>
                Ir para o início
              </button>
            ) : (
              <button type="button" className="botao botao--escuro" onClick={() => setTentativa((n) => n + 1)}>
                Tentar de novo
              </button>
            )}
          </div>
        )}

        {status === 'pronto' && (
          <>
            <h1 className="titulo-pagina">
              O que vamos estudar hoje?
              <span className="so-leitor"> No livro {livro.nome}.</span>
            </h1>

            {gerenciar && (
              <section className="livro__painel" aria-label="Gerenciar livro">
                <p className="livro__nome">{livro.nome}</p>
                <div className="livro__linha">
                  <button type="button" className="botao botao--claro livro__mini" onClick={() => setModal({ tipo: 'renomear-livro' })}>
                    Renomear livro
                  </button>
                  <button type="button" className="botao botao--perigo livro__mini" onClick={() => setModal({ tipo: 'excluir-livro' })}>
                    Excluir livro
                  </button>
                </div>
              </section>
            )}

            {livro.conteudos.length > 0 ? (
              <ul className="livro__chips" aria-label={`Conteúdos de ${livro.nome}`}>
                {livro.conteudos.map((conteudo) => (
                  <li key={conteudo.id} className="livro__item">
                    <button type="button" className="botao botao--claro livro__chip" onClick={() => abrirResumo(conteudo)}>
                      {conteudo.tema}
                    </button>
                    {gerenciar && (
                      <div className="livro__linha">
                        <button
                          type="button"
                          className="botao botao--claro livro__mini"
                          aria-label={`Renomear ${conteudo.tema}`}
                          onClick={() => setModal({ tipo: 'renomear-conteudo', conteudo })}
                        >
                          Renomear
                        </button>
                        <button
                          type="button"
                          className="botao botao--perigo livro__mini"
                          aria-label={`Excluir ${conteudo.tema}`}
                          onClick={() => setModal({ tipo: 'excluir-conteudo', conteudo })}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="livro__aviso">Este livro ainda não tem conteúdos. Crie o primeiro.</p>
            )}

            <button type="button" className="botao botao--escuro livro__gerenciar" aria-pressed={gerenciar} onClick={() => setGerenciar((g) => !g)}>
              {gerenciar ? 'Concluir' : 'Gerenciar'}
            </button>

            <button type="button" className="botao botao--claro livro__novo" onClick={novoConteudo}>
              Novo conteúdo
            </button>
          </>
        )}
      </main>

      {modal?.tipo === 'renomear-livro' && (
        <NomeModal
          titulo="Renomear livro"
          rotulo="Novo nome do livro"
          valorInicial={livro.nome}
          aoEnviar={(nome, signal) => renomearLivro(livro.id, nome, { signal })}
          aoConcluir={(atualizado) => {
            alterarLivro((l) => ({ ...l, nome: atualizado.nome }))
            fecharModal()
          }}
          aoFechar={fecharModal}
        />
      )}

      {modal?.tipo === 'excluir-livro' && (
        <ConfirmarModal
          titulo="Excluir livro"
          mensagem={`Excluir o livro “${livro.nome}”? ${
            livro.conteudos.length > 0
              ? `Os ${livro.conteudos.length} conteúdos salvos nele também serão excluídos. `
              : ''
          }Isso não pode ser desfeito.`}
          confirmar="Excluir livro"
          aoConfirmar={(signal) => excluirLivro(livro.id, { signal })}
          aoConcluir={() => navigate('/inicio', { replace: true })}
          aoFechar={fecharModal}
        />
      )}

      {modal?.tipo === 'renomear-conteudo' && (
        <NomeModal
          titulo="Renomear conteúdo"
          rotulo="Novo nome do conteúdo"
          valorInicial={modal.conteudo.tema}
          limite={255}
          aoEnviar={(tema, signal) => renomearConteudo(modal.conteudo.id, tema, { signal })}
          aoConcluir={(atualizado) => {
            alterarLivro((l) => ({
              ...l,
              conteudos: l.conteudos.map((c) => (c.id === modal.conteudo.id ? { ...c, tema: atualizado.tema } : c)),
            }))
            fecharModal()
          }}
          aoFechar={fecharModal}
        />
      )}

      {modal?.tipo === 'excluir-conteudo' && (
        <ConfirmarModal
          titulo="Excluir conteúdo"
          mensagem={`Excluir “${modal.conteudo.tema}”? Isso não pode ser desfeito.`}
          aoConfirmar={(signal) => excluirConteudo(modal.conteudo.id, { signal })}
          aoConcluir={() => {
            alterarLivro((l) => ({ ...l, conteudos: l.conteudos.filter((c) => c.id !== modal.conteudo.id) }))
            fecharModal()
          }}
          aoFechar={fecharModal}
        />
      )}
    </Layout>
  )
}
