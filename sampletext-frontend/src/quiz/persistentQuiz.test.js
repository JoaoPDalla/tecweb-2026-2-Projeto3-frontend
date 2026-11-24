import test from 'node:test'
import assert from 'node:assert/strict'
import { createPersistentQuiz } from './persistentQuiz.js'
import { getQuizResult } from './quiz.js'
import { material } from '../study/testFixtures.js'
import { ApiError } from '../services/api.js'

const perguntas = () => material().perguntas.map((p, i) => ({ ...p, id: String(i + 1) }))
const resposta = (pedido) => ({ id: 1, pergunta: Number(pedido.questionId), alternativa: pedido.answerId,
  resposta_correta: 'a', acertou: pedido.answerId === 'a' })
const turno = () => new Promise((resolve) => setTimeout(resolve, 0))

test('só corrige e avança depois da confirmação do servidor; cliques duplicados compartilham envio', async () => {
  let concluir, chamadas = 0
  const quiz = createPersistentQuiz(perguntas(), (pedido) => new Promise(resolve => {
    chamadas++; concluir = () => resolve(resposta(pedido))
  }))
  quiz.dispatch({ type: 'answer', questionId: '1', answerId: 'a' })
  assert.equal(quiz.getSnapshot().state.answers.length, 0)
  const a = quiz.submitAnswer({ questionId: '1', answerId: 'a' })
  const b = quiz.submitAnswer({ questionId: '1', answerId: 'a' })
  assert.equal(a, b)
  await turno()
  assert.equal(chamadas, 1)
  assert.equal(quiz.getSnapshot().pending, true)
  assert.equal(quiz.getSnapshot().state.position, 0)
  concluir()
  await a
  assert.equal(quiz.getSnapshot().state.position, 1)
  assert.equal(quiz.getSnapshot().state.answers[0].correct, true)
})

test('erro mantém a etapa e repetir usa a mesma chave, inclusive se a primeira resposta foi gravada', async () => {
  const gravadas = new Map()
  const envios = []
  let falhar = true
  const quiz = createPersistentQuiz(perguntas(), async (pedido) => {
    envios.push(pedido.chaveEnvio)
    if (!gravadas.has(pedido.chaveEnvio)) gravadas.set(pedido.chaveEnvio, resposta(pedido))
    if (falhar) { falhar = false; throw new ApiError('Conexão interrompida', 0) }
    return gravadas.get(pedido.chaveEnvio)
  })
  await assert.rejects(quiz.submitAnswer({ questionId: '1', answerId: 'b' }))
  assert.equal(quiz.getSnapshot().state.phase, 'question')
  assert.equal(quiz.getSnapshot().state.answers.length, 0)
  await quiz.submitAnswer({ questionId: '1', answerId: 'b' })
  assert.equal(envios[0], envios[1])
  assert.equal(gravadas.size, 1)
  assert.equal(quiz.getSnapshot().state.phase, 'resolution')
  quiz.dispatch({ type: 'continue' })
  assert.equal(quiz.getSnapshot().state.position, 1)
})

test('reiniciar cria nova chave e uma resposta atrasada não altera a tentativa nova', async () => {
  const pedidos = []
  const quiz = createPersistentQuiz(perguntas(), (pedido) => new Promise(resolve => pedidos.push({ pedido, resolve })))
  const antigo = quiz.submitAnswer({ questionId: '1', answerId: 'a' })
  const esperarAntigo = assert.rejects(antigo, { name: 'AbortError' })
  await turno()
  quiz.dispatch({ type: 'restart' })
  assert.equal(pedidos[0].pedido.signal.aborted, true)
  const novo = quiz.submitAnswer({ questionId: '1', answerId: 'b' })
  await turno()
  assert.notEqual(pedidos[0].pedido.chaveEnvio, pedidos[1].pedido.chaveEnvio)
  pedidos[0].resolve(resposta(pedidos[0].pedido))
  await esperarAntigo
  assert.equal(quiz.getSnapshot().state.answers.length, 0)
  pedidos[1].resolve(resposta(pedidos[1].pedido))
  await novo
  assert.equal(quiz.getSnapshot().state.attempt, 1)
  assert.equal(quiz.getSnapshot().state.answers[0].correct, false)
})

test('não aceita pontuação incompatível com a confirmação do servidor', async () => {
  const quiz = createPersistentQuiz(perguntas(), async (pedido) => ({ ...resposta(pedido), resposta_correta: 'b', acertou: false }))
  await assert.rejects(quiz.submitAnswer({ questionId: '1', answerId: 'a' }), { code: 'gabarito_alterado' })
  assert.equal(quiz.getSnapshot().state.answers.length, 0)
})

test('dez confirmações geram dez registros e o resultado da tentativa atual', async () => {
  const gravadas = []
  const quiz = createPersistentQuiz(perguntas(), async (pedido) => { gravadas.push(pedido); return resposta(pedido) })
  for (let i = 0; i < 10; i++) {
    await quiz.submitAnswer({ questionId: String(i + 1), answerId: i % 2 ? 'b' : 'a' })
    if (i % 2) quiz.dispatch({ type: 'continue' })
  }
  assert.equal(gravadas.length, 10)
  assert.equal(new Set(gravadas.map(p => p.chaveEnvio)).size, 10)
  assert.equal(getQuizResult(quiz.getSnapshot().state).scorePercentage, 50)
  quiz.dispatch({ type: 'restart' })
  assert.equal(quiz.getSnapshot().state.answers.length, 0)
  assert.equal(gravadas.length, 10)
})

test('montagem e StrictMode não registram respostas automaticamente', async () => {
  let chamadas = 0
  const quiz = createPersistentQuiz(perguntas(), async () => { chamadas++ })
  const parar = quiz.connect()
  parar()
  const sair = quiz.connect()
  await turno()
  assert.equal(chamadas, 0)
  sair()
})
