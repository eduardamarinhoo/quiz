import { useState, useEffect, useCallback } from 'react'

const TALES = [
  { id: 'emanuel',      title: 'Um erro que não aparece em exames', author: 'Emanuel'       },
  { id: 'gabriel',      title: 'Chá de amor',                       author: 'Gabriel'       },
  { id: 'marcos',       title: 'Depois do dia',                     author: 'Marcos'        },
  { id: 'matheus',      title: 'Infusão',                           author: 'Matheus'       },
  { id: 'gabriela',     title: 'O Chá da Memória',                  author: 'Gabriela'      },
  { id: 'gustavo',      title: 'O Jogo dos Condenados',             author: 'Gustavo'       },
  { id: 'mariaeduarda', title: 'Sabor da Montanha',                 author: 'Maria Eduarda' },
]

const NAME_TO_TALE = {
  'Emanuel': 'emanuel', 'Gabriel': 'gabriel', 'Marcos': 'marcos',
  'Matheus': 'matheus', 'Gabriela': 'gabriela', 'Gustavo': 'gustavo',
  'Maria Eduarda': 'mariaeduarda',
}

const NAMES = ['Gabriela', 'Gabriel', 'Gustavo', 'Matheus', 'Marcos', 'Maria Eduarda', 'Emanuel']

const QUESTIONS = [
  {
    id: 'q1',
    text: 'O conto tem ambientação brasileira ou catarinense bem desenvolvida?',
    opts: [
      { label: 'Sim, é central na história',                        color: 'green', pts: 3 },
      { label: 'Está presente, mas poderia ser mais desenvolvida',  color: 'amber', pts: 1 },
      { label: 'Não tem ou é muito superficial',                    color: 'red',   pts: 0 },
    ],
  },
  {
    id: 'q2',
    text: 'O conflito, clímax e desfecho estão claros o suficiente para virar um curta?',
    opts: [
      { label: 'Sim, a estrutura está bem definida',   color: 'green', pts: 3 },
      { label: 'Dá para adaptar com alguns ajustes',   color: 'amber', pts: 1 },
      { label: 'A estrutura é confusa ou incompleta',  color: 'red',   pts: 0 },
    ],
  },
  {
    id: 'q3',
    text: 'Você consegue enxergar esse conto sendo gravado com os recursos que o grupo tem?',
    opts: [
      { label: 'Sim, é viável e tem potencial visual forte', color: 'green', pts: 3 },
      { label: 'É viável, mas exigiria bastante esforço',    color: 'amber', pts: 1 },
      { label: 'Seria muito difícil ou inviável de gravar',  color: 'red',   pts: 0 },
    ],
  },
]

