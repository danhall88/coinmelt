import type { MBOSpec, MBOScoreRecord } from '@/types/icm-dsl'

export function computeMBOMultiplier(
  mbo: MBOSpec,
  scores: MBOScoreRecord[]
): number {
  const scoreMap = Object.fromEntries(scores.map(s => [s.objectiveId, s.score]))

  switch (mbo.aggregation) {
    case 'weighted_average': {
      let total = 0
      let weightSum = 0
      for (const obj of mbo.objectives) {
        const score = scoreMap[obj.id] ?? 0
        total += score * obj.weight
        weightSum += obj.weight
      }
      return weightSum === 0 ? 1 : total / weightSum
    }
    case 'all_or_nothing': {
      const allMet = mbo.objectives.every(obj => {
        const score = scoreMap[obj.id] ?? 0
        return score >= (obj.fullScoreThreshold ?? 1.0)
      })
      return allMet ? 1 : 0
    }
    case 'proportional': {
      let met = 0
      for (const obj of mbo.objectives) {
        const score = scoreMap[obj.id] ?? 0
        if (score >= (obj.fullScoreThreshold ?? 1.0)) met++
      }
      return mbo.objectives.length === 0 ? 1 : met / mbo.objectives.length
    }
  }
}
