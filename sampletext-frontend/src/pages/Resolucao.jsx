import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import { resolucaoMock } from '../services/mocks'
import './Resolucao.css'

// Tela mostrada só quando o usuário ERRA a pergunta.
// Recebe o resultado pela navegação, no formato de `resolucaoMock` (services/mocks.js):
//   navigate('/resolucao', { state: { resultado: { numero, total, materia, enunciado,
//     escolhida: { texto, explicacao }, correta: { texto, explicacao } } } })
// Sem `state` (ex.: abrindo a URL direto), usa o exemplo.
export default function Resolucao() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { numero, total, materia, enunciado, escolhida, correta } = state?.resultado ?? resolucaoMock

  // TODO: a rota /pergunta é da tela de perguntas (ainda não existe).
  const proxima = () => navigate('/pergunta', { state: { proxima: numero + 1 } })

  return (
    <Layout>
      <main className="resolucao">
        <div className="resolucao__topo">
          <p className="resolucao__info">
            Pergunta {numero} de {total}
          </p>
          <p className="resolucao__info">{materia}</p>
        </div>

        <div className="resolucao__pergunta">
          <div className="resolucao__enunciado">
            <Markdown inline>{enunciado}</Markdown>
          </div>
          <span className="selo selo--erro">Você errou</span>
        </div>

        <div className="resolucao__cartoes">
          <section className="cartao" aria-label="Sua resposta">
            <span className="selo selo--erro">Errada</span>
            <div className="cartao__resposta">
              <Markdown inline>{escolhida.texto}</Markdown>
            </div>
            <h2 className="cartao__titulo">Explicação</h2>
            <Markdown>{escolhida.explicacao}</Markdown>
          </section>

          <section className="cartao" aria-label="Resposta certa">
            <span className="selo selo--acerto">Certa</span>
            <div className="cartao__resposta">
              <Markdown inline>{correta.texto}</Markdown>
            </div>
            <h2 className="cartao__titulo">Explicação</h2>
            <Markdown>{correta.explicacao}</Markdown>
          </section>
        </div>

        <button type="button" className="botao botao--escuro resolucao__proxima" onClick={proxima}>
          Próxima pergunta
        </button>
      </main>
    </Layout>
  )
}