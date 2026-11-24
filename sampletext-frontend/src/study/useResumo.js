import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequest } from '../hooks/useRequest'
import { salvarConteudo } from '../services/conteudos.js'
import { useStudy } from './useStudy'

export function useResumo() {
  const { conteudo, conteudoId, livro, materialId, href, salvos, registrarSalvo } = useStudy()
  const navigate = useNavigate()
  const pedido = useRequest()
  const trava = useRef(false)
  const [escolhendoLivro, setEscolhendoLivro] = useState(false)
  const reaberto = conteudoId !== null
  const livroSalvo = reaberto ? conteudo.livro : Object.keys(salvos).at(-1)
  const ativo = Boolean(livroSalvo)
  const statusSalvar = ativo ? 'salvo' : pedido.loading ? 'salvando' : pedido.error ? 'erro' : 'parado'
  function guardar(livroId, signal) {
    return salvarConteudo({ livro: livroId, tema: conteudo.tema, resumo: conteudo.resumo }, { signal })
  }
  async function salvar() {
    if (trava.current || ativo) return
    if (!livro) { setEscolhendoLivro(true); return }
    trava.current = true
    try {
      const resultado = await pedido.executar((signal) => guardar(livro, signal))
      registrarSalvo(livro, resultado, materialId)
    } catch {
      // O erro é apresentado pela tela; o material validado continua disponível.
    } finally {
      trava.current = false
    }
  }
  function salvoNoModal({ livroId, conteudo: salvo }) {
    setEscolhendoLivro(false)
    registrarSalvo(livroId, salvo, materialId)
  }
  return { conteudo, reaberto, livroSalvo, statusSalvar, salvar, guardar, salvoNoModal,
    escolhendoLivro, fecharModal: () => setEscolhendoLivro(false), mensagemSalvar: pedido.error?.message ?? '',
    irParaPerguntas: () => navigate(href('/pergunta')) }
}
