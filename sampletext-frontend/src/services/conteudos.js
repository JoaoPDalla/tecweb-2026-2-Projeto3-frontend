import { request } from './api.js'
import * as loja from './lojaMock.js'
import { usarMock } from './modo.js'
import { resumoMock } from './mocks.js'

// Resumos. Com VITE_USAR_MOCK ligado (padrão) usa exemplos em memória;
// com `false` chama a API real.

// Gera o resumo de um tema (a IA do backend, com cache): { tema, resumo, perguntas }.
// Não salva nada: para guardar em um livro, use salvarConteudo.
export async function gerarConteudo(tema, opcoes = {}) {
  if (usarMock()) {
    await loja.esperar(400)
    return { ...resumoMock, tema }
  }
  return request('/conteudos/gerar/', { ...opcoes, method: 'POST', corpo: { tema } })
}

// Reabre um conteúdo já salvo, sem gerar de novo:
// { id, livro, tema, resumo, criado_em, perguntas }. Erro 404 se não existir.
export function abrirConteudo(id, opcoes = {}) {
  if (usarMock()) return loja.abrirConteudo(id)
  return request(`/conteudos/${encodeURIComponent(id)}/`, opcoes)
}

// Salva o resumo em um livro do usuário. A API exige o `livro`.
export function salvarConteudo({ livro, tema, resumo, perguntas }, opcoes = {}) {
  const dados = { livro: Number(livro), tema, resumo, ...(perguntas === undefined ? {} : { perguntas }) }
  if (usarMock()) return loja.salvarConteudo(dados)
  return request('/conteudos/', { ...opcoes, method: 'POST', corpo: dados })
}

// Troca o tema (o título) de um conteúdo salvo.
export function renomearConteudo(id, tema, opcoes = {}) {
  if (usarMock()) return loja.renomearConteudo(id, tema)
  return request(`/conteudos/${encodeURIComponent(id)}/`, { ...opcoes, method: 'PATCH', corpo: { tema } })
}

export async function excluirConteudo(id, opcoes = {}) {
  if (usarMock()) await loja.excluirConteudo(id)
  else await request(`/conteudos/${encodeURIComponent(id)}/`, { ...opcoes, method: 'DELETE' })
}
