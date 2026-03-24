import { describe, it, expect } from 'vitest';
import { CombatSystem, emptyEquipStats, getSkillDamageMultiplier, getSkillManaCost, getSkillCooldown, getSkillAoeRadius, getSkillBuffValue, getSynergyBonus } from '../systems/CombatSystem';
import type { CombatEntity, EquipStats, DamageResult } from '../systems/CombatSystem';
import type { SkillDefinition, Stats, MonsterDefinition, MapData } from '../data/types';
import { PathfindingSystem } from '../systems/PathfindingSystem';
import { LootSystem } from '../systems/LootSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { MapGenerator } from '../systems/MapGenerator';

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

function makeSkill(overrides?: Partial<SkillDefinition>): SkillDefinition {
  return {
    id: 'test_skill',
    name: '测试技能',
    nameEn: 'Test Skill',
    description: 'A test skill',
    tree: 'offense',
    tier: 1,
    maxLevel: 20,
    manaCost: 10,
    cooldown: 2000,
    range: 1,
    damageMultiplier: 1.5,
    damageType: 'physical',
    icon: 'skill_test',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// CombatSystem
// ---------------------------------------------------------------------------
describe('CombatSystem', () => {
  const cs = new CombatSystem();

  describe('calculateDamage', () => {
    it('deals at least 1 damage against a defender', () => {
      const atk = makeEntity({ stats: makeStats({ dex: 0, lck: 0 }) });
      const def = makeEntity({ stats: makeStats({ dex: 0 }) });
      const result = cs.calculateDamage(atk, def);
      // Damage should be a positive integer or dodge
      expect(result.damage).toBeGreaterThanOrEqual(0);
      if (!result.isDodged) {
        expect(result.damage).toBeGreaterThanOrEqual(1);
      }
    });

    it('returns isDodged=true when dex is very high', () => {
      const atk = makeEntity({ stats: makeStats({ dex: 0, lck: 0 }) });
      const def = makeEntity({ stats: makeStats({ dex: 100 }) });
      // With dex=100, dodgeRate = 30 (capped). Run enough tries to get at least 1 dodge.
      let dodgeCount = 0;
      for (let i = 0; i < 200; i++) {
        if (cs.calculateDamage(atk, def).isDodged) dodgeCount++;
      }
      expect(dodgeCount).toBeGreaterThan(0);
    });

    it('skill multiplier increases damage', () => {
      const atk = makeEntity({ stats: makeStats({ dex: 0, lck: 0 }) });
      const def = makeEntity({ stats: makeStats({ dex: 0 }), defense: 0 });
      const skill = makeSkill({ damageMultiplier: 3.0 });
      // Run multiple trials and compare averages
      let skillDmg = 0;
      let normalDmg = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        skillDmg += cs.calculateDamage(atk, def, skill, 1).damage;
        normalDmg += cs.calculateDamage(atk, def).damage;
      }
      expect(skillDmg / trials).toBeGreaterThan(normalDmg / trials);
    });

    it('equipment damage bonus increases output', () => {
      const eq = emptyEquipStats();
      eq.damage = 50;
      const atk = makeEntity({ equipStats: eq, stats: makeStats({ dex: 0, lck: 0 }) });
      const def = makeEntity({ stats: makeStats({ dex: 0 }), defense: 0 });
      const result = cs.calculateDamage(atk, def);
      if (!result.isDodged) {
        // With 50 flat bonus, damage should be significantly higher than 15 base
        expect(result.damage).toBeGreaterThan(15);
      }
    });

    it('damageReduction buff reduces damage', () => {
      const atk = makeEntity({ baseDamage: 100, stats: makeStats({ dex: 0, lck: 0 }) });
      const defNoBuff = makeEntity({ defense: 0, stats: makeStats({ dex: 0 }) });
      const defBuff = makeEntity({
        defense: 0,
        stats: makeStats({ dex: 0 }),
        buffs: [{ stat: 'damageReduction', value: 0.5, duration: 10000, startTime: 0 }],
      });
      let totalNoBuff = 0;
      let totalBuff = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        totalNoBuff += cs.calculateDamage(atk, defNoBuff).damage;
        totalBuff += cs.calculateDamage(atk, defBuff).damage;
      }
      // Buffed defender should take roughly half the damage
      expect(totalBuff / trials).toBeLessThan(totalNoBuff / trials * 0.75);
    });
  });

  describe('applyDamage', () => {
    it('reduces target HP', () => {
      const target = makeEntity({ hp: 100 });
      cs.applyDamage(target, { damage: 30, isCrit: false, isDodged: false, damageType: 'physical', lifeStolen: 0, manaStolen: 0 });
      expect(target.hp).toBe(70);
    });

    it('does not reduce HP below 0', () => {
      const target = makeEntity({ hp: 10 });
      cs.applyDamage(target, { damage: 50, isCrit: false, isDodged: false, damageType: 'physical', lifeStolen: 0, manaStolen: 0 });
      expect(target.hp).toBe(0);
    });

    it('does not modify HP on dodge', () => {
      const target = makeEntity({ hp: 100 });
      cs.applyDamage(target, { damage: 0, isCrit: false, isDodged: true, damageType: 'physical', lifeStolen: 0, manaStolen: 0 });
      expect(target.hp).toBe(100);
    });
  });

  describe('skill scaling helpers', () => {
    it('getSkillDamageMultiplier scales with level', () => {
      const skill = makeSkill({ damageMultiplier: 1.0, scaling: { damagePerLevel: 0.1, manaCostPerLevel: 0.5 } });
      const lv1 = getSkillDamageMultiplier(skill, 1);
      const lv10 = getSkillDamageMultiplier(skill, 10);
      expect(lv10).toBeGreaterThan(lv1);
    });

    it('getSkillManaCost increases with level', () => {
      const skill = makeSkill({ manaCost: 10, scaling: { damagePerLevel: 0.1, manaCostPerLevel: 1 } });
      expect(getSkillManaCost(skill, 5)).toBeGreaterThan(getSkillManaCost(skill, 1));
    });

    it('getSynergyBonus returns 1 with no synergies', () => {
      const skill = makeSkill();
      expect(getSynergyBonus(skill, {})).toBe(1);
    });

    it('getSynergyBonus increases with synergy levels', () => {
      const skill = makeSkill({
        synergies: [{ skillId: 'other', damagePerLevel: 0.05 }],
      });
      expect(getSynergyBonus(skill, { other: 5 })).toBeGreaterThan(1);
    });
  });

  describe('buff management', () => {
    it('updateBuffs removes expired buffs', () => {
      const entity = makeEntity({
        buffs: [
          { stat: 'damageReduction', value: 0.5, duration: 5000, startTime: 1000 },
          { stat: 'attackSpeed', value: 0.2, duration: 10000, startTime: 1000 },
        ],
      });
      cs.updateBuffs(entity, 7000); // 6s elapsed — first buff should expire
      expect(entity.buffs).toHaveLength(1);
      expect(entity.buffs[0].stat).toBe('attackSpeed');
    });

    it('addBuff adds a buff to the entity', () => {
      const entity = makeEntity();
      cs.addBuff(entity, { stat: 'defense', value: 10, duration: 5000, startTime: 0 });
      expect(entity.buffs).toHaveLength(1);
    });
  });

  describe('canUseSkill / useSkillMana', () => {
    it('canUseSkill returns true when mana is sufficient', () => {
      const entity = makeEntity({ mana: 50 });
      const skill = makeSkill({ manaCost: 10 });
      expect(cs.canUseSkill(entity, skill)).toBe(true);
    });

    it('canUseSkill returns false when mana is insufficient', () => {
      const entity = makeEntity({ mana: 5 });
      const skill = makeSkill({ manaCost: 10 });
      expect(cs.canUseSkill(entity, skill)).toBe(false);
    });

    it('useSkillMana deducts mana', () => {
      const entity = makeEntity({ mana: 50 });
      const skill = makeSkill({ manaCost: 10 });
      cs.useSkillMana(entity, skill);
      expect(entity.mana).toBe(40);
    });
  });
});

