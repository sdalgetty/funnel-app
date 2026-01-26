#!/usr/bin/env node
/**
 * Deploy to Netlify via the Deploy API (no CLI).
 * Uses NETLIFY_AUTH_TOKEN. Works in sandboxed environments (e.g. Cursor)
 * because it only reads/writes workspace and uses HTTPS.
 *
 * Usage:
 *   node scripts/deploy-to-netlify.mjs [--test|--prod]
 *   Default: --test
 *
 * Prerequisites:
 *   - NETLIFY_AUTH_TOKEN set (Personal access token from Netlify)
 *   - Build exists: analytics-vite-app/dist
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const SITES = {
  test: {
    id: '4e44bee4-893e-494e-be35-1a12f341b6c9',
    name: 'fnnl-app-test',
    url: 'https://fnnl-app-test.netlify.app',
  },
  prod: {
    id: '8313f660-c306-4d5e-af13-eeeb793bfd87',
    name: 'fnnl-app-prod',
    url: 'https://app.fnnlapp.com',
  },
}

function usage() {
  console.error(`
Usage: node scripts/deploy-to-netlify.mjs [--test|--prod]

  --test   Deploy to Test (default). Site: fnnl-app-test
  --prod   Deploy to Production. Site: fnnl-app-prod

Requires: NETLIFY_AUTH_TOKEN environment variable.
Create a token at: https://app.netlify.com/user/applications#personal-access-tokens
`)
}

function parseArgs() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    usage()
    process.exit(0)
  }
  if (args.includes('--prod')) return 'prod'
  return 'test'
}

async function main() {
  const target = parseArgs()
  const site = SITES[target]
  const token = process.env.NETLIFY_AUTH_TOKEN

  if (!token) {
    console.error('Missing NETLIFY_AUTH_TOKEN. Set it and try again.')
    console.error('Create a token: https://app.netlify.com/user/applications#personal-access-tokens')
    process.exit(1)
  }

  const distDir = path.join(root, 'analytics-vite-app', 'dist')
  const zipPath = path.join(root, 'analytics-vite-app', '.netlify-deploy.zip')
  const distAbs = path.resolve(distDir)

  console.log('Building...')
  execSync('npm run build', {
    cwd: path.join(root, 'analytics-vite-app'),
    stdio: 'inherit',
  })

  if (!fs.existsSync(distDir)) {
    console.error('Build failed: analytics-vite-app/dist not found.')
    process.exit(1)
  }

  console.log(`Zipping ${path.relative(root, distDir)}...`)
  try {
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
    execSync(`zip -r "${zipPath}" .`, {
      cwd: distAbs,
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('Zip failed. Ensure "zip" is available (macOS/Linux).')
    process.exit(1)
  }

  const zipBuf = fs.readFileSync(zipPath)
  const apiUrl = `https://api.netlify.com/api/v1/sites/${site.id}/deploys`

  console.log(`Deploying to ${site.name} (${target})...`)
  let res
  try {
    res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/zip',
      },
      body: zipBuf,
    })
  } catch (e) {
    console.error('Request failed:', e.message)
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
    process.exit(1)
  }

  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

  if (!res.ok) {
    const text = await res.text()
    console.error(`Deploy failed (${res.status}): ${text}`)
    process.exit(1)
  }

  const deploy = await res.json()
  const deployUrl = deploy.deploy_ssl_url || deploy.url || site.url
  console.log('')
  console.log('Deploy complete.')
  console.log(`  Site: ${site.name}`)
  console.log(`  URL:  ${deployUrl}`)
  if (deploy.unique_url) console.log(`  Unique: ${deploy.unique_url}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
