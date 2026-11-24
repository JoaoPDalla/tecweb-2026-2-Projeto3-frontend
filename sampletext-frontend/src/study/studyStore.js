import { ApiError } from '../services/api.js'
import { gerarConteudo } from '../services/geracao.js'
import { abrirConteudo } from '../services/conteudos.js'
import { chaveMaterial, validarMaterialSalvo } from './material.js'

// Estado de transporte isolado de React e da correção/pontuação do quiz.
export function createStudyStore(carregar = gerarConteudo, abrir = abrirConteudo) {
  let estado = { status: 'idle', chave: '', temaSolicitado: '', conteudoId: null, livro: null, conteudo: null, erro: null, materialId: 0, salvos: {} }
  let pendente = null
  let versao = 0
  let assinantes = 0
  const ouvintes = new Set()
  const publicar = (novo) => { estado = novo; ouvintes.forEach((ouvinte) => ouvinte()) }
  const cancelar = () => { versao++; pendente?.controlador.abort(); pendente = null }

  function load(tema, { livro = null, conteudoId = null } = {}) {
    const salvo = conteudoId !== null
    const chave = chaveMaterial(tema, conteudoId)
    const idValido = /^\d+$/.test(String(conteudoId)) && Number.isSafeInteger(Number(conteudoId)) && Number(conteudoId) > 0
    if (salvo ? !idValido : (!chave || typeof tema !== 'string' || tema.trim().length > 255)) {
      cancelar()
      publicar({ ...estado, status: 'error', chave, conteudo: null, temaSolicitado: tema ?? '', livro,
        erro: new ApiError(salvo ? 'O identificador do resumo é inválido.' : 'Escolha um tema com 1 a 255 caracteres para estudar.', 400, 'tema_ausente') })
      return Promise.resolve(null)
    }
    if (chave === estado.chave) {
      if (!salvo && livro !== estado.livro) publicar({ ...estado, livro })
      if (pendente) return pendente.promessa
      if (estado.status === 'ready') return Promise.resolve(estado.conteudo)
    }
    cancelar()
    const atual = versao
    const controlador = new AbortController()
    const temaNormalizado = typeof tema === 'string' ? tema.trim().replace(/\s+/g, ' ') : ''
    publicar({ ...estado, status: 'loading', chave, temaSolicitado: temaNormalizado, conteudoId, livro, conteudo: null, erro: null, salvos: {} })
    const promessa = Promise.resolve().then(() => {
      if (controlador.signal.aborted) throw new DOMException('Operação cancelada.', 'AbortError')
      return salvo ? abrir(conteudoId, { signal: controlador.signal }).then((dados) => validarMaterialSalvo(dados, conteudoId))
        : carregar(temaNormalizado, { signal: controlador.signal })
    })
      .then((conteudo) => {
        if (atual !== versao || controlador.signal.aborted) return null
        publicar({ ...estado, status: 'ready', conteudo, temaSolicitado: salvo ? conteudo.tema : estado.temaSolicitado,
          livro: salvo ? conteudo.livro : estado.livro, erro: null, materialId: estado.materialId + 1 })
        return conteudo
      })
      .catch((erro) => {
        if (atual === versao && !controlador.signal.aborted) publicar({ ...estado, status: 'error', conteudo: null, erro })
        return null
      })
      .finally(() => { if (atual === versao) pendente = null })
    pendente = { controlador, promessa }
    return promessa
  }

  return {
    load,
    recordSaved: (livro, resultado, materialId) => {
      if (estado.materialId === materialId && estado.status === 'ready') publicar({ ...estado, salvos: { ...estado.salvos, [livro]: resultado } })
    },
    getSnapshot: () => estado,
    subscribe: (ouvinte) => { ouvintes.add(ouvinte); return () => ouvintes.delete(ouvinte) },
    connect: () => {
      assinantes++
      return () => {
        assinantes--
        // StrictMode remonta os efeitos antes deste cancelamento, sem duplicar a geração.
        queueMicrotask(() => { if (assinantes === 0) cancelar() })
      }
    },
  }
}
