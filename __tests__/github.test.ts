import { expect, test } from '@jest/globals'

import { pullRequestsMetrics } from '../src/github'
import { setVerbose } from '../src/utils/verbose'

// Note that process.env.GITHUB_TOKEN is required to run this test
test('pullRequestsMetrics', async () => {
  setVerbose()
  // assert not throwing
  const metrics = await pullRequestsMetrics('octokit', 'rest.js', [], {
    cycleOptions: {
      startDate: '2023-06-09',
      unit: 'week',
    },
    listPullRequestsOptions: {
      limit: 100,
      // eslint-disable-next-line camelcase
      per_page: 100,
    },
  })
  expect(metrics).toBeDefined()
  expect(metrics).toHaveProperty('cycleOptions')
  expect(metrics).toHaveProperty('mergedCount')
}, 10000)
