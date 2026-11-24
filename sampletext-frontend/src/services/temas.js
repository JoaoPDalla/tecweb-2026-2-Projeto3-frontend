// Regras de exemplo para classificar o tema digitado na busca.
// Só é usado no modo mock: com a API real, quem decide é o backend (validação do tema).
// Sem imports de propósito, para poder ser testado com `node --test`.

export function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Assuntos grandes demais para gerar um resumo: o usuário precisa "destrinchar".
// A chave é o texto normalizado; o valor é o nome para mostrar na tela.
const TEMAS_AMPLOS = {
  calculo: 'Cálculo',
  'calculo i': 'Cálculo I',
  'calculo 1': 'Cálculo 1',
  'calculo ii': 'Cálculo II',
  'calculo 2': 'Cálculo 2',
  matematica: 'Matemática',
  fisica: 'Física',
  quimica: 'Química',
  biologia: 'Biologia',
  historia: 'História',
  geografia: 'Geografia',
  filosofia: 'Filosofia',
  sociologia: 'Sociologia',
  portugues: 'Português',
  ingles: 'Inglês',
  algebra: 'Álgebra',
  geometria: 'Geometria',
  economia: 'Economia',
}

// Devolve { status: 'ok' | 'amplo' | 'invalido', tema? }.
export function classificarTema(texto) {
  const limpo = normalizar(texto ?? '')
  const letras = limpo.replace(/[^a-z]/g, '')

  if (letras.length < 3 || !/[aeiou]/.test(letras) || /(.)\1{3,}/.test(letras)) {
    return { status: 'invalido' }
  }
  if (Object.hasOwn(TEMAS_AMPLOS, limpo)) {
    return { status: 'amplo', tema: TEMAS_AMPLOS[limpo] }
  }
  return { status: 'ok' }
}
