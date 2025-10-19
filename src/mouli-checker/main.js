import { chromium } from "playwright"
import fs from "fs/promises"

const MOULI_URL = "https://myresults.epitest.eu"
const STORAGE = "state.json"

async function ensureConnected(page) {
  await page.reload();
  const selector = 'button:has-text("Log in"), a:has-text("Log in")'
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

function getTypeFromUrl(windowUrl) {
    const types = {
    YEAR: "year",
    MODULE: "module",
    PROJECT: "project",
    DETAILS: "details",
    UNKNOWN: "unknown"
    };
    if (windowUrl.includes("#y")) return types.YEAR;
    if (windowUrl.includes("#m")) return types.MODULE;
    if (windowUrl.includes("#p")) return types.PROJECT;
    if (windowUrl.includes("#d")) return types.DETAILS;
    return types.UNKNOWN;
};

function getTypeSchema(type, windowUrl) {
    const types = {
    YEAR: "year",
    MODULE: "module",
    PROJECT: "project",
    DETAILS: "details",
    UNKNOWN: "unknown"
    };
    switch (type) {
        case types.YEAR:
            return windowUrl.split("#y/")[1];
        case types.MODULE:
            return windowUrl.split("#m/")[1].slice(0, 4);
        case types.PROJECT:
            return windowUrl.split("#p/")[1];
        case types.DETAILS: {
            const splitted = windowUrl.split("/");
            return "details/" + splitted[splitted.length - 1];
        }
        default:
            throw new Error("Unknown type for schema: " + type);
    }
};

async function waitForHash(page, timeout = 3000) {
  const deadline = Date.now() + timeout;
  let hash = "";
  while (Date.now() < deadline) {
    hash = await page.evaluate(() => location.hash || "");
    if (hash && hash !== "#") return hash;
    await page.waitForTimeout(100);
  }
  return hash;
}

export function getFetchUrl(url) {
    const base = "https://api.epitest.eu/me/";
    const types = {
    YEAR: "year",
    MODULE: "module",
    PROJECT: "project",
    DETAILS: "details",
    UNKNOWN: "unknown"
    };
    const type = getTypeFromUrl(url);
    if (type === types.UNKNOWN) throw new Error("Type inconnu pour l'URL: " + url);

    const schema = getTypeSchema(type, url);
    return base + schema;
}

async function fetchEpitestFromPage(page) {
    if (!page) throw new Error("page is required");

    const hash = await waitForHash(page, 3000);
    const year = hash.split("#y/")[1];

    await waitForHash(page, 3000);

    const href = await page.evaluate(() => location.href).catch(() => null);
    const purl = await page.url();
    const windowUrl = (href && href.includes("#")) ? href : purl;

    if (!windowUrl) throw new Error("Could not determine page URL");

    const rawToken = await page.evaluate(() => localStorage.getItem("argos-api.oidc-token")).catch(() => null);
    if (!rawToken) throw new Error("Token can not be found (localStorage: argos-api.oidc-token) and no overrideToken provided");
    const token = String(rawToken).replace(/"/g, "");

    const fetchUrl = getFetchUrl(windowUrl);

    const data = await fetchEpitestFromUrl(page, fetchUrl);

   return {data, year};
  }

async function fetchEpitestFromUrl(page, url) {

    const rawToken = await page.evaluate(() => localStorage.getItem("argos-api.oidc-token")).catch(() => null);
    if (!rawToken) throw new Error("Token can not be found (localStorage: argos-api.oidc-token) and no overrideToken provided");
    const token = String(rawToken).replace(/"/g, "");

    const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    return await response.json();
}

export async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext(
    (await fs.stat(STORAGE).catch(() => null)) ? { storageState: STORAGE } : {}
  )
  const page = await context.newPage()

  await page.goto(MOULI_URL)
  await ensureConnected(page)
  await context.storageState({ path: STORAGE })

  const {data, year} = await fetchEpitestFromPage(page)
  await context.storageState({ path: STORAGE })

  await browser.close()

  return {data, year}
}

export async function bis(url) {
  const browser = await chromium.launch({ headless: true }) //<-- Set headless to false to connect to your microsoft account manually
  const context = await browser.newContext(
    (await fs.stat(STORAGE).catch(() => null)) ? { storageState: STORAGE } : {}
  )
  const page = await context.newPage()

  await page.goto(MOULI_URL)
  // await page.waitForTimeout(60000) <-- Add this breakpoint here if headless is false to login manually
  await ensureConnected(page)
  await context.storageState({ path: STORAGE })

  const data = await fetchEpitestFromUrl(page, url)
  await context.storageState({ path: STORAGE })

  await browser.close()

  return data
}