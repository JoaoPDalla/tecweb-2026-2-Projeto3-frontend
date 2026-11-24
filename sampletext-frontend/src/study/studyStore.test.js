import test from 'node:test'
import assert from 'node:assert/strict'
import { createStudyStore } from './studyStore.js'
import { acaoParaErro } from './material.js'
import { material } from './testFixtures.js'
import { ApiError } from '../services/api.js'
import { createQuizState, getCurrentQuestion, getResolution, getQuizResult, quizReducer } from '../quiz/quiz.js'

const turno = () => new Promise((resolve) => setTimeout(resolve, 0))

test('StrictMode e múltiplos consumidores compartilham um único pedido', async () => {
  let chamadas = 0
  const store = createStudyStore(async () => { chamadas++; return material() })
  const desconectar = store.connect()
  const a = store.load('Regra da potência', { livro: '2' })
  desconectar()
  const parar = store.connect()
  const b = store.load('Regra da potência', { livro: '2' })
  assert.equal(a, b)
  await Promise.all([a, b])
  assert.equal(chamadas, 1)
  assert.equal(store.getSnapshot().status, 'ready')
  parar()
})

test('voltar ao resumo e refazer usam exatamente o material já carregado', async () => {
  let chamadas = 0
  const store = createStudyStore(async (tema) => { chamadas++; return material(tema) })
  const conteudo = await store.load('Derivadas', { livro: '3' })
  assert.equal(await store.load('DERIVADAS', { livro: '3' }), conteudo)
  let quiz = createQuizState(conteudo.perguntas)
  for (let i = 0; i < 10; i++) {
    const question = getCurrentQuestion(quiz)
    quiz = quizReducer(quiz, { type: 'answer', questionId: question.id, answerId: i % 2 ? 'b' : 'a' })
    if (i % 2) {
      assert.equal(getResolution(quiz).escolhida.explicacao, conteudo.perguntas[i].answers[1].explanation)
      quiz = quizReducer(quiz, { type: 'continue' })
    }
  }
  assert.equal(getQuizResult(quiz).scorePercentage, 50)
  assert.equal(getQuizResult(quiz).totalQuestions, 10)
  quiz = quizReducer(quiz, { type: 'restart' })
  assert.equal(getCurrentQuestion(quiz).topic, 'Derivadas')
  assert.equal(store.getSnapshot().livro, '3')
  assert.equal(chamadas, 1)
})

test('trocar o tema cancela o pedido anterior e ignora resultados atrasados', async () => {
  const pedidos = []
  const store = createStudyStore((tema, { signal }) => new Promise((resolve) => pedidos.push({ tema, signal, resolve })))
  const a = store.load('Derivadas')
  await turno()
  const b = store.load('Trigonometria')
  assert.equal(store.getSnapshot().conteudo, null)
  await turno()
  assert.equal(pedidos[0].signal.aborted, true)
  pedidos[1].resolve(material('Trigonometria'))
  await b
  pedidos[0].resolve(material('Derivadas'))
  await a
  assert.equal(store.getSnapshot().conteudo.tema, 'Trigonometria')
  assert.equal(store.getSnapshot().livro, null)
})

test('não envia um pedido já cancelado antes de o transporte começar', async () => {
  const temas = []
  const store = createStudyStore(async (tema) => { temas.push(tema); return material(tema) })
  await Promise.all([store.load('Derivadas'), store.load('Trigonometria')])
  assert.deepEqual(temas, ['Trigonometria'])
})

test('falhas permitem nova tentativa sem mostrar perguntas antigas', async () => {
  let falhar = false
  const erro = new ApiError('IA indisponível', 503, 'ia_conexao')
  const store = createStudyStore(async (tema) => { if (falhar) throw erro; return material(tema) })
  await store.load('Derivadas')
  falhar = true
  await store.load('Trigonometria')
  assert.equal(store.getSnapshot().status, 'error')
  assert.equal(store.getSnapshot().erro, erro)
  assert.equal(store.getSnapshot().conteudo, null)
  falhar = false
  await store.load('Trigonometria')
  assert.equal(store.getSnapshot().status, 'ready')
  assert.equal(store.getSnapshot().conteudo.perguntas[0].topic, 'Trigonometria')
})

