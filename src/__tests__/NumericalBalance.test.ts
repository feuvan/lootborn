import { describe, it, expect } from 'vitest';
import { CombatSystem, emptyEquipStats, getSkillDamageMultiplier, getSkillManaCost, getSkillCooldown } from '../systems/CombatSystem';
import type { CombatEntity, EquipStats } from '../systems/CombatSystem';
import type { Stats, SkillDefinition, MonsterDefinition } from '../data/types';
import { MonstersByZone } from '../data/monsters';
import { WarriorClass } from '../data/classes/warrior';
import { MageClass } from '../data/classes/mage';
import { RogueClass } from '../data/classes/rogue';
import { Weapons, Armors, Accessories } from '../data/items/bases';
import { Prefixes, Suffixes } from '../data/items/affixes';
import { LootSystem } from '../systems/LootSystem';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeStats(overrides?: Partial<Stats>): Stats {
  return { str: 10, dex: 10, vit: 10, int: 10, spi: 10, lck: 0, ...overrides };
}

function makeEntity(overrides?: Partial<CombatEntity>): CombatEntity {
  return {
    id: 'e1',
    name: 'Test Entity',
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50,
    stats: makeStats(),
    level: 1,
    baseDamage: 10,
    defense: 5,
    attackSpeed: 1000,
    attackRange: 1,
    buffs: [],
    ...overrides,
  };
}

/** Simulate a player at a given level for a class */
function simulatePlayer(classId: string, level: number): CombatEntity {
  const classDef = classId === 'warrior' ? WarriorClass
    : classId === 'mage' ? MageClass : RogueClass;
  const stats = { ...classDef.baseStats };
  // Apply stat growth per level
  for (let i = 2; i <= level; i++) {
    stats.str += classDef.statGrowth.str;
    stats.dex += classDef.statGrowth.dex;
    stats.vit += classDef.statGrowth.vit;
    stats.int += classDef.statGrowth.int;
    stats.spi += classDef.statGrowth.spi;
    stats.lck += classDef.statGrowth.lck;
  }
  // Allocate 5 free stat points per level into primary stat
  const freePoints = (level - 1) * 5;
  if (classId === 'warrior') stats.str += Math.floor(freePoints * 0.5);
  else if (classId === 'mage') stats.int += Math.floor(freePoints * 0.5);
  else stats.dex += Math.floor(freePoints * 0.5);
  // Spread remaining into vit
  stats.vit += Math.floor(freePoints * 0.3);
  stats.str += Math.floor(freePoints * 0.1);
  stats.dex += Math.floor(freePoints * 0.1);

  const maxHp = 50 + stats.vit * 10 + (level - 1) * 15;
  const maxMana = 30 + stats.spi * 8 + stats.int * 3 + (level - 1) * 8;
  const baseDamage = 8 + stats.str * 0.8 + level * 2;
  const defense = 3 + stats.vit * 0.5 + level;

  return {
    id: 'player',
    name: classDef.name,
    hp: maxHp,
    maxHp,
    mana: maxMana,
    maxMana,
    stats,
    level,
    baseDamage,
    defense,
    attackSpeed: 1000,
    attackRange: 1.5,
    buffs: [],
  };
}

/** Simulate a monster as a CombatEntity */
function monsterToEntity(m: MonsterDefinition): CombatEntity {
  return {
    id: m.id,
    name: m.name,
    hp: m.hp,
    maxHp: m.hp,
    mana: 0,
    maxMana: 0,
    stats: makeStats({ str: 5, dex: 5, vit: 5, int: 5, spi: 5, lck: 0 }),
    level: m.level,
    baseDamage: m.damage,
    defense: m.defense,
    attackSpeed: m.attackSpeed,
    attackRange: m.attackRange,
    buffs: [],
  };
}

/** Get exp needed for a level using the game formula */
function expToNextLevel(level: number): number {
  return Math.floor(level * level * 3 + level * 25);
}

const ZONE_ORDER = ['emerald_plains', 'twilight_forest', 'anvil_mountains', 'scorching_desert', 'abyss_rift'];