function ProgBar({ step }) {
  return (
    <div className="progress">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`prog-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
      ))}
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('names')
  const [db, setDb] = useState({ votes: {}, scores: {} })
  const [user, setUser] = useState(null)
  const [vote1, setVote1] = useState(null)
  const [vote2, setVote2] = useState(null)
  const [quiz1, setQuiz1] = useState({})
  const [quiz2, setQuiz2] = useState({})

  const base = import.meta.env.BASE_URL

  const loadDB = useCallback(async () => {
    try {
      const res = await fetch(`${base}api/votes`)
      setDb(await res.json())
    } catch {
      setDb({ votes: {}, scores: {} })
    }
  }, [base])

  useEffect(() => { loadDB() }, [loadDB])

  function selectName(name) {
    setUser(name)
    setVote1(null)
    setVote2(null)
    setQuiz1({})
    setQuiz2({})
    setScreen('vote1')
  }

  function pickTale(round, id) {
    const own = NAME_TO_TALE[user]
    if (id === own) return
    const tale = TALES.find(t => t.id === id)
    if (round === 1) setVote1(tale)
    else setVote2(tale)
  }

  function pickOpt(round, qId, pts) {
    if (round === 1) setQuiz1(prev => ({ ...prev, [qId]: pts }))
    else setQuiz2(prev => ({ ...prev, [qId]: pts }))
  }

  function quizPts(quiz) {
    return Object.entries(quiz)
      .filter(([k]) => !k.endsWith('_color'))
      .reduce((sum, [, v]) => sum + v, 0)
  }

  async function submitVote() {
    const score1 = 3 + quizPts(quiz1)
    const score2 = 1 + quizPts(quiz2)

    await fetch(`${base}api/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voter: user, vote1: vote1.id, vote2: vote2.id, score1, score2 }),
    })

    await loadDB()
    setScreen('ranking')
  }

  async function tryReset() {
    const senha = prompt('Senha de reset:')
    if (senha !== 'resetar2026') { alert('Senha incorreta.'); return }
    if (!confirm('Tem certeza? Todos os votos serão apagados.')) return

    await fetch(`${base}api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    })

    setDb({ votes: {}, scores: {} })
    setScreen('names')
    alert('Votos apagados com sucesso!')
  }

  // ── Tela: Nomes ────────────────────────────────────────────────
  if (screen === 'names') {
    return (
      <div className="container">
        <div className="eyebrow">votação · enquete interdisciplinar</div>
        <div className="page-header">
          <h1>Qual conto vira curta?</h1>
          <p className="subtitle">Selecione seu nome para começar a votar. Cada pessoa vota uma única vez.</p>
        </div>
        <div className="names-grid">
          {NAMES.map(name => {
            const used = db.votes?.[name]
            return (
              <button
                key={name}
                className={`name-btn${used ? ' used' : ''}`}
                onClick={() => selectName(name)}
              >
                {name}{used ? ' ✓' : ''}
              </button>
            )
          })}
        </div>
        <button className="btn-secondary" onClick={() => setScreen('ranking')}>
          Ver ranking atual →
        </button>
      </div>
    )
  }

  // ── Tela: 1ª escolha ──────────────────────────────────────────
  if (screen === 'vote1') {
    const own = NAME_TO_TALE[user]
    return (
      <div className="container">
        <ProgBar step={1} />
        <div className="step-header">
          <div className="eyebrow">1ª escolha</div>
          <h1>Qual conto você escolheria?</h1>
          <p className="subtitle">Este voto tem peso maior. Seu próprio conto está desabilitado.</p>
        </div>
        <div className="tales-grid">
          {TALES.map(t => {
            const isOwn = t.id === own
            const isSel = vote1?.id === t.id
            const cls = isOwn ? 'own' : isSel ? 'selected' : ''
            return (
              <div key={t.id} className={`tale-btn ${cls}`} onClick={() => pickTale(1, t.id)}>
                <div className="tale-title">{t.title}</div>
                <div className="tale-author">{t.author}</div>
                {isOwn && <div className="own-label">seu conto</div>}
              </div>
            )
          })}
        </div>
        <button className="btn-primary" disabled={!vote1} onClick={() => setScreen('quiz1')}>
          Confirmar 1ª escolha →
        </button>
        <button className="btn-back" onClick={() => { loadDB(); setScreen('names') }}>
          ← Voltar
        </button>
      </div>
    )
  }

  // ── Tela: Quiz 1ª escolha ─────────────────────────────────────
  if (screen === 'quiz1') {
    const allDone = QUESTIONS.every(q => quiz1[q.id] !== undefined)
    return (
      <div className="container">
        <ProgBar step={2} />
        <div className="step-header">
          <div className="eyebrow">quiz · 1ª escolha</div>
          <h1>Avalie o conto</h1>
        </div>
        <div className="selected-pill">{vote1?.title}</div>
        {QUESTIONS.map(q => (
          <div key={q.id} className="quiz-block">
            <div className="quiz-q">{q.text}</div>
            <div className="quiz-opts">
              {q.opts.map((o, i) => {
                const isSel = quiz1[q.id] === o.pts && quiz1[`${q.id}_color`] === o.color
                return (
                  <div
                    key={i}
                    className={`quiz-opt${isSel ? ` sel-${o.color}` : ''}`}
                    onClick={() => {
                      setQuiz1(prev => ({ ...prev, [q.id]: o.pts, [`${q.id}_color`]: o.color }))
                    }}
                  >
                    <div className={`opt-circle${isSel ? ` ${o.color}` : ''}`} />
                    <div className="opt-label">{o.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <button className="btn-primary" disabled={!allDone} onClick={() => {
          setVote2(null)
          setQuiz2({})
          setScreen('vote2')
        }}>
          Confirmar e ir para 2ª escolha →
        </button>
        <button className="btn-back" onClick={() => setScreen('vote1')}>← Voltar</button>
      </div>
    )
  }

  // ── Tela: 2ª escolha ──────────────────────────────────────────
  if (screen === 'vote2') {
    const own = NAME_TO_TALE[user]
    return (
      <div className="container">
        <ProgBar step={3} />
        <div className="step-header">
          <div className="eyebrow">2ª escolha</div>
          <h1>Qual seria sua 2ª opção?</h1>
          <p className="subtitle">Este voto tem peso menor, mas conta como critério de desempate.</p>
        </div>
        <div className="tales-grid">
          {TALES.map(t => {
            const isOwn  = t.id === own
            const isExcl = t.id === vote1?.id
            const isSel  = vote2?.id === t.id
            const cls = isOwn ? 'own' : isExcl ? 'disabled' : isSel ? 'selected' : ''
            return (
              <div key={t.id} className={`tale-btn ${cls}`} onClick={() => pickTale(2, t.id)}>
                <div className="tale-title">{t.title}</div>
                <div className="tale-author">{t.author}</div>
                {isOwn && <div className="own-label">seu conto</div>}
              </div>
            )
          })}
        </div>
        <button className="btn-primary" disabled={!vote2} onClick={() => setScreen('quiz2')}>
          Confirmar 2ª escolha →
        </button>
        <button className="btn-back" onClick={() => setScreen('quiz1')}>← Voltar</button>
      </div>
    )
  }

  // ── Tela: Quiz 2ª escolha ─────────────────────────────────────
  if (screen === 'quiz2') {
    const allDone = QUESTIONS.every(q => quiz2[q.id] !== undefined)
    return (
      <div className="container">
        <ProgBar step={4} />
        <div className="step-header">
          <div className="eyebrow">quiz · 2ª escolha</div>
          <h1>Avalie o conto</h1>
        </div>
        <div className="selected-pill">{vote2?.title}</div>
        {QUESTIONS.map(q => (
          <div key={q.id} className="quiz-block">
            <div className="quiz-q">{q.text}</div>
            <div className="quiz-opts">
              {q.opts.map((o, i) => {
                const isSel = quiz2[q.id] === o.pts && quiz2[`${q.id}_color`] === o.color
                return (
                  <div
                    key={i}
                    className={`quiz-opt${isSel ? ` sel-${o.color}` : ''}`}
                    onClick={() => {
                      setQuiz2(prev => ({ ...prev, [q.id]: o.pts, [`${q.id}_color`]: o.color }))
                    }}
                  >
                    <div className={`opt-circle${isSel ? ` ${o.color}` : ''}`} />
                    <div className="opt-label">{o.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <button className="btn-primary" disabled={!allDone} onClick={submitVote}>
          Finalizar votação →
        </button>
        <button className="btn-back" onClick={() => setScreen('vote2')}>← Voltar</button>
      </div>
    )
  }

  // ── Tela: Ranking ─────────────────────────────────────────────
  if (screen === 'ranking') {
    const total = Object.keys(db.votes ?? {}).length
    const ranked = TALES.map(t => ({
      ...t,
      score: db.scores?.[t.id] ?? 0,
      voters: Object.values(db.votes ?? {}).filter(v => v.vote1 === t.id || v.vote2 === t.id).length,
    })).sort((a, b) => b.score - a.score)

    const pos = ['1º','2º','3º','4º','5º','6º','7º']

    return (
      <div className="container">
        <div className="eyebrow">resultado parcial</div>
        <div className="page-header">
          <h1>Ranking atual</h1>
          <p className="subtitle">{total} de {NAMES.length} pessoas já votaram.</p>
        </div>
        <div className="section-label">pontuação</div>
        <div className="rank-list">
          {ranked.map((t, i) => (
            <div key={t.id} className={`rank-item${i === 0 ? ' top' : ''}`}>
              <div className={`rank-pos${i === 0 ? ' gold' : ''}`}>{pos[i]}</div>
              <div className="rank-info">
                <div className="rank-title">{t.title}</div>
                <div className="rank-author">{t.author}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="rank-score">{t.score}</div>
                <div className="rank-votes">{t.voters} voto{t.voters !== 1 ? 's' : ''}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="score-note">
          1ª escolha: até 12 pts (3 base + até 9 do quiz) ·
          2ª escolha: até 6 pts (1 base + até 5 do quiz)
        </p>
        <button className="btn-back" onClick={() => { loadDB(); setScreen('names') }}>
          ← Voltar para votação
        </button>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn-reset" onClick={tryReset}>resetar votos</button>
        </div>
      </div>
    )
  }

  return null
}
