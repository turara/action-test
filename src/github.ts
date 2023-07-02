import { Octokit } from '@octokit/rest'

import { isVerbose } from './utils/verbose'
import { getPeriod, isInvalidDate } from './utils/date'

const baseHeaders = {
  'X-GitHub-Api-Version': '2022-11-28',
}

const createClient = () => {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set')
  }
  return new Octokit({ auth: token })
}

type PullRequest = {
  created_at: string
  merged_at: string | null
  base: {
    ref: string
  }
}

/* eslint-disable camelcase */
const extractPullRequest = <T extends PullRequest>(pr: T): PullRequest => {
  const { created_at, merged_at, base } = pr
  return {
    created_at,
    merged_at,
    base: {
      ref: base.ref,
    },
  }
}
/* eslint-enable camelcase */

type ListPullRequestsOptions = {
  direction: 'asc' | 'desc'
  limit?: number
  per_page: number
  sort: 'created' | 'updated' | 'popularity' | 'long-running'
  state: 'open' | 'closed' | 'all'
}

const defaultListPullRequestsOption: ListPullRequestsOptions = {
  direction: 'desc',
  // limit: undefined,
  // eslint-disable-next-line camelcase
  per_page: 100,
  sort: 'created',
  // Note that the default value of `state` is `closed` here
  state: 'closed',
}

const listPullRequests = async (
  owner: string,
  repo: string,
  options?: Partial<ListPullRequestsOptions>
): Promise<PullRequest[]> => {
  const octokit = createClient()

  const items: PullRequest[] = []
  for (let page = 1; ; page++) {
    if (isVerbose) {
      // eslint-disable-next-line no-console
      console.log(`[listPullRequests] Listing pull requests for page:${page}`)
    }

    const response = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      headers: {
        ...baseHeaders,
      },
      ...defaultListPullRequestsOption,
      ...options,
      page,
    })
    if (response.status !== 200) {
      throw new Error(`status ${response.status}`)
    }
    if (response.data.length === 0) {
      break
    }

    if (isVerbose) {
      // eslint-disable-next-line no-console
      console.log(`[listPullRequests] Found ${response.data.length} pull requests`)
    }
    items.push(...response.data)

    if (options?.limit && items.length >= options.limit) {
      break
    }
  }

  return items
}

type CycleOptions = {
  startDate: string // ex: "2021-01-01"
  unit: 'week' | 'month'
  gmt: string // ex: "GMT+0900"
}

const defaultCycleOptions: CycleOptions = (() => {
  const now = new Date()
  const startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
  // Last 1 week
  return {
    startDate: `${startAt.getFullYear()}-${startAt.getMonth() + 1}-${startAt.getDate()}`,
    unit: 'week',
    gmt: 'GMT+0900',
  }
})()

type PullRequestsMetrics = {
  cycleOptions: CycleOptions
  mergedCount: number
}

export const pullRequestsMetrics = async (
  owner: string,
  repo: string,
  baseBranches: string[] = [],
  options?: {
    cycleOptions?: Partial<CycleOptions>
    // Note that this option is exposed for testing purpose
    listPullRequestsOptions?: Partial<Pick<ListPullRequestsOptions, 'limit' | 'per_page'>>
  }
): Promise<PullRequestsMetrics> => {
  const cycleOptions = {
    ...defaultCycleOptions,
    ...options?.cycleOptions,
  }
  const period = getPeriod(cycleOptions.startDate, cycleOptions.unit, cycleOptions.gmt)
  if (isVerbose) {
    // eslint-disable-next-line no-console
    console.log(
      `[pullRequestsMetrics] period: ${period.startAt.toISOString()} - ${period.endAt.toISOString()}`
    )
  }

  const prs = await listPullRequests(owner, repo, options?.listPullRequestsOptions)
  const targetPrs = prs
    .filter((pr) => {
      if (baseBranches.length === 0) {
        return true
      }
      return baseBranches.some((baseBranch) => pr.base.ref.startsWith(baseBranch))
    })
    .filter((pr) => {
      /* eslint-disable camelcase */
      const { merged_at } = pr
      if (merged_at == null) {
        return false
      }
      const mergedAt = new Date(merged_at)
      if (isInvalidDate(mergedAt)) {
        return false
      }
      return period.startAt <= mergedAt && mergedAt <= period.endAt
      /* eslint-enable camelcase */
    })
  if (isVerbose) {
    // eslint-disable-next-line no-console
    console.log(
      '[pullRequestsMetrics] targetPrs:',
      JSON.stringify(
        targetPrs.slice(0, Math.min(targetPrs.length, 100)).map(extractPullRequest),
        null,
        2
      )
    )
  }
  return {
    cycleOptions,
    mergedCount: targetPrs.length,
  }
}
