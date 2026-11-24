import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { limparSessao, salvarSessao } from './auth.js'
import { abrirConteudo, excluirConteudo, gerarConteudo, renomearConteudo, salvarConteudo } from './conteudos.js'
import { aoMudarLivros, buscarLivro, criarLivro, excluirLivro, listarLivros, renomearLivro, validarTema } from './livros.js'
import { definirAtraso, reiniciarLojaMock } from './lojaMock.js'
import { forcarModoMock } from './modo.js'

const fetchOriginal = globalThis.fetch
let token

// Cada teste entra com um token novo: a lista de livros é guardada por sessão.
let contador = 0
function entrar(token = `token-ana-${++contador}`) {
  salvarSessao({ token, usuario: { id: 1, nome: 'Ana' } })
  return token
}

// Troca o fetch por uma função que registra cada chamada e responde como a API.
function simularApi(resposta) {
  const chamadas = []
  globalThis.fetch = async (url, init = {}) => {
    const chamada = {
      url: String(url),
      metodo: init.method ?? 'GET',
      cabecalhos: init.headers,
      corpo: init.body ? JSON.parse(init.body) : undefined,
    }
    chamadas.push(chamada)
    const { status = 200, corpo } = resposta(chamada)
    return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return chamadas
}

beforeEach(() => {
  definirAtraso(0)
  reiniciarLojaMock()
  token = entrar()
})

afterEach(() => {
  forcarModoMock(null)
  globalThis.fetch = fetchOriginal
  limparSessao()
})

describe('com dados de exemplo (VITE_USAR_MOCK ligado)', () => {
  beforeEach(() => forcarModoMock(true))

  test('lista, cria, renomeia e exclui livros como a API', async () => {
    const inicial = await listarLivros()
    assert.deepEqual(inicial.map((l) => l.nome), ['Cálculo I', 'Química', 'História'])

    const criado = await criarLivro('  Física   Moderna ')
    assert.equal(criado.nome, 'Física Moderna')
    assert.equal((await listarLivros()).length, 4)

    const renomeado = await renomearLivro(criado.id, 'Física')
    assert.equal(renomeado.nome, 'Física')

    await excluirLivro(criado.id)
    assert.equal((await listarLivros()).length, 3)
  })

  test('recusa nome vazio, grande demais ou repetido (sem diferenciar maiúsculas)', async () => {
    await assert.rejects(criarLivro('   '), { status: 400 })
    await assert.rejects(criarLivro('x'.repeat(101)), { status: 400 })
    await assert.rejects(criarLivro('química'), { status: 400, message: 'Você já tem um livro com esse nome.' })
    await assert.rejects(renomearLivro(1, 'QUÍMICA'), { status: 400 })
    // Renomear com o mesmo nome (só trocando a caixa) é permitido.
    assert.equal((await renomearLivro(2, 'QUÍMICA')).nome, 'QUÍMICA')
  })

  test('o livro aberto traz seus conteúdos, e livro inexistente dá 404', async () => {
    const livro = await buscarLivro(1)
    assert.deepEqual(livro.conteudos.map((c) => c.tema), ['Integral definida', 'Limite', 'Derivadas'])
    await assert.rejects(buscarLivro(999), { status: 404 })
  })

  test('salva, reabre, renomeia e exclui um conteúdo', async () => {
    const salvo = await salvarConteudo({ livro: 3, tema: 'Revolução Francesa', resumo: '**Resumo**' })
    assert.equal(salvo.livro, 3)
    assert.equal((await buscarLivro(3)).conteudos.length, 1)

    const reaberto = await abrirConteudo(salvo.id)
    assert.equal(reaberto.resumo, '**Resumo**')
    assert.equal(reaberto.tema, 'Revolução Francesa')

    assert.equal((await renomearConteudo(salvo.id, 'Francesa')).tema, 'Francesa')
    await excluirConteudo(salvo.id)
    await assert.rejects(abrirConteudo(salvo.id), { status: 404 })
    assert.equal((await buscarLivro(3)).conteudos.length, 0)
  })

  test('não salva em livro que não existe nem resumo em branco', async () => {
    await assert.rejects(salvarConteudo({ livro: 999, tema: 'X', resumo: 'y' }), { status: 404 })
    await assert.rejects(salvarConteudo({ livro: 1, tema: 'X', resumo: '   ' }), { status: 400 })
  })

  test('excluir um livro leva os conteúdos dele', async () => {
    const [primeiro] = (await buscarLivro(1)).conteudos
    await excluirLivro(1)
    await assert.rejects(abrirConteudo(primeiro.id), { status: 404 })
  })

  test('valida temas: específico, amplo e inválido', async () => {
    assert.equal((await validarTema('Regra da cadeia')).status, 'ok')
    assert.equal((await validarTema('Cálculo I')).status, 'amplo')
    assert.equal((await validarTema('qwrtp')).status, 'invalido')
  })

  test('gerar devolve o resumo com o tema pedido', async () => {
    const conteudo = await gerarConteudo('Limites')
    assert.equal(conteudo.tema, 'Limites')
    assert.ok(conteudo.resumo.length > 0)
  })
})

describe('avisos e cache da lista de livros', () => {
  beforeEach(() => forcarModoMock(true))

  test('a lista é reaproveitada até algo mudar', async () => {
    const primeira = listarLivros()
    assert.equal(listarLivros(), primeira)
    await criarLivro('Biologia')
    assert.notEqual(listarLivros(), primeira)
    assert.equal((await listarLivros()).at(-1).nome, 'Biologia')
  })

  test('outra pessoa que entra não vê a lista guardada da anterior', async () => {
    const daAna = listarLivros()
    await daAna
    entrar('token-bia')
    assert.notEqual(listarLivros(), daAna)
  })

  test('quem ouve é avisado ao criar, renomear e excluir, e para de ser avisado ao sair', async () => {
    let avisos = 0
    const parar = aoMudarLivros(() => avisos++)
    const livro = await criarLivro('Geografia')
    await renomearLivro(livro.id, 'Geografia Humana')
    await excluirLivro(livro.id)
    assert.equal(avisos, 3)
    parar()
    await criarLivro('Filosofia')
    assert.equal(avisos, 3)
  })

  test('uma alteração que falha não avisa ninguém', async () => {
    let avisos = 0
    const parar = aoMudarLivros(() => avisos++)
    await assert.rejects(criarLivro(''))
    assert.equal(avisos, 0)
    parar()
  })

  test('a lista que deu erro não fica guardada', async () => {
    forcarModoMock(false)
    let falhar = true
    simularApi(() => (falhar ? { status: 500, corpo: { detail: 'Erro.' } } : { corpo: [{ id: 1, nome: 'A' }] }))
    await assert.rejects(listarLivros())
    falhar = false
    assert.deepEqual(await listarLivros(), [{ id: 1, nome: 'A' }])
  })
})

describe('com a API real (VITE_USAR_MOCK=false)', () => {
  beforeEach(() => forcarModoMock(false))

  test('lista os livros enviando o token, e aceita resposta paginada', async () => {
    const chamadas = simularApi(() => ({ corpo: { results: [{ id: 1, nome: 'Cálculo I' }] } }))
    assert.deepEqual(await listarLivros(), [{ id: 1, nome: 'Cálculo I' }])
    assert.equal(chamadas[0].url, 'http://localhost:8000/api/livros/')
    assert.equal(chamadas[0].metodo, 'GET')
    assert.equal(chamadas[0].cabecalhos.Authorization, `Token ${token}`)
  })

  test('cria, renomeia e exclui livros nas rotas da API', async () => {
    const chamadas = simularApi((c) => {
      if (c.metodo === 'DELETE') return { status: 204 }
      return { status: c.metodo === 'POST' ? 201 : 200, corpo: { id: 7, nome: c.corpo.nome } }
    })
    assert.equal((await criarLivro('Química')).id, 7)
    await renomearLivro(7, 'Química Geral')
    await excluirLivro(7)
    assert.deepEqual(
      chamadas.map((c) => [c.metodo, c.url.replace('http://localhost:8000/api', ''), c.corpo]),
      [
        ['POST', '/livros/', { nome: 'Química' }],
        ['PATCH', '/livros/7/', { nome: 'Química Geral' }],
        ['DELETE', '/livros/7/', undefined],
      ],
    )
  })

  test('abre um livro com os conteúdos e repassa o 404', async () => {
    simularApi((c) =>
      c.url.endsWith('/livros/1/')
        ? { corpo: { id: 1, nome: 'A', conteudos: [{ id: 5, tema: 'Limite' }] } }
        : { status: 404, corpo: { detail: 'No Livro matches the given query.' } },
    )
    assert.deepEqual((await buscarLivro(1)).conteudos, [{ id: 5, tema: 'Limite' }])
    await assert.rejects(buscarLivro(2), { status: 404 })
  })

  test('mostra a mensagem do campo quando o nome do livro é recusado', async () => {
    simularApi(() => ({ status: 400, corpo: { nome: ['Você já tem um livro com esse nome.'] } }))
    await assert.rejects(criarLivro('Química'), { status: 400, message: 'Você já tem um livro com esse nome.' })
  })

  test('valida o tema e gera o resumo nas rotas da IA', async () => {
    const chamadas = simularApi((c) =>
      c.url.endsWith('/validar-tema/')
        ? { corpo: { status: 'amplo', tema: 'Cálculo I', motivo: 'Muito amplo.' } }
        : { corpo: { tema: c.corpo.tema, resumo: 'R', perguntas: [] } },
    )
    assert.deepEqual(await validarTema('Cálculo I'), { status: 'amplo', tema: 'Cálculo I', motivo: 'Muito amplo.' })
    assert.equal((await gerarConteudo('Limite')).resumo, 'R')
    assert.deepEqual(
      chamadas.map((c) => [c.metodo, c.url.replace('http://localhost:8000/api', ''), c.corpo]),
      [
        ['POST', '/conteudos/validar-tema/', { tema: 'Cálculo I' }],
        ['POST', '/conteudos/gerar/', { tema: 'Limite' }],
      ],
    )
  })

  test('o erro da IA chega com o código para a tela decidir o que fazer', async () => {
    simularApi(() => ({ status: 422, corpo: { code: 'tema_amplo', detail: 'O tema é amplo demais.' } }))
    await assert.rejects(gerarConteudo('Cálculo'), { status: 422, code: 'tema_amplo', message: 'O tema é amplo demais.' })
  })

  test('salva, reabre, renomeia e exclui conteúdos nas rotas da API', async () => {
    const chamadas = simularApi((c) => {
      if (c.metodo === 'DELETE') return { status: 204 }
      return { status: c.metodo === 'POST' ? 201 : 200, corpo: { id: 9, livro: 3, tema: 'Limite', resumo: 'R', perguntas: [] } }
    })
    await salvarConteudo({ livro: '3', tema: 'Limite', resumo: 'R' })
    await abrirConteudo(9)
    await renomearConteudo(9, 'Limites')
    await excluirConteudo(9)
    assert.deepEqual(
      chamadas.map((c) => [c.metodo, c.url.replace('http://localhost:8000/api', ''), c.corpo]),
      [
        ['POST', '/conteudos/', { livro: 3, tema: 'Limite', resumo: 'R' }],
        ['GET', '/conteudos/9/', undefined],
        ['PATCH', '/conteudos/9/', { tema: 'Limites' }],
        ['DELETE', '/conteudos/9/', undefined],
      ],
    )
  })
})
