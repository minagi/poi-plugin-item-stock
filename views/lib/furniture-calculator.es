// Current server-side hard cap (raised from 200,000 in the 2021-07-15 update).
const FURNITURE_COIN_CAP = 350000

// Use-item IDs and conversion rates used by information center and game data.
const FURNITURE_BOX_VALUES = Object.freeze({
  10: 200,
  11: 400,
  12: 700,
})

// Only choices confirmed in the game's furniture-box dialog.
const OPTION_IDS = Object.freeze(['full', 'half', 'ten'])

function toStockCount(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0
}

function toCoinBalance(value) {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : null
}

function getOptionCount(optionId, stock) {
  switch (optionId) {
    case 'full':
      return stock
    case 'half':
      // Matches information center; the game disables this choice below 2 boxes.
      return Math.floor(stock / 2)
    case 'ten':
      return 10
    default:
      return 0
  }
}

function calculateFurnitureBoxPlan({
  stock,
  coinValue,
  currentCoins,
  cap = FURNITURE_COIN_CAP,
}) {
  const normalizedStock = toStockCount(stock)
  const normalizedValue = toStockCount(coinValue)
  const normalizedBalance = toCoinBalance(currentCoins)
  const normalizedCap = toStockCount(cap)

  const options = OPTION_IDS.map(id => {
    const count = getOptionCount(id, normalizedStock)
    const available = count > 0 && count <= normalizedStock
    const gain = available ? count * normalizedValue : 0

    if (!available || normalizedBalance == null) {
      return {
        id,
        count,
        available,
        gain,
        after: null,
        discarded: null,
        safe: null,
      }
    }

    const uncappedAfter = normalizedBalance + gain
    const discarded = Math.max(0, uncappedAfter - normalizedCap)

    return {
      id,
      count,
      available,
      gain,
      after: Math.min(uncappedAfter, normalizedCap),
      discarded,
      safe: discarded === 0,
    }
  })

  const recommendation = options.reduce((best, option) => {
    if (!option.available || option.safe !== true)
      return best
    if (!best || option.gain > best.gain)
      return option
    return best
  }, null)

  return {
    stock: normalizedStock,
    coinValue: normalizedValue,
    currentCoins: normalizedBalance,
    cap: normalizedCap,
    options,
    recommendation,
  }
}

function findOverallRecommendation(plans) {
  return (plans || []).reduce((best, entry) => {
    const option = entry && entry.plan && entry.plan.recommendation
    if (!option)
      return best
    if (!best || option.gain > best.option.gain)
      return { ...entry, option }
    return best
  }, null)
}

module.exports = {
  FURNITURE_COIN_CAP,
  FURNITURE_BOX_VALUES,
  OPTION_IDS,
  calculateFurnitureBoxPlan,
  findOverallRecommendation,
}
