// Exemplos fixos exclusivos da prévia da #5. Não há banco nem correção de quiz.
export const previewQuestion = {
  id: 'chain-rule-1',
  topic: 'Regra da cadeia',
  prompt: 'Qual a derivada de (5x² + 3x³)³?',
  answers: [
    { id: 'a', text: '3(5x² + 3x³)²' },
    { id: 'b', text: '3(5x² + 3x³)² + 10x + 9x²' },
    { id: 'c', text: '(5x² + 3x³)³ · (10x + 9x²)' },
    { id: 'd', text: '3(5x² + 3x³)² · (10x + 9x²)' },
  ],
}

// Totais e percentuais fornecidos prontos: não são calculados pela tela #18.
export const previewResults = {
  regular: {
    topic: 'Regra da cadeia',
    totalQuestions: 10,
    correctAnswers: 7,
    incorrectAnswers: 2,
    unansweredQuestions: 1,
    scorePercentage: 70,
    summary: 'Continue praticando para aprofundar seus conhecimentos sobre o conteúdo.',
  },
  perfect: {
    topic: 'Regra da cadeia',
    totalQuestions: 10,
    correctAnswers: 10,
    incorrectAnswers: 0,
    unansweredQuestions: 0,
    scorePercentage: 100,
  },
  zero: {
    topic: 'Regra da cadeia',
    totalQuestions: 10,
    correctAnswers: 0,
    incorrectAnswers: 10,
    unansweredQuestions: 0,
    scorePercentage: 0,
  },
  empty: {
    topic: 'Regra da cadeia',
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    unansweredQuestions: 0,
    scorePercentage: 0,
  },
  unavailable: null,
}

// A resolução já vem pronta para exibição, sem comparar respostas.
export const previewSolution = {
  prompt: previewQuestion.prompt,
  result: 'incorrect',
  resultLabel: 'Você errou!',
  selectedLabel: 'Errada',
  selectedAnswer: '3(5x² + 3x³)²',
  selectedExplanation: 'Você derivou a função de fora, mas faltou multiplicar pela derivada da função de dentro.',
  correctAnswer: '3(5x² + 3x³)² · (10x + 9x²)',
  explanation: 'Aplicamos a regra da cadeia: derivada de fora, mantendo a função de dentro, vezes a derivada de dentro.',
  steps: [
    'Derivada de fora: 3(5x² + 3x³)².',
    'Derivada de dentro: 10x + 9x².',
    'Multiplicando: 3(5x² + 3x³)² · (10x + 9x²).',
  ],
}
