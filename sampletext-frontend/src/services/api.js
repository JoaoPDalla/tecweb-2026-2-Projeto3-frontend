import { lerSessao } from './auth'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(mensagem, status) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
  }
}

function mensagemDeErro(dados) {
  if (!dados) return null
  if (typeof dados.detail === 'string') return dados.detail
  const primeiro = Object.values(dados).flat()[0]
  return typeof primeiro === 'string' ? primeiro : null
}

// Chamada única à API: coloca o token no header e transforma erros em ApiError.
export async function request(caminho, { method = 'GET', corpo } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const sessao = lerSessao()
  if (sessao?.token) headers.Authorization = `Token ${sessao.token}`

  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Tente de novo em instantes.', 0)
  }

  if (resposta.status === 204) return null
  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    throw new ApiError(mensagemDeErro(dados) ?? 'Algo deu errado. Tente novamente.', resposta.status)
  }
  return dados
}

// POST /api/auth/login/  ->  { token, usuario: { id, nome }, criado }
export function login(nome) {
  return request('/auth/login/', { method: 'POST', corpo: { nome } })
}