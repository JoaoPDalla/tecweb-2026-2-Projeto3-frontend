import { lerSessao } from './auth.js'
import { request } from './api.js'
import * as loja from './lojaMock.js'
import { usarMock } from './modo.js'
import { classificarTema } from './temas.js'

// Livros do usuário. Com VITE_USAR_MOCK ligado (padrão) usa exemplos em memória;
// com `false` chama a API real (rotas em docs/tarefas-2-9-20.md do backend).

// ---- aviso de mudanças -----------------------------------------------------
// O menu lateral e as telas se atualizam quando um livro é criado, renomeado ou excluído.
const ouvintes = new Set()
let lista = null // { token, pedido }: a lista é guardada por sessão

export function aoMudarLivros(ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

function livrosMudaram() {
  lista = null
  ouvintes.forEach((ouvinte) => ouvinte())
}

// ---- consulta --------------------------------------------------------------

// Lista os livros: [{ id, nome, criado_em }]. Repete a consulta só quando algo muda
// ou quando outra pessoa entra no site (a lista é guardada junto com o token).
export function listarLivros(opcoes = {}) {
  const token = lerSessao()?.token ?? null
  if (lista && lista.token === token) return lista.pedido

  const bruto = usarMock() ? loja.listarLivros() : request('/livros/', opcoes)
  const pedido = bruto.then((dados) => (Array.isArray(dados) ? dados : (dados.results ?? [])))
  const atual = { token, pedido }
  lista = atual
  // Em caso de erro (inclusive cancelamento) não guarda: a próxima chamada tenta de novo.
  pedido.catch(() => {
    if (lista === atual) lista = null
  })
  return pedido
}

// Abre um livro: { id, nome, criado_em, conteudos: [{ id, tema, criado_em }] }.
// Lança ApiError com status 404 se ele não existir (ou for de outra pessoa).
export function buscarLivro(id, opcoes = {}) {
  if (usarMock()) return loja.buscarLivro(id)
  return request(`/livros/${encodeURIComponent(id)}/`, opcoes)
}

// ---- alterações ------------------------------------------------------------

export async function criarLivro(nome, opcoes = {}) {
  const livro = usarMock()
    ? await loja.criarLivro(nome)
    : await request('/livros/', { ...opcoes, method: 'POST', corpo: { nome } })
  livrosMudaram()
  return livro
}

export async function renomearLivro(id, nome, opcoes = {}) {
  const livro = usarMock()
    ? await loja.renomearLivro(id, nome)
    : await request(`/livros/${encodeURIComponent(id)}/`, { ...opcoes, method: 'PATCH', corpo: { nome } })
  livrosMudaram()
  return livro
}

// Exclui o livro e, junto, os conteúdos salvos nele.
export async function excluirLivro(id, opcoes = {}) {
  if (usarMock()) await loja.excluirLivro(id)
  else await request(`/livros/${encodeURIComponent(id)}/`, { ...opcoes, method: 'DELETE' })
  livrosMudaram()
}

// ---- busca -----------------------------------------------------------------

// Confere se o tema digitado serve para gerar um resumo.
// Resposta: { status: 'ok' | 'amplo' | 'invalido', tema, motivo? }
//   amplo    -> tema grande demais ("Cálculo I"): o usuário deve destrinchar;
//   invalido -> não parece uma matéria de estudo.
export async function validarTema(tema, opcoes = {}) {
  if (usarMock()) {
    await loja.esperar(600)
    return classificarTema(tema)
  }
  return request('/conteudos/validar-tema/', { ...opcoes, method: 'POST', corpo: { tema } })
}
