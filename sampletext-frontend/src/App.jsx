import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import NaoEncontrada from './pages/NaoEncontrada'
import Resumo from './pages/Resumo'
import { QuizSession } from './quiz/QuizSession'
import { QuizQuestionPage, QuizResolutionPage, QuizResultPage } from './quiz/QuizPages'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/resumo" element={<Resumo />} />
      <Route element={<QuizSession />}>
        <Route path="/pergunta" element={<QuizQuestionPage />} />
        <Route path="/resolucao" element={<QuizResolutionPage />} />
        <Route path="/resultado" element={<QuizResultPage />} />
      </Route>
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}
