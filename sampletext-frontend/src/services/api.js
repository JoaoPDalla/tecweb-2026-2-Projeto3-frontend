import { invalidarSessao, lerSessao } from './auth.js'

export const API_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(mensagem, status = 0, code = 'erro_api', errors = null) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

function mensagemDeErro(dados) {
  if (typeof dados === 'string') return dados
  if (!dados || typeof dados !== 'object') return null
  if (typeof dados.detail === 'string') return dados.detail
  for (const [chave, valor] of Object.entries(dados)) {
    if (chave === 'code') continue
    const mensagem = mensagemDeErro(valor)
    if (mensagem) return mensagem
  }
  return null
}

// Dependências injetáveis permitem testar rede, timeout e expiração sem servidor.
export function createApiClient({ baseUrl = API_URL, fetchImpl = (...args) => fetch(...args), getSession = lerSessao,
  onUnauthorized = invalidarSessao, timeoutMs = 120_000 } = {}) {
  let pendentes = 0
  const ouvintes = new Set()
  const notificar = () => ouvintes.forEach((ouvinte) => ouvinte())

  async function request(caminho, { method = 'GET', corpo, signal, timeout = timeoutMs, autenticar = true, token } = {}) {
    if (!Number.isFinite(timeout) || timeout <= 0) throw new RangeError('Timeout deve ser positivo.')
    if (signal?.aborted) throw new DOMException('Operação cancelada.', 'AbortError')
    const controlador = new AbortController()
    let expirou = false
    const cancelar = () => controlador.abort()
    signal?.addEventListener('abort', cancelar, { once: true })
    const relogio = setTimeout(() => { expirou = true; controlador.abort() }, timeout)
    const tokenEnviado = autenticar ? (token ?? getSession()?.token) : null
    const headers = { Accept: 'application/json' }
    if (corpo !== undefined) headers['Content-Type'] = 'application/json'
    if (tokenEnviado) headers.Authorization = `Token ${tokenEnviado}`
    pendentes++
    notificar()
    try {
      const resposta = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${caminho}`, {
        method, headers, signal: controlador.signal,
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      })
      if (resposta.status === 401 && tokenEnviado && getSession()?.token === tokenEnviado) onUnauthorized(tokenEnviado)
      if (resposta.status === 204) return null
      const dados = await resposta.json().catch((erro) => {
        if (controlador.signal.aborted) throw erro
        return null
      })
      if (!resposta.ok) {
        throw new ApiError(mensagemDeErro(dados) ?? 'Não foi possível concluir o pedido. Tente novamente.',
          resposta.status, dados?.code ?? 'erro_api', dados?.errors ?? dados)
      }
      if (dados === null) throw new ApiError('O servidor retornou uma resposta inválida.', 502, 'resposta_invalida')
      return dados
    } catch (erro) {
      if (expirou) throw new ApiError('O servidor demorou para responder. Tente novamente.', 0, 'timeout')
      if (controlador.signal.aborted) throw new DOMException('Operação cancelada.', 'AbortError')
      if (erro instanceof ApiError) throw erro
      throw new ApiError('Não foi possível conectar ao servidor. Tente de novo em instantes.', 0, 'conexao')
    } finally {
      clearTimeout(relogio)
      signal?.removeEventListener('abort', cancelar)
      pendentes--
      notificar()
    }
  }
  return { request, getPending: () => pendentes, subscribe: (ouvinte) => {
    ouvintes.add(ouvinte)
    return () => ouvintes.delete(ouvinte)
  } }
}

export const api = createApiClient()
export const request = api.request

export function login(nome, opcoes = {}) {
  return request('/auth/login/', { ...opcoes, method: 'POST', corpo: { nome }, autenticar: false })
}
