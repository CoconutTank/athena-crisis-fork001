import Vector from '@deities/athena/map/Vector.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import replaceEffect from '../lib/replaceEffect.tsx';
import { EditorState } from '../Types.tsx';

export default class VectorBehavior {
  public readonly type = 'vector' as const;

  enter(
    vector: Vector,
    state: State,
    actions: Actions,
    editor?: EditorState,
  ): StateLike | null {
    return editor?.isDrawing ? this.put(vector, state, actions, editor) : null;
  }

  private put(
    vector: Vector,
    state: State,
    { setEditorState }: Actions,
    editor: EditorState,
  ): StateLike | null {
    const { map } = state;
    const { config } = map;
    const { action, condition, effects, scenario } = editor;
    if (condition) {
      const [winCondition, index] = condition;
      const winConditions = [...config.winConditions];

      const vectors = new Set(winCondition.vectors);
      vectors[editor.isErasing ? 'delete' : 'add'](vector);
      const newWinCondition = {
        ...winCondition,
        vectors,
      };
      winConditions[index] = newWinCondition;
      setEditorState({
        condition: [newWinCondition, index],
      });
      return {
        map: map.copy({
          config: config.copy({
            winConditions,
          }),
        }),
      };
    } else if (action && scenario) {
      const unit = map.units.get(vector);
      if (!unit) {
        return null;
      }

      const { action: currentAction, actionId } = action;
      const { effect: currentEffect, trigger } = scenario;
      const actions = [...currentEffect.actions];
      const newAction = {
        ...currentAction,
        ...(currentAction.type === 'SpawnEffect'
          ? {
              units: editor.isErasing
                ? currentAction.units.delete(vector)
                : currentAction.units.set(vector, unit.removeLeader()),
            }
          : null),
      };
      actions[actionId] = newAction;

      const effect = {
        ...currentEffect,
        actions,
      };
      setEditorState({
        action: { action: newAction, actionId },
        effects: replaceEffect(effects, trigger, currentEffect, effect),
        scenario: { effect, trigger },
      });

      return {
        map: map.copy({
          units: map.units.delete(vector),
        }),
      };
    }
    return null;
  }
}
