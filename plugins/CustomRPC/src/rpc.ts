import { findByProps, findByStoreName } from "@vendetta/metro";
import { logger } from "@vendetta";
import type { RPCProfile, PlaylistTrack } from "./types";

let playlistTimer: ReturnType<typeof setTimeout> | null = null;
let currentTrackIndex = 0;

function buildStatusText(profile: RPCProfile, track?: PlaylistTrack): string {
  if (track) {
    return [track.name, track.details, track.state].filter(Boolean).join(" · ");
  }
  return [profile.name, profile.details, profile.state].filter(Boolean).join(" · ");
}

async function setCustomStatus(text: string): Promise<void> {
  try {
    const UserSettingsProtoUtils = findByProps("updateAsync");
    await UserSettingsProtoUtils.updateAsync("status", (s: any) => {
      s.status.customStatus.text = text;
      s.status.customStatus.emojiName = "";
    });
    logger.log("[CustomRPC] Status set:", text);
  } catch (e) {
    logger.warn("[CustomRPC] Proto failed, trying REST:", e);
    try {
      const RestAPI = findByProps("patch", "post", "put");
      await RestAPI.patch({
        url: "/users/@me/settings",
        body: { custom_status: { text, emoji_name: null } },
      });
      logger.log("[CustomRPC] Status set via REST:", text);
    } catch (e2) {
      logger.error("[CustomRPC] Both methods failed:", e2);
    }
  }
}

export async function clearActivity(): Promise<void> {
  stopPlaylist();
  try {
    const UserSettingsProtoUtils = findByProps("updateAsync");
    await UserSettingsProtoUtils.updateAsync("status", (s: any) => {
      s.status.customStatus.text = "";
      s.status.customStatus.emojiName = "";
    });
    logger.log("[CustomRPC] Status cleared");
  } catch (e) {
    try {
      const RestAPI = findByProps("patch", "post", "put");
      await RestAPI.patch({
        url: "/users/@me/settings",
        body: { custom_status: null },
      });
    } catch (e2) {
      logger.error("[CustomRPC] Failed to clear status:", e2);
    }
  }
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
    await setCustomStatus(buildStatusText(profile));
  }
}

async function playTrack(profile: RPCProfile, index: number): Promise<void> {
  const pl = profile.playlist!;
  const track = pl.tracks[index];
  if (!track) return;

  currentTrackIndex = index;
  if (profile.playlist) profile.playlist._currentIndex = index;

  await setCustomStatus(buildStatusText(profile, track));
  logger.log(`[CustomRPC] Playlist: track ${index} — "${track.name}"`);

  const duration = track.durationMs > 0 ? track.durationMs : 0;
  if (duration > 0) {
    playlistTimer = setTimeout(async () => {
      const nextIndex = index + 1;
      if (nextIndex < pl.tracks.length) {
        await playTrack(profile, nextIndex);
      } else if (pl.loop) {
        await playTrack(profile, 0);
      } else {
        await clearActivity();
      }
    }, duration);
  }
}

export function getCurrentTrackIndex(): number {
  return currentTrackIndex;
}
