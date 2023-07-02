export const isInvalidDate = (date: Date) => Number.isNaN(date.getTime())

type Period = {
  startAt: Date
  endAt: Date
}

export const getPeriod = (startDate: string, unit: 'week' | 'month', gmt = 'GMT'): Period => {
  const startAt = new Date(`${startDate} 00:00:00 ${gmt}`)
  if (isInvalidDate(startAt)) {
    throw new Error(`[getPeriod] Invalid date: ${startDate} 00:00:00 ${gmt}`)
  }
  const endAt = new Date(startAt.getTime())
  if (unit === 'week') {
    endAt.setDate(endAt.getDate() + 7)
  } else if (unit === 'month') {
    endAt.setMonth(endAt.getMonth() + 1)
  }
  return { startAt, endAt }
}
