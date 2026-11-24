export function material(tema = 'Regra da potência') {
  return { tema, resumo: `## ${tema}\n\nUse $\\frac{d}{dx}x^n = nx^{n-1}$.`,
    perguntas: Array.from({ length: 10 }, (_, i) => ({
      id: `pergunta-${i + 1}`, topic: tema, prompt: `Qual é a derivada de $x^{${i + 2}}$?`, correctAnswerId: 'a',
      answers: [
        { id: 'a', text: `$${i + 2}x^{${i + 1}}$`, explanation: 'Multiplica pelo expoente e diminui o expoente em um.' },
        { id: 'b', text: `$x^{${i + 1}}$`, explanation: 'Faltou multiplicar pelo expoente original.' },
        { id: 'c', text: `$${i + 2}x^{${i + 2}}$`, explanation: 'Faltou diminuir o expoente em um.' },
        { id: 'd', text: '$0$', explanation: 'A função não é constante.' },
      ],
    })),
  }
}
