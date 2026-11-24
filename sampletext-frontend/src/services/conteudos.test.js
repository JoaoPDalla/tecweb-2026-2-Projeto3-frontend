import test from 'node:test'
import assert from 'node:assert/strict'
import { createContentService } from './geracao.js'
import { ApiError } from './api.js'
import { validarMaterial } from '../study/material.js'
import { material } from '../study/testFixtures.js'

test('geração envia tema/token pelo cliente HTTP e conserva as dez perguntas e LaTeX', async () => {
  const dados = material()
  let pedido
  const servico = createContentService(async (...args) => { pedido = args; return dados })
  const controlador = new AbortController()
  const conteudo = await servico.gerarConteudo(dados.tema, { signal: controlador.signal })
  assert.equal(pedido[0], '/conteudos/gerar/')
  assert.deepEqual(pedido[1].corpo, { tema: dados.tema })
  assert.equal(pedido[1].signal, controlador.signal)
  assert.deepEqual(conteudo, dados)
  conteudo.perguntas[0].answers[0].text = 'Alterado'
  assert.notEqual(conteudo.perguntas[0].answers[0].text, dados.perguntas[0].answers[0].text)
})

test('aceita tema canônico do cache, mas rejeita material de outro assunto', () => {
  assert.equal(validarMaterial(material('REGRA DA POTÊNCIA'), '  regra da potencia  ').perguntas.length, 10)
  assert.throws(() => validarMaterial(material('Derivadas'), 'Fotossíntese'), { code: 'conteudo_invalido' })
})

test('recusa respostas incompletas sem substituir pelo quiz de exemplo', async () => {
  for (const defeito of ['quantidade', 'id', 'correta', 'alternativas', 'explicacao', 'tema', 'resumo', 'texto']) {
    const dados = material()
    const q = dados.perguntas[0]
    if (defeito === 'quantidade') dados.perguntas.pop()
    if (defeito === 'id') dados.perguntas[1].id = q.id
    if (defeito === 'correta') q.correctAnswerId = 'e'
    if (defeito === 'alternativas') q.answers[1].id = 'a'
    if (defeito === 'explicacao') q.answers[3].explanation = ' '
    if (defeito === 'tema') q.topic = 'Outro'
    if (defeito === 'resumo') dados.resumo = ''
    if (defeito === 'texto') q.answers[1].text = q.answers[0].text
    const servico = createContentService(async () => dados)
    await assert.rejects(servico.gerarConteudo(dados.tema), { code: 'conteudo_invalido' })
  }
})

test('validação de tema usa o endpoint real e preserva os três estados da busca', async () => {
  for (const status of ['ok', 'amplo', 'invalido']) {
    const servico = createContentService(async (rota, pedido) => {
      assert.equal(rota, '/conteudos/validar-tema/')
      return { status, tema: pedido.corpo.tema, motivo: 'Orientação do backend.' }
    })
    assert.equal((await servico.validarTema('Derivadas')).status, status)
  }
})

test('erros da IA, cota e sessão chegam intactos ao controlador', async () => {
  for (const [status, code] of [[401, 'erro_api'], [422, 'tema_amplo'], [429, 'erro_api'], [503, 'ia_nao_configurada'], [504, 'ia_timeout']]) {
    const erro = new ApiError('Mensagem do servidor', status, code)
    const servico = createContentService(async () => { throw erro })
    await assert.rejects(servico.gerarConteudo('Derivadas'), (recebido) => recebido === erro)
  }
})
