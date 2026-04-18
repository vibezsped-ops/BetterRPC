import { storage } from "@vendetta/plugin";
import { logger } from "@vendetta";
import { makeDefaultProfile } from "./utils";
import { startProfile, clearActivity } from "./rpc";
import Settings from "./Settings";
import type { PluginStorage } from "./types";

const store = storage as unknown as PluginStorage;

function initStorage(): void {
  if (!store.profiles || typeof store.profiles !== "object") {
    store.profiles = { default: makeDefaultProfile() };
  }
  if (!store.selected || !store.profiles[store.selected]) {
    store.selected = Object.keys(store.profiles)[0] ?? "default";
    if (!store.profiles[store.selected]) {
      store.profiles["default"] = makeDefaultProfile();
      store.selected = "default";
    }
  }
}

export default {
  onLoad() {
    initStorage();
    const profile = store.profiles[store.selected];
    if (!profile) {
      logger.error("[CustomRPC] Missing profile:", store.selected);
      return;
    }
    startProfile(profile).catch((e) =>
      logger.error("[CustomRPC] Start error:", e)
    );
  },

  onUnload() {
    clearActivity();
  },

  settings: Settings,
};
