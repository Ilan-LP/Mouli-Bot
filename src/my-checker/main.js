import { chromium } from "playwright"
import fs from "fs/promises"

const STORAGE = "state.json"

async function ensureConnected(page) {
  await page.reload();
  const selector = 'button:has-text("Login with Epitech account"), a:has-text("Login with Epitech account")'
  const bouton = await page.$(selector)
  if (bouton) {
    await Promise.all([
      bouton.click(),
      page.waitForLoadState("networkidle").catch(() => {})
    ])
    return true
  }
  return false
}

async function logTimeFetch(page) {
  if (!page) throw new Error("page is required");

  const fetchUrl = "https://my.epitech.eu/api/students/logtime";
  const rawToken = await page.evaluate(() => localStorage.getItem("@account")).catch(() => null);
    if (!rawToken) throw new Error("Token can not be found (localStorage: @account) and no overrideToken provided");
    const token = JSON.parse(rawToken).token;

    const response = await fetch(fetchUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
    });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    return await response.json();

}

export async function logTime() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext(
    (await fs.stat(STORAGE).catch(() => null)) ? { storageState: STORAGE } : {}
  )
  const page = await context.newPage()

  await page.goto("https://my.epitech.eu")
  await page.waitForTimeout(2000)
  await ensureConnected(page)
  await page.waitForTimeout(2000)
  await context.storageState({ path: STORAGE })

  const data = await logTimeFetch(page)
  await context.storageState({ path: STORAGE })
  await browser.close()

  return data
}

async function calendarFetch(page, startDate, endDate) {
  if (!page) throw new Error("page is required");

  const fetchUrl = `https://my.epitech.eu/api/events?startDate=${startDate}&endDate=${endDate}`;
  const rawToken = await page.evaluate(() => localStorage.getItem("@account")).catch(() => null);
    if (!rawToken) throw new Error("Token can not be found (localStorage: @account) and no overrideToken provided");
    const token = JSON.parse(rawToken).token;

    const response = await fetch(fetchUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
    });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    return await response.json();

}

export async function calendar(startDate, endDate) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext(
    (await fs.stat(STORAGE).catch(() => null)) ? { storageState: STORAGE } : {}
  )
  const page = await context.newPage()

  await page.goto("https://my.epitech.eu/planning")
  await page.waitForTimeout(2000)
  await ensureConnected(page)
  await page.waitForTimeout(2000)
  await context.storageState({ path: STORAGE })

  const data = await calendarFetch(page, startDate, endDate)
  await context.storageState({ path: STORAGE })
  await browser.close()

  return data
}