const NO_TIME = '-'

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function computePlayerStats(history) {
  const escapedTimes = history
    .filter((game) => game.result?.completed)
    .map((game) => game.result.completion_time)

  return {
    played: history.length,
    escaped: escapedTimes.length,
    bestTime: escapedTimes.length ? formatTime(Math.min(...escapedTimes)) : NO_TIME,
  }
}
