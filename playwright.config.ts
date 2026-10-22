import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 45000, workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['line'], ['html', {open:'never'}]] : 'list',
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', channel: 'chromium', baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run dev -- --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});