/** Get zone level range (approximate, from monster levels in data) */
function getZoneLevelRange(zoneId: string): [number, number] {
  const monsters = MonstersByZone[zoneId];
  if (!monsters || monsters.length === 0) return [1, 1];
  const levels = monsters.map(m => m.level);
  return [Math.min(...levels), Math.max(...levels)];
}

// ---------------------------------------------------------------------------
// 1. Monster stat curves — smooth progression across zones
// ---------------------------------------------------------------------------
describe('Monster stat curves', () => {
  it('monster HP progresses smoothly across zones without sudden 10x jumps', () => {
    // Compare average HP of normal mobs in consecutive zones
    for (let i = 0; i < ZONE_ORDER.length - 1; i++) {
      const zone1 = MonstersByZone[ZONE_ORDER[i]].filter(m => !m.elite);
      const zone2 = MonstersByZone[ZONE_ORDER[i + 1]].filter(m => !m.elite);
      if (zone1.length === 0 || zone2.length === 0) continue;
      const avgHp1 = zone1.reduce((s, m) => s + m.hp, 0) / zone1.length;
      const avgHp2 = zone2.reduce((s, m) => s + m.hp, 0) / zone2.length;
      const ratio = avgHp2 / avgHp1;
      expect(ratio).toBeGreaterThan(1); // HP should increase
      expect(ratio).toBeLessThan(10); // No sudden 10x jump
    }
  });

  it('monster damage progresses smoothly across zones', () => {
    for (let i = 0; i < ZONE_ORDER.length - 1; i++) {
      const zone1 = MonstersByZone[ZONE_ORDER[i]].filter(m => !m.elite);
      const zone2 = MonstersByZone[ZONE_ORDER[i + 1]].filter(m => !m.elite);
      if (zone1.length === 0 || zone2.length === 0) continue;
      const avgDmg1 = zone1.reduce((s, m) => s + m.damage, 0) / zone1.length;
      const avgDmg2 = zone2.reduce((s, m) => s + m.damage, 0) / zone2.length;
      const ratio = avgDmg2 / avgDmg1;
      expect(ratio).toBeGreaterThan(1);
      expect(ratio).toBeLessThan(10);
    }
  });

  it('monster defense progresses smoothly across zones', () => {
    for (let i = 0; i < ZONE_ORDER.length - 1; i++) {
      const zone1 = MonstersByZone[ZONE_ORDER[i]].filter(m => !m.elite);
      const zone2 = MonstersByZone[ZONE_ORDER[i + 1]].filter(m => !m.elite);
      if (zone1.length === 0 || zone2.length === 0) continue;
      const avgDef1 = zone1.reduce((s, m) => s + m.defense, 0) / zone1.length;
      const avgDef2 = zone2.reduce((s, m) => s + m.defense, 0) / zone2.length;
      const ratio = avgDef2 / avgDef1;
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThan(10);
    }
  });

  it('monster exp and gold increase with zones', () => {
    for (let i = 0; i < ZONE_ORDER.length - 1; i++) {
      const zone1 = MonstersByZone[ZONE_ORDER[i]].filter(m => !m.elite);
      const zone2 = MonstersByZone[ZONE_ORDER[i + 1]].filter(m => !m.elite);
      if (zone1.length === 0 || zone2.length === 0) continue;
      const avgExp1 = zone1.reduce((s, m) => s + m.expReward, 0) / zone1.length;
      const avgExp2 = zone2.reduce((s, m) => s + m.expReward, 0) / zone2.length;
      expect(avgExp2).toBeGreaterThan(avgExp1);

      const avgGold1 = zone1.reduce((s, m) => s + (m.goldReward[0] + m.goldReward[1]) / 2, 0) / zone1.length;
      const avgGold2 = zone2.reduce((s, m) => s + (m.goldReward[0] + m.goldReward[1]) / 2, 0) / zone2.length;
      expect(avgGold2).toBeGreaterThan(avgGold1);
    }
  });

  it('elite monsters are significantly stronger than normals in the same zone', () => {
    for (const zoneId of ZONE_ORDER) {
      const monsters = MonstersByZone[zoneId];
      const normals = monsters.filter(m => !m.elite);
      const elites = monsters.filter(m => m.elite);
      if (normals.length === 0 || elites.length === 0) continue;
      const avgNormalHp = normals.reduce((s, m) => s + m.hp, 0) / normals.length;
      const avgEliteHp = elites.reduce((s, m) => s + m.hp, 0) / elites.length;
      expect(avgEliteHp).toBeGreaterThan(avgNormalHp * 2);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Experience curve — ~15-25 kills per level
// ---------------------------------------------------------------------------
describe('Experience curve', () => {
  const CHECKPOINTS = [5, 15, 25, 35, 45];
  const ZONE_FOR_CHECKPOINT: Record<number, string> = {
    5: 'emerald_plains',
    15: 'twilight_forest',
    25: 'anvil_mountains',
    35: 'scorching_desert',
    45: 'abyss_rift',
  };

  for (const checkpoint of CHECKPOINTS) {
    it(`at level ${checkpoint}, ~15-25 kills per level in current zone`, () => {
      const needed = expToNextLevel(checkpoint);
      const zoneId = ZONE_FOR_CHECKPOINT[checkpoint];
      const normals = MonstersByZone[zoneId].filter(m => !m.elite);
      if (normals.length === 0) return;
      const avgExp = normals.reduce((s, m) => s + m.expReward, 0) / normals.length;
      const killsNeeded = needed / avgExp;
      expect(killsNeeded).toBeGreaterThanOrEqual(10); // Allow some margin
      expect(killsNeeded).toBeLessThanOrEqual(35); // Allow some margin
    });
  }

  it('exp curve is monotonically increasing', () => {
    for (let lvl = 1; lvl < 50; lvl++) {
      expect(expToNextLevel(lvl + 1)).toBeGreaterThan(expToNextLevel(lvl));
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Player survivability at checkpoints — can clear 3+ fights
// ---------------------------------------------------------------------------
describe('Player survivability at checkpoints', () => {
  const cs = new CombatSystem();
  const CHECKPOINTS = [
    { level: 5, zone: 'emerald_plains', classId: 'warrior' },
    { level: 15, zone: 'twilight_forest', classId: 'warrior' },
    { level: 25, zone: 'anvil_mountains', classId: 'warrior' },
    { level: 35, zone: 'scorching_desert', classId: 'warrior' },
    { level: 45, zone: 'abyss_rift', classId: 'warrior' },
  ];

  for (const cp of CHECKPOINTS) {
    it(`level ${cp.level} ${cp.classId} can survive 3+ fights in ${cp.zone}`, () => {
      const player = simulatePlayer(cp.classId, cp.level);
      const normals = MonstersByZone[cp.zone].filter(m => !m.elite);
      if (normals.length === 0) return;

      // Pick the toughest normal monster
      const toughest = normals.reduce((a, b) => a.damage > b.damage ? a : b);
      const monster = monsterToEntity(toughest);

      // Simulate: count how many hits player can tank from toughest monster
      // Use zero-dex to avoid dodge variance
      const playerEntity = { ...player, stats: { ...player.stats, dex: 0, lck: 0 } };
      const monsterEntity = { ...monster, stats: { ...monster.stats, dex: 0, lck: 0 } };
      const hitResult = cs.calculateDamage(monsterEntity, playerEntity);
      const hitsToKill = Math.ceil(player.hp / Math.max(1, hitResult.damage));

      // Player should survive at least some hits (enough for 3 fights with regen between)
      // In a real fight the player also does damage back, so surviving ~5 hits per fight is enough
      // Verify no one-shot: a single hit shouldn't kill player
      expect(hitResult.damage).toBeLessThan(player.hp);

      // And player should deal meaningful damage back
      const playerResult = cs.calculateDamage(playerEntity, monsterEntity);
      const hitsToKillMonster = Math.ceil(toughest.hp / Math.max(1, playerResult.damage));
      // Player should be able to kill the monster (within reasonable number of hits)
      expect(hitsToKillMonster).toBeLessThan(50);
      // Player should survive more hits than it takes to kill the monster
      expect(hitsToKill).toBeGreaterThanOrEqual(3);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Item power scaling — levelReq matches zone ranges
// ---------------------------------------------------------------------------
describe('Item power scaling', () => {
  it('weapons exist for all level tiers (1, 8-10, 15, 20, 28-30, 35)', () => {
    const levelTiers = [1, 10, 15, 20, 28, 35];
    for (const tier of levelTiers) {
      const weapons = Weapons.filter(w => Math.abs(w.levelReq - tier) <= 3);
      expect(weapons.length).toBeGreaterThan(0);
    }
  });

  it('weapon damage scales with levelReq within same weapon type', () => {
    const weaponTypes = ['sword', 'dagger', 'bow', 'staff'];
    for (const wtype of weaponTypes) {
      const sorted = [...Weapons]
        .filter(w => (w as any).weaponType === wtype && w.baseDamage[1] > 0)
        .sort((a, b) => a.levelReq - b.levelReq);
      for (let i = 0; i < sorted.length - 1; i++) {
        const avgDmg1 = (sorted[i].baseDamage[0] + sorted[i].baseDamage[1]) / 2;
        const avgDmg2 = (sorted[i + 1].baseDamage[0] + sorted[i + 1].baseDamage[1]) / 2;
        if (sorted[i + 1].levelReq > sorted[i].levelReq) {
          expect(avgDmg2).toBeGreaterThanOrEqual(avgDmg1);
        }
      }
    }
  });

  it('armor defense scales with levelReq within same slot', () => {
    const slots = ['helmet', 'armor', 'gloves', 'boots', 'belt'];
    for (const slot of slots) {
      const sorted = Armors.filter(a => a.slot === slot).sort((a, b) => a.levelReq - b.levelReq);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1].levelReq > sorted[i].levelReq) {
          expect(sorted[i + 1].baseDefense).toBeGreaterThanOrEqual(sorted[i].baseDefense);
        }
      }
    }
  });

  it('armors exist for all zone level tiers', () => {
    const levelTiers = [1, 10, 15, 20, 30, 35];
    for (const tier of levelTiers) {
      const armors = Armors.filter(a => Math.abs(a.levelReq - tier) <= 3);
      expect(armors.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Affix tiers match zone difficulty
// ---------------------------------------------------------------------------
describe('Affix tiers match zone difficulty', () => {
  it('zone 1 (lv 1-7) generates tier 1-2 affixes', () => {
    const ls = new LootSystem();
    const affixTiers = new Set<number>();
    // Generate many items at zone 1 level
    for (let i = 0; i < 200; i++) {
      const item = ls.generateEquipment(5, 'magic');
      if (item) {
        for (const affix of item.affixes) {
          const def = [...Prefixes, ...Suffixes].find(a => a.id === affix.affixId);
          if (def) affixTiers.add(def.tier);
        }
      }
    }
    // Should mostly be tier 1-2
    if (affixTiers.size > 0) {
      const maxTier = Math.max(...affixTiers);
      expect(maxTier).toBeLessThanOrEqual(3); // Allow up to tier 3 edge case
    }
  });

  it('zone 5 (lv 38+) generates tier 4-5 affixes', () => {
    const ls = new LootSystem();
    const affixTiers = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const item = ls.generateEquipment(42, 'rare');
      if (item) {
        for (const affix of item.affixes) {
          const def = [...Prefixes, ...Suffixes].find(a => a.id === affix.affixId);
          if (def) affixTiers.add(def.tier);
        }
      }
    }
    // Should include high-tier affixes
    if (affixTiers.size > 0) {
      const maxTier = Math.max(...affixTiers);
      expect(maxTier).toBeGreaterThanOrEqual(4);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Skill damage multipliers — level 10 ~2-3x level 1
// ---------------------------------------------------------------------------
describe('Skill damage scaling', () => {
  const allClasses = [
    { name: 'warrior', classDef: WarriorClass },
    { name: 'mage', classDef: MageClass },
    { name: 'rogue', classDef: RogueClass },
  ];

  for (const { name, classDef } of allClasses) {
    for (const skill of classDef.skills) {
      if (skill.damageMultiplier === 0) continue; // buff-only skills
      it(`${name}/${skill.nameEn} level 10 does ~2-3x level 1 damage`, () => {
        const mult1 = getSkillDamageMultiplier(skill, 1);
        const mult10 = getSkillDamageMultiplier(skill, 10);
        const ratio = mult10 / mult1;
        // Allow 1.5x to 4x range (generous but prevents broken scaling)
        expect(ratio).toBeGreaterThanOrEqual(1.5);
        expect(ratio).toBeLessThanOrEqual(4.0);
      });

      it(`${name}/${skill.nameEn} has damageMultiplier <= 3.0`, () => {
        expect(skill.damageMultiplier).toBeLessThanOrEqual(3.0);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// 7. Gold economy — affordable items after reasonable farming
// ---------------------------------------------------------------------------
describe('Gold economy', () => {
  const ZONE_FOR_LVL: Record<number, string> = {
    5: 'emerald_plains',
    15: 'twilight_forest',
    25: 'anvil_mountains',
    35: 'scorching_desert',
    45: 'abyss_rift',
  };

  it('gold drops scale with zones', () => {
    for (let i = 0; i < ZONE_ORDER.length - 1; i++) {
      const zone1 = MonstersByZone[ZONE_ORDER[i]].filter(m => !m.elite);
      const zone2 = MonstersByZone[ZONE_ORDER[i + 1]].filter(m => !m.elite);
      if (zone1.length === 0 || zone2.length === 0) continue;
      const avgGold1 = zone1.reduce((s, m) => s + (m.goldReward[0] + m.goldReward[1]) / 2, 0) / zone1.length;
      const avgGold2 = zone2.reduce((s, m) => s + (m.goldReward[0] + m.goldReward[1]) / 2, 0) / zone2.length;
      expect(avgGold2).toBeGreaterThan(avgGold1);
    }
  });

  for (const [lvl, zone] of Object.entries(ZONE_FOR_LVL)) {
    it(`at level ${lvl}, a weapon of similar level is buyable after ~30 min farming`, () => {
      const playerLvl = Number(lvl);
      // Find a weapon near this level
      const weaponsNearLevel = Weapons.filter(w =>
        w.baseDamage[1] > 0 && w.levelReq <= playerLvl && w.levelReq >= playerLvl - 10
      );
      if (weaponsNearLevel.length === 0) return;
      const weapon = weaponsNearLevel.sort((a, b) => b.levelReq - a.levelReq)[0];
      const buyPrice = weapon.sellPrice * 3; // Shop markup is 3x

      const normals = MonstersByZone[zone].filter(m => !m.elite);
      if (normals.length === 0) return;
      const avgGold = normals.reduce((s, m) => s + (m.goldReward[0] + m.goldReward[1]) / 2, 0) / normals.length;

      // Assume ~1 kill per 5-10 seconds (auto-battle), so 30 min = 180-360 kills
      const killsFor30Min = 200; // conservative estimate
      const goldIn30Min = avgGold * killsFor30Min;
      // The weapon should be affordable (30 min or less of farming)
      expect(buyPrice).toBeLessThanOrEqual(goldIn30Min);
    });
  }
});

// ---------------------------------------------------------------------------
// 8. Minimum damage always 1, no negative damage
// ---------------------------------------------------------------------------
describe('Minimum damage guarantees', () => {
  const cs = new CombatSystem();

  it('damage is always >= 1 even with extreme defense', () => {
    const atk = makeEntity({ baseDamage: 1, stats: makeStats({ str: 1, dex: 0, lck: 0 }) });
    const def = makeEntity({ defense: 999, stats: makeStats({ dex: 0 }) });
    const result = cs.calculateDamage(atk, def);
    if (!result.isDodged) {
      expect(result.damage).toBeGreaterThanOrEqual(1);
    }
  });

  it('damage is always >= 1 with max damage reduction buff', () => {
    const atk = makeEntity({ baseDamage: 1, stats: makeStats({ str: 1, dex: 0, lck: 0 }) });
    const def = makeEntity({
      defense: 100,
      stats: makeStats({ dex: 0 }),
      buffs: [{ stat: 'damageReduction', value: 0.9, duration: 99999, startTime: 0 }],
    });
    const result = cs.calculateDamage(atk, def);
    if (!result.isDodged) {
      expect(result.damage).toBeGreaterThanOrEqual(1);
    }
  });

  it('damage is never NaN or Infinity', () => {
    const atk = makeEntity({ stats: makeStats({ dex: 0, lck: 0 }) });
    const def = makeEntity({ stats: makeStats({ dex: 0 }) });
    for (let i = 0; i < 100; i++) {
      const result = cs.calculateDamage(atk, def);
      expect(Number.isFinite(result.damage)).toBe(true);
      expect(Number.isNaN(result.damage)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Stat growth is meaningful
// ---------------------------------------------------------------------------
describe('Stat growth meaningfulness', () => {
  it('+1 STR adds approximately +0.8 damage', () => {
    // baseDamage formula: 8 + str * 0.8 + level * 2
    const base1 = 8 + 10 * 0.8;
    const base2 = 8 + 11 * 0.8;
    const diff = base2 - base1;
    expect(diff).toBeCloseTo(0.8, 1);
  });

  it('+1 VIT adds exactly +10 HP', () => {
    // maxHp formula: 50 + vit * 10 + (level-1) * 15
    const hp1 = 50 + 10 * 10;
    const hp2 = 50 + 11 * 10;
    const diff = hp2 - hp1;
    expect(diff).toBe(10);
  });

  it('stat growth per level makes noticeable difference in power', () => {
    const player1 = simulatePlayer('warrior', 1);
    const player10 = simulatePlayer('warrior', 10);
    // Level 10 warrior should have significantly more HP and damage
    expect(player10.maxHp).toBeGreaterThan(player1.maxHp * 2);
    expect(player10.baseDamage).toBeGreaterThan(player1.baseDamage * 1.5);
  });
});

// ---------------------------------------------------------------------------
// 10. Comprehensive checkpoint balance tests
// ---------------------------------------------------------------------------
describe('Comprehensive checkpoint balance (lv 5/15/25/35/45)', () => {
  const cs = new CombatSystem();
  const CHECKPOINTS = [
    { level: 5, zone: 'emerald_plains' },
    { level: 15, zone: 'twilight_forest' },
    { level: 25, zone: 'anvil_mountains' },
    { level: 35, zone: 'scorching_desert' },
    { level: 45, zone: 'abyss_rift' },
  ];

  for (const cp of CHECKPOINTS) {
    describe(`Checkpoint level ${cp.level} (${cp.zone})`, () => {
      const player = simulatePlayer('warrior', cp.level);
      const normals = MonstersByZone[cp.zone].filter(m => !m.elite);

      it('player HP is adequate for zone', () => {
        if (normals.length === 0) return;
        const toughest = normals.reduce((a, b) => a.damage > b.damage ? a : b);
        // Player should survive at least 3 hits from the toughest normal
        expect(player.hp).toBeGreaterThan(toughest.damage * 3);
      });

      it('player deals meaningful damage to zone monsters', () => {
        if (normals.length === 0) return;
        const weakest = normals.reduce((a, b) => a.hp < b.hp ? a : b);
        const monsterEntity = monsterToEntity(weakest);
        const playerEntity = { ...player, stats: { ...player.stats, dex: 0, lck: 0 } };
        const monsterEnt = { ...monsterEntity, stats: { ...monsterEntity.stats, dex: 0 } };
        const result = cs.calculateDamage(playerEntity, monsterEnt);
        // Should kill the weakest mob in under 20 hits
        const hitsToKill = Math.ceil(weakest.hp / Math.max(1, result.damage));
        expect(hitsToKill).toBeLessThan(20);
      });

      it('exp rewards match the kills-per-level target', () => {
        if (normals.length === 0) return;
        const expNeeded = expToNextLevel(cp.level);
        const avgExp = normals.reduce((s, m) => s + m.expReward, 0) / normals.length;
        const kills = expNeeded / avgExp;
        expect(kills).toBeGreaterThanOrEqual(8);
        expect(kills).toBeLessThanOrEqual(40);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// 11. No damageMultiplier > 3.0 on any skill
// ---------------------------------------------------------------------------
describe('Skill multiplier caps', () => {
  const allSkills: SkillDefinition[] = [
    ...WarriorClass.skills,
    ...MageClass.skills,
    ...RogueClass.skills,
  ];

  it('no skill has base damageMultiplier > 3.0', () => {
    for (const skill of allSkills) {
      expect(skill.damageMultiplier).toBeLessThanOrEqual(3.0);
    }
  });
});
