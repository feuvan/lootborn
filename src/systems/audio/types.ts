export type SFXType = 'hit' | 'hit_heavy' | 'crit' | 'miss' | 'block' | 'player_hurt'
  | 'monster_death' | 'player_death'
  | 'skill_melee' | 'skill_fire' | 'skill_ice' | 'skill_lightning' | 'skill_heal' | 'skill_buff'
  | 'loot_common' | 'loot_magic' | 'loot_rare' | 'loot_legendary' | 'equip' | 'potion'
  | 'click' | 'panel_open' | 'panel_close' | 'error'
  | 'zone_transition' | 'quest_complete' | 'levelup' | 'npc_interact';

export type MusicState = 'explore' | 'combat' | 'victory';

export interface ZoneTheme {
  id: string;
  scale: number[];        // frequencies in Hz
  baseKey: number;        // root frequency
  tempo: number;          // BPM for rhythm
  padWaveform: OscillatorType;
  mood: 'pastoral' | 'mysterious' | 'epic' | 'exotic' | 'dark';
}

export interface AudioSettings {
  bgmVolume: number;      // 0-1
  sfxVolume: number;      // 0-1
  bgmMuted: boolean;
  sfxMuted: boolean;
}
