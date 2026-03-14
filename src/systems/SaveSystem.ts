import Dexie from 'dexie';
import type { SaveData } from '../data/types';

class AbyssfireDB extends Dexie {
  saves!: Dexie.Table<SaveData, string>;

  constructor() {
    super('AbyssfireDB');
    this.version(1).stores({
      saves: 'id, timestamp',
    });
  }
}

const db = new AbyssfireDB();

export class SaveSystem {
  async save(data: SaveData): Promise<void> {
    data.timestamp = Date.now();
    data.version = 1;
    await db.saves.put(data);
  }

  async load(id: string): Promise<SaveData | undefined> {
    return await db.saves.get(id);
  }

  async listSaves(): Promise<SaveData[]> {
    return await db.saves.orderBy('timestamp').reverse().toArray();
  }

  async deleteSave(id: string): Promise<void> {
    await db.saves.delete(id);
  }

  async autoSave(data: SaveData): Promise<void> {
    data.id = 'autosave';
    await this.save(data);
  }

  async loadAutoSave(): Promise<SaveData | undefined> {
    return await this.load('autosave');
  }

  async quickSave(data: SaveData, slot: number): Promise<void> {
    data.id = `save_${slot}`;
    await this.save(data);
  }
}
