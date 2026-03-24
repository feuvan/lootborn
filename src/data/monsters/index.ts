import { EmeraldPlainsMonsters } from './emerald_plains';
import { TwilightForestMonsters } from './twilight_forest';
import { AnvilMountainsMonsters } from './anvil_mountains';
import { ScorchingDesertMonsters } from './scorching_desert';
import { AbyssRiftMonsters } from './abyss_rift';
import { AllDungeonMonsters } from '../dungeonData';
import type { MonsterDefinition } from '../types';

export const MonstersByZone: Record<string, MonsterDefinition[]> = {
  emerald_plains: EmeraldPlainsMonsters,
  twilight_forest: TwilightForestMonsters,
  anvil_mountains: AnvilMountainsMonsters,
  scorching_desert: ScorchingDesertMonsters,
  abyss_rift: AbyssRiftMonsters,
};

export function getMonsterDef(monsterId: string): MonsterDefinition | undefined {
  // Check dungeon-exclusive monsters first
  const dungeonDef = AllDungeonMonsters[monsterId];
  if (dungeonDef) return dungeonDef;

  for (const monsters of Object.values(MonstersByZone)) {
    const found = monsters.find(m => m.id === monsterId);
    if (found) return found;
  }
  return undefined;
}
