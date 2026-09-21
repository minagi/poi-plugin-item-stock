#!/usr/bin/env node

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const dist = path.join(__dirname, '..', 'dist')
const packagePath = path.join(dist, 'package.json')
assert.ok(fs.existsSync(packagePath), 'dist/package.json is missing')

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
assert.equal(pkg.main, 'index.js')
assert.ok(fs.existsSync(path.join(dist, pkg.main)), 'dist package main is missing')
assert.ok(fs.existsSync(path.join(dist, 'assets', 'images', 'port_skin_1_22.webp')), 'runtime image is missing')

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(target) : [target]
  })
}

function resolvesRelativeRequire(fromFile, request) {
  const target = path.resolve(path.dirname(fromFile), request)
  return [target, `${target}.js`, `${target}.json`, path.join(target, 'index.js')]
    .some(candidate => fs.existsSync(candidate))
}

for (const file of walk(dist).filter(file => file.endsWith('.js'))) {
  const source = fs.readFileSync(file, 'utf8')
  const requires = source.matchAll(/require\(["'](\.[^"']+)["']\)/g)
  for (const match of requires) {
    assert.ok(resolvesRelativeRequire(file, match[1]), `unresolved ${match[1]} from ${path.relative(dist, file)}`)
  }
}

const calculator = require(path.join(dist, 'views', 'lib', 'furniture-calculator.js'))
assert.deepEqual(calculator.OPTION_IDS, ['full', 'half', 'ten'])
assert.deepEqual(calculator.FURNITURE_BOX_VALUES, { 10: 200, 11: 400, 12: 700 })
const plan = calculator.calculateFurnitureBoxPlan({ stock: 11, coinValue: 700, currentCoins: 346500 })
assert.equal(plan.recommendation.id, 'half')
assert.equal(plan.recommendation.after, calculator.FURNITURE_COIN_CAP)

console.log('Dist package structure and calculation smoke test passed.')
