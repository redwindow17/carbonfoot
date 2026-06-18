/**
 * The recommendation engine — EcoTrack's "smart assistant".
 *
 * Rather than printing a generic checklist, each rule:
 *   1. decides whether it is *relevant* to this user (the context gate), and
 *   2. estimates the saving from *their own* numbers, using the same emission
 *      factors as the calculator so the advice stays internally consistent.
 *
 * The result is a list that is filtered to what matters to the individual and
 * ordered by impact, with effort surfaced so they can pick their battles.
 */

import {
  CAR_KG_PER_KM,
  CONSUMPTION_KG_PER_YEAR,
  DIET_KG_PER_YEAR,
  ELECTRICITY_KG_PER_KWH,
  HEAT_PUMP_COP,
} from './emissionFactors';
import { resolveHeatingFactor } from './calculator';
import { CAR_FUEL_LABELS, DIET_LABELS, HEATING_FUEL_LABELS } from './labels';
import type {
  ConsumptionLevel,
  DietType,
  EffortLevel,
  FootprintResult,
  Recommendation,
  UserProfile,
} from './types';

/** Advice below this annual saving is filtered out to avoid trivial noise. */
const MIN_SAVINGS_KG = 25;

/** Approx. emissions of replacing one short-haul flight with a train trip. */
const SHORT_HAUL_TRAIN_EQUIVALENT_KG = 40;

/** Next, lower-impact diet to nudge a user toward (null = already lowest). */
const NEXT_DIET: Record<DietType, DietType | null> = {
  heavyMeat: 'mediumMeat',
  mediumMeat: 'lowMeat',
  lowMeat: 'vegetarian',
  pescatarian: 'vegetarian',
  vegetarian: 'vegan',
  vegan: null,
};

/** Next, lower consumption tier (null = already lowest). */
const NEXT_CONSUMPTION: Record<ConsumptionLevel, ConsumptionLevel | null> = {
  high: 'medium',
  medium: 'low',
  low: null,
};

const EFFORT_RANK: Record<EffortLevel, number> = {
  easy: 0,
  medium: 1,
  committed: 2,
};

interface RuleContext {
  profile: UserProfile;
  result: FootprintResult;
  /** Looks up a calculated line item by key, defaulting to 0. */
  li: (key: string) => number;
}

interface Rule {
  id: string;
  category: Recommendation['category'];
  effort: EffortLevel;
  title: (ctx: RuleContext) => string;
  applies: (ctx: RuleContext) => boolean;
  savingsKg: (ctx: RuleContext) => number;
  rationale: (ctx: RuleContext, savings: number) => string;
}

const fmt = (kg: number): string => Math.round(kg).toLocaleString('en-US');

