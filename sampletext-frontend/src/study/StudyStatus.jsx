import Layout from '../components/Layout'
import { acaoParaErro } from './material.js'

export default function StudyStatus({ carregando, tema, reaberto = false, erro, onRetry, onChangeTheme, onGenerate }) {
  const acao = acaoParaErro(erro)
  return (
    <Layout>
      <main className="resumo">
        <article className="resumo__papel" aria-busy={carregando}>
          {carregando ? <p role="status">{reaberto ? 'Abrindo o resumo…' : `Gerando o material de ${tema}…`}</p> : (
            <div role="alert">
              <p>{acao.mensagem}</p>
              {acao.podeTentarNovamente && <button type="button" className="botao botao--escuro" onClick={onRetry}>Tentar de novo</button>}
              {onGenerate && <button type="button" className="botao botao--escuro" onClick={onGenerate}>Gerar novo material</button>}
              <button type="button" className="botao botao--claro" onClick={onChangeTheme}>Escolher outro tema</button>
            </div>
          )}
        </article>
      </main>
    </Layout>
  )
}
