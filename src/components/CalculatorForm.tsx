/**
 * The data-entry form. Each category is a <fieldset> with a <legend>, and the
 * running total is shown (visually) at the top so the effect of each change is
 * immediate. The total is intentionally *not* an ARIA live region: announcing a
 * new number on every keystroke would overwhelm screen-reader users — the
 * "Insights" tab provides the authoritative, announce-on-demand summary.
 */

import {
  CAR_FUEL_LABELS,
  CONSUMPTION_LABELS,
  DIET_LABELS,
  ELECTRICITY_SOURCE_LABELS,
  HEATING_FUEL_LABELS,
  INPUT_LIMITS,
  RECYCLING_LABELS,
  type CarFuel,
  type HeatingFuel,
} from '../domain';
import { useApp } from '../app/appContext';
import { formatKg, formatTonnes } from '../utils/format';
import { NumberField } from './fields/NumberField';
import { SelectField } from './fields/SelectField';
import { optionsFromLabels } from './fields/options';

const CAR_FUEL_OPTIONS = optionsFromLabels(CAR_FUEL_LABELS);
const ELECTRICITY_SOURCE_OPTIONS = optionsFromLabels(ELECTRICITY_SOURCE_LABELS);
const HEATING_FUEL_OPTIONS = optionsFromLabels(HEATING_FUEL_LABELS);
const DIET_OPTIONS = optionsFromLabels(DIET_LABELS);
const CONSUMPTION_OPTIONS = optionsFromLabels(CONSUMPTION_LABELS);
const RECYCLING_OPTIONS = optionsFromLabels(RECYCLING_LABELS);

export function CalculatorForm() {
  const { profile, result, updateTransport, updateHome, updateFood, updateGoods } = useApp();
  const { transport, home, food, goods } = profile;

  function handleCarFuel(carFuel: CarFuel) {
    // Driving distance is meaningless without a car — zero and disable it.
    updateTransport(carFuel === 'none' ? { carFuel, carKmPerWeek: 0 } : { carFuel });
  }

  function handleHeatingFuel(heatingFuel: HeatingFuel) {
    updateHome(heatingFuel === 'none' ? { heatingFuel, heatingKwhPerMonth: 0 } : { heatingFuel });
  }

  return (
    <form className="calculator" aria-labelledby="calculator-heading">
      <div className="calculator__summary card">
        <p className="calculator__summary-label" id="calculator-heading">
          Your estimated footprint
        </p>
        <p className="calculator__summary-value">
          {formatKg(result.totalKgPerYear)}
          <span className="calculator__summary-unit"> CO₂e / year</span>
        </p>
        <p className="calculator__summary-sub">≈ {formatTonnes(result.totalKgPerYear)} per year</p>
      </div>

      <fieldset className="calculator__section">
        <legend className="calculator__legend">
          <span aria-hidden="true">🚗</span> Transport
        </legend>
        <SelectField
          label="Main car fuel"
          value={transport.carFuel}
          options={CAR_FUEL_OPTIONS}
          onChange={handleCarFuel}
        />
        <NumberField
          label="Distance you drive"
          value={transport.carKmPerWeek}
          onChange={(carKmPerWeek) => updateTransport({ carKmPerWeek })}
          limit={INPUT_LIMITS.carKmPerWeek}
          unit="km / week"
          disabled={transport.carFuel === 'none'}
          help="Roughly how far you personally travel by car each week."
        />
        <NumberField
          label="Public transport"
          value={transport.publicTransitKmPerWeek}
          onChange={(publicTransitKmPerWeek) => updateTransport({ publicTransitKmPerWeek })}
          limit={INPUT_LIMITS.publicTransitKmPerWeek}
          unit="km / week"
          help="Bus, train, metro or tram."
        />
        <NumberField
          label="Short-haul flights"
          value={transport.shortHaulFlightsPerYear}
          onChange={(shortHaulFlightsPerYear) => updateTransport({ shortHaulFlightsPerYear })}
          limit={INPUT_LIMITS.flightsPerYear}
          unit="per year"
          integer
          help="Return trips under ~3 hours."
        />
        <NumberField
          label="Long-haul flights"
          value={transport.longHaulFlightsPerYear}
          onChange={(longHaulFlightsPerYear) => updateTransport({ longHaulFlightsPerYear })}
          limit={INPUT_LIMITS.flightsPerYear}
          unit="per year"
          integer
          help="Return trips over ~6 hours."
        />
      </fieldset>

      <fieldset className="calculator__section">
        <legend className="calculator__legend">
          <span aria-hidden="true">🏠</span> Home energy
        </legend>
        <NumberField
          label="People in your home"
          value={home.householdSize}
          onChange={(householdSize) => updateHome({ householdSize })}
          limit={INPUT_LIMITS.householdSize}
          unit="people"
          integer
          help="Shared energy is divided across everyone who lives there."
        />
        <NumberField
          label="Electricity use"
          value={home.electricityKwhPerMonth}
          onChange={(electricityKwhPerMonth) => updateHome({ electricityKwhPerMonth })}
          limit={INPUT_LIMITS.electricityKwhPerMonth}
          unit="kWh / month"
          help="Check a utility bill — a typical home uses around 300 kWh."
        />
        <SelectField
          label="Electricity source"
          value={home.electricitySource}
          options={ELECTRICITY_SOURCE_OPTIONS}
          onChange={(electricitySource) => updateHome({ electricitySource })}
        />
        <SelectField
          label="Heating fuel"
          value={home.heatingFuel}
          options={HEATING_FUEL_OPTIONS}
          onChange={handleHeatingFuel}
        />
        <NumberField
          label="Heating & hot water energy"
          value={home.heatingKwhPerMonth}
          onChange={(heatingKwhPerMonth) => updateHome({ heatingKwhPerMonth })}
          limit={INPUT_LIMITS.heatingKwhPerMonth}
          unit="kWh / month"
          disabled={home.heatingFuel === 'none'}
          help="Energy used to heat your home and water."
        />
      </fieldset>

      <fieldset className="calculator__section">
        <legend className="calculator__legend">
          <span aria-hidden="true">🍽️</span> Food
        </legend>
        <SelectField
          label="Your diet"
          value={food.dietType}
          options={DIET_OPTIONS}
          onChange={(dietType) => updateFood({ dietType })}
          help="Pick the closest match to how you usually eat."
        />
      </fieldset>

      <fieldset className="calculator__section">
        <legend className="calculator__legend">
          <span aria-hidden="true">🛒</span> Goods &amp; waste
        </legend>
        <SelectField
          label="Shopping habits"
          value={goods.consumptionLevel}
          options={CONSUMPTION_OPTIONS}
          onChange={(consumptionLevel) => updateGoods({ consumptionLevel })}
        />
        <SelectField
          label="How much do you recycle?"
          value={goods.recyclingHabit}
          options={RECYCLING_OPTIONS}
          onChange={(recyclingHabit) => updateGoods({ recyclingHabit })}
        />
      </fieldset>
    </form>
  );
}
