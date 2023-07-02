import * as core from '@actions/core'

import { pullRequestsMetrics } from './github'
import { setVerbose } from './utils/verbose'

const validateEnvs = (): void => {
  if (process.env.GITHUB_TOKEN == null || process.env.GITHUB_TOKEN === '') {
    throw new Error('GITHUB_TOKEN is not set')
  }
}

async function run(): Promise<void> {
  try {
    validateEnvs()

    const owner: string = core.getInput('owner')
    const repo: string = core.getInput('repo')
    const startDate: string = core.getInput('start-date')
    const unit: string = core.getInput('cycle-unit')
    const gmt: string = core.getInput('gmt')
    const branches: string[] = core
      .getInput('branches')
      .split(',')
      .map((branch) => branch.trim())
    const verbose: boolean = core.getInput('verbose') === 'true'

    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new Error(`Invalid start date: ${startDate}`)
    }
    if (unit !== 'week' && unit !== 'month') {
      throw new Error(`Invalid cycle unit: ${unit}`)
    }

    if (verbose) {
      setVerbose()
    }

    const metrics = await pullRequestsMetrics(owner, repo, branches, {
      cycleOptions: {
        startDate,
        unit,
        gmt,
      },
    })

    core.setOutput('merged-count', metrics.mergedCount)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
