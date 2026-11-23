import { useEffect, useRef, useState } from 'react'
import Summary from '../components/study/Summary'
import Question from '../components/study/Question'
import Solution from '../components/study/Solution'
import QuizResult from '../components/study/QuizResult'
import Layout from '../components/Layout'
import { previewQuestion, previewSolution, previewResults } from './fixtures'
import '../components/study/StudyScreens.css'
import './StaticScreensPreview.css'

const screens = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'pergunta', label: 'Pergunta' },
  { id: 'solucao', label: 'Solução' },
  { id: 'resultado', label: 'Resultado final' },
]

// Ambiente de demonstração das #5, #10 e #18. Não implementa o fluxo da #14.
export default function StaticScreensPreview() {
  const [screen, setScreen] = useState('resumo')
  const [questionVersion, setQuestionVersion] = useState(0)
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [sending, setSending] = useState(false)
  const [resultExample, setResultExample] = useState('regular')
  const [previewEvent, setPreviewEvent] = useState('')
  const mainRef = useRef(null)

  useEffect(() => {
    document.title = `${screens.find(({ id }) => id === screen).label} | Prévia Sampletext`
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [screen])

  // Adaptador de demonstração, sem HTTP, correção, pontos ou avanço do quiz.
  async function receivePreviewAnswer({ questionId, answerId }) {
    setSending(true)
    setPreviewEvent('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      if (simulateFailure) throw new Error('Falha simulada pela prévia')
      setPreviewEvent(`Prévia recebeu: pergunta ${questionId}, alternativa ${answerId.toUpperCase()}. Sem correção ou avanço.`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="static-preview">
      <nav className="preview-toolbar" aria-label="Prévia das telas">
        <div>
          <p className="preview-title">Prévia de telas · #5, #10 e #18</p>
          <p className="preview-note">Dados de exemplo. O resultado é independente da pergunta.</p>
        </div>
        <div className="preview-tabs">
          {screens.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={screen === id}
              onClick={() => {
                setPreviewEvent('')
                setScreen(id)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {(screen === 'pergunta' || screen === 'resultado') && (
        <aside className="preview-controls" aria-label="Controles da demonstração">
          {screen === 'pergunta' && (
            <>
              <label>
                <input type="checkbox" checked={simulateFailure} disabled={sending} onChange={(event) => setSimulateFailure(event.target.checked)} />
                Simular falha na confirmação
              </label>
              <button
                type="button"
                disabled={sending}
                onClick={() => {
                  setQuestionVersion((version) => version + 1)
                  setPreviewEvent('')
                }}
              >
                Limpar seleção
              </button>
            </>
          )}
          {screen === 'resultado' && (
            <label>
              Exemplo de resultado
              <select value={resultExample} onChange={(event) => {
                setResultExample(event.target.value)
                setPreviewEvent('')
              }}>
                <option value="regular">7 acertos, 2 erros e 1 sem resposta</option>
                <option value="perfect">100% de acertos</option>
                <option value="zero">Nenhum acerto</option>
                <option value="empty">Nenhuma questão</option>
                <option value="unavailable">Resultado indisponível</option>
              </select>
            </label>
          )}
          <p className="preview-event" role="status">{previewEvent}</p>
        </aside>
      )}

      <Layout>
        <main className="preview-content" ref={mainRef} tabIndex={-1}>
        {screen === 'resumo' && <Summary />}
        {screen === 'pergunta' && (
          <Question key={questionVersion} question={previewQuestion} number={1} total={10} onSubmitAnswer={receivePreviewAnswer} />
        )}
        {screen === 'solucao' && <Solution solution={previewSolution} number={1} total={10} />}
        {screen === 'resultado' && (
          <QuizResult
            result={previewResults[resultExample]}
            onRetry={() => setPreviewEvent('Prévia: ação de refazer solicitada. O reinício real será conectado pela #14.')}
            onBackToSummary={() => {
              setPreviewEvent('')
              setScreen('resumo')
            }}
          />
        )}
        </main>
      </Layout>
    </div>
  )
}
