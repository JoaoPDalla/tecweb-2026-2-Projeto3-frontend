import QuestionProgress from './QuestionProgress'

// A tela só apresenta uma resolução pronta. A correção pertence à #14;
// a resolução funcional e sua integração pertencem à #15 (luanmfp).
export default function Solution({ solution, number, total, onNext }) {
  const resultClass = solution.result === 'correct' ? 'is-correct' : 'is-incorrect'

  return (
    <section className="study-screen exercise-layout solution-layout" aria-label="Solução">
      <QuestionProgress number={number} total={total} />
      <div className="solution-heading">
        <h1 className="question-prompt">{solution.prompt}</h1>
        <p className={`result-badge ${resultClass}`}>
          {solution.resultLabel}
        </p>
      </div>

      <div className="solution-grid">
        <article className="solution-card">
          <h2 className={`answer-badge ${resultClass}`}>
            {solution.selectedLabel}
          </h2>
          <p className="solution-formula">{solution.selectedAnswer}</p>
          <h3>Explicação</h3>
          <p className="explanation">
            {solution.selectedExplanation}
          </p>
        </article>

        <article className="solution-card">
          <h2 className="answer-badge is-correct">Certa</h2>
          <p className="solution-formula">{solution.correctAnswer}</p>
          <h3>Explicação</h3>
          <p className="explanation">{solution.explanation}</p>
          <ol className="solution-steps">
            {solution.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </article>
      </div>

      <div className="solution-actions">
        <button className="button button-dark" type="button" onClick={onNext} disabled={!onNext}>
          Próxima pergunta
        </button>
      </div>
    </section>
  )
}
