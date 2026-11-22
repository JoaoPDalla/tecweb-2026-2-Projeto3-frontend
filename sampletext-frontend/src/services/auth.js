// Guarda a sessão (token + nome) no navegador depois do login.
const CHAVE = 'sampletext.sessao'

export function salvarSessao({ token, usuario }) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ token, nome: usuario.nome }))
  } catch {
    // Sem localStorage (modo privado, por exemplo): o usuário só precisará entrar de novo.
  }
}

export function lerSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE))
  } catch {
    return null
  }
}

export function limparSessao() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // nada a fazer
  }
}