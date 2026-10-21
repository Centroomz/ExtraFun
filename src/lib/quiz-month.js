// "Quiz miesiąca" registry — one quiz per editorial month, same keying as
// theme-month.js's MONTH_THEMES (shares its `activeMonth` so the two never
// drift out of sync). A month with no entry here → no quiz that month; the
// quiz module/tile disappears, never a placeholder.
//
// Each quiz lives in its own file (quiz-<slug>.js, exporting `QUIZ`) — this
// file only wires them to a month.

import { QUIZ as PLAZOWICZ_QUIZ } from './quiz-plazowicz'
import { QUIZ as DOGGING_QUIZ } from './quiz-dogging'
import { QUIZ as SWING_QUIZ } from './quiz-swing'
import { QUIZ as BI_CURIOUS_QUIZ } from './quiz-bi-curious'
import { activeMonth } from './theme-month'

export const MONTH_QUIZZES = {
  7: PLAZOWICZ_QUIZ,
  8: PLAZOWICZ_QUIZ,
  9: DOGGING_QUIZ,
  10: SWING_QUIZ,
  11: BI_CURIOUS_QUIZ,
}

export function getMonthQuiz(date = new Date()) {
  return MONTH_QUIZZES[activeMonth(date)] || null
}

export function getLastMonthQuiz(date = new Date()) {
  return getPastQuizzes(date, 1)[0] || null
}

// Unlike getPastThemes (every month has a theme, so it stops at the first
// gap), not every month has a quiz — this walks back up to a full year and
// collects whichever months actually had one, skipping the gaps.
export function getPastQuizzes(date = new Date(), max = 6) {
  const currentMonth = activeMonth(date)
  const out = []
  for (let i = 1; i <= 12 && out.length < max; i++) {
    const m = ((currentMonth - 1 - i) % 12 + 12) % 12 + 1
    const quiz = MONTH_QUIZZES[m]
    if (quiz) out.push(quiz)
  }
  return out
}

// Per-quiz completion flag — was one shared 'ef_quiz_dogging_done' key
// (hardcoded to whichever quiz was "current" at the time), which meant
// finishing October's quiz would have nothing to do with September's.
// Keying by slug lets each quiz remember completion independently.
export function quizDoneKey(quiz) {
  return `ef_quiz_${quiz.slug}_done`
}
