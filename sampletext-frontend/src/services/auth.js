// Armazenamento compatível com a sessão antiga { token, nome }.
const CHAVE = 'sampletext.sessao'
export const EVENTO_SESSAO_EXPIRADA = 'sampletext:sessao-expirada'
let memoria = null
let somenteMemoria = false

function validar(sessao) {
  const nome = sessao?.usuario?.nome ?? sessao?.nome
  if (typeof sessao?.token !== 'string' || !sessao.token.trim() || typeof nome !== 'string' || !nome.trim()) return null
  return { token: sessao.token, nome, usuario: sessao.usuario ?? { nome } }
}

export function salvarSessao({ token, usuario }) {
  const sessao = validar({ token, usuario })
  if (!sessao) throw new Error('O servidor retornou uma sessão inválida.')
  memoria = sessao
  try {
    localStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    somenteMemoria = true
    // A sessão permanece em memória quando o navegador bloqueia o armazenamento.
  }
  return sessao
}

export function lerSessao() {
  if (somenteMemoria) return memoria
  let texto
  try {
    texto = localStorage.getItem(CHAVE)
  } catch {
    return memoria
  }
  try { memoria = validar(JSON.parse(texto)) } catch { memoria = null }
  return memoria
}

export function limparSessao() {
  memoria = null
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    somenteMemoria = true
  }
}

export function invalidarSessao(token) {
  if (!token || lerSessao()?.token !== token) return
  limparSessao()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA))
}

export function eventoDeSessao(evento) {
  return evento.key === CHAVE || evento.key === null
}
