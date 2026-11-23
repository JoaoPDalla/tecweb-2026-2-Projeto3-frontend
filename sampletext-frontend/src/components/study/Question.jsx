import { useId, useRef, useState } from 'react'
import QuestionProgress from './QuestionProgress'

// #10 cuida da seleção e da confirmação. O consumidor da #14 recebe os IDs;
// esta tela não conhece a alternativa correta nem escolhe a próxima pergunta.
export default function Question(props) {
  return <QuestionForm key={props.question.id} {...props} />
}

function QuestionForm({ question, number, total, selectedAnswerId, onAnswer, onSubmitAnswer, disabled = false }) {
  const inputId = useId()
  const [localAnswerId, setLocalAnswerId] = useState(null)
  const [status, setStatus] = useState('idle')
  const sendingRef = useRef(false)
  const selection = selectedAnswerId === undefined ? localAnswerId : selectedAnswerId
  const locked = disabled || status === 'submitting' || status === 'submitted'
  const hasSelection = question.answers.some(({ id }) => id === selection)

  function selectAnswer(answerId) {
    setLocalAnswerId(answerId)
    setStatus('idle')
    onAnswer?.(answerId)
  }

  async function submitAnswer(event) {
    event.preventDefault()
    if (!hasSelection || locked || sendingRef.current || !onSubmitAnswer) return

    sendingRef.current = true
    setStatus('submitting')
    try {
      await onSubmitAnswer({ questionId: question.id, answerId: selection })
      setStatus('submitted')
    } catch {
      setStatus('error')
    } finally {
      sendingRef.current = false
    }
  }

  return (
    <section className="study-screen exercise-layout question-layout" aria-label="Pergunta">
      <QuestionProgress number={number} total={total} topic={question.topic} />
      <h1 className="question-prompt" id={`${inputId}-prompt`}>{question.prompt}</h1>
      <form onSubmit={submitAnswer} aria-labelledby={`${inputId}-prompt`} aria-busy={status === 'submitting'}>
        <fieldset className="answer-grid" disabled={locked} aria-describedby={`${inputId}-hint`}>
          <legend className="study-sr-only">Alternativas de resposta</legend>
          {question.answers.map((answer, index) => (
            <label className="answer-option" key={answer.id}>
              <input
                className="answer-input study-sr-only"
                type="radio"
                name={inputId}
                value={answer.id}
                checked={selection === answer.id}
                aria-label={`Alternativa ${String.fromCharCode(65 + index)}: ${answer.text}`}
                onChange={() => selectAnswer(answer.id)}
              />
              <span>{answer.text}</span>
            </label>
          ))}
        </fieldset>

        <div className="question-actions">
          <p className="question-hint" id={`${inputId}-hint`} role="status">
            {status === 'submitted'
              ? 'Resposta enviada.'
              : status === 'submitting'
                ? 'Enviando sua resposta…'
                : hasSelection
                  ? 'Você pode trocar a alternativa antes de confirmar.'
                  : 'Selecione uma alternativa para continuar.'}
          </p>
          <button
            className="button button-dark"
            type="submit"
            disabled={!hasSelection || locked || !onSubmitAnswer}
          >
            {status === 'submitting' ? 'Enviando…' : 'Confirmar resposta'}
          </button>
        </div>
        {status === 'error' && (
          <p className="question-error" role="alert">
            Não foi possível enviar sua resposta. Tente novamente.
          </p>
        )}
      </form>
    </section>
  )
}
