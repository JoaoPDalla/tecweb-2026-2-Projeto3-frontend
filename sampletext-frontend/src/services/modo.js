// Decide se os serviços de livros e conteúdos usam dados de exemplo ou a API real.
// `VITE_USAR_MOCK=false` no .env liga a API real; qualquer outro valor mantém os exemplos.
let forcado = null

export function usarMock() {
  if (forcado !== null) return forcado
  return import.meta.env?.VITE_USAR_MOCK !== 'false'
}

// Só para testes automatizados: força um modo, ou `null` para voltar ao do .env.
export function forcarModoMock(valor) {
  forcado = valor
}
