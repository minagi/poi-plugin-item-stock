#!/usr/bin/env node

const assert = require('node:assert/strict')
const {
  FURNITURE_COIN_CAP,
  calculateFurnitureBoxPlan,
  findOverallRecommendation,
} = require('../views/lib/furniture-calculator.es')

const option = (plan, id) => plan.options.find(item => item.id === id)

{
  const plan = calculateFurnitureBoxPlan({ stock: 2, coinValue: 200, currentCoins: 0 })
  assert.equal(plan.currentCoins, 0, 'a zero balance is available, not unknown')
  assert.equal(option(plan, 'half').safe, true)
  assert.equal(option(plan, 'half').after, 200)
}

{
  const plan = calculateFurnitureBoxPlan({ stock: 0, coinValue: 200, currentCoins: 0 })
  assert.equal(plan.recommendation, null, 'stock 0 has no recommendation')
  assert.ok(plan.options.every(item => !item.available), 'stock 0 disables every option')
}

{
  const plan = calculateFurnitureBoxPlan({ stock: 1, coinValue: 200, currentCoins: FURNITURE_COIN_CAP })
  assert.equal(plan.recommendation, null, 'at cap has no safe recommendation')
  assert.equal(option(plan, 'full').discarded, 200)
  assert.equal(option(plan, 'half').count, 0)
  assert.equal(option(plan, 'half').available, false)
  assert.equal(option(plan, 'ten').available, false)
}

{
  const plan = calculateFurnitureBoxPlan({ stock: 10, coinValue: 200, currentCoins: 348000 })
  assert.equal(option(plan, 'full').after, FURNITURE_COIN_CAP)
  assert.equal(option(plan, 'full').discarded, 0, 'exact fit is safe')
  assert.equal(option(plan, 'full').safe, true)
}

{
  const plan = calculateFurnitureBoxPlan({ stock: 10, coinValue: 200, currentCoins: 348001 })
  assert.equal(option(plan, 'full').after, FURNITURE_COIN_CAP)
  assert.equal(option(plan, 'full').discarded, 1, 'one coin over is reported')
  assert.equal(plan.recommendation.id, 'half', 'a smaller safe choice remains recommendable')
  assert.equal(plan.recommendation.after, 349001)
}

{
  const ten = calculateFurnitureBoxPlan({ stock: 10, coinValue: 200, currentCoins: 0 })
  const twentyNearCap = calculateFurnitureBoxPlan({ stock: 20, coinValue: 200, currentCoins: 348000 })
  assert.equal(option(ten, 'full').count, option(ten, 'ten').count)
  assert.equal(ten.recommendation.id, 'full', 'equal counts use deterministic option order')
  assert.equal(option(twentyNearCap, 'half').count, option(twentyNearCap, 'ten').count)
  assert.equal(twentyNearCap.recommendation.id, 'half')
  assert.equal(twentyNearCap.options.filter(item => item.id === twentyNearCap.recommendation.id).length, 1)
}

{
  const nine = calculateFurnitureBoxPlan({ stock: 9, coinValue: 400, currentCoins: 0 })
  const ten = calculateFurnitureBoxPlan({ stock: 10, coinValue: 400, currentCoins: 0 })
  const odd = calculateFurnitureBoxPlan({ stock: 11, coinValue: 700, currentCoins: 0 })
  assert.equal(option(nine, 'ten').available, false, '9 boxes cannot use the 10 option')
  assert.equal(option(ten, 'ten').available, true, '10 boxes can use the 10 option')
  assert.equal(option(odd, 'half').count, 5, 'half rounds down for odd stock')
}

{
  const plan = calculateFurnitureBoxPlan({ stock: 10, coinValue: 200, currentCoins: 0 })
  assert.deepEqual(plan.options.map(item => item.id), ['full', 'half', 'ten'])
  assert.equal(option(plan, 'one'), undefined, 'unconfirmed one-box opening is not simulated')
  assert.equal(plan.coinValue, 200, 'per-box value remains available as reference data')
}

{
  const unknown = calculateFurnitureBoxPlan({ stock: 10, coinValue: 200, currentCoins: null })
  assert.equal(unknown.currentCoins, null)
  assert.equal(unknown.recommendation, null, 'unknown balance must not produce a recommendation')
  assert.ok(unknown.options.filter(item => item.available).every(item => item.safe === null))
}

{
  const small = calculateFurnitureBoxPlan({ stock: 10, coinValue: 200, currentCoins: 340000 })
  const large = calculateFurnitureBoxPlan({ stock: 10, coinValue: 700, currentCoins: 340000 })
  const best = findOverallRecommendation([
    { boxId: 10, plan: small },
    { boxId: 12, plan: large },
  ])
  assert.equal(best.boxId, 12)
  assert.equal(best.option.gain, 7000)
}

console.log('Furniture box calculation verification passed.')
