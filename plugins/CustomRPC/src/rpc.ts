import { FluxDispatcher } from "@vendetta/metro/common";
import { findByProps } from "@vendetta/metro";
import { logger } from "@vendetta";
import { cloneAndFilter, isUrl } from "./utils";
import type { RPCProfile, PlaylistTrack } from "./types";

const assetManager = findByProps("getAssetIds");
const pluginStartSince = Date.now();

let playlistTimer: ReturnType<typeof setTimeout> | null = null;
let currentTrackIndex = 0;

// Rozwiązuje obrazek: URL zostawia jak jest, asset key próbuje pobić przez API
async function resolveImage(appId: string, key: string | undefined): Promise<string | undefined> {
  if (!key) return undefined;
  if (isUrl(key)) return key; // już jest URL, Discord to akceptuje

  try {
    let ids = assetManager.getAssetIds(appId, [key]);
    if (!ids?.length) ids = await assetManager.fetchAssetIds(appId, [key]);
    return ids?.[0] ?? key;
  } catch (e) {
    logger.warn("[CustomRPC] Failed to resolve asset key:", key, e);
    return key; // fallback — wróć klucz
  }
}

export async function sendActivity(profile: RPCProfile, trackOverride?: PlaylistTrack): Promise<void> {
  const source = trackOverride
    ? {
        ...profile,
        name: trackOverride.name ?? profile.name,
        details: trackOverride.details ?? profile.details,
        state: trackOverride.state ?? profile.state,
        assets: { ...profile.assets, ...trackOverride.assets },
      }
    : profile;

  let activity: any = cloneAndFilter(source);

  // Timestamps
  const tsEnabled = profile.timestamps._enabled;
  if (tsEnabled) {
    activity.timestamps = {
      start: profile.timestamps.start ?? pluginStartSince,
    };
    if (profile.timestamps.end && profile.timestamps.end > 0) {
      activity.timestamps.end = profile.timestamps.end;
    }
    // Playlist: nadpisz timestamps na czas trwania tracka
    if (trackOverride && trackOverride.durationMs > 0) {
      const now = Date.now();
      activity.timestamps = { start: now, end: now + trackOverride.durationMs };
    }
  } else {
    delete activity.timestamps;
  }

  // Obrazki
  if (activity.assets) {
    activity.assets.large_image = await resolveImage(activity.application_id, activity.assets.large_image);
    activity.assets.small_image = await resolveImage(activity.application_id, activity.assets.small_image);
    // Wyczyść puste
    if (!activity.assets.large_image) delete activity.assets.large_image;
    if (!activity.assets.small_image) delete activity.assets.small_image;
    if (!activity.assets.large_text) delete activity.assets.large_text;
    if (!activity.assets.small_text) delete activity.assets.small_text;
    if (Object.keys(activity.assets).length === 0) delete activity.assets;
  }

  // Buttons
  if (activity.buttons?.length) {
    const validBtns = activity.buttons.filter((b: any) => b?.label?.trim());
    if (validBtns.length) {
      activity.metadata = { button_urls: validBtns.map((b: any) => b.url ?? "") };
      activity.buttons = validBtns.map((b: any) => b.label);
    } else {
      delete activity.buttons;
    }
  } else {
    delete activity.buttons;
  }

  FluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    activity,
    pid: 1608,
    socketId: "CustomRPC@Revenge",
  });

  logger.log("[CustomRPC] Activity sent:", activity);
}

export function clearActivity(): void {
  stopPlaylist();
  FluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    activity: null,
    pid: 1608,
    socketId: "RPC@Reveg",
  });
  logger.log("[CustomRPC] Activity cleared");
}

export function stopPlaylist(): void {
  if (playlistTimer) {
    clearTimeout(playlistTimer);
    playlistTimer = null;
  }
}

export async function startProfile(profile: RPCProfile): Promise<void> {
  stopPlaylist();

  const pl = profile.playlist;
  if (pl?.enabled && pl.tracks.length > 0) {
    currentTrackIndex = pl._currentIndex ?? 0;
    await playTrack(profile, currentTrackIndex);
  } else {
    await sendActivity(profile);
  }
}

async function playTrack(profile: RPCProfile, index: number): Promise<void> {
  const pl = profile.playlist!;
  const track = pl.tracks[index];
  if (!track) return;

  currentTrackIndex = index;
  if (profile.playlist) profile.playlist._currentIndex = index;

  await sendActivity(profile, track);
  logger.log(`[CustomRPC] Playlist: playing track ${index} — "${track.name}"`);

  const duration = track.durationMs > 0 ? track.durationMs : 0;
  if (duration > 0) {
    playlistTimer = setTimeout(async () => {
      const nextIndex = index + 1;
      if (nextIndex < pl.tracks.length) {
        await playTrack(profile, nextIndex);
      } else if (pl.loop) {
        await playTrack(profile, 0); // wróć do początku
      } else {
        clearActivity(); // koniec playlisty bez loopa
      }
    }, duration);
  }
}

export function getCurrentTrackIndex(): number {
  return currentTrackIndex;
}
