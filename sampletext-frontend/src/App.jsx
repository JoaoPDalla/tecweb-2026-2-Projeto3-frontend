import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import NaoEncontrada from './pages/NaoEncontrada'
import Resolucao from './pages/Resolucao'
import Resumo from './pages/Resumo'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/resumo" element={<Resumo />} />
      <Route path="/resolucao" element={<Resolucao />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}