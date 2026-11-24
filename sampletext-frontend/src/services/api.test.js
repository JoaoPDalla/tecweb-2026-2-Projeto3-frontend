import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, createApiClient } from './api.js'

test('envia token e JSON, aceita corpo falso e respeita chamadas públicas', async () => {
  const chamadas = []
  const cliente = createApiClient({ baseUrl: 'http://teste/api/', getSession: () => ({ token: 'abc' }),
    fetchImpl: async (...args) => { chamadas.push(args); return Response.json({ ok: true }) } })
  await cliente.request('/teste/', { method: 'POST', corpo: false })
  assert.equal(chamadas[0][0], 'http://teste/api/teste/')
  assert.equal(chamadas[0][1].headers.Authorization, 'Token abc')
  assert.equal(chamadas[0][1].body, 'false')
  await cliente.request('/login/', { autenticar: false })
  assert.equal(chamadas[1][1].headers.Authorization, undefined)
})

test('preserva código, mensagem e campos de erros da API', async () => {
  const cliente = createApiClient({ fetchImpl: async () => Response.json({ code: 'tema_amplo', detail: 'Especifique o tema.', errors: { tema: ['Amplo'] } }, { status: 422 }) })
  await assert.rejects(cliente.request('/'), (erro) => {
    assert.ok(erro instanceof ApiError)
    assert.equal(erro.status, 422)
    assert.equal(erro.code, 'tema_amplo')
    assert.equal(erro.message, 'Especifique o tema.')
    assert.deepEqual(erro.errors, { tema: ['Amplo'] })
    return true
  })
})

test('extrai validações aninhadas e não exibe HTML de erro do servidor', async () => {
  const aninhado = createApiClient({ fetchImpl: async () => Response.json({ usuario: { nome: ['Nome obrigatório.'] } }, { status: 400 }) })
  await assert.rejects(aninhado.request('/'), { message: 'Nome obrigatório.' })
  const html = createApiClient({ fetchImpl: async () => new Response('<html>segredo</html>', { status: 500 }) })
  await assert.rejects(html.request('/'), (erro) => erro.status === 500 && !erro.message.includes('segredo'))
})

test('aceita 204 e rejeita resposta de sucesso que não seja JSON', async () => {
  const vazio = createApiClient({ fetchImpl: async () => new Response(null, { status: 204 }) })
  assert.equal(await vazio.request('/'), null)
  const invalido = createApiClient({ fetchImpl: async () => new Response('invalido') })
  await assert.rejects(invalido.request('/'), { code: 'resposta_invalida' })
})

test('401 expira somente a sessão que enviou o pedido', async () => {
  let sessao = { token: 'antigo' }
  const expirados = []
  const cliente = createApiClient({ getSession: () => sessao, onUnauthorized: (token) => expirados.push(token),
    fetchImpl: async () => Response.json({ detail: 'Token inválido' }, { status: 401 }) })
  await assert.rejects(cliente.request('/'))
  assert.deepEqual(expirados, ['antigo'])
  const tardio = createApiClient({ getSession: () => sessao, onUnauthorized: (token) => expirados.push(token),
    fetchImpl: async () => { sessao = { token: 'novo' }; return Response.json({}, { status: 401 }) } })
  await assert.rejects(tardio.request('/'))
  assert.deepEqual(expirados, ['antigo'])
})

test('acompanha pedidos concorrentes e zera loading após falhas', async () => {
  const resolver = []
  const cliente = createApiClient({ fetchImpl: () => new Promise((resolve) => resolver.push(resolve)) })
  const contagens = []
  const parar = cliente.subscribe(() => contagens.push(cliente.getPending()))
  const a = cliente.request('/a')
  const b = cliente.request('/b')
  assert.equal(cliente.getPending(), 2)
  resolver[0](Response.json({ ok: true }))
  await a
  resolver[1](Response.json({}, { status: 500 }))
  await assert.rejects(b)
  assert.deepEqual(contagens, [1, 2, 1, 0])
  parar()
})

const semResposta = (_url, { signal }) => new Promise((_resolve, reject) => {
  signal.addEventListener('abort', () => reject(new DOMException('Cancelado', 'AbortError')), { once: true })
})

test('timeout libera loading e pode ser tentado novamente', async () => {
  let primeira = true
  const cliente = createApiClient({ timeoutMs: 10, fetchImpl: (...args) => {
    if (!primeira) return Promise.resolve(Response.json({ ok: true }))
    primeira = false
    return semResposta(...args)
  } })
  await assert.rejects(cliente.request('/'), { code: 'timeout' })
  assert.equal(cliente.getPending(), 0)
  assert.deepEqual(await cliente.request('/'), { ok: true })
})

test('cancelamento é distinto de falha de conexão', async () => {
  const cliente = createApiClient({ fetchImpl: semResposta })
  const controlador = new AbortController()
  const pedido = cliente.request('/', { signal: controlador.signal })
  controlador.abort()
  await assert.rejects(pedido, { name: 'AbortError' })
  assert.equal(cliente.getPending(), 0)
  await assert.rejects(cliente.request('/', { signal: controlador.signal }), { name: 'AbortError' })
  const offline = createApiClient({ fetchImpl: async () => { throw new TypeError('Failed to fetch') } })
  await assert.rejects(offline.request('/'), { code: 'conexao' })
})
