import { ApiError, request } from './api.js'

export function createAnswerService(http = request) {
  return async ({ questionId, answerId, chaveEnvio, signal }) => {
    if (!/^[1-9]\d*$/.test(String(questionId)) || !Number.isSafeInteger(Number(questionId))) {
      throw new ApiError('Esta pergunta ainda não possui um ID do banco. Atualize o backend e reabra o material.', 409, 'pergunta_sem_id')
    }
    if (!['a', 'b', 'c', 'd'].includes(answerId)) throw new ApiError('Escolha uma alternativa válida.', 400, 'alternativa_invalida')
    const dados = await http(`/perguntas/${questionId}/responder/`, {
      method: 'POST', corpo: { alternativa: answerId, chave_envio: chaveEnvio }, signal,
    })
    if (!dados || !Number.isInteger(dados.id) || String(dados.pergunta) !== String(questionId)
      || dados.alternativa !== answerId || typeof dados.acertou !== 'boolean' || !['a', 'b', 'c', 'd'].includes(dados.resposta_correta)) {
      throw new ApiError('O servidor retornou uma confirmação de resposta inválida. Tente novamente.', 502, 'resposta_invalida')
    }
    return dados
  }
}

export const registrarResposta = createAnswerService()