const RULES: readonly Rule[] = [
  // --- Transport ------------------------------------------------------------
  {
    id: 'car-reduce',
    category: 'transport',
    effort: 'medium',
    title: () => 'Swap short car trips for walking, cycling or transit',
    applies: (c) => c.profile.transport.carFuel !== 'none' && c.li('transport.car') > 100,
    savingsKg: (c) => c.li('transport.car') * 0.3,
    rationale: (c, s) =>
      `Your car is responsible for about ${fmt(c.li('transport.car'))} kg CO₂e a year. ` +
      `Shifting roughly a third of those trips to active or public transport would save about ${fmt(s)} kg.`,
  },
  {
    id: 'car-ev',
    category: 'transport',
    effort: 'committed',
    title: () => 'Switch your next car to electric',
    applies: (c) =>
      ['petrol', 'diesel', 'hybrid'].includes(c.profile.transport.carFuel) &&
      c.li('transport.car') > 200,
    savingsKg: (c) => {
      const current = CAR_KG_PER_KM[c.profile.transport.carFuel];
      return current > 0 ? c.li('transport.car') * (1 - CAR_KG_PER_KM.electric / current) : 0;
    },
    rationale: (c, s) =>
      `A ${CAR_FUEL_LABELS[c.profile.transport.carFuel].toLowerCase()} car emits roughly ` +
      `${fmt(c.li('transport.car'))} kg CO₂e a year for your mileage. On your current grid an EV would ` +
      `cut about ${fmt(s)} kg of that.`,
  },
  {
    id: 'flights-short-to-rail',
    category: 'transport',
    effort: 'medium',
    title: () => 'Take the train instead of short-haul flights',
    applies: (c) => c.profile.transport.shortHaulFlightsPerYear >= 1,
    savingsKg: (c) =>
      c.profile.transport.shortHaulFlightsPerYear * (500 - SHORT_HAUL_TRAIN_EQUIVALENT_KG),
    rationale: (c, s) => {
      const n = Math.round(c.profile.transport.shortHaulFlightsPerYear);
      return (
        `You take ${n} short-haul flight${n === 1 ? '' : 's'} a year. Choosing rail for those ` +
        `journeys where possible would save about ${fmt(s)} kg CO₂e.`
      );
    },
  },
  {
    id: 'flights-long-reduce',
    category: 'transport',
    effort: 'committed',
    title: () => 'Take one fewer long-haul flight',
    applies: (c) => c.profile.transport.longHaulFlightsPerYear >= 1,
    savingsKg: () => 2500,
    rationale: (_c, s) =>
      `A single long-haul return flight adds roughly 2,500 kg CO₂e — more than the entire yearly ` +
      `footprint of an average person in some countries. Skipping one saves about ${fmt(s)} kg.`,
  },
  // --- Home energy ----------------------------------------------------------
  {
    id: 'electricity-renewable',
    category: 'home',
    effort: 'easy',
    title: () => 'Switch to a certified renewable electricity tariff',
    applies: (c) =>
      c.profile.home.electricitySource !== 'fullGreen' && c.li('home.electricity') > 100,
    savingsKg: (c) => {
      const current = ELECTRICITY_KG_PER_KWH[c.profile.home.electricitySource];
      return current > 0
        ? c.li('home.electricity') * (1 - ELECTRICITY_KG_PER_KWH.fullGreen / current)
        : 0;
    },
    rationale: (c, s) =>
      `Your share of home electricity is about ${fmt(c.li('home.electricity'))} kg CO₂e a year. ` +
      `Moving to a 100% renewable tariff is often the single biggest low-effort win — around ${fmt(s)} kg.`,
  },
  {
    id: 'electricity-reduce',
    category: 'home',
    effort: 'easy',
    title: () => 'Trim everyday electricity use',
    applies: (c) => c.li('home.electricity') > 150,
    savingsKg: (c) => c.li('home.electricity') * 0.1,
    rationale: (_c, s) =>
      `LED bulbs, line-drying laundry and cutting standby power typically reduce household ` +
      `electricity by about 10% — roughly ${fmt(s)} kg CO₂e a year for your home.`,
  },
  {
    id: 'heating-efficiency',
    category: 'home',
    effort: 'easy',
    title: () => 'Turn the thermostat down and seal draughts',
    applies: (c) => c.li('home.heating') > 100,
    savingsKg: (c) => c.li('home.heating') * 0.15,
    rationale: (_c, s) =>
      `Lowering heating by 1–2 °C and draught-proofing can cut heating energy by around 15%, ` +
      `saving roughly ${fmt(s)} kg CO₂e a year.`,
  },
  {
    id: 'heating-heat-pump',
    category: 'home',
    effort: 'committed',
    title: () => 'Replace fossil heating with a heat pump',
    applies: (c) =>
      ['gas', 'oil'].includes(c.profile.home.heatingFuel) && c.li('home.heating') > 200,
    savingsKg: (c) => {
      const current = resolveHeatingFactor(
        c.profile.home.heatingFuel,
        c.profile.home.electricitySource,
      );
      const heatPump = ELECTRICITY_KG_PER_KWH[c.profile.home.electricitySource] / HEAT_PUMP_COP;
      return current > 0 ? c.li('home.heating') * (1 - heatPump / current) : 0;
    },
    rationale: (c, s) =>
      `Your ${HEATING_FUEL_LABELS[c.profile.home.heatingFuel].toLowerCase()} heating emits about ` +
      `${fmt(c.li('home.heating'))} kg CO₂e a year. A heat pump is far more efficient and would ` +
      `cut roughly ${fmt(s)} kg.`,
  },
  // --- Food -----------------------------------------------------------------
  {
    id: 'diet-step-down',
    category: 'food',
    effort: 'medium',
    title: (c) => {
      const next = NEXT_DIET[c.profile.food.dietType];
      return next === 'vegan' ? 'Try a fully plant-based diet' : 'Eat a little less meat';
    },
    applies: (c) => NEXT_DIET[c.profile.food.dietType] !== null,
    savingsKg: (c) => {
      const next = NEXT_DIET[c.profile.food.dietType];
      return next ? DIET_KG_PER_YEAR[c.profile.food.dietType] - DIET_KG_PER_YEAR[next] : 0;
    },
    rationale: (c, s) => {
      const next = NEXT_DIET[c.profile.food.dietType];
      const target = next ? DIET_LABELS[next] : '';
      return (
        `Moving from ${DIET_LABELS[c.profile.food.dietType]} toward a ${target} pattern saves about ` +
        `${fmt(s)} kg CO₂e a year — even a few plant-based days each week adds up.`
      );
    },
  },
  // --- Goods & waste --------------------------------------------------------
  {
    id: 'goods-reduce',
    category: 'goods',
    effort: 'medium',
    title: () => 'Buy less, and choose second-hand or repairable',
    applies: (c) => NEXT_CONSUMPTION[c.profile.goods.consumptionLevel] !== null,
    savingsKg: (c) => {
      const next = NEXT_CONSUMPTION[c.profile.goods.consumptionLevel];
      return next
        ? CONSUMPTION_KG_PER_YEAR[c.profile.goods.consumptionLevel] - CONSUMPTION_KG_PER_YEAR[next]
        : 0;
    },
    rationale: (c, s) =>
      `Your shopping and services footprint is about ${fmt(c.li('goods.consumption'))} kg CO₂e a year. ` +
      `Buying less and choosing used, durable or repairable goods could save around ${fmt(s)} kg.`,
  },
  {
    id: 'recycle-more',
    category: 'goods',
    effort: 'easy',
    title: () => 'Recycle and compost more consistently',
    applies: (c) => c.profile.goods.recyclingHabit !== 'most' && c.li('goods.waste') > 0,
    savingsKg: (c) => c.li('goods.waste'),
    rationale: (_c, s) =>
      `Recycling more of your packaging and composting food scraps avoids landfill methane — ` +
      `about ${fmt(s)} kg CO₂e a year.`,
  },
];

