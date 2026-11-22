import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import './Markdown.css'

// Mostra o texto da IA: Markdown + fórmulas em LaTeX ($...$ e $$...$$).
// `inline` tira o parágrafo em volta, para textos curtos (enunciado, alternativas).
const SEM_PARAGRAFO = { p: ({ children }) => <>{children}</> }

export default function Markdown({ children, inline = false }) {
  return (
    <div className={inline ? 'markdown markdown--inline' : 'markdown'}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={inline ? SEM_PARAGRAFO : undefined}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}