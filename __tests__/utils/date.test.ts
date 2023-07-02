import { describe, expect, test } from '@jest/globals'

import { getPeriod } from '../../src/utils/date'

describe('getPeriod', () => {
  test('throws if invalid args are given', () => {
    expect(() => {
      getPeriod('invalid date string', 'week')
    }).toThrow()
  })

  test('returns week period', () => {
    const { startAt, endAt } = getPeriod('2023-07-01', 'week', 'GMT+0900')
    const expectedStartAt = new Date('2023-07-01 00:00:00 GMT+0900')
    const expectedEndAt = new Date('2023-07-08 00:00:00 GMT+0900')
    expect(startAt.getTime()).toBe(expectedStartAt.getTime())
    expect(endAt.getTime()).toBe(expectedEndAt.getTime())
  })

  test('returns month period', () => {
    const { startAt, endAt } = getPeriod('2023-07-01', 'month', 'GMT+0900')
    const expectedStartAt = new Date('2023-07-01 00:00:00 GMT+0900')
    const expectedEndAt = new Date('2023-08-01 00:00:00 GMT+0900')
    expect(startAt.getTime()).toBe(expectedStartAt.getTime())
    expect(endAt.getTime()).toBe(expectedEndAt.getTime())
  })
})
