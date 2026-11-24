import test from 'node:test'
import assert from 'node:assert/strict'

let versao = 0
function storage() {
  const dados = new Map()
  return { getItem: (chave) => dados.get(chave) ?? null, setItem: (chave, valor) => dados.set(chave, valor), removeItem: (chave) => dados.delete(chave) }
}
async function modulo() { return import(`./auth.js?teste=${++versao}`) }

test('lê sessão antiga e conserva usuário completo na nova', async () => {
  globalThis.localStorage = storage()
  localStorage.setItem('sampletext.sessao', JSON.stringify({ token: 'antigo', nome: 'Ana' }))
  const auth = await modulo()
  assert.deepEqual(auth.lerSessao().usuario, { nome: 'Ana' })
  auth.salvarSessao({ token: 'novo', usuario: { id: 1, nome: 'Matheus' } })
  assert.equal(auth.lerSessao().usuario.id, 1)
  auth.limparSessao()
  assert.equal(auth.lerSessao(), null)
})

test('ignora JSON corrompido e sessões incompletas', async () => {
  globalThis.localStorage = storage()
  const auth = await modulo()
  auth.salvarSessao({ token: 'abc', usuario: { nome: 'Ana' } })
  for (const texto of ('quebrado|{}|{"token":123,"nome":"Ana"}|{"token":"abc"}').split('|')) {
    localStorage.setItem('sampletext.sessao', texto)
    assert.equal(auth.lerSessao(), null)
  }
  assert.throws(() => auth.salvarSessao({ token: '', usuario: { nome: 'Ana' } }))
})

test('mantém a sessão em memória quando armazenamento está bloqueado ou cheio', async () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('QuotaExceeded') }, removeItem: () => { throw new Error('Bloqueado') } }
  const auth = await modulo()
  auth.salvarSessao({ token: 'abc', usuario: { nome: 'Ana' } })
  assert.equal(auth.lerSessao().nome, 'Ana')
  auth.limparSessao()
  assert.equal(auth.lerSessao(), null)
})

test('uma requisição antiga não invalida o login novo', async () => {
  globalThis.localStorage = storage()
  globalThis.window = new EventTarget()
  const auth = await modulo()
  let expirou = 0
  window.addEventListener(auth.EVENTO_SESSAO_EXPIRADA, () => expirou++)
  auth.salvarSessao({ token: 'novo', usuario: { nome: 'Ana' } })
  auth.invalidarSessao('antigo')
  assert.equal(auth.lerSessao().token, 'novo')
  auth.invalidarSessao('novo')
  assert.equal(auth.lerSessao(), null)
  assert.equal(expirou, 1)
})