test('sair do fluxo cancela a geração e não publica resultado posterior', async () => {
  let responder, sinal
  const store = createStudyStore((_tema, { signal }) => new Promise((resolve) => { responder = resolve; sinal = signal }))
  const sair = store.connect()
  const pedido = store.load('Derivadas')
  await turno()
  sair()
  await turno()
  assert.equal(sinal.aborted, true)
  responder(material('Derivadas'))
  await pedido
  assert.notEqual(store.getSnapshot().status, 'ready')
})

test('tema ausente não usa o exemplo da Regra da cadeia nem acessa a API', async () => {
  let chamadas = 0
  const store = createStudyStore(async () => { chamadas++ })
  await store.load('')
  assert.equal(chamadas, 0)
  assert.equal(store.getSnapshot().erro.code, 'tema_ausente')
  assert.equal(acaoParaErro(store.getSnapshot().erro).podeTentarNovamente, false)
  assert.equal(acaoParaErro(new ApiError('IA indisponível', 503)).podeTentarNovamente, true)
})

test('salvar não substitui perguntas por lista vazia da API e não mistura materiais', async () => {
  const store = createStudyStore(async (tema) => material(tema))
  await store.load('Derivadas', { livro: '7' })
  const id = store.getSnapshot().materialId
  store.recordSaved('7', { id: 42, perguntas: [] }, id)
  assert.equal(store.getSnapshot().salvos['7'].id, 42)
  assert.equal(store.getSnapshot().conteudo.perguntas.length, 10)
  await store.load('Trigonometria', { livro: '9' })
  store.recordSaved('7', { id: 42 }, id)
  assert.deepEqual(store.getSnapshot().salvos, {})
})

test('reabrir resumo salvo usa seu ID e nunca gera material automaticamente', async () => {
  let geracoes = 0, consultas = 0
  const salvo = { ...material(), id: 42, livro: 7 }
  salvo.tema = 'Título renomeado pelo estudante'
  const store = createStudyStore(async () => { geracoes++ }, async (id) => {
    consultas++
    assert.equal(id, '42')
    return salvo
  })
  await store.load('', { conteudoId: '42' })
  assert.equal(store.getSnapshot().conteudo.tema, salvo.tema)
  assert.equal(store.getSnapshot().conteudo.perguntas[0].topic, material().tema)
  await store.load('', { conteudoId: '42' })
  assert.equal(store.getSnapshot().livro, 7)
  assert.equal(consultas, 1)
  assert.equal(geracoes, 0)
})

test('resumo salvo sem perguntas permanece sem perguntas, sem fallback e sem nota falsa', async () => {
  const store = createStudyStore(async () => { throw new Error('Não deveria gerar') }, async () => ({
    id: 42, livro: 7, tema: 'Derivadas', resumo: 'Resumo salvo.', perguntas: [],
  }))
  await store.load('', { conteudoId: '42' })
  assert.equal(store.getSnapshot().status, 'ready')
  assert.deepEqual(store.getSnapshot().conteudo.perguntas, [])
  assert.equal(acaoParaErro(new ApiError('Sem perguntas', 422, 'perguntas_indisponiveis')).podeTentarNovamente, false)
})

test('resumo inexistente ou ID inválido não abre o exemplo nem consulta outro recurso', async () => {
  let consultas = 0
  const store = createStudyStore(async () => { throw new Error('Não deveria gerar') }, async () => {
    consultas++
    throw new ApiError('Não encontrado', 404)
  })
  await store.load('', { conteudoId: 'inválido' })
  assert.equal(consultas, 0)
  await store.load('', { conteudoId: '42' })
  assert.equal(consultas, 1)
  assert.equal(store.getSnapshot().conteudo, null)
  assert.equal(acaoParaErro(store.getSnapshot().erro).mensagem, 'Não encontramos esse resumo.')
})

test('um tema parecido com identificador não se mistura com um resumo salvo', async () => {
  const store = createStudyStore(async (tema) => material(tema), async () => ({ id: 7, livro: 3, tema: 'Salvo', resumo: 'Resumo.', perguntas: [] }))
  await store.load('conteudo:7')
  assert.equal(store.getSnapshot().conteudo.tema, 'conteudo:7')
  await store.load('', { conteudoId: '7' })
  assert.equal(store.getSnapshot().conteudo.tema, 'Salvo')
})
