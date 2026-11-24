import { ApiError } from '../services/api.js'
import { registrarResposta } from '../services/respostas.js'
import { createQuizState, quizReducer } from './quiz.js'

// Transporte e confirmação são externos ao reducer puro da #14.
export function createPersistentQuiz(perguntas, enviar = registrarResposta, uuid = () => crypto.randomUUID()) {
  let snapshot = { state: createQuizState(perguntas), pending: false, error: null }
  let pendente = null
  let versao = 0
  let conexoes = 0
  const chaves = new Map()
  const ouvintes = new Set()
  const publicar = (valor) => { snapshot = valor; ouvintes.forEach((ouvinte) => ouvinte()) }
  const cancelar = () => { versao++; pendente?.controlador.abort(); pendente = null }

  function dispatch(action) {
    if (action.type === 'restart') {
      cancelar()
      chaves.clear()
      publicar({ state: quizReducer(snapshot.state, action), pending: false, error: null })
    } else if (action.type === 'continue' && !snapshot.pending) {
      publicar({ ...snapshot, state: quizReducer(snapshot.state, action) })
    }
  }

  function submitAnswer({ questionId, answerId }) {
    const estado = snapshot.state
    const pergunta = estado.questions[estado.position]
    if (estado.phase !== 'question' || pergunta?.id !== questionId || !pergunta.answers.some(a => a.id === answerId)) {
      return Promise.reject(new ApiError('Esta resposta não corresponde à pergunta atual.', 400, 'resposta_fora_de_etapa'))
    }
    if (pendente) return pendente.answerId === answerId ? pendente.promessa
      : Promise.reject(new ApiError('Aguarde a confirmação da resposta em andamento.', 409, 'envio_em_andamento'))
    const chave = `${estado.attempt}/${questionId}`
    if (!chaves.has(chave)) chaves.set(chave, uuid())
    const controlador = new AbortController()
    const atual = versao
    publicar({ ...snapshot, pending: true, error: null })
    const promessa = Promise.resolve().then(() => {
      if (controlador.signal.aborted) throw new DOMException('Envio cancelado.', 'AbortError')
      return enviar({ questionId, answerId, chaveEnvio: chaves.get(chave), signal: controlador.signal })
    }).then((resposta) => {
      if (atual !== versao || controlador.signal.aborted) throw new DOMException('Envio cancelado.', 'AbortError')
      if (resposta.resposta_correta !== pergunta.correctAnswerId || resposta.acertou !== (answerId === pergunta.correctAnswerId)) {
        throw new ApiError('O gabarito deste material mudou no servidor. Reabra o material antes de continuar.', 409, 'gabarito_alterado')
      }
      publicar({ state: quizReducer(snapshot.state, { type: 'answer', questionId, answerId }), pending: false, error: null })
      return resposta
    }).catch((error) => {
      if (atual === versao && !controlador.signal.aborted) publicar({ ...snapshot, pending: false, error })
      throw error
    }).finally(() => { if (atual === versao) pendente = null })
    pendente = { controlador, promessa, answerId }
    return promessa
  }

  return {
    dispatch, submitAnswer,
    getSnapshot: () => snapshot,
    subscribe: (ouvinte) => { ouvintes.add(ouvinte); return () => ouvintes.delete(ouvinte) },
    connect: () => {
      conexoes++
      return () => { conexoes--; queueMicrotask(() => { if (!conexoes) cancelar() }) }
    },
  }
}