// ---------------------------------------------------------------------------
// PathfindingSystem
// ---------------------------------------------------------------------------
describe('PathfindingSystem', () => {
  // collisions: true = walkable, false = blocked
  function makeGrid(cols: number, rows: number, blocked?: [number, number][]): boolean[][] {
    const grid: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      grid.push(new Array(cols).fill(true));
    }
    for (const [c, r] of blocked ?? []) {
      grid[r][c] = false;
    }
    return grid;
  }

  it('finds a straight-line path on an open grid', () => {
    const grid = makeGrid(10, 10);
    const pf = new PathfindingSystem(grid, 10, 10);
    const path = pf.findPath(0, 0, 3, 0);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ col: 3, row: 0 });
  });

  it('returns empty path when destination is blocked', () => {
    const grid = makeGrid(10, 10, [[5, 5]]);
    const pf = new PathfindingSystem(grid, 10, 10);
    const path = pf.findPath(0, 0, 5, 5);
    expect(path).toEqual([]);
  });

  it('returns empty path when start equals end', () => {
    const grid = makeGrid(10, 10);
    const pf = new PathfindingSystem(grid, 10, 10);
    expect(pf.findPath(3, 3, 3, 3)).toEqual([]);
  });

  it('navigates around a wall', () => {
    // Block column 5, rows 0-8 (leave row 9 open)
    const blocked: [number, number][] = [];
    for (let r = 0; r < 9; r++) blocked.push([5, r]);
    const grid = makeGrid(10, 10, blocked);
    const pf = new PathfindingSystem(grid, 10, 10);
    const path = pf.findPath(0, 0, 9, 0);
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ col: 9, row: 0 });
    // Path should never step on a blocked cell
    for (const step of path) {
      expect(grid[step.row][step.col]).toBe(true);
    }
  });

  it('returns empty path for out-of-bounds destination', () => {
    const grid = makeGrid(5, 5);
    const pf = new PathfindingSystem(grid, 5, 5);
    expect(pf.findPath(0, 0, 10, 10)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// LootSystem
// ---------------------------------------------------------------------------
describe('LootSystem', () => {
  const ls = new LootSystem();

  function makeMonster(overrides?: Partial<MonsterDefinition>): MonsterDefinition {
    return {
      id: 'test_mob',
      name: 'Test Mob',
      level: 10,
      hp: 100,
      damage: 10,
      defense: 5,
      speed: 80,
      aggroRange: 5,
      attackRange: 1,
      attackSpeed: 1000,
      expReward: 20,
      goldReward: [5, 10],
      spriteKey: 'mob_test',
      ...overrides,
    };
  }

  it('generateLoot returns an array', () => {
    const items = ls.generateLoot(makeMonster(), 0);
    expect(Array.isArray(items)).toBe(true);
  });

  it('elite monsters can drop more items', () => {
    let eliteTotalItems = 0;
    let normalTotalItems = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      eliteTotalItems += ls.generateLoot(makeMonster({ elite: true }), 50).length;
      normalTotalItems += ls.generateLoot(makeMonster({ elite: false }), 50).length;
    }
    // On average, elites should drop more
    expect(eliteTotalItems / trials).toBeGreaterThan(normalTotalItems / trials);
  });

  it('generateEquipment returns an item with correct quality', () => {
    const item = ls.generateEquipment(10, 'rare');
    if (item) {
      expect(item.quality).toBe('rare');
      expect(item.uid).toBeTruthy();
      expect(item.name).toBeTruthy();
    }
  });

  it('generateEquipment returns item with level-appropriate affixes', () => {
    const item = ls.generateEquipment(10, 'magic');
    if (item) {
      expect(item.affixes.length).toBeGreaterThanOrEqual(1);
      expect(item.affixes.length).toBeLessThanOrEqual(2);
    }
  });

  it('rare items have 3-4 affixes', () => {
    // Rare items should have 3-4 affixes, run several generations
    let found = false;
    for (let i = 0; i < 50; i++) {
      const item = ls.generateEquipment(20, 'rare');
      if (item && item.affixes.length >= 3 && item.affixes.length <= 4) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// InventorySystem
// ---------------------------------------------------------------------------
describe('InventorySystem', () => {
  function makeItem(overrides?: Partial<import('../data/types').ItemInstance>): import('../data/types').ItemInstance {
    return {
      uid: `item_${Date.now()}_${Math.random()}`,
      baseId: 'w_rusty_sword',
      name: '生锈的剑',
      quality: 'normal' as const,
      level: 1,
      affixes: [],
      sockets: [],
      identified: true,
      quantity: 1,
      stats: {},
      ...overrides,
    };
  }

  it('addItem adds to inventory', () => {
    const inv = new InventorySystem();
    const item = makeItem();
    expect(inv.addItem(item)).toBe(true);
    expect(inv.inventory).toHaveLength(1);
  });

  it('removeItem removes from inventory', () => {
    const inv = new InventorySystem();
    const item = makeItem();
    inv.addItem(item);
    const removed = inv.removeItem(item.uid);
    expect(removed).not.toBeNull();
    expect(inv.inventory).toHaveLength(0);
  });

  it('equip moves item from inventory to equipment', () => {
    const inv = new InventorySystem();
    const item = makeItem({ baseId: 'w_rusty_sword' });
    inv.addItem(item);
    expect(inv.equip(item.uid)).toBe(true);
    expect(inv.inventory).toHaveLength(0);
    expect(inv.equipment['weapon']).toBeTruthy();
  });

  it('unequip moves item from equipment to inventory', () => {
    const inv = new InventorySystem();
    const item = makeItem({ baseId: 'w_rusty_sword' });
    inv.addItem(item);
    inv.equip(item.uid);
    expect(inv.unequip('weapon')).toBe(true);
    expect(inv.inventory).toHaveLength(1);
    expect(inv.equipment['weapon']).toBeUndefined();
  });

  it('getEquipmentStats returns accumulated stats from equipped items', () => {
    const inv = new InventorySystem();
    const item = makeItem({
      baseId: 'w_rusty_sword',
      stats: { damage: 10, critRate: 5 },
    });
    inv.addItem(item);
    inv.equip(item.uid);
    const eqStats = inv.getEquipmentStats();
    expect(eqStats['damage']).toBeGreaterThanOrEqual(10);
  });

  it('refuses to add when inventory is full', () => {
    const inv = new InventorySystem();
    for (let i = 0; i < 100; i++) {
      inv.addItem(makeItem({ uid: `item_${i}` }));
    }
    expect(inv.addItem(makeItem({ uid: 'overflow' }))).toBe(false);
    expect(inv.inventory).toHaveLength(100);
  });

  it('discardItem removes and returns true', () => {
    const inv = new InventorySystem();
    const item = makeItem();
    inv.addItem(item);
    expect(inv.discardItem(item.uid)).toBe(true);
    expect(inv.inventory).toHaveLength(0);
  });

  it('sellItem returns sell price', () => {
    const inv = new InventorySystem();
    const item = makeItem({ baseId: 'w_rusty_sword' }); // sellPrice = 5
    inv.addItem(item);
    const gold = inv.sellItem(item.uid);
    expect(gold).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// MapGenerator
// ---------------------------------------------------------------------------
describe('MapGenerator', () => {
  function makeMinimalMap(): MapData {
    return {
      id: 'test_map',
      name: 'Test Map',
      cols: 30,
      rows: 30,
      tiles: [],
      collisions: [],
      spawns: [{ col: 15, row: 15, monsterId: 'test_mob', count: 3 }],
      camps: [{ col: 5, row: 5, npcs: ['test_npc'] }],
      playerStart: { col: 2, row: 2 },
      exits: [{ col: 29, row: 15, targetMap: 'zone2', targetCol: 1, targetRow: 15 }],
      levelRange: [1, 5] as [number, number],
      theme: 'plains',
      seed: 12345,
    };
  }

  it('generates a map with correct dimensions', () => {
    const result = MapGenerator.generate(makeMinimalMap());
    expect(result.tiles).toHaveLength(30);
    expect(result.tiles[0]).toHaveLength(30);
    expect(result.collisions).toHaveLength(30);
    expect(result.collisions[0]).toHaveLength(30);
  });

  it('border tiles are walls', () => {
    const result = MapGenerator.generate(makeMinimalMap());
    // Top row should be all walls (tile 4)
    for (let c = 0; c < 30; c++) {
      expect(result.tiles[0][c]).toBe(4); // TILE_WALL
    }
    // Bottom row
    for (let c = 0; c < 30; c++) {
      expect(result.tiles[29][c]).toBe(4);
    }
  });

  it('player start is walkable', () => {
    const map = makeMinimalMap();
    const result = MapGenerator.generate(map);
    expect(result.collisions[map.playerStart.row][map.playerStart.col]).toBe(true);
  });

  it('deterministic with same seed', () => {
    const map1 = MapGenerator.generate(makeMinimalMap());
    const map2 = MapGenerator.generate(makeMinimalMap());
    expect(map1.tiles).toEqual(map2.tiles);
    expect(map1.collisions).toEqual(map2.collisions);
  });

  it('different seeds produce different maps', () => {
    const map1 = MapGenerator.generate(makeMinimalMap());
    const mapDef2 = makeMinimalMap();
    mapDef2.seed = 99999;
    const map2 = MapGenerator.generate(mapDef2);
    // Very unlikely both are identical with different seeds
    expect(map1.tiles).not.toEqual(map2.tiles);
  });

  it('generates decorations', () => {
    const result = MapGenerator.generate(makeMinimalMap());
    expect(result.decorations).toBeDefined();
    expect(result.decorations!.length).toBeGreaterThan(0);
  });
});
