import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { EventBus, GameEvents } from '../utils/EventBus';
import { getItemBase } from '../data/items/bases';
import { AllMaps, MapOrder } from '../data/maps/index';
import type { Player } from '../entities/Player';
import type { ZoneScene } from './ZoneScene';

const LOG_MAX_LINES = 8;

export class UIScene extends Phaser.Scene {
  private player!: Player;
  private zone!: ZoneScene;

  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private manaBar!: Phaser.GameObjects.Rectangle;
  private manaText!: Phaser.GameObjects.Text;
  private expBar!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private autoCombatText!: Phaser.GameObjects.Text;
  private skillSlots: Phaser.GameObjects.Container[] = [];
  private skillCooldownOverlays: Phaser.GameObjects.Rectangle[] = [];
  private logTexts: Phaser.GameObjects.Text[] = [];
  private logMessages: { text: string; type: string }[] = [];
  private questTracker!: Phaser.GameObjects.Text;
  private zoneLabel!: Phaser.GameObjects.Text;

  // Panels
  private inventoryPanel: Phaser.GameObjects.Container | null = null;
  private shopPanel: Phaser.GameObjects.Container | null = null;
  private mapPanel: Phaser.GameObjects.Container | null = null;
  private skillPanel: Phaser.GameObjects.Container | null = null;
  private charPanel: Phaser.GameObjects.Container | null = null;
  private homesteadPanel: Phaser.GameObjects.Container | null = null;
  private tooltipContainer: Phaser.GameObjects.Container | null = null;
  private minimap!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { player: Player; zone: ZoneScene }): void {
    this.player = data.player;
    this.zone = data.zone;
  }

  create(): void {
    this.createHPManaBar();
    this.createExpBar();
    this.createSkillBar();
    this.createLogPanel();
    this.createInfoDisplay();
    this.createQuestTracker();
    this.createMinimap();
    this.setupEventListeners();
  }

  private createHPManaBar(): void {
    const x = 15, barW = 160, barH = 14;
    const portrait = this.add.rectangle(x + 15, 20, 30, 30, 0x2c3e50).setStrokeStyle(2, 0x3498db).setDepth(3000);
    const classLetter = this.player.classData.id === 'warrior' ? 'W' : this.player.classData.id === 'mage' ? 'M' : 'R';
    this.add.text(x + 15, 20, classLetter, { fontSize: '14px', color: '#3498db', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3001);

    const hpX = x + 38, hpY = 12;
    this.add.rectangle(hpX, hpY, barW, barH, 0x333333).setOrigin(0, 0.5).setDepth(3000);
    this.hpBar = this.add.rectangle(hpX, hpY, barW, barH, 0xe74c3c).setOrigin(0, 0.5).setDepth(3001);
    this.hpText = this.add.text(hpX + barW / 2, hpY, '', { fontSize: '10px', color: '#fff', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(3002);

    const manaY = hpY + barH + 3;
    this.add.rectangle(hpX, manaY, barW, barH, 0x333333).setOrigin(0, 0.5).setDepth(3000);
    this.manaBar = this.add.rectangle(hpX, manaY, barW, barH, 0x3498db).setOrigin(0, 0.5).setDepth(3001);
    this.manaText = this.add.text(hpX + barW / 2, manaY, '', { fontSize: '10px', color: '#fff', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(3002);
  }

  private createExpBar(): void {
    const barW = GAME_WIDTH - 30, barH = 6, y = GAME_HEIGHT - 8;
    this.add.rectangle(15, y, barW, barH, 0x333333).setOrigin(0, 0.5).setDepth(3000);
    this.expBar = this.add.rectangle(15, y, 0, barH, 0x9b59b6).setOrigin(0, 0.5).setDepth(3001);
    this.levelText = this.add.text(15, y - 10, '', { fontSize: '10px', color: '#9b59b6', fontFamily: 'monospace' }).setOrigin(0, 0.5).setDepth(3002);
  }

  private createSkillBar(): void {
    const slotSize = 36, gap = 4;
    const skills = this.player.classData.skills;
    const totalW = skills.length * (slotSize + gap) - gap;
    const startX = (GAME_WIDTH - totalW) / 2 - 30;
    const y = GAME_HEIGHT - 48;

    this.skillSlots = [];
    this.skillCooldownOverlays = [];

    for (let i = 0; i < skills.length; i++) {
      const x = startX + i * (slotSize + gap);
      const skill = skills[i];
      const container = this.add.container(x + slotSize / 2, y).setDepth(3000);
      const bg = this.add.rectangle(0, 0, slotSize, slotSize, 0x2c3e50).setStrokeStyle(2, 0x555555);
      container.add(bg);
      container.add(this.add.text(0, -4, skill.name.substring(0, 2), { fontSize: '12px', color: '#fff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5));
      container.add(this.add.text(0, 12, `${i + 1}`, { fontSize: '9px', color: '#95a5a6', fontFamily: 'monospace' }).setOrigin(0.5));
      const cdOverlay = this.add.rectangle(0, 0, slotSize, slotSize, 0x000000, 0.6).setVisible(false);
      container.add(cdOverlay);
      this.skillCooldownOverlays.push(cdOverlay);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => EventBus.emit(GameEvents.UI_SKILL_CLICK, { index: i, skillId: skill.id }));
      this.skillSlots.push(container);
    }

    // Auto combat button
    const acX = startX + totalW + gap + 20;
    const acBg = this.add.rectangle(acX, y, 44, slotSize, 0x2c3e50).setStrokeStyle(2, 0x555555).setInteractive({ useHandCursor: true }).setDepth(3000);
    this.autoCombatText = this.add.text(acX, y, 'AUTO\nOFF', { fontSize: '9px', color: '#95a5a6', fontFamily: 'monospace', align: 'center' }).setOrigin(0.5).setDepth(3001);
    acBg.on('pointerdown', () => {
      this.player.autoCombat = !this.player.autoCombat;
      EventBus.emit(GameEvents.LOG_MESSAGE, { text: `自动战斗: ${this.player.autoCombat ? '开启' : '关闭'}`, type: 'system' });
    });

    // Inventory button
    const invX = acX + 50;
    const invBg = this.add.rectangle(invX, y, 44, slotSize, 0x2c3e50).setStrokeStyle(2, 0x8e44ad).setInteractive({ useHandCursor: true }).setDepth(3000);
    this.add.text(invX, y, '背包\n(I)', { fontSize: '9px', color: '#8e44ad', fontFamily: 'monospace', align: 'center' }).setOrigin(0.5).setDepth(3001);
    invBg.on('pointerdown', () => this.toggleInventory());
  }

  private createLogPanel(): void {
    const panelW = 260, panelH = 120, x = 10, y = GAME_HEIGHT - 190;
    this.add.rectangle(x, y, panelW, panelH, 0x000000, 0.6).setOrigin(0, 0).setDepth(2999);
    this.add.text(x + 5, y + 2, '[ 战斗日志 ]', { fontSize: '9px', color: '#f39c12', fontFamily: 'monospace' }).setDepth(3000);
    for (let i = 0; i < LOG_MAX_LINES; i++) {
      this.logTexts.push(
        this.add.text(x + 5, y + 14 + i * 13, '', { fontSize: '9px', color: '#ccc', fontFamily: 'monospace', wordWrap: { width: panelW - 10 } }).setDepth(3000)
      );
    }
  }

  private createInfoDisplay(): void {
    this.goldText = this.add.text(GAME_WIDTH - 15, 15, '', { fontSize: '12px', color: '#f1c40f', fontFamily: 'monospace' }).setOrigin(1, 0).setDepth(3000);
    this.zoneLabel = this.add.text(GAME_WIDTH - 15, 30, '', { fontSize: '10px', color: '#95a5a6', fontFamily: 'monospace' }).setOrigin(1, 0).setDepth(3000);
  }

  private createQuestTracker(): void {
    this.questTracker = this.add.text(GAME_WIDTH - 15, 50, '', {
      fontSize: '9px', color: '#f39c12', fontFamily: 'monospace', align: 'right', wordWrap: { width: 200 },
    }).setOrigin(1, 0).setDepth(3000);
  }

  private setupEventListeners(): void {
    EventBus.on(GameEvents.LOG_MESSAGE, (data: { text: string; type: string }) => {
      this.logMessages.push(data);
      if (this.logMessages.length > LOG_MAX_LINES) this.logMessages.shift();
      this.updateLogDisplay();
    });

    EventBus.on(GameEvents.SHOP_OPEN, (data: { npcId: string; shopItems: string[]; type: string }) => {
      this.openShop(data);
    });

    EventBus.on(GameEvents.UI_TOGGLE_PANEL, (data: { panel: string }) => {
      if (data.panel === 'inventory') this.toggleInventory();
      if (data.panel === 'map') this.toggleMap();
      if (data.panel === 'skills') this.toggleSkillTree();
      if (data.panel === 'character') this.toggleCharacter();
      if (data.panel === 'homestead') this.toggleHomestead();
    });

    EventBus.on('ui:refresh', (data: { player: Player; zone: ZoneScene }) => {
      this.player = data.player;
      this.zone = data.zone;
    });
  }

  private updateLogDisplay(): void {
    const colors: Record<string, string> = { system: '#f39c12', combat: '#e74c3c', loot: '#2ecc71', info: '#3498db' };
    for (let i = 0; i < LOG_MAX_LINES; i++) {
      if (i < this.logMessages.length) {
        this.logTexts[i].setText(this.logMessages[i].text).setColor(colors[this.logMessages[i].type] ?? '#ccc');
      } else {
        this.logTexts[i].setText('');
      }
    }
  }

  // --- Inventory Panel ---
  private toggleInventory(): void {
    if (this.inventoryPanel) { this.inventoryPanel.destroy(); this.inventoryPanel = null; return; }
    this.closeAllPanels();
    const pw = 350, ph = 400, px = (GAME_WIDTH - pw) / 2, py = 30;
    this.inventoryPanel = this.add.container(px, py).setDepth(4000);
    const bg = this.add.rectangle(0, 0, pw, ph, 0x1a1a2e, 0.95).setOrigin(0, 0).setStrokeStyle(2, 0x3498db);
    this.inventoryPanel.add(bg);
    this.inventoryPanel.add(this.add.text(pw / 2, 10, '背包', { fontSize: '14px', color: '#fff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5, 0));

    // Close button
    const closeBtn = this.add.text(pw - 15, 8, 'X', { fontSize: '14px', color: '#e74c3c', fontFamily: 'monospace' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleInventory());
    this.inventoryPanel.add(closeBtn);

    // Equipment slots
    const equipSlots = ['helmet', 'armor', 'gloves', 'boots', 'weapon', 'offhand', 'necklace', 'ring1', 'ring2', 'belt'];
    const slotNames = ['头盔', '铠甲', '手套', '鞋子', '武器', '副手', '项链', '戒指1', '戒指2', '腰带'];
    const slotSize = 28;
    equipSlots.forEach((slot, i) => {
      const sx = 10 + (i % 5) * (slotSize + 4);
      const sy = 32 + Math.floor(i / 5) * (slotSize + 14);
      const eq = this.zone.inventorySystem.equipment[slot as keyof typeof this.zone.inventorySystem.equipment];
      const slotBg = this.add.rectangle(sx + slotSize / 2, sy + slotSize / 2, slotSize, slotSize, eq ? this.getQualityColorNum(eq.quality) : 0x333333).setStrokeStyle(1, 0x555555);
      this.inventoryPanel!.add(slotBg);
      this.inventoryPanel!.add(this.add.text(sx + slotSize / 2, sy + slotSize + 2, slotNames[i], { fontSize: '7px', color: '#999', fontFamily: 'monospace' }).setOrigin(0.5, 0));
      if (eq) {
        this.inventoryPanel!.add(this.add.text(sx + slotSize / 2, sy + slotSize / 2, eq.name.charAt(0), { fontSize: '10px', color: '#fff', fontFamily: 'monospace' }).setOrigin(0.5));
      }
    });

    // Inventory grid
    const inv = this.zone.inventorySystem.inventory;
    const gridStartY = 100;
    const cols = 8;
    inv.forEach((item, i) => {
      const ix = 10 + (i % cols) * (slotSize + 4);
      const iy = gridStartY + Math.floor(i / cols) * (slotSize + 4);
      const itemBg = this.add.rectangle(ix + slotSize / 2, iy + slotSize / 2, slotSize, slotSize, this.getQualityColorNum(item.quality))
        .setStrokeStyle(1, 0x777).setInteractive({ useHandCursor: true });
      this.inventoryPanel!.add(itemBg);
      this.inventoryPanel!.add(this.add.text(ix + slotSize / 2, iy + slotSize / 2, item.name.charAt(0), { fontSize: '10px', color: '#fff', fontFamily: 'monospace' }).setOrigin(0.5));
      if (item.quantity > 1) {
        this.inventoryPanel!.add(this.add.text(ix + slotSize - 2, iy + slotSize - 2, `${item.quantity}`, { fontSize: '8px', color: '#ff0', fontFamily: 'monospace' }).setOrigin(1, 1));
      }

      // Click to equip/use
      itemBg.on('pointerdown', () => {
        const base = getItemBase(item.baseId);
        if (base && base.slot) {
          this.zone.inventorySystem.equip(item.uid);
        } else if (base && (base.type === 'consumable' || base.type === 'scroll')) {
          const result = this.zone.inventorySystem.useConsumable(item.uid);
          if (result) {
            if (result.effect === 'heal') this.player.hp = Math.min(this.player.maxHp, this.player.hp + result.value);
            if (result.effect === 'mana') this.player.mana = Math.min(this.player.maxMana, this.player.mana + result.value);
          }
        }
        this.toggleInventory(); this.toggleInventory(); // Refresh
      });
    });

    // Stats summary
    const statsY = gridStartY + Math.ceil(inv.length / cols) * (slotSize + 4) + 10;
    const eqStats = this.zone.inventorySystem.getEquipmentStats();
    const statText = Object.entries(eqStats).map(([k, v]) => `${k}: +${v}`).join('  ');
    this.inventoryPanel.add(this.add.text(10, Math.min(statsY, ph - 30), `装备加成: ${statText || '无'}`, { fontSize: '8px', color: '#aaa', fontFamily: 'monospace', wordWrap: { width: pw - 20 } }));
  }

  // --- Shop Panel ---
  private openShop(data: { npcId: string; shopItems: string[]; type: string }): void {
    this.closeAllPanels();
    const pw = 300, ph = 350, px = (GAME_WIDTH - pw) / 2, py = 50;
    this.shopPanel = this.add.container(px, py).setDepth(4000);
    const bg = this.add.rectangle(0, 0, pw, ph, 0x1a1a2e, 0.95).setOrigin(0, 0).setStrokeStyle(2, 0xf39c12);
    this.shopPanel.add(bg);
    const title = data.type === 'blacksmith' ? '铁匠铺' : '商店';
    this.shopPanel.add(this.add.text(pw / 2, 10, title, { fontSize: '14px', color: '#f39c12', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5, 0));
    const closeBtn = this.add.text(pw - 15, 8, 'X', { fontSize: '14px', color: '#e74c3c', fontFamily: 'monospace' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => { this.shopPanel?.destroy(); this.shopPanel = null; });
    this.shopPanel.add(closeBtn);

    data.shopItems.forEach((itemId, i) => {
      const base = getItemBase(itemId);
      if (!base) return;
      const iy = 35 + i * 24;
      if (iy > ph - 30) return;

      const buyPrice = base.sellPrice * 3;
      const canAfford = this.player.gold >= buyPrice;
      const row = this.add.text(10, iy, `${base.name}`, { fontSize: '10px', color: canAfford ? '#fff' : '#666', fontFamily: 'monospace' });
      const price = this.add.text(pw - 10, iy, `${buyPrice}G`, { fontSize: '10px', color: canAfford ? '#f1c40f' : '#666', fontFamily: 'monospace' }).setOrigin(1, 0);
      this.shopPanel!.add(row);
      this.shopPanel!.add(price);

      if (canAfford) {
        const buyBtn = this.add.text(pw - 50, iy, '[买]', { fontSize: '10px', color: '#2ecc71', fontFamily: 'monospace' }).setInteractive({ useHandCursor: true });
        buyBtn.on('pointerdown', () => {
          if (this.player.gold >= buyPrice) {
            this.player.gold -= buyPrice;
            const item = this.zone.lootSystem.createItem(itemId, this.player.level, 'normal');
            if (item) { item.identified = true; this.zone.inventorySystem.addItem(item); }
            this.shopPanel?.destroy(); this.shopPanel = null;
            this.openShop(data); // Refresh
          }
        });
        this.shopPanel!.add(buyBtn);
      }
    });

    this.shopPanel.add(this.add.text(10, ph - 20, `金币: ${this.player.gold}G`, { fontSize: '10px', color: '#f1c40f', fontFamily: 'monospace' }));
  }

  // --- World Map Panel ---
  private toggleMap(): void {
    if (this.mapPanel) { this.mapPanel.destroy(); this.mapPanel = null; return; }
    this.closeAllPanels();
    const pw = 400, ph = 200, px = (GAME_WIDTH - pw) / 2, py = 100;
    this.mapPanel = this.add.container(px, py).setDepth(4000);
    this.mapPanel.add(this.add.rectangle(0, 0, pw, ph, 0x1a1a2e, 0.95).setOrigin(0, 0).setStrokeStyle(2, 0x2ecc71));
    this.mapPanel.add(this.add.text(pw / 2, 10, '暗烬大陆', { fontSize: '14px', color: '#2ecc71', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5, 0));
    const closeBtn = this.add.text(pw - 15, 8, 'X', { fontSize: '14px', color: '#e74c3c', fontFamily: 'monospace' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleMap());
    this.mapPanel.add(closeBtn);

    MapOrder.forEach((mapId, i) => {
      const map = AllMaps[mapId];
      const x = 30 + i * 75, y = 60;
      const isExplored = true; // Simplified
      const isCurrent = (this.zone as any).currentMapId === mapId;
      const color = isCurrent ? 0x2ecc71 : isExplored ? 0x2c3e50 : 0x111111;
      this.mapPanel!.add(this.add.rectangle(x, y, 60, 40, color).setStrokeStyle(isCurrent ? 2 : 1, isCurrent ? 0x2ecc71 : 0x555555));
      this.mapPanel!.add(this.add.text(x, y, map.name.substring(0, 4), { fontSize: '10px', color: '#fff', fontFamily: 'monospace' }).setOrigin(0.5));
      this.mapPanel!.add(this.add.text(x, y + 25, `Lv.${map.levelRange[0]}-${map.levelRange[1]}`, { fontSize: '8px', color: '#999', fontFamily: 'monospace' }).setOrigin(0.5));
      // Connection line
      if (i < MapOrder.length - 1) {
        this.mapPanel!.add(this.add.text(x + 38, y, '→', { fontSize: '12px', color: '#555', fontFamily: 'monospace' }).setOrigin(0.5));
      }
    });

    this.mapPanel.add(this.add.text(pw / 2, ph - 20, '按 M 关闭', { fontSize: '9px', color: '#666', fontFamily: 'monospace' }).setOrigin(0.5));
  }

  // --- Skill Tree Panel (K) ---
  private toggleSkillTree(): void {
    if (this.skillPanel) { this.skillPanel.destroy(); this.skillPanel = null; return; }
    this.closeAllPanels();
    const pw = 420, ph = 380, px = (GAME_WIDTH - pw) / 2, py = 20;
    this.skillPanel = this.add.container(px, py).setDepth(4000);
    this.skillPanel.add(this.add.rectangle(0, 0, pw, ph, 0x1a1a2e, 0.95).setOrigin(0, 0).setStrokeStyle(2, 0x9b59b6));
    this.skillPanel.add(this.add.text(pw / 2, 8, `技能树 - ${this.player.classData.name}`, { fontSize: '13px', color: '#9b59b6', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5, 0));
    this.skillPanel.add(this.add.text(pw / 2, 24, `剩余技能点: ${this.player.freeSkillPoints}`, { fontSize: '10px', color: '#f1c40f', fontFamily: 'monospace' }).setOrigin(0.5, 0));
    const closeBtn = this.add.text(pw - 12, 6, 'X', { fontSize: '14px', color: '#e74c3c', fontFamily: 'monospace' }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleSkillTree());
    this.skillPanel.add(closeBtn);

    // Group skills by tree
    const trees = new Map<string, typeof this.player.classData.skills>();
    for (const skill of this.player.classData.skills) {
      if (!trees.has(skill.tree)) trees.set(skill.tree, []);
      trees.get(skill.tree)!.push(skill);
    }

    let treeIdx = 0;
    const treeW = (pw - 20) / Math.max(trees.size, 1);
    for (const [treeName, skills] of trees) {
      const tx = 10 + treeIdx * treeW;
      this.skillPanel.add(this.add.text(tx + treeW / 2, 42, treeName, { fontSize: '10px', color: '#e0e0e0', fontFamily: 'monospace' }).setOrigin(0.5, 0));
      skills.forEach((skill, si) => {
        const sy = 60 + si * 55;
        const level = this.player.getSkillLevel(skill.id);
        const canLevel = this.player.freeSkillPoints > 0 && level < skill.maxLevel;
        const slotBg = this.add.rectangle(tx + treeW / 2, sy + 10, treeW - 10, 48, 0x2c3e50).setStrokeStyle(1, canLevel ? 0xf1c40f : 0x444444).setOrigin(0.5, 0);
        this.skillPanel!.add(slotBg);
        this.skillPanel!.add(this.add.text(tx + treeW / 2, sy + 14, skill.name, { fontSize: '10px', color: '#fff', fontFamily: 'monospace' }).setOrigin(0.5, 0));
        this.skillPanel!.add(this.add.text(tx + treeW / 2, sy + 28, `Lv.${level}/${skill.maxLevel}  MP:${skill.manaCost}  CD:${(skill.cooldown / 1000).toFixed(1)}s`, { fontSize: '8px', color: '#aaa', fontFamily: 'monospace' }).setOrigin(0.5, 0));
        this.skillPanel!.add(this.add.text(tx + treeW / 2, sy + 40, skill.description, { fontSize: '7px', color: '#888', fontFamily: 'monospace', wordWrap: { width: treeW - 16 } }).setOrigin(0.5, 0));
        if (canLevel) {
          const plusBtn = this.add.text(tx + treeW - 12, sy + 14, '+', { fontSize: '14px', color: '#2ecc71', fontFamily: 'monospace', fontStyle: 'bold' }).setInteractive({ useHandCursor: true });
          plusBtn.on('pointerdown', () => {
            if (this.player.freeSkillPoints > 0) {
              this.player.freeSkillPoints--;
              this.player.skillLevels.set(skill.id, level + 1);
              this.toggleSkillTree(); this.toggleSkillTree();
            }
          });
          this.skillPanel!.add(plusBtn);
        }
      });
      treeIdx++;
    }
  }

  // --- Character Stats Panel (C) ---
  private toggleCharacter(): void {
    if (this.charPanel) { this.charPanel.destroy(); this.charPanel = null; return; }
    this.closeAllPanels();
    const pw = 280, ph = 340, px = (GAME_WIDTH - pw) / 2, py = 40;
    this.charPanel = this.add.container(px, py).setDepth(4000);
    this.charPanel.add(this.add.rectangle(0, 0, pw, ph, 0x1a1a2e, 0.95).setOrigin(0, 0).setStrokeStyle(2, 0x3498db));
    this.charPanel.add(this.add.text(pw / 2, 8, `角色属性 - ${this.player.classData.name}`, { fontSize: '13px', color: '#3498db', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5, 0));
    this.charPanel.add(this.add.text(pw / 2, 24, `Lv.${this.player.level}  剩余属性点: ${this.player.freeStatPoints}`, { fontSize: '10px', color: '#f1c40f', fontFamily: 'monospace' }).setOrigin(0.5, 0));
    const closeBtn = this.add.text(pw - 12, 6, 'X', { fontSize: '14px', color: '#e74c3c', fontFamily: 'monospace' }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleCharacter());
    this.charPanel.add(closeBtn);

    const stats: [string, keyof typeof this.player.stats, string][] = [
      ['力量 STR', 'str', '物理伤害/负重'],
      ['敏捷 DEX', 'dex', '闪避/暴击率/攻速'],
      ['体质 VIT', 'vit', '生命值/物理抗性'],
      ['智力 INT', 'int', '魔法伤害/法术抗性'],
      ['精神 SPI', 'spi', '法力值/法力回复'],
      ['幸运 LCK', 'lck', '掉宝率/暴击倍率'],
    ];

    stats.forEach(([label, key, desc], i) => {
      const sy = 44 + i * 36;
      const val = this.player.stats[key];
      this.charPanel!.add(this.add.text(12, sy, label, { fontSize: '11px', color: '#e0e0e0', fontFamily: 'monospace' }));
      this.charPanel!.add(this.add.text(120, sy, `${val}`, { fontSize: '11px', color: '#fff', fontFamily: 'monospace', fontStyle: 'bold' }));
      this.charPanel!.add(this.add.text(12, sy + 14, desc, { fontSize: '7px', color: '#888', fontFamily: 'monospace' }));
      if (this.player.freeStatPoints > 0) {
        const plusBtn = this.add.text(150, sy, '[+]', { fontSize: '11px', color: '#2ecc71', fontFamily: 'monospace' }).setInteractive({ useHandCursor: true });
        plusBtn.on('pointerdown', () => {
          if (this.player.freeStatPoints > 0) {
            this.player.freeStatPoints--;
            this.player.stats[key]++;
            this.player.recalcDerived();
            this.toggleCharacter(); this.toggleCharacter();
          }
        });
        this.charPanel!.add(plusBtn);
      }
    });

    // Derived stats
    const dy = 44 + stats.length * 36 + 8;
    const eqStats = this.zone.inventorySystem.getEquipmentStats();
    const derived = [
      `HP: ${Math.ceil(this.player.hp)}/${this.player.maxHp}`,
      `MP: ${Math.ceil(this.player.mana)}/${this.player.maxMana}`,
      `攻击: ${Math.floor(this.player.baseDamage)}${eqStats['damage'] ? ` (+${eqStats['damage']})` : ''}`,
      `防御: ${Math.floor(this.player.defense)}${eqStats['defense'] ? ` (+${eqStats['defense']})` : ''}`,
      `金币: ${this.player.gold}G`,
    ];
    derived.forEach((line, i) => {
      this.charPanel!.add(this.add.text(12, dy + i * 14, line, { fontSize: '9px', color: '#aaa', fontFamily: 'monospace' }));
    });
  }

  // --- Homestead Panel (H) ---
  private toggleHomestead(): void {
    if (this.homesteadPanel) { this.homesteadPanel.destroy(); this.homesteadPanel = null; return; }
    this.closeAllPanels();
    const pw = 380, ph = 360, px = (GAME_WIDTH - pw) / 2, py = 30;
    this.homesteadPanel = this.add.container(px, py).setDepth(4000);
    this.homesteadPanel.add(this.add.rectangle(0, 0, pw, ph, 0x1a1a2e, 0.95).setOrigin(0, 0).setStrokeStyle(2, 0xf39c12));
    this.homesteadPanel.add(this.add.text(pw / 2, 8, '家园', { fontSize: '14px', color: '#f39c12', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5, 0));
    const closeBtn = this.add.text(pw - 12, 6, 'X', { fontSize: '14px', color: '#e74c3c', fontFamily: 'monospace' }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleHomestead());
    this.homesteadPanel.add(closeBtn);

    const hs = this.zone.homesteadSystem;
    const buildings = hs.getAllBuildings();

    buildings.forEach((b, i) => {
      const sy = 30 + i * 42;
      const lv = hs.getBuildingLevel(b.id);
      const maxed = lv >= b.maxLevel;
      const cost = maxed ? 0 : b.costPerLevel[lv]?.gold ?? 0;
      const canUpgrade = !maxed && this.player.gold >= cost;

      this.homesteadPanel!.add(this.add.text(12, sy, `${b.name} Lv.${lv}/${b.maxLevel}`, { fontSize: '10px', color: '#e0e0e0', fontFamily: 'monospace' }));
      this.homesteadPanel!.add(this.add.text(12, sy + 14, b.description, { fontSize: '8px', color: '#888', fontFamily: 'monospace' }));

      if (!maxed) {
        const upBtn = this.add.text(pw - 12, sy + 4, `升级 ${cost}G`, { fontSize: '9px', color: canUpgrade ? '#2ecc71' : '#666', fontFamily: 'monospace' }).setOrigin(1, 0);
        if (canUpgrade) {
          upBtn.setInteractive({ useHandCursor: true });
          upBtn.on('pointerdown', () => {
            const actualCost = hs.upgrade(b.id);
            this.player.gold -= actualCost;
            this.toggleHomestead(); this.toggleHomestead();
          });
        }
        this.homesteadPanel!.add(upBtn);
      } else {
        this.homesteadPanel!.add(this.add.text(pw - 12, sy + 4, '已满级', { fontSize: '9px', color: '#f39c12', fontFamily: 'monospace' }).setOrigin(1, 0));
      }
    });

    // Pets section
    const petY = 30 + buildings.length * 42 + 10;
    this.homesteadPanel.add(this.add.text(12, petY, '── 宠物 ──', { fontSize: '10px', color: '#f39c12', fontFamily: 'monospace' }));
    const pets = hs.pets;
    if (pets.length === 0) {
      this.homesteadPanel.add(this.add.text(12, petY + 16, '暂无宠物 (击杀Boss有机会获得)', { fontSize: '8px', color: '#666', fontFamily: 'monospace' }));
    }
    pets.forEach((p, i) => {
      const pd = hs.getAllPets().find(d => d.id === p.petId);
      const isActive = hs.activePet === p.petId;
      this.homesteadPanel!.add(this.add.text(12, petY + 16 + i * 16, `${pd?.name ?? p.petId} Lv.${p.level} ${isActive ? '[激活]' : ''}`, {
        fontSize: '9px', color: isActive ? '#2ecc71' : '#aaa', fontFamily: 'monospace',
      }));
    });
  }

  // --- Minimap ---
  private createMinimap(): void {
    const size = 80, padding = 8;
    const x = GAME_WIDTH - size - padding, y = padding;
    // Background
    this.add.rectangle(x + size / 2, y + size / 2, size + 4, size + 4, 0x000000, 0.6).setStrokeStyle(1, 0x555555).setDepth(2999);
    this.minimap = this.add.graphics().setDepth(3000);
    this.minimap.setPosition(x, y);
  }

  private updateMinimap(): void {
    if (!this.minimap || !this.zone) return;
    this.minimap.clear();
    const mapData = AllMaps[(this.zone as any).currentMapId];
    if (!mapData) return;
    const size = 80;
    const sx = size / mapData.cols, sy = size / mapData.rows;
    const tileColors: Record<number, number> = {
      0: 0x4a8c3f, 1: 0x8b7355, 2: 0x707070, 3: 0x2471a3, 4: 0x4a4a4a, 5: 0xb8956b,
    };

    for (let r = 0; r < mapData.rows; r++) {
      for (let c = 0; c < mapData.cols; c++) {
        const color = tileColors[mapData.tiles[r][c]] ?? 0x333333;
        this.minimap.fillStyle(color, 0.8);
        this.minimap.fillRect(c * sx, r * sy, Math.ceil(sx), Math.ceil(sy));
      }
    }

    // Player dot
    this.minimap.fillStyle(0x3498db);
    this.minimap.fillCircle(this.player.tileCol * sx, this.player.tileRow * sy, 2);

    // Exit markers
    for (const exit of mapData.exits) {
      this.minimap.fillStyle(0x00ff00);
      this.minimap.fillRect(exit.col * sx - 1, exit.row * sy - 1, 3, 3);
    }
  }

  private closeAllPanels(): void {
    if (this.inventoryPanel) { this.inventoryPanel.destroy(); this.inventoryPanel = null; }
    if (this.shopPanel) { this.shopPanel.destroy(); this.shopPanel = null; }
    if (this.mapPanel) { this.mapPanel.destroy(); this.mapPanel = null; }
    if (this.skillPanel) { this.skillPanel.destroy(); this.skillPanel = null; }
    if (this.charPanel) { this.charPanel.destroy(); this.charPanel = null; }
    if (this.homesteadPanel) { this.homesteadPanel.destroy(); this.homesteadPanel = null; }
  }

  private getQualityColorNum(quality: string): number {
    switch (quality) { case 'magic': return 0x3498db; case 'rare': return 0xf1c40f; case 'legendary': return 0xe67e22; case 'set': return 0x2ecc71; default: return 0x555555; }
  }

  update(time: number): void {
    if (!this.player) return;
    const hpR = this.player.hp / this.player.maxHp;
    this.hpBar.scaleX = Math.max(0, hpR);
    this.hpText.setText(`${Math.ceil(this.player.hp)}/${this.player.maxHp}`);
    const manaR = this.player.mana / this.player.maxMana;
    this.manaBar.scaleX = Math.max(0, manaR);
    this.manaText.setText(`${Math.ceil(this.player.mana)}/${this.player.maxMana}`);
    const expN = this.player.expToNextLevel();
    this.expBar.width = (GAME_WIDTH - 30) * (this.player.exp / expN);
    this.levelText.setText(`Lv.${this.player.level} (${this.player.exp}/${expN})`);
    this.goldText.setText(`${this.player.gold} G`);
    this.autoCombatText.setText(`AUTO\n${this.player.autoCombat ? 'ON' : 'OFF'}`).setColor(this.player.autoCombat ? '#2ecc71' : '#95a5a6');

    // Zone label
    if (this.zone && (this.zone as any).currentMapId) {
      const map = AllMaps[(this.zone as any).currentMapId];
      if (map) this.zoneLabel.setText(map.name);
    }

    // Skill cooldowns
    const skills = this.player.classData.skills;
    for (let i = 0; i < Math.min(skills.length, this.skillCooldownOverlays.length); i++) {
      const cd = this.player.skillCooldowns.get(skills[i].id) ?? 0;
      this.skillCooldownOverlays[i].setVisible(time < cd);
    }

    // Minimap (every 5 frames)
    if (Math.floor(time / 200) % 2 === 0) this.updateMinimap();

    // Quest tracker
    if (this.zone?.questSystem) {
      const active = this.zone.questSystem.getActiveQuests();
      const lines = active.slice(0, 3).map(({ quest, progress }) => {
        const obj = quest.objectives[0];
        const cur = progress.objectives[0]?.current ?? 0;
        const status = progress.status === 'completed' ? '[完成]' : `(${cur}/${obj.required})`;
        return `${quest.name} ${status}`;
      });
      this.questTracker.setText(lines.join('\n'));
    }
  }
}
