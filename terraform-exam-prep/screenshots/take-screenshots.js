import { chromium } from 'playwright'
import { preview } from 'vite'
import { resolve, join } from 'path'
import { mkdir } from 'fs/promises'

const OUT = join(import.meta.dir, 'output')
const WEB = resolve(import.meta.dir, '..') // web/ root — has vite.config.js + dist/

// Topics that will be marked complete in progress scenarios
const PARTIAL_PROGRESS = [
  '01-use-cases',
  '02-core-and-plugins',
  '03-install',
  '04-up-and-running',
]

const HIGH_PROGRESS = [
  '01-use-cases', '02-core-and-plugins', '03-install', '04-up-and-running',
  '05-cli-and-configuration', '06-terraform-lifecycle', '07-init', '08-plan-and-apply',
  '09-execution-plans', '10-visualizing-execution-plans', '11-resource-graph',
  '12-change-automation', '13-apply-update',
]

async function main() {
  await mkdir(OUT, { recursive: true })

  console.log('Starting Vite preview server…')
  const server = await preview({ root: WEB, preview: { port: 4174, strictPort: false } })
  const url = server.resolvedUrls.local[0].replace(/\/$/, '')
  console.log(`Preview server: ${url}`)

  console.log('Launching Chromium…')
  const browser = await chromium.launch({ headless: true })

  try {
    await takeAll(browser, url)
    console.log(`\nAll done — screenshots saved to:\n  ${OUT}`)
  } finally {
    await browser.close()
    await server.close()
  }
}

/**
 * Create a new page with localStorage pre-seeded (runs before any app JS).
 * The data-theme attribute is also set on <html> so there's no flash of the
 * wrong theme while the React app initialises.
 */
async function makePage(browser, { width = 1440, height = 900, theme = 'light', progress = [] }) {
  const ctx = await browser.newContext({ viewport: { width, height } })
  await ctx.addInitScript(({ theme, progress }) => {
    localStorage.setItem('tf-theme', theme)
    localStorage.setItem('tf-exam-progress', JSON.stringify(progress))
    document.documentElement.setAttribute('data-theme', theme)
  }, { theme, progress })
  return ctx.newPage()
}

async function shot(page, name) {
  const file = join(OUT, name)
  await page.screenshot({ path: file, fullPage: false })
  console.log(`  ✓ ${name}`)
}

async function navigateTo(page, titleText) {
  await page.locator('.sidebar-topic-btn').filter({ hasText: titleText }).click()
  // Wait for React to re-render and the content view to scroll back to top
  await page.waitForTimeout(500)
}

async function scrollContent(page, px) {
  await page.locator('.content-view').evaluate((el, px) => { el.scrollTop = px }, px)
  await page.waitForTimeout(150)
}

async function takeAll(browser, url) {
  // ── 01: Light mode — initial state ────────────────────────────────────────
  {
    const page = await makePage(browser, { theme: 'light' })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await shot(page, '01-light-initial.png')
    await page.context().close()
  }

  // ── 02: Dark mode — initial state ─────────────────────────────────────────
  {
    const page = await makePage(browser, { theme: 'dark' })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await shot(page, '02-dark-initial.png')
    await page.context().close()
  }

  // ── 03: Code highlighting — light, scrolled to first HCL block ────────────
  {
    const page = await makePage(browser, { theme: 'light' })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await scrollContent(page, 620)
    await shot(page, '03-code-highlight-light.png')
    await page.context().close()
  }

  // ── 04: Code highlighting — dark, same scroll ─────────────────────────────
  {
    const page = await makePage(browser, { theme: 'dark' })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await scrollContent(page, 620)
    await shot(page, '04-code-highlight-dark.png')
    await page.context().close()
  }

  // ── 05: Progress tracking — 4 topics done, topic 05 active ────────────────
  {
    const page = await makePage(browser, { theme: 'light', progress: PARTIAL_PROGRESS })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await navigateTo(page, 'CLI and Configuration')
    await shot(page, '05-progress-sidebar.png')
    await page.context().close()
  }

  // ── 06: Topic 14 — Input Variables (light) ────────────────────────────────
  {
    const page = await makePage(browser, { theme: 'light' })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await navigateTo(page, 'Input Variables')
    await shot(page, '06-input-variables.png')
    await page.context().close()
  }

  // ── 07: Topic 14 — Input Variables (dark, scrolled to type examples) ───────
  {
    const page = await makePage(browser, { theme: 'dark' })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await navigateTo(page, 'Input Variables')
    await scrollContent(page, 800)
    await shot(page, '07-input-variables-dark.png')
    await page.context().close()
  }

  // ── 08: Mobile — light, sidebar closed ────────────────────────────────────
  {
    const page = await makePage(browser, { width: 390, height: 844, theme: 'light' })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await shot(page, '08-mobile-light.png')
    await page.context().close()
  }

  // ── 09: Mobile — dark, sidebar open ───────────────────────────────────────
  {
    const page = await makePage(browser, { width: 390, height: 844, theme: 'dark' })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await page.locator('.hamburger').click()
    await page.waitForTimeout(350)
    await shot(page, '09-mobile-dark-sidebar.png')
    await page.context().close()
  }

  // ── 10: High progress — 13/23 done ────────────────────────────────────────
  {
    const page = await makePage(browser, { theme: 'light', progress: HIGH_PROGRESS })
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await navigateTo(page, 'Input Variables')
    await shot(page, '10-high-progress.png')
    await page.context().close()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
