import test from 'node:test'
import assert from 'node:assert/strict'
import { createAnswerService } from './respostas.js'
import { abrirConteudo, salvarConteudo } from './conteudos.js'
import { forcarModoMock } from './modo.js'
import { definirAtraso, reiniciarLojaMock } from './lojaMock.js'
import { salvarSessao, limparSessao } from './auth.js'
import { material } from '../study/testFixtures.js'

test('resposta envia a escolha e a chave de envio, nunca a pontuação', async () => {
  let recebido
  const enviar = createAnswerService(async (...args) => {
    recebido = args
    return { id: 42, pergunta: 7, alternativa: 'b', resposta_correta: 'a', acertou: false }
  })
  const resultado = await enviar({ questionId: '7', answerId: 'b', chaveEnvio: 'chave' })
  assert.equal(recebido[0], '/perguntas/7/responder/')
  assert.deepEqual(recebido[1].corpo, { alternativa: 'b', chave_envio: 'chave' })
  assert.equal(resultado.acertou, false)
})

test('ID local ou confirmação inválida não fingem um registro no histórico', async () => {
  let chamadas = 0
  const enviar = createAnswerService(async () => { chamadas++; return { id: 42, pergunta: 9 } })
  await assert.rejects(enviar({ questionId: 'pergunta-1', answerId: 'a' }), { code: 'pergunta_sem_id' })
  assert.equal(chamadas, 0)
  await assert.rejects(enviar({ questionId: '7', answerId: 'a' }), { code: 'resposta_invalida' })
})

test('salvar conserva perguntas e o contrato antigo sem perguntas', async () => {
  const original = globalThis.fetch
  const pedidos = []
  try {
    forcarModoMock(false)
    globalThis.fetch = async (_url, pedido) => {
      const corpo = JSON.parse(pedido.body)
      pedidos.push(corpo)
      return Response.json({ id: 7, ...corpo })
    }
    const dados = { livro: 3, ...material() }
    await salvarConteudo(dados)
    assert.deepEqual(pedidos[0].perguntas, dados.perguntas)
    await salvarConteudo({ livro: 3, tema: dados.tema, resumo: dados.resumo })
    assert.equal('perguntas' in pedidos[1], false)
  } finally { globalThis.fetch = original; forcarModoMock(null) }
})

test('modo de desenvolvimento também conserva as perguntas ao salvar e reabrir', async () => {
  try {
    forcarModoMock(true)
    definirAtraso(0)
    reiniciarLojaMock()
    salvarSessao({ token: 'teste-persistencia', usuario: { id: 1, nome: 'Ana' } })
    const dados = { livro: 1, ...material() }
    const salvo = await salvarConteudo(dados)
    dados.perguntas.pop()
    const reaberto = await abrirConteudo(salvo.id)
    assert.equal(reaberto.perguntas.length, 10)
  } finally { forcarModoMock(null); limparSessao() }
})
