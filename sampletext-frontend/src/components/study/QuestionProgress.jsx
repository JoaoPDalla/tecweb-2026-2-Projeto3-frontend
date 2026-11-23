export default function QuestionProgress({ number, total, topic = 'Regra da cadeia' }) {
  return (
    <div className="question-progress">
      <div className="progress-labels">
        <p>Pergunta {number} de {total}</p>
        <p>{topic}</p>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Progresso das perguntas"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={number}
        aria-valuetext={`Pergunta ${number} de ${total}`}
      >
        <div className="progress-fill" style={{ width: `${(number / total) * 100}%` }} />
      </div>
    </div>
  )
}
