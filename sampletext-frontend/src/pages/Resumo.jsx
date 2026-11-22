import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import { gerarConteudo, salvarConteudo } from '../services/conteudos'
import './Resumo.css'

// Tela do resumo. O tema vem da URL (/resumo?tema=Regra da cadeia).
export default function Resumo() {
  const navigate = useNavigate()
  const [parametros] = useSearchParams()
  const tema = parametros.get('tema') ?? 'Regra da cadeia'

  // `chave` identifica o pedido atual (tema + tentativa); resultados de pedidos antigos são ignorados.
  const [tentativa, setTentativa] = useState(0)
  const chave = `${tema}#${tentativa}`
  const [resultado, setResultado] = useState(null) // { chave, conteudo } ou { chave, erro }
  const [salvamento, setSalvamento] = useState({ chave: null, status: 'parado' })

  useEffect(() => {
    let cancelado = false
    gerarConteudo(tema)
      .then((conteudo) => !cancelado && setResultado({ chave, conteudo }))
      .catch((e) => !cancelado && setResultado({ chave, erro: e.message }))
    return () => {
      cancelado = true
    }
  }, [tema, chave])

  const atual = resultado?.chave === chave ? resultado : null
  const status = !atual ? 'carregando' : atual.erro ? 'erro' : 'pronto'
  const conteudo = atual?.conteudo
  const statusSalvar = salvamento.chave === chave ? salvamento.status : 'parado'

  async function salvar() {
    setSalvamento({ chave, status: 'salvando' })
    try {
      await salvarConteudo(conteudo)
      setSalvamento({ chave, status: 'salvo' })
    } catch {
      setSalvamento({ chave, status: 'erro' })
    }
  }

  // TODO: a rota /pergunta é da tela de perguntas (ainda não existe).
  const irParaPerguntas = () => navigate('/pergunta', { state: { conteudoId: conteudo?.id } })

  const pronto = status === 'pronto'

  return (
    <Layout>
      <main className="resumo">
        <article className="resumo__papel" aria-busy={status === 'carregando'}>
          {status === 'carregando' && <p role="status">Gerando o resumo de {tema}…</p>}

          {status === 'erro' && (
            <div role="alert">
              <p>{atual.erro}</p>
              <button type="button" className="botao botao--escuro" onClick={() => setTentativa((n) => n + 1)}>
                Tentar de novo
              </button>
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
        </aside>
        <p className="resumo__aviso" role="status">
          {statusSalvar === 'salvando' && 'Salvando…'}
          {statusSalvar === 'salvo' && 'Resumo salvo.'}
          {statusSalvar === 'erro' && 'Não foi possível salvar. Tente de novo.'}
        </p>
        </div>
      </main>
    </Layout>
  )
}