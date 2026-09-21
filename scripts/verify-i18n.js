#!/usr/bin/env node

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..', 'i18n')
const locales = ['en-US', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW']

function flatten(value, prefix = '', result = {}) {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, fullKey, result)
    } else {
      result[fullKey] = child
    }
  }
  return result
}

const dictionaries = Object.fromEntries(locales.map(locale => {
  const file = path.join(root, `${locale}.json`)
  assert.ok(fs.existsSync(file), `missing locale file: ${locale}`)
  return [locale, flatten(JSON.parse(fs.readFileSync(file, 'utf8')))]
}))

const referenceKeys = Object.keys(dictionaries['en-US']).sort()
for (const locale of locales) {
  const dictionary = dictionaries[locale]
  assert.deepEqual(Object.keys(dictionary).sort(), referenceKeys, `${locale} keys differ from en-US`)
  for (const key of referenceKeys) {
    assert.equal(typeof dictionary[key], 'string', `${locale}:${key} must be a string`)
    assert.ok(dictionary[key].trim(), `${locale}:${key} must not be empty`)
  }

  assert.ok(dictionary['tabs.common.furnitureSupport.perUnit'], `${locale} is missing the per-box reference`)
  assert.ok(dictionary['tabs.common.furnitureSupport.options.full'], `${locale} is missing the full option`)
  assert.ok(dictionary['tabs.common.furnitureSupport.options.half'], `${locale} is missing the half option`)
  assert.ok(dictionary['tabs.common.furnitureSupport.options.ten'], `${locale} is missing the ten-box option`)
  assert.equal(
    dictionary['tabs.common.furnitureSupport.options.one'],
    undefined,
    `${locale} must not expose one box as an opening option`,
  )
}

console.log('Locale key verification passed.')
