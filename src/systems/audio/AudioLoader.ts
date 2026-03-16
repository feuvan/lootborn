/**
 * AudioLoader — stores decoded AudioBuffer objects keyed by string.
 *
 * Actual file loading happens in BootScene following the project's asset
 * pipeline pattern (attempt external load -> silent loaderror catch ->
 * procedural fallback).  AudioLoader is the storage layer: BootScene decodes
 * raw ArrayBuffers here; SFXEngine and MusicEngine retrieve them at play-time.
 *
 * Expected file path conventions (loading handled by BootScene):
 *   BGM : assets/audio/bgm/{zoneId}_{state}.mp3
 *   SFX : assets/audio/sfx/{type}.mp3
 *
 * When a file is missing (the current default — no audio assets are shipped),
 * the buffer simply won't be present and callers receive null, then fall back
 * to procedural Web Audio synthesis.
 */
export class AudioLoader {
  private buffers: Map<string, AudioBuffer> = new Map();

  /** Returns true if a decoded buffer is stored for the given key. */
  has(key: string): boolean {
    return this.buffers.has(key);
  }

  /**
   * Returns the decoded AudioBuffer for the given key, or null if absent.
   * Callers should use procedural synthesis when null is returned.
   */
  getBuffer(key: string): AudioBuffer | null {
    return this.buffers.get(key) ?? null;
  }

  /** Stores an already-decoded AudioBuffer directly. */
  storeBuffer(key: string, buffer: AudioBuffer): void {
    this.buffers.set(key, buffer);
  }

  /**
   * Decodes the raw ArrayBuffer using the provided AudioContext and stores the
   * result under key.  Rejects if decoding fails (e.g. unsupported format).
   */
  async decodeAudio(ctx: AudioContext, key: string, arrayBuffer: ArrayBuffer): Promise<void> {
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    this.buffers.set(key, decoded);
  }
}
