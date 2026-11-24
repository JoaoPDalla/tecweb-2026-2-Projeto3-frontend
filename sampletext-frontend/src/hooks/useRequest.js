import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { api } from '../services/api.js'

export function useApiActivity() {
  return useSyncExternalStore(api.subscribe, api.getPending, () => 0)
}

export function useRequest() {
  const atual = useRef(null)
  const [estado, setEstado] = useState({ loading: false, error: null, data: null })
  useEffect(() => () => { atual.current?.abort(); atual.current = null }, [])
  const executar = useCallback(async (operacao) => {
    atual.current?.abort()
    const controlador = new AbortController()
    atual.current = controlador
    setEstado({ loading: true, error: null, data: null })
    try {
      const data = await operacao(controlador.signal)
      if (atual.current !== controlador || controlador.signal.aborted) throw new DOMException('Operação cancelada.', 'AbortError')
      if (atual.current === controlador) setEstado({ loading: false, error: null, data })
      return data
    } catch (error) {
      if (atual.current === controlador) setEstado({ loading: false, error: error.name === 'AbortError' ? null : error, data: null })
      throw error
    } finally {
      if (atual.current === controlador) atual.current = null
    }
  }, [])
  return { ...estado, executar, cancelar: () => atual.current?.abort() }
}
