import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import SalvarModal from '../components/SalvarModal'
import { abrirConteudo, gerarConteudo, salvarConteudo } from '../services/conteudos'
import './Resumo.css'

// Erros em que tentar de novo com o mesmo tema não adianta: é preciso escolher outro.
const ERROS_DE_TEMA = ['tema_amplo', 'tema_invalido', 'ia_recusou']

// Tela do resumo. Há dois jeitos de chegar aqui:
//   /resumo?tema=Regra da cadeia[&livro=3]  gera um resumo novo (livro = onde salvar, vindo de "Novo conteúdo");
//   /resumo?conteudo=12                     reabre um conteúdo já salvo, sem gerar de novo.
export default function Resumo() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const conteudoId = parametros.get('conteudo')
  const livroDoPedido = parametros.get('livro')
  const tema = parametros.get('tema') ?? 'Regra da cadeia'

  // `chave` identifica o pedido atual (origem + tentativa); resultados de pedidos antigos são ignorados.
  const [tentativa, setTentativa] = useState(0)
  const chave = `${conteudoId ? `conteudo:${conteudoId}` : `tema:${tema}`}#${tentativa}`
  const [resultado, setResultado] = useState(null) // { chave, conteudo } ou { chave, erro }
  const [salvamento, setSalvamento] = useState({ chave: null, status: 'parado', livroId: null, mensagem: '' })
  const [escolhendoLivro, setEscolhendoLivro] = useState(false)

  useEffect(() => {
    const controlador = new AbortController()
    const opcoes = { signal: controlador.signal }
    const pedido = conteudoId ? abrirConteudo(conteudoId, opcoes) : gerarConteudo(tema, opcoes)
    pedido
      .then((conteudo) => setResultado({ chave, conteudo }))
      .catch((erro) => {
        if (erro?.name !== 'AbortError') setResultado({ chave, erro })
      })
    return () => controlador.abort()
  }, [conteudoId, tema, chave])

  const atual = resultado?.chave === chave ? resultado : null
  const status = !atual ? 'carregando' : atual.erro ? 'erro' : 'pronto'
  const conteudo = atual?.conteudo
  const reaberto = Boolean(conteudoId)
  const naoEncontrado = atual?.erro?.status === 404
  const trocarTema = ERROS_DE_TEMA.includes(atual?.erro?.code)

  const doPedidoAtual = salvamento.chave === chave
  const statusSalvar = reaberto ? 'salvo' : doPedidoAtual ? salvamento.status : 'parado'
  const livroSalvo = reaberto ? conteudo?.livro : doPedidoAtual ? salvamento.livroId : null

  function guardar(livroId, signal) {
    return salvarConteudo({ livro: livroId, tema: conteudo.tema, resumo: conteudo.resumo }, { signal })
  }

  // Com o livro já escolhido ("Novo conteúdo"), salva direto; senão, pergunta em qual livro.
  async function salvar() {
    if (!livroDoPedido) {
      setEscolhendoLivro(true)
      return
    }
    setSalvamento({ chave, status: 'salvando', livroId: null, mensagem: '' })
    try {
      await guardar(livroDoPedido)
      setSalvamento({ chave, status: 'salvo', livroId: livroDoPedido, mensagem: '' })
    } catch (erro) {
      setSalvamento({ chave, status: 'erro', livroId: null, mensagem: erro.message })
    }
  }

  function salvoNoModal({ livroId }) {
    setEscolhendoLivro(false)
    setSalvamento({ chave, status: 'salvo', livroId, mensagem: '' })
  }

  // TODO: a rota /pergunta ainda usa as perguntas de exemplo (#16).
  const irParaPerguntas = () => navigate('/pergunta', { state: { conteudoId: conteudo?.id } })

  const pronto = status === 'pronto'

  return (
    <Layout>
      <main className="resumo">
        <article className="resumo__papel" aria-busy={status === 'carregando'}>
          {status === 'carregando' && (
            <p role="status">{reaberto ? 'Abrindo o resumo…' : `Gerando o resumo de ${tema}…`}</p>
          )}

          {status === 'erro' && (
            <div role="alert">
              <p>{naoEncontrado ? 'Não encontramos esse resumo.' : atual.erro.message}</p>
              {naoEncontrado || trocarTema ? (
                <button type="button" className="botao botao--escuro" onClick={() => navigate('/inicio')}>
                  {naoEncontrado ? 'Ir para o início' : 'Escolher outro tema'}
                </button>
              ) : (
                <button type="button" className="botao botao--escuro" onClick={() => setTentativa((n) => n + 1)}>
                  Tentar de novo
                </button>
              )}
            </div>
          )}

          {pronto && (
            <>
              <h1 className="resumo__titulo">{conteudo.tema}</h1>
              <Markdown>{conteudo.resumo}</Markdown>
            </>
          )}
        </article>

        <div className="resumo__lateral">
          <aside className="resumo__acoes" aria-label="Ações do resumo">
            <button type="button" className="botao botao--claro" disabled={!pronto} onClick={irParaPerguntas}>
              Perguntas
            </button>
            <button
              type="button"
              className="botao botao--claro"
              disabled={!pronto || statusSalvar === 'salvando' || statusSalvar === 'salvo'}
              onClick={salvar}
            >
              {statusSalvar === 'salvo' ? 'Salvo' : 'Salvar'}
            </button>
            {pronto && statusSalvar === 'salvo' && livroSalvo && (
              <button type="button" className="botao botao--claro" onClick={() => navigate(`/livro/${livroSalvo}`)}>
                Ver livro
              </button>
            )}
          </aside>
          <p className="resumo__aviso" role="status">
            {statusSalvar === 'salvando' && 'Salvando…'}
            {statusSalvar === 'salvo' && !reaberto && 'Resumo salvo.'}
            {statusSalvar === 'erro' && (salvamento.mensagem || 'Não foi possível salvar. Tente de novo.')}
          </p>
        </div>
      </main>

      {escolhendoLivro && pronto && (
        <SalvarModal aoSalvar={guardar} aoConcluir={salvoNoModal} aoFechar={() => setEscolhendoLivro(false)} />
      )}
    </Layout>
  )
}
