import { request } from './api'
import { resumoMock } from './mocks'

const USAR_MOCK = import.meta.env.VITE_USAR_MOCK !== 'false'
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Gera (ou reabre) o resumo de um tema.
// Formato esperado: { id, tema, resumo }, com `resumo` em Markdown + LaTeX.
// TODO: quando o endpoint de gerar conteúdo (issue #12) existir, confirme a rota e o formato aqui.
export async function gerarConteudo(tema) {
  if (USAR_MOCK) {
    await esperar(400)
    return { ...resumoMock, tema }
  }
  return request('/conteudos/gerar/', { method: 'POST', corpo: { tema } })
}

// Salva o conteúdo em um livro.
// TODO: ligar ao endpoint de Conteúdo (issue #9) e, depois, à escolha do livro.
export async function salvarConteudo(conteudo) {
  if (USAR_MOCK) {
    await esperar(300)
    return conteudo
  }
  return request('/conteudos/', { method: 'POST', corpo: { tema: conteudo.tema, resumo: conteudo.resumo } })
}