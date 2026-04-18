export enum ActivityType {
  PLAYING = 0,
  STREAMING = 1,
  LISTENING = 2,
  WATCHING = 3,
  COMPETING = 5,
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ActivityType.PLAYING]: "🎮 Playing",
  [ActivityType.STREAMING]: "📡 Streaming",
  [ActivityType.LISTENING]: "🎵 Listening",
  [ActivityType.WATCHING]: "📺 Watching",
  [ActivityType.COMPETING]: "🏆 Competing",
};

export interface RPCAssets {
  large_image?: string;
  large_text?: string;
  small_image?: string;
  small_text?: string;
}

export interface RPCButton {
  label?: string;
  url?: string;
}

export interface RPCTimestamps {
  _enabled: boolean;
  start?: number;
  end?: number;
}

export interface PlaylistTrack {
  name: string;
  details?: string;
  state?: string;
  assets?: RPCAssets;
  durationMs: number; // długość utworu w ms (0 = bez timera)
}

export interface RPCProfile {
  name: string;
  application_id: string;
  type: ActivityType;
  details?: string;
  state?: string;
  assets: RPCAssets;
  buttons: [RPCButton, RPCButton];
  timestamps: RPCTimestamps;
  // playlist mode
  playlist?: {
    enabled: boolean;
    loop: boolean;
    tracks: PlaylistTrack[];
    _currentIndex?: number;
  };
}

export interface PluginStorage {
  selected: string;
  profiles: Record<string, RPCProfile>;
  authorName?: string;
  authorId?: string;
}

// Wbudowane presety
export const BUILTIN_PRESETS: Record<string, Omit<RPCProfile, "buttons" | "timestamps">> = {
  watching_netflix: {
    name: "Netflix",
    application_id: "1054951789318909972",
    type: ActivityType.WATCHING,
    details: "Watching something",
    state: "Season 1 • Episode 1",
    assets: {
      large_image: "https://cdn.discordapp.com/emojis/1054951789318909972.png",
      large_text: "Netflix",
    },
  },
  listening_spotify: {
    name: "Spotify",
    application_id: "1054951789318909972",
    type: ActivityType.LISTENING,
    details: "Song Title",
    state: "Artist Name",
    assets: {
      large_image: "https://i.imgur.com/oBPXx0D.png",
      large_text: "Spotify",
      small_image: "https://i.imgur.com/oBPXx0D.png",
      small_text: "Playing",
    },
  },
  playing_minecraft: {
    name: "Minecraft",
    application_id: "1054951789318909972",
    type: ActivityType.PLAYING,
    details: "Playing on a server",
    state: "Survival Mode",
    assets: {
      large_image: "https://i.imgur.com/p5pMaGT.png",
      large_text: "Minecraft",
    },
  },
  competing: {
    name: "Competitive",
    application_id: "1054951789318909972",
    type: ActivityType.COMPETING,
    details: "In a ranked match",
    state: "Diamond I",
    assets: {},
  },
};
