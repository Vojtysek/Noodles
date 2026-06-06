export const returnData: { [key: string]: [number, number] } = {
  facades: [1.3, 0.2],
  roof: [1.2, 0.18],
  windows: [3, 1],
  externalBlinds: [0.6, 0.1],
}

export const calcReturn = (area: number, type: string): number => {
  return Number(
    ((returnData[type][0] - returnData[type][1]) *
      area *
      14 *
      (4400 / 1000) *
      2) /
      12
  )
}

export const calcBlinds = (windowArea: number): number => {
  const gOld = 0.6
  const gNew = 0.1
  const irradiance = 150
  const hours = 1000
  const priceKwh = 2
  const cop = 2.5

  const savingKwh =
    ((gOld - gNew) * windowArea * irradiance * hours) / 1000 / cop
  return (savingKwh * priceKwh) / 12
}

export const calcHeatPump = (
  annualHeatDemand: number,
  copOld: number,
  priceOld: number,
  copNew: number = 3.5,
  priceNew: number = 5
): number => {
  const costOld = (annualHeatDemand / copOld) * priceOld
  const costNew = (annualHeatDemand / copNew) * priceNew
  return (costOld - costNew) / 12
}

export const calcHeatingSystem = (annualHeatingCost: number): number => {
  const efficiencyGain = 0.15 // 15 % průměrná úspora
  return (annualHeatingCost * efficiencyGain) / 12
}

export const calcRecuperation = (
  annualHeatDemand: number,
  ventilationLoss: number = 0.4,
  efficiency: number = 0.8,
  priceKwh: number = 2
): number => {
  const saving = annualHeatDemand * ventilationLoss * efficiency
  return (saving * priceKwh) / 12
}

export const calcPhotovoltaics = (
  installedKwp: number,
  selfConsumption: number = 0.6,
  gridPrice: number = 5,
  feedInPrice: number = 2
): number => {
  const annualProduction = installedKwp * 1050 // kWh/kWp/rok v ČR
  const saved = annualProduction * selfConsumption * gridPrice
  const sold = annualProduction * (1 - selfConsumption) * feedInPrice
  return (saved + sold) / 12
}
