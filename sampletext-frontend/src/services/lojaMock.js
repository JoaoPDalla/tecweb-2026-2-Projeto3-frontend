// Livros e conteúdos de exemplo que se comportam como a API: dá para criar, renomear,
// salvar e excluir sem backend. Os dados vivem na memória e voltam ao normal ao recarregar.
// Usado só quando VITE_USAR_MOCK não é "false" (ver services/modo.js).
import { ApiError } from './api.js'
import { livrosMock, resumoMock } from './mocks.js'

let atrasoMs = 250
let estado = null

// Só para testes: elimina a espera artificial.
export function definirAtraso(ms) {
  atrasoMs = ms
}

export function reiniciarLojaMock() {
  estado = null
}

// Com o atraso zerado (testes), todas as esperas somem, inclusive as mais longas.
export const esperar = (ms = atrasoMs) => new Promise((resolve) => setTimeout(resolve, atrasoMs === 0 ? 0 : ms))

function loja() {
  if (!estado) {
    const livros = structuredClone(livrosMock).map((livro) => ({
      ...livro,
      criado_em: '2026-01-01T12:00:00Z',
      conteudos: livro.conteudos.map((c) => ({ ...c, criado_em: '2026-01-01T12:00:00Z', resumo: resumoMock.resumo })),
    }))
    const idsConteudo = livros.flatMap((livro) => livro.conteudos.map((c) => c.id))
    estado = {
      livros,
      proximoLivro: Math.max(0, ...livros.map((l) => l.id)) + 1,
      proximoConteudo: Math.max(0, ...idsConteudo) + 1,
    }
  }
  return estado
}

function limparNome(texto, limite, rotulo) {
  const nome = String(texto ?? '').split(/\s+/).filter(Boolean).join(' ')
  if (!nome) throw new ApiError(`${rotulo} não pode ficar em branco.`, 400)
  if (nome.length > limite) throw new ApiError(`${rotulo} deve ter no máximo ${limite} caracteres.`, 400)
  return nome
}

function acharLivro(id) {
  const livro = loja().livros.find((l) => String(l.id) === String(id))
  if (!livro) throw new ApiError('Não encontrado.', 404)
  return livro
}

function acharConteudo(id) {
  for (const livro of loja().livros) {
    const conteudo = livro.conteudos.find((c) => String(c.id) === String(id))
    if (conteudo) return { livro, conteudo }
  }
  throw new ApiError('Não encontrado.', 404)
}

const cabecalho = ({ id, nome, criado_em }) => ({ id, nome, criado_em })
const itemDoLivro = ({ id, tema, criado_em }) => ({ id, tema, criado_em })

// ---- livros ----------------------------------------------------------------

export async function listarLivros() {
  await esperar()
  return loja().livros.map(cabecalho)
}

export async function buscarLivro(id) {
  await esperar()
  const livro = acharLivro(id)
  return { ...cabecalho(livro), conteudos: livro.conteudos.map(itemDoLivro) }
}

export async function criarLivro(nome) {
  await esperar()
  const limpo = limparNome(nome, 100, 'O nome do livro')
  const dados = loja()
  if (dados.livros.some((l) => l.nome.toLowerCase() === limpo.toLowerCase())) {
    throw new ApiError('Você já tem um livro com esse nome.', 400)
  }
  const livro = { id: dados.proximoLivro++, nome: limpo, criado_em: new Date().toISOString(), conteudos: [] }
  dados.livros.push(livro)
  return cabecalho(livro)
}

export async function renomearLivro(id, nome) {
  await esperar()
  const livro = acharLivro(id)
  const limpo = limparNome(nome, 100, 'O nome do livro')
  const repetido = loja().livros.some((l) => l.id !== livro.id && l.nome.toLowerCase() === limpo.toLowerCase())
  if (repetido) throw new ApiError('Você já tem um livro com esse nome.', 400)
  livro.nome = limpo
  return cabecalho(livro)
}

export async function excluirLivro(id) {
  await esperar()
  const livro = acharLivro(id)
  loja().livros = loja().livros.filter((l) => l !== livro) // leva os conteúdos junto, como a API
  return null
}

// ---- conteúdos -------------------------------------------------------------

export async function abrirConteudo(id) {
  await esperar()
  const { livro, conteudo } = acharConteudo(id)
  return { id: conteudo.id, livro: livro.id, tema: conteudo.tema, resumo: conteudo.resumo, criado_em: conteudo.criado_em, perguntas: structuredClone(conteudo.perguntas ?? []) }
}

export async function salvarConteudo({ livro, tema, resumo, perguntas = [] }) {
  await esperar()
  const destino = acharLivro(livro)
  const dados = {
    id: loja().proximoConteudo++,
    tema: limparNome(tema, 255, 'O tema'),
    resumo: String(resumo ?? '').trim(),
    perguntas: structuredClone(perguntas),
    criado_em: new Date().toISOString(),
  }
  if (!dados.resumo) throw new ApiError('O resumo não pode ficar em branco.', 400)
  destino.conteudos.push(dados)
  return { id: dados.id, livro: destino.id, tema: dados.tema, resumo: dados.resumo, criado_em: dados.criado_em, perguntas: structuredClone(dados.perguntas) }
}

export async function renomearConteudo(id, tema) {
  await esperar()
  const { conteudo } = acharConteudo(id)
  conteudo.tema = limparNome(tema, 255, 'O tema')
  return itemDoLivro(conteudo)
}

export async function excluirConteudo(id) {
  await esperar()
  const { livro, conteudo } = acharConteudo(id)
  livro.conteudos = livro.conteudos.filter((c) => c !== conteudo)
  return null
}
