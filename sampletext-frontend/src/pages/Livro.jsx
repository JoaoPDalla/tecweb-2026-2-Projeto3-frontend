import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { buscarLivro } from '../services/livros'
import './Livro.css'

// Tela do livro: os tópicos já salvos viram chips e "Novo conteúdo" abre a busca.
export default function Livro() {
  const { id } = useParams()
  const navigate = useNavigate()

  // `chave` identifica o pedido atual (livro + tentativa); resultados de pedidos antigos são ignorados.
  const [tentativa, setTentativa] = useState(0)
  const chave = `${id}#${tentativa}`
  const [resultado, setResultado] = useState(null) // { chave, livro } ou { chave, erro }

  useEffect(() => {
    let cancelado = false
    buscarLivro(id)
      .then((livro) => !cancelado && setResultado({ chave, livro }))
      .catch((erro) => !cancelado && setResultado({ chave, erro }))
    return () => {
      cancelado = true
    }
  }, [id, chave])

  const atual = resultado?.chave === chave ? resultado : null
  const status = !atual ? 'carregando' : atual.erro ? 'erro' : 'pronto'
  const livro = atual?.livro
  const naoEncontrado = atual?.erro?.status === 404

  const abrirResumo = (tema) => navigate(`/resumo?${new URLSearchParams({ tema })}`)
  const novoConteudo = () => navigate('/inicio', { state: { livroId: livro.id } })

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
            <p className="livro__aviso">
              {naoEncontrado ? 'Não encontramos esse livro.' : atual.erro.message}
            </p>
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

            {livro.topicos.length > 0 ? (
              <ul className="livro__chips" aria-label={`Tópicos de ${livro.nome}`}>
                {livro.topicos.map((topico) => (
                  <li key={topico.id}>
                    <button type="button" className="botao botao--claro livro__chip" onClick={() => abrirResumo(topico.tema)}>
                      {topico.tema}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="livro__aviso">Este livro ainda não tem conteúdos. Crie o primeiro.</p>
            )}

            <button type="button" className="botao botao--claro livro__novo" onClick={novoConteudo}>
              Novo conteúdo
            </button>
          </>
        )}
      </main>
    </Layout>
  )
}
