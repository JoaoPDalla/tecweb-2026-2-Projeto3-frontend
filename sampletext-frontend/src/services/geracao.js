import { ApiError, request } from './api.js'
import { chaveTema, validarMaterial } from '../study/material.js'

// A geração pode fazer duas chamadas de IA de 120 s, mais a margem de transporte.
const TIMEOUT_IA_MS = 300_000

// Geração/validação da #16 sempre usam a API, sem fallback para os exemplos.
// Os serviços de CRUD e o modo de desenvolvimento dos livros são independentes.
export function createContentService(http = request) {
  return {
    async gerarConteudo(tema, { signal } = {}) {
      const dados = await http('/conteudos/gerar/', { method: 'POST', corpo: { tema }, signal, timeout: TIMEOUT_IA_MS })
      return validarMaterial(dados, tema)
    },
    async validarTema(tema, { signal } = {}) {
      const dados = await http('/conteudos/validar-tema/', { method: 'POST', corpo: { tema }, signal, timeout: TIMEOUT_IA_MS })
      if (!dados || !['ok', 'amplo', 'invalido'].includes(dados.status) || !chaveTema(dados.tema)
        || chaveTema(dados.tema) !== chaveTema(tema) || typeof dados.motivo !== 'string' || !dados.motivo.trim()) {
        throw new ApiError('O servidor retornou uma validação de tema inválida. Tente novamente.', 502, 'resposta_invalida')
      }
      return dados
    },
  }
}

const servico = createContentService()
export const gerarConteudo = servico.gerarConteudo
export const validarTema = servico.validarTema
