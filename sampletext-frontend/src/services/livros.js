import { ApiError, request } from './api'
import { livrosMock } from './mocks'
import { classificarTema } from './temas'

const USAR_MOCK = import.meta.env.VITE_USAR_MOCK !== 'false'
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Lista os livros do usuário (menu lateral).
// Formato esperado: [{ id, nome }, ...]
// TODO: ligar ao endpoint de Conteúdo (issue #9) e confirmar a rota.
let livrosEmCache = null
export function listarLivros() {
  if (!livrosEmCache) {
    const pedido = USAR_MOCK ? esperar(300).then(() => livrosMock) : request('/livros/')
    // Em caso de erro, não guarda: a próxima chamada tenta de novo.
    livrosEmCache = pedido.catch((erro) => {
      livrosEmCache = null
      throw erro
    })
  }
  return livrosEmCache
}

// Busca um livro com os tópicos (chips) já salvos nele.
// Formato esperado: { id, nome, topicos: [{ id, tema }] }. Lança ApiError(404) se não existir.
// TODO: ligar ao endpoint de Conteúdo (issue #9).
export async function buscarLivro(id) {
  if (USAR_MOCK) {
    await esperar(300)
    const livro = livrosMock.find((l) => String(l.id) === String(id))
    if (!livro) throw new ApiError('Livro não encontrado.', 404)
    return livro
  }
  return request(`/livros/${encodeURIComponent(id)}/`)
}

// Confere se o tema digitado serve para gerar um resumo.
// Formato esperado: { status: 'ok' | 'amplo' | 'invalido', tema? }
//   amplo    -> tema grande demais ("Cálculo I"): o usuário deve destrinchar;
//   invalido -> não parece uma matéria de estudo.
// TODO: ligar à validação semântica do tema do backend (#14 do backend) e confirmar a rota.
export async function validarTema(tema) {
  if (USAR_MOCK) {
    await esperar(600)
    return classificarTema(tema)
  }
  return request('/conteudos/validar-tema/', { method: 'POST', corpo: { tema } })
}
