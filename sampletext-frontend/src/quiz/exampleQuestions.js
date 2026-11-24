// Exemplos da #14. Trocar a origem dos dados reais faz parte da #16.
export const exampleQuestions = [
  {
    id: 'chain-rule-1', topic: 'Regra da cadeia',
    prompt: 'Qual a derivada de (5x² + 3x³)³?', correctAnswerId: 'd',
    answers: [
      { id: 'a', text: '3(5x² + 3x³)²', explanation: 'Você derivou a função de fora, mas faltou multiplicar pela derivada de dentro.' },
      { id: 'b', text: '3(5x² + 3x³)² + 10x + 9x²', explanation: 'Na regra da cadeia, multiplicamos as derivadas de fora e de dentro, em vez de somá-las.' },
      { id: 'c', text: '(5x² + 3x³)³ · (10x + 9x²)', explanation: 'Você derivou o conteúdo dos parênteses, mas também precisa derivar a potência externa.' },
      { id: 'd', text: '3(5x² + 3x³)² · (10x + 9x²)', explanation: 'A derivada de fora é 3(5x² + 3x³)² e a de dentro é 10x + 9x². Multiplicamos as duas.' },
    ],
  },
  {
    id: 'chain-rule-2', topic: 'Regra da cadeia',
    prompt: 'Qual a derivada de (2x + 1)⁴?', correctAnswerId: 'b',
    answers: [
      { id: 'a', text: '4(2x + 1)³', explanation: 'Faltou multiplicar pela derivada de 2x + 1, que é 2.' },
      { id: 'b', text: '8(2x + 1)³', explanation: 'Derivamos a potência: 4(2x + 1)³. Multiplicando pela derivada de dentro, 2, obtemos 8(2x + 1)³.' },
      { id: 'c', text: '2(2x + 1)⁴', explanation: 'A potência externa também precisa ser derivada: o expoente 4 passa a multiplicar e diminui para 3.' },
      { id: 'd', text: '4(2x + 1)³ + 2', explanation: 'As derivadas são multiplicadas, e não somadas.' },
    ],
  },
  {
    id: 'chain-rule-3', topic: 'Regra da cadeia',
    prompt: 'Qual a derivada de (x² + 1)⁵?', correctAnswerId: 'c',
    answers: [
      { id: 'a', text: '5(x² + 1)⁴', explanation: 'Faltou multiplicar pela derivada de x² + 1, que é 2x.' },
      { id: 'b', text: '2x(x² + 1)⁵', explanation: 'A função de fora também precisa ser derivada, produzindo 5(x² + 1)⁴.' },
      { id: 'c', text: '10x(x² + 1)⁴', explanation: 'Multiplicamos a derivada de fora, 5(x² + 1)⁴, pela derivada de dentro, 2x.' },
      { id: 'd', text: '5(x² + 1)⁴ + 2x', explanation: 'Na regra da cadeia, as derivadas de fora e de dentro são multiplicadas.' },
    ],
  },
]
