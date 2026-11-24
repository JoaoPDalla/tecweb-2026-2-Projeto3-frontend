// Regras da #14: este módulo não depende de React, navegação ou API.
export function createQuizState(questions, attempt = 0) {
  if (!Array.isArray(questions)) throw new Error('As perguntas devem ser uma lista.')
  const questionIds = new Set()
  const snapshot = questions.map((question) => {
    if (!question.id || questionIds.has(question.id) || !question.prompt || !Array.isArray(question.answers) || question.answers.length < 2) {
      throw new Error('Pergunta inválida ou com ID repetido.')
    }
    questionIds.add(question.id)
    const answerIds = question.answers.map(({ id }) => id)
    if (answerIds.some((id) => !id) || new Set(answerIds).size !== answerIds.length || !answerIds.includes(question.correctAnswerId)) {
      throw new Error('Alternativas inválidas ou resposta correta ausente.')
    }
    return { ...question, answers: question.answers.map((answer) => ({ ...answer })) }
  })
  return { questions: snapshot, position: 0, answers: [], phase: snapshot.length ? 'question' : 'finished', attempt }
}

function advance(state) {
  return state.position + 1 === state.questions.length
    ? { ...state, phase: 'finished' }
    : { ...state, position: state.position + 1, phase: 'question' }
}

export function quizReducer(state, action) {
  switch (action.type) {
    case 'answer': {
      if (state.phase !== 'question') return state
      const question = state.questions[state.position]
      const { questionId, answerId } = action
      if (questionId !== question.id || !question.answers.some(({ id }) => id === answerId)) return state
      const correct = answerId === question.correctAnswerId
      const answered = { ...state, answers: [...state.answers, { questionId, answerId, correct }] }
      return correct ? advance(answered) : { ...answered, phase: 'resolution' }
    }
    case 'continue':
      return state.phase === 'resolution' ? advance(state) : state
    case 'restart':
      return createQuizState(state.questions, state.attempt + 1)
    default:
      return state
  }
}

// A tela de pergunta recebe somente o enunciado e as alternativas públicas.
export function getCurrentQuestion(state) {
  if (state.phase !== 'question') return null
  const { id, topic, prompt, answers } = state.questions[state.position]
  return { id, topic, prompt, answers: answers.map(({ id: answerId, text }) => ({ id: answerId, text })) }
}

// Adapta a correção ao contrato já usado pela página Resolucao do Luan.
export function getResolution(state) {
  if (state.phase !== 'resolution') return null
  const question = state.questions[state.position]
  const submitted = state.answers[state.answers.length - 1]
  const chosen = question.answers.find(({ id }) => id === submitted.answerId)
  const correct = question.answers.find(({ id }) => id === question.correctAnswerId)
  return {
    numero: state.position + 1,
    total: state.questions.length,
    materia: question.topic,
    enunciado: question.prompt,
    escolhida: { texto: chosen.text, explicacao: chosen.explanation },
    correta: { texto: correct.text, explicacao: correct.explanation },
  }
}

export function getQuizResult(state) {
  if (state.phase !== 'finished') return null
  const correctAnswers = state.answers.filter(({ correct }) => correct).length
  const totalQuestions = state.questions.length
  return {
    topic: state.questions[0]?.topic ?? 'Quiz de estudo',
    totalQuestions,
    correctAnswers,
    incorrectAnswers: state.answers.length - correctAnswers,
    unansweredQuestions: totalQuestions - state.answers.length,
    scorePercentage: totalQuestions ? Math.round(correctAnswers / totalQuestions * 100) : 0,
  }
}
