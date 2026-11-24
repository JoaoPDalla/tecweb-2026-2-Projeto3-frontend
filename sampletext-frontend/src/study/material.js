import { ApiError } from '../services/api.js'

export function chaveTema(tema) {
  return typeof tema === 'string' ? tema.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ') : ''
}

export function chaveMaterial(tema, conteudoId = null) {
  return conteudoId !== null ? `conteudo:${conteudoId}` : chaveTema(tema) ? `tema:${chaveTema(tema)}` : ''
}

const texto = (valor) => typeof valor === 'string' && Boolean(valor.trim())
const invalido = () => new ApiError('O servidor retornou um material incompleto ou inválido. Tente novamente.', 502, 'conteudo_invalido')

// Verifica o contrato de transporte antes de iniciar uma tentativa da #14.
export function validarMaterial(dados, temaSolicitado, { salvo = false } = {}) {
  if (!dados || !texto(dados.tema) || !texto(dados.resumo) || (!salvo && chaveTema(dados.tema) !== chaveTema(temaSolicitado))
    || !Array.isArray(dados.perguntas) || (!salvo && dados.perguntas.length !== 10)) throw invalido()
  const ids = new Set()
  const enunciados = new Set()
  const perguntas = dados.perguntas.map((pergunta) => {
    if (!pergunta || !texto(pergunta.id) || !texto(pergunta.prompt) || !texto(pergunta.topic) || (!salvo && pergunta.topic !== dados.tema)
      || ids.has(pergunta.id) || enunciados.has(chaveTema(pergunta.prompt))
      || !Array.isArray(pergunta.answers) || pergunta.answers.length !== 4) throw invalido()
    ids.add(pergunta.id)
    enunciados.add(chaveTema(pergunta.prompt))
    const alternativas = new Set()
    const textos = new Set()
    const answers = pergunta.answers.map((resposta) => {
      if (!resposta || !['a', 'b', 'c', 'd'].includes(resposta.id) || alternativas.has(resposta.id)
        || !texto(resposta.text) || !texto(resposta.explanation) || textos.has(chaveTema(resposta.text))) throw invalido()
      alternativas.add(resposta.id)
      textos.add(chaveTema(resposta.text))
      return { id: resposta.id, text: resposta.text, explanation: resposta.explanation }
    })
    if (!alternativas.has(pergunta.correctAnswerId)) throw invalido()
    return { id: pergunta.id, topic: pergunta.topic, prompt: pergunta.prompt, answers, correctAnswerId: pergunta.correctAnswerId }
  })
  return { ...(salvo ? { id: dados.id, livro: dados.livro } : {}), tema: dados.tema, resumo: dados.resumo, perguntas }
}

export function validarMaterialSalvo(dados, id) {
  if (!dados || String(dados.id) !== String(id)) throw invalido()
  return validarMaterial(dados, null, { salvo: true })
}

export function acaoParaErro(erro) {
  const corrigir = erro?.status === 404 || ['perguntas_indisponiveis', 'tema_ausente', 'entrada_invalida', 'tema_amplo', 'tema_invalido', 'ia_recusou'].includes(erro?.code)
  return { mensagem: erro?.status === 404 ? 'Não encontramos esse resumo.' : erro?.message ?? 'Não foi possível carregar o material. Tente novamente.', podeTentarNovamente: !corrigir }
}
