// #18 apenas exibe o resultado pronto. Contagens, percentual e reinício real
// são responsabilidade do consumidor (#14), por meio dos dados e callbacks.
export default function QuizResult({ result, onRetry, onBackToSummary }) {
  if (!result) {
    return (
      <section className="study-screen quiz-result-layout" aria-label="Resultado final do quiz">
        <div className="quiz-result-card quiz-result-empty">
          <h1>Resultado do quiz</h1>
          <p role="status">O resultado ainda não está disponível.</p>
          <button className="button button-dark" type="button" onClick={onBackToSummary} disabled={!onBackToSummary}>
            Voltar ao resumo
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="study-screen quiz-result-layout" aria-label="Resultado final do quiz">
      <div className="quiz-result-heading">
        <p>Quiz concluído</p>
        <p>{result.topic}</p>
      </div>

      <article className="quiz-result-card">
        <div className="quiz-result-overview">
          <div
            className="quiz-result-score"
            role="meter"
            aria-label="Aproveitamento no quiz"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={result.scorePercentage}
            style={{ '--result-score': `${result.scorePercentage}%` }}
          >
            <span aria-hidden="true">{result.scorePercentage}%</span>
          </div>
          <div className="quiz-result-intro">
            <h1>Resultado do quiz</h1>
            <p className="quiz-result-fraction">{result.correctAnswers} de {result.totalQuestions} questões corretas</p>
            {result.summary && <p>{result.summary}</p>}
          </div>
        </div>

        <dl className="quiz-result-stats" aria-label="Resumo do desempenho">
          <div><dt>Acertos</dt><dd>{result.correctAnswers}</dd></div>
          <div><dt>Erros</dt><dd>{result.incorrectAnswers}</dd></div>
          <div><dt>Sem resposta</dt><dd>{result.unansweredQuestions}</dd></div>
          <div><dt>Total de questões</dt><dd>{result.totalQuestions}</dd></div>
        </dl>
      </article>

      <div className="quiz-result-actions">
        <button className="button button-light" type="button" onClick={onBackToSummary} disabled={!onBackToSummary}>
          Voltar ao resumo
        </button>
        <button className="button button-dark" type="button" onClick={onRetry} disabled={!onRetry}>
          Refazer quiz
        </button>
      </div>
    </section>
  )
}
