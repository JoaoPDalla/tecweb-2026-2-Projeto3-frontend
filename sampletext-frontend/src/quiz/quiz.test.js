import test from 'node:test'
import assert from 'node:assert/strict'
import { createQuizState, quizReducer, getCurrentQuestion, getResolution, getQuizResult } from './quiz.js'
import { exampleQuestions } from './exampleQuestions.js'

const start = () => createQuizState(exampleQuestions)
const answer = (state, answerId) => quizReducer(state, { type: 'answer', questionId: state.questions[state.position].id, answerId })
const next = (state) => quizReducer(state, { type: 'continue' })

test('começa na primeira questão, sem revelar o gabarito à tela', () => {
  const state = start()
  assert.equal(state.phase, 'question')
  assert.equal(state.position, 0)
  assert.deepEqual(state.answers, [])
  const question = getCurrentQuestion(state)
  assert.equal(question.id, 'chain-rule-1')
  assert.equal('correctAnswerId' in question, false)
  assert.equal('explanation' in question.answers[0], false)
  assert.equal(getQuizResult(state), null)
})

test('confirmação correta vale um ponto e avança sem abrir resolução', () => {
  const state = answer(start(), 'd')
  assert.equal(state.position, 1)
  assert.equal(state.phase, 'question')
  assert.deepEqual(state.answers, [{ questionId: 'chain-rule-1', answerId: 'd', correct: true }])
  assert.equal(getResolution(state), null)
})

test('não aceita confirmação inválida, vazia ou de outra pergunta', () => {
  const state = start()
  for (const action of [
    { type: 'answer', questionId: 'chain-rule-1', answerId: 'inexistente' },
    { type: 'answer', questionId: 'chain-rule-1' },
    { type: 'answer', questionId: 'outra-pergunta', answerId: 'd' },
  ]) assert.equal(quizReducer(state, action), state)
  assert.equal(next(state), state)
})

test('resposta duplicada não confirma a pergunta seguinte nem soma outro ponto', () => {
  const action = { type: 'answer', questionId: 'chain-rule-1', answerId: 'd' }
  const state = quizReducer(start(), action)
  assert.equal(quizReducer(state, action), state)
  assert.equal(state.answers.length, 1)
})

test('erro mantém a posição até a resolução ser continuada', () => {
  const state = answer(start(), 'a')
  assert.equal(state.phase, 'resolution')
  assert.equal(state.position, 0)
  assert.equal(getCurrentQuestion(state), null)
  assert.equal(getQuizResult(state), null)
  assert.equal(answer(state, 'd'), state)
  const resolution = getResolution(state)
  assert.equal(resolution.numero, 1)
  assert.equal(resolution.total, 3)
  assert.equal(resolution.escolhida.texto, '3(5x² + 3x³)²')
  assert.equal(resolution.correta.texto, '3(5x² + 3x³)² · (10x + 9x²)')
  assert.ok(resolution.escolhida.explicacao)
  assert.ok(resolution.correta.explicacao)
  const continued = next(state)
  assert.equal(continued.position, 1)
  assert.equal(continued.phase, 'question')
  assert.equal(next(continued), continued)
})

test('todos os acertos encerram com 100%, sem questões sem resposta', () => {
  const finished = answer(answer(answer(start(), 'd'), 'b'), 'c')
  assert.equal(finished.phase, 'finished')
  assert.deepEqual(getQuizResult(finished), {
    topic: 'Regra da cadeia', totalQuestions: 3,
    correctAnswers: 3, incorrectAnswers: 0, unansweredQuestions: 0, scorePercentage: 100,
  })
  assert.equal(answer(finished, 'a'), finished)
  assert.equal(next(finished), finished)
})

test('erro na última questão exige resolução antes de mostrar a nota', () => {
  const reviewing = answer(answer(answer(start(), 'd'), 'b'), 'a')
  assert.equal(reviewing.phase, 'resolution')
  assert.equal(getResolution(reviewing).numero, 3)
  assert.equal(getQuizResult(reviewing), null)
  const finished = next(reviewing)
  assert.equal(finished.phase, 'finished')
  assert.equal(getQuizResult(finished).correctAnswers, 2)
  assert.equal(getQuizResult(finished).incorrectAnswers, 1)
  assert.equal(getQuizResult(finished).scorePercentage, 67)
})

test('todos os erros geram 0% e cada pergunta só é respondida uma vez', () => {
  let state = start()
  for (const answerId of ['a', 'a', 'a']) state = next(answer(state, answerId))
  const result = getQuizResult(state)
  assert.equal(result.correctAnswers, 0)
  assert.equal(result.incorrectAnswers, 3)
  assert.equal(result.scorePercentage, 0)
  assert.equal(state.answers.length, 3)
})

test('refazer limpa todas as respostas, inclusive durante a resolução', () => {
  const reviewing = answer(start(), 'a')
  const restarted = quizReducer(reviewing, { type: 'restart' })
  assert.deepEqual(restarted.answers, [])
  assert.equal(restarted.position, 0)
  assert.equal(restarted.phase, 'question')
  assert.equal(restarted.attempt, 1)
  assert.equal(getQuizResult(restarted), null)
  const finished = answer(answer(answer(restarted, 'd'), 'b'), 'c')
  const again = quizReducer(finished, { type: 'restart' })
  assert.equal(again.attempt, 2)
  assert.deepEqual(again.answers, [])
  assert.equal(getCurrentQuestion(again).id, 'chain-rule-1')
})

test('não modifica estado anterior nem os dados de exemplo', () => {
  const originalData = JSON.stringify(exampleQuestions)
  const initial = start()
  const originalState = JSON.stringify(initial)
  answer(initial, 'a')
  assert.equal(JSON.stringify(initial), originalState)
  assert.equal(JSON.stringify(exampleQuestions), originalData)
  exampleQuestions.forEach((question, index) => assert.notEqual(initial.questions[index], question))
})

test('lista vazia encerra com resultado zero sem divisão por zero', () => {
  const state = createQuizState([])
  assert.equal(state.phase, 'finished')
  assert.equal(getCurrentQuestion(state), null)
  assert.equal(getQuizResult(state).totalQuestions, 0)
  assert.equal(getQuizResult(state).scorePercentage, 0)
})

test('rejeita gabarito ausente e IDs duplicados no conjunto de questões', () => {
  assert.throws(() => createQuizState(null))
  assert.throws(() => createQuizState([exampleQuestions[0], exampleQuestions[0]]))
  assert.throws(() => createQuizState([{ ...exampleQuestions[0], correctAnswerId: 'z' }]))
  assert.throws(() => createQuizState([{ ...exampleQuestions[0], answers: [exampleQuestions[0].answers[0], exampleQuestions[0].answers[0]] }]))
})
