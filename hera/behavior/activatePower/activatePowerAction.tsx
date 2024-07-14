import { ActivatePowerActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import {
  getHealUnitTypes,
  onPowerUnitUpgrade,
  Skill,
} from '@deities/athena/info/Skill.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import { MaxHealth } from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import { sortByVectorKey, sortVectors } from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import animateHeal from '../../lib/animateHeal.tsx';
import AnimationKey from '../../lib/AnimationKey.tsx';
import getSkillConfigForDisplay from '../../lib/getSkillConfigForDisplay.tsx';
import upgradeUnits from '../../lib/upgradeUnits.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

const getUnitsToHeal = (map: MapData, player: PlayerID, skill: Skill) => {
  const healTypes = getHealUnitTypes(skill);
  return healTypes
    ? map.units.filter(
        (unit, vector) =>
          map.matchesPlayer(unit, player) &&
          unit.health < MaxHealth &&
          matchesActiveType(healTypes, unit, vector),
      )
    : null;
};

export default async function activatePowerAction(
  actions: Actions,
  state: State,
  actionResponse: ActivatePowerActionResponse,
): Promise<State> {
  const { requestFrame, update } = actions;
  const { skill } = actionResponse;
  const player = state.map.getCurrentPlayer();
  const { colors, name } = getSkillConfigForDisplay(skill);
  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: colors,
        length: 'long',
        onComplete: (state) => {
          const map = applyActionResponse(
            state.map,
            state.vision,
            actionResponse,
          );

          const unitTypes = state.map
            .copy({
              teams: updatePlayer(state.map.teams, map.getPlayer(player.id)),
            })
            .getActiveUnitTypes()
            .get(player.id);

          const unitsToHeal = getUnitsToHeal(state.map, player.id, skill);
          const healVectors = new Set(
            unitsToHeal ? [...unitsToHeal.keys()] : [],
          );
          const units = state.map.units.filter(
            (unit, vector) =>
              !healVectors.has(vector) &&
              (!unit.isCompleted() || skill === Skill.RecoverAirUnits) &&
              state.map.matchesPlayer(unit, player) &&
              matchesActiveType(unitTypes, unit, vector),
          );

          const getUpgradeAnimations = (state: State) =>
            upgradeUnits(
              actions,
              state,
              sortVectors([...units.keys()]),
              (state) => {
                requestFrame(() =>
                  resolve({ ...state, map, ...resetBehavior() }),
                );
                return null;
              },
              ({ map }, vector) => {
                const unit = map.units.get(vector);
                const newMap =
                  unit && onPowerUnitUpgrade(skill, map, vector, unit);
                return newMap ? { map: newMap } : null;
              },
            );

          return {
            ...(unitsToHeal?.size
              ? animateHeal(
                  state,
                  sortByVectorKey([...unitsToHeal]),
                  (state) => (units.size ? getUpgradeAnimations(state) : state),
                )
              : getUpgradeAnimations(state)),
            map: state.map.copy({
              teams: updatePlayer(
                state.map.teams,
                state.map
                  .getPlayer(player.id)
                  .setCharge(map.getPlayer(player.id).charge),
              ),
            }),
          };
        },
        player: player.id,
        sound: 'UI/Start',
        style: 'flashy',
        text: String(name),
        type: 'banner',
      }),
      ...resetBehavior(NullBehavior),
    })),
  );
}
