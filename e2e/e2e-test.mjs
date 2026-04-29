import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  // Debug helpers: forward page console and errors to Node logs
  page.on('console', (msg) => console.log('PAGE LOG>', msg.text()))
  page.on('pageerror', (err) => console.log('PAGE ERROR>', err && err.message))

  const APP_URL = process.env.APP_URL || 'http://localhost:5173'
  const BACKEND_API = process.env.BACKEND_API || 'http://localhost:3000/api'
  const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'us@gmail.com'
  const ADMIN_PWD = process.env.E2E_ADMIN_PWD || 'us1234'

  try {
    console.log('Opening app:', APP_URL)
    await page.goto(APP_URL, { waitUntil: 'load', timeout: 30000 })

    // Login
    await page.fill('#username', ADMIN_EMAIL)
    await page.fill('#password', ADMIN_PWD)
    await page.click('button:has-text("Iniciar Sesión")')
    // SPA may not trigger a full navigation; wait for auth token to be stored
    await page.waitForFunction(() => !!localStorage.getItem('authToken'), { timeout: 10000 })
    // then wait for sidebar button to appear (if available)
    await page.waitForSelector('button:has-text("Mesas")', { timeout: 8000 }).catch(() => {})

    console.log('Logged in, waiting for sidebar...')
    await page.waitForSelector('button:has-text("Mesas")', { timeout: 8000 })

    // Go to Tables (Mesas)
    await page.click('button:has-text("Mesas")')
    await page.waitForSelector('button:has-text("Añadir Mesa")', { timeout: 5000 })

    const mesaName = `E2E-${Date.now()}`

    // Open add table modal
    await page.click('button:has-text("Añadir Mesa")')
    const modal = page.locator('div:has-text("Nueva Mesa")')
    await modal.waitFor({ state: 'visible', timeout: 4000 })

    // Fill form
    await modal.locator('input[type="text"]').fill(mesaName)
    await modal.locator('input[type="number"]').fill('4')
    // select location (first select is location)
    await modal.locator('select').nth(0).selectOption('terraza')
    await modal.locator('select').nth(1).selectOption('normal')

    // Submit
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/mesas') &&
          resp.request().method() === 'POST' &&
          resp.status() < 500,
        { timeout: 8000 }
      ),
      modal.locator('button:has-text("Guardar")').click()
    ])

    // Ensure modal closed
    await page.waitForSelector('div:has-text("Nueva Mesa")', { state: 'detached', timeout: 5000 })

    // Grab auth token from localStorage and verify creation via backend
    const token = await page.evaluate(() => localStorage.getItem('authToken'))
    if (!token) throw new Error('No auth token found after login')

    const createdList = await page.evaluate(
      async (api, tkn, name) => {
        const r = await fetch(`${api}/mesas`, { headers: { Authorization: `Bearer ${tkn}` } })
        const data = await r.json()
        return data.filter((m) => m.name === name)
      },
      BACKEND_API,
      token,
      mesaName
    )

    if (!createdList || createdList.length === 0)
      throw new Error('Created mesa not found in backend')
    const mesa = createdList[0]
    console.log('Mesa created in backend:', mesa.id || mesa._id || mesa.name)

    // Edit via UI: find the card and click Edit
    const card = page.locator(`div:has-text("${mesaName}")`).first()
    await card.waitFor({ state: 'visible', timeout: 5000 })
    await card.locator('button[aria-label="Editar"]').click()

    const editModal = page.locator('div:has-text("Editar Mesa")')
    await editModal.waitFor({ state: 'visible', timeout: 4000 })
    await editModal.locator('input[type="number"]').fill('6')

    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes(`/mesas/${mesa.id || mesa._id}`) &&
          resp.request().method() === 'PUT' &&
          resp.status() < 500,
        { timeout: 8000 }
      ),
      editModal.locator('button:has-text("Guardar")').click()
    ])

    await page.waitForSelector('div:has-text("Editar Mesa")', { state: 'detached', timeout: 5000 })

    // Verify update via backend
    const updated = await page.evaluate(
      async (api, tkn, id) => {
        const r = await fetch(`${api}/mesas/${id}`, { headers: { Authorization: `Bearer ${tkn}` } })
        return r.json()
      },
      BACKEND_API,
      token,
      mesa.id || mesa._id
    )

    if (!updated || Number(updated.capacity) !== 6)
      throw new Error('Updated capacity not reflected in backend')
    console.log('Update verified: capacity=6')

    // Click on table card to change status (Disponible -> Reservada)
    await card.click()
    // wait a bit for optimistic UI + backend patch
    await page.waitForTimeout(1200)

    const afterStatus = await page.evaluate(
      async (api, tkn, id) => {
        const r = await fetch(`${api}/mesas/${id}`, { headers: { Authorization: `Bearer ${tkn}` } })
        return r.json()
      },
      BACKEND_API,
      token,
      mesa.id || mesa._id
    )

    if (!afterStatus || afterStatus.status !== 'Reservada')
      throw new Error(`Status change not reflected in backend (got: ${afterStatus?.status})`)
    console.log('Status change verified: Reservada')

    // Delete via UI: open delete confirmation and confirm
    // Click delete icon inside card
    await card.locator('button[aria-label="Eliminar"]').click()
    const delModal = page.locator('div:has-text("¿Eliminar Mesa?")')
    await delModal.waitFor({ state: 'visible', timeout: 4000 })

    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes(`/mesas/${mesa.id || mesa._id}`) &&
          resp.request().method() === 'DELETE' &&
          resp.status() < 500,
        { timeout: 8000 }
      ),
      delModal.locator('button:has-text("Eliminar")').click()
    ])

    // Verify deletion via backend
    const listAfterDelete = await page.evaluate(
      async (api, tkn) => {
        const r = await fetch(`${api}/mesas`, { headers: { Authorization: `Bearer ${tkn}` } })
        return r.json()
      },
      BACKEND_API,
      token
    )

    const still = listAfterDelete.find((m) => m.name === mesaName)
    if (still) throw new Error('Mesa still present after deletion')

    console.log('Deletion verified — E2E CRUD passed')

    await browser.close()
    process.exit(0)
  } catch (err) {
    console.error('E2E Test failed:', err)
    await browser.close()
    process.exit(2)
  }
}

run()
