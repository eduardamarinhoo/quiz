import express from 'express'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dataDir = path.join(__dirname, 'data')
mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(path.join(dataDir, 'votes.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS votes (
    voter    TEXT PRIMARY KEY,
    vote1    TEXT NOT NULL,
    vote2    TEXT NOT NULL,
    score1   INTEGER NOT NULL,
    score2   INTEGER NOT NULL,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)

const TALES = ['emanuel','gabriel','marcos','matheus','gabriela','gustavo','mariaeduarda']

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

app.get('/api/votes', (req, res) => {
  const rows = db.prepare('SELECT voter, vote1, vote2, score1, score2 FROM votes').all()

  const votes = {}
  const scores = Object.fromEntries(TALES.map(t => [t, 0]))

  for (const row of rows) {
    votes[row.voter] = { vote1: row.vote1, vote2: row.vote2, score1: row.score1, score2: row.score2 }
    if (row.vote1 in scores) scores[row.vote1] += row.score1
    if (row.vote2 in scores) scores[row.vote2] += row.score2
  }

  res.json({ votes, scores })
})

app.post('/api/votes', (req, res) => {
  const { voter, vote1, vote2, score1, score2 } = req.body
  if (!voter || !vote1 || !vote2) return res.status(400).json({ error: 'Dados incompletos' })

  db.prepare('INSERT OR REPLACE INTO votes (voter, vote1, vote2, score1, score2) VALUES (?,?,?,?,?)')
    .run(voter, vote1, vote2, score1, score2)

  res.json({ ok: true })
})

app.post('/api/reset', (req, res) => {
  if (req.body.senha !== 'resetar2026') return res.status(403).json({ error: 'Senha incorreta' })
  db.prepare('DELETE FROM votes').run()
  res.json({ ok: true })
})

app.listen(3000, () => console.log('Rodando em http://localhost:3000'))