/**
 * Produces a prioritised, personalised set of recommendations for a profile.
 * Ordered by estimated saving (largest first), then by least effort.
 *
 * Note: savings are per-action estimates and are *not* strictly additive —
 * adopting two overlapping actions (e.g. an EV *and* driving less) will save
 * somewhat less than the sum of the two figures.
 */
export function generateRecommendations(
  profile: UserProfile,
  result: FootprintResult,
): Recommendation[] {
  const byKey = new Map(result.lineItems.map((item) => [item.key, item.kgPerYear]));
  const ctx: RuleContext = {
    profile,
    result,
    li: (key) => byKey.get(key) ?? 0,
  };

  return RULES.filter((rule) => rule.applies(ctx))
    .map((rule): Recommendation => {
      const annualSavingsKg = Math.max(0, Math.round(rule.savingsKg(ctx)));
      return {
        id: rule.id,
        category: rule.category,
        title: rule.title(ctx),
        rationale: rule.rationale(ctx, annualSavingsKg),
        annualSavingsKg,
        effort: rule.effort,
      };
    })
    .filter((rec) => rec.annualSavingsKg >= MIN_SAVINGS_KG)
    .sort(
      (a, b) =>
        b.annualSavingsKg - a.annualSavingsKg || EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort],
    );
}
