import assert from 'node:assert/strict'
import test from 'node:test'
import { classificarTema, normalizar } from './temas.js'

test('normaliza acentos, caixa e espaços', () => {
  assert.equal(normalizar('  Cálculo   I '), 'calculo i')
})

test('temas específicos são aceitos', () => {
  for (const tema of ['Regra da cadeia', 'Trigonometria', 'Limite', 'Integral definida']) {
    assert.equal(classificarTema(tema).status, 'ok', tema)
  }
})

test('temas amplos pedem para destrinchar e voltam com o nome bonito', () => {
  assert.deepEqual(classificarTema('calculo  i'), { status: 'amplo', tema: 'Cálculo I' })
  assert.deepEqual(classificarTema('QUÍMICA'), { status: 'amplo', tema: 'Química' })
})

test('textos sem cara de matéria são inválidos', () => {
  for (const tema of ['', 'a', '12', '2+2', 'qwrtp', 'aaaaaa', '???']) {
    assert.equal(classificarTema(tema).status, 'invalido', tema)
  }
})
