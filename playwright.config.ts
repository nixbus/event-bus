import { createRequire } from 'node:module'

import { defineConfig, devices, expect, test } from '@playwright/test'

expect.extend({
  verify(received: Record<any, any> | string) {
    try {
      const snapshotFolderName = '.snapshots'
      const platform = test.info().titlePath[0].split('/')[0] as 'server' | 'client'
      const suiteName = test.info().titlePath[1].replace(/ /g, '_')
      const testName = test.info().titlePath[2].replace(/ /g, '_')
      expect(JSON.stringify(received, null, 2)).toMatchSnapshot([
        platform,
        snapshotFolderName,
        `${suiteName}_${testName}.json`,
      ])
      return {
        pass: true,
        message: () => 'Snapshot matches',
      }
    } catch (error: any) {
      return {
        pass: false,
        message: () => error.message,
      }
    }
  },
})

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  snapshotPathTemplate: '{testDir}/{arg}{ext}',
  reporter: 'line',
  use: {
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  expect: {
    timeout: 5000,
  },
})
