import { React, ReactNative } from "@vendetta/metro/common";
import { Forms, General } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";
import { logger } from "@vendetta";
import { startProfile, clearActivity } from "./rpc";
import { makeDefaultProfile, uniqueKey } from "./utils";
import {
  ActivityType,
  ACTIVITY_TYPE_LABELS,
  BUILTIN_PRESETS,
  type RPCProfile,
  type PluginStorage,
  type PlaylistTrack,
} from "./types";

const { View, ScrollView, TouchableOpacity, TextInput, Switch, Text, Alert } = ReactNative;
const { FormSection, FormInput, FormRow, FormSwitchRow, FormText } = Forms;

const store = storage as unknown as PluginStorage;

const C = {
  brand: "#5865F2",
  danger: "#ED4245",
  success: "#57F287",
  bg: "#2B2D31",
  bgLight: "#383A40",
  bgLighter: "#404249",
  text: "#DBDEE1",
  textMuted: "#949BA4",
  border: "#4E5058",
};

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: active ? C.brand : C.bgLighter,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: active ? "#fff" : C.textMuted, fontWeight: active ? "700" : "400", fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 20, marginBottom: 8, textTransform: "uppercase" }}>
      {title}
    </Text>
  );
}

function Input({
  label, placeholder, value, onChange, numeric, disabled,
}: {
  label: string; placeholder?: string; value?: string; onChange: (v: string) => void; numeric?: boolean; disabled?: boolean;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <TextInput
        style={{
          backgroundColor: C.bgLighter,
          color: disabled ? C.textMuted : C.text,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          opacity: disabled ? 0.5 : 1,
        }}
        placeholder={placeholder ?? ""}
        placeholderTextColor={C.textMuted}
        value={value ?? ""}
        onChangeText={onChange}
        keyboardType={numeric ? "numeric" : "default"}
        editable={!disabled}
      />
    </View>
  );
}

function Row({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: C.text, fontSize: 14 }}>{label}</Text>
        {sub && <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

function Btn({ label, color, onPress, small }: { label: string; color?: string; onPress: () => void; small?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: color ?? C.brand,
        borderRadius: 8,
        paddingVertical: small ? 8 : 12,
        paddingHorizontal: small ? 12 : 16,
        alignItems: "center",
        marginBottom: small ? 0 : 10,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: small ? 13 : 15 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function Settings() {
  useProxy(store);

  const [activeTab, setActiveTab] = React.useState<"profile" | "playlist" | "presets" | "about">("profile");
  const [newProfileName, setNewProfileName] = React.useState("");
  const [newTrackName, setNewTrackName] = React.useState("");
  const [newTrackDuration, setNewTrackDuration] = React.useState("");

  if (!store.profiles) store.profiles = { default: makeDefaultProfile() };
  if (!store.selected || !store.profiles[store.selected]) store.selected = Object.keys(store.profiles)[0] ?? "default";

  const profile = useProxy(store.profiles[store.selected]) as RPCProfile;

  if (!profile.playlist) profile.playlist = { enabled: false, loop: true, tracks: [], _currentIndex: 0 };
  if (!profile.assets) profile.assets = {};
  if (!profile.buttons || profile.buttons.length < 2) profile.buttons = [{}, {}];
  if (!profile.timestamps) profile.timestamps = { _enabled: false, start: Date.now() };

  function apply() {
    startProfile(store.profiles[store.selected]).catch((e) =>
      logger.error("[CustomRPC] Apply error:", e)
    );
  }

  function addProfile() {
    const name = newProfileName.trim() || "New Profile";
    const key = uniqueKey(name, Object.keys(store.profiles));
    store.profiles[key] = { ...makeDefaultProfile(), name };
    store.selected = key;
    setNewProfileName("");
  }

  function deleteProfile(key: string) {
    if (Object.keys(store.profiles).length <= 1) {
      Alert.alert("CustomRPC", "You can't delete the last profile.");
      return;
    }
    Alert.alert("Delete Profile", `Delete profile "${store.profiles[key].name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          delete store.profiles[key];
          if (store.selected === key) store.selected = Object.keys(store.profiles)[0];
        },
      },
    ]);
  }

  function applyPreset(key: string) {
    const preset = BUILTIN_PRESETS[key];
    Object.assign(profile, {
      name: preset.name,
      application_id: preset.application_id,
      type: preset.type,
      details: preset.details ?? "",
      state: preset.state ?? "",
      assets: { ...preset.assets },
    });
    Alert.alert("CustomRPC", `Preset "${preset.name}" loaded! Hit Apply to activate.`);
  }

  function addTrack() {
    const name = newTrackName.trim();
    if (!name) return;
    const durationMs = parseInt(newTrackDuration) * 1000 || 0;
    const track: PlaylistTrack = { name, durationMs };
    if (!profile.playlist!.tracks) profile.playlist!.tracks = [];
    profile.playlist!.tracks.push(track);
    setNewTrackName("");
    setNewTrackDuration("");
  }

  function removeTrack(i: number) {
    profile.playlist!.tracks.splice(i, 1);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

      {/* Profile selector */}
      <SectionHeader title="Profile" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={{ flexDirection: "row" }}>
          {Object.entries(store.profiles).map(([key, p]) => (
            <Pill key={key} label={p.name} active={store.selected === key} onPress={() => { store.selected = key; }} />
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={{ backgroundColor: C.bgLighter, color: C.text, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 }}
            placeholder="New profile name…"
            placeholderTextColor={C.textMuted}
            value={newProfileName}
            onChangeText={setNewProfileName}
          />
        </View>
        <TouchableOpacity onPress={addProfile} style={{ backgroundColor: C.brand, borderRadius: 8, paddingHorizontal: 14, justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>+</Text>
        </TouchableOpacity>
        {Object.keys(store.profiles).length > 1 && (
          <TouchableOpacity onPress={() => deleteProfile(store.selected)} style={{ backgroundColor: C.danger, borderRadius: 8, paddingHorizontal: 14, justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", marginTop: 16, marginBottom: 4, backgroundColor: C.bgLight, borderRadius: 10, padding: 4 }}>
        {(["profile", "playlist", "presets", "about"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: activeTab === tab ? C.brand : "transparent", alignItems: "center" }}
          >
            <Text style={{ color: activeTab === tab ? "#fff" : C.textMuted, fontWeight: "700", fontSize: 12 }}>
              {tab === "profile" ? "Profile" : tab === "playlist" ? "Playlist" : tab === "presets" ? "Presets" : "About"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TAB: PROFILE ── */}
      {activeTab === "profile" && (
        <>
          <SectionHeader title="Basic" />
          <Input label="Application Name" placeholder="Discord" value={profile.name} onChange={(v) => (profile.name = v)} />
          <Input label="Application ID" placeholder="1054951789318909972" value={profile.application_id} onChange={(v) => (profile.application_id = v)} numeric />

          <SectionHeader title="Activity Type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row" }}>
              {(Object.values(ActivityType).filter((v) => typeof v === "number") as ActivityType[]).map((t) => (
                <Pill key={t} label={ACTIVITY_TYPE_LABELS[t]} active={profile.type === t} onPress={() => (profile.type = t)} />
              ))}
            </View>
          </ScrollView>

          <SectionHeader title="Text" />
          <Input label="Details (top line)" placeholder="e.g. Watching cute kittys" value={profile.details} onChange={(v) => (profile.details = v)} />
          <Input label="State (bottom line)" placeholder="e.g. Episode 3" value={profile.state} onChange={(v) => (profile.state = v)} />

          <SectionHeader title="Images (URL or asset key)" />
          <Input label="Large Image" placeholder="https://... or asset_key" value={profile.assets.large_image} onChange={(v) => (profile.assets.large_image = v)} />
          <Input label="Large Image Text" placeholder="Shown on hover" value={profile.assets.large_text} onChange={(v) => (profile.assets.large_text = v)} disabled={!profile.assets.large_image} />
          <Input label="Small Image" placeholder="https://... or asset_key" value={profile.assets.small_image} onChange={(v) => (profile.assets.small_image = v)} />
          <Input label="Small Image Text" placeholder="Shown on hover" value={profile.assets.small_text} onChange={(v) => (profile.assets.small_text = v)} disabled={!profile.assets.small_image} />

          <SectionHeader title="Timestamps" />
          <Row
            label="Enable timestamps"
            sub="Show elapsed time in activity"
            right={<Switch value={profile.timestamps._enabled} onValueChange={(v) => (profile.timestamps._enabled = v)} />}
          />
          {profile.timestamps._enabled && (
            <>
              <Input label="Start (ms, leave empty = now)" placeholder={String(Date.now())} value={profile.timestamps.start ? String(profile.timestamps.start) : ""} onChange={(v) => (profile.timestamps.start = Number(v) || Date.now())} numeric />
              <Input label="End (ms, optional)" placeholder="0" value={profile.timestamps.end ? String(profile.timestamps.end) : ""} onChange={(v) => (profile.timestamps.end = Number(v) || 0)} numeric />
              <Btn small label="Set now as start" onPress={() => (profile.timestamps.start = Date.now())} />
            </>
          )}

          <SectionHeader title="Buttons" />
          <Input label="Button 1 — label" placeholder="Click me" value={profile.buttons[0]?.label} onChange={(v) => (profile.buttons[0] = { ...profile.buttons[0], label: v })} />
          <Input label="Button 1 — URL" placeholder="https://example.com" value={profile.buttons[0]?.url} onChange={(v) => (profile.buttons[0] = { ...profile.buttons[0], url: v })} disabled={!profile.buttons[0]?.label} />
          <Input label="Button 2 — label" placeholder="My GitHub" value={profile.buttons[1]?.label} onChange={(v) => (profile.buttons[1] = { ...profile.buttons[1], label: v })} />
          <Input label="Button 2 — URL" placeholder="https://github.com/..." value={profile.buttons[1]?.url} onChange={(v) => (profile.buttons[1] = { ...profile.buttons[1], url: v })} disabled={!profile.buttons[1]?.label} />
        </>
      )}

      {/* ── TAB: PLAYLIST ── */}
      {activeTab === "playlist" && (
        <>
          <SectionHeader title="Playlist Mode" />
          <Row
            label="Enable playlist"
            sub="Automatically switches tracks after a set time"
            right={<Switch value={profile.playlist!.enabled} onValueChange={(v) => (profile.playlist!.enabled = v)} />}
          />
          <Row
            label="Loop"
            sub="Restart from the first track after the last one"
            right={<Switch value={profile.playlist!.loop} onValueChange={(v) => (profile.playlist!.loop = v)} />}
          />

          <SectionHeader title="Add Track" />
          <Input label="Name (e.g. song title)" placeholder="Never Gonna Give You Up" value={newTrackName} onChange={setNewTrackName} />
          <Input label="Duration (seconds, 0 = no timer)" placeholder="210" value={newTrackDuration} onChange={setNewTrackDuration} numeric />
          <Btn label="+ Add Track" color={C.success} onPress={addTrack} />

          <SectionHeader title="Tracks" />
          {profile.playlist!.tracks.length === 0 && (
            <Text style={{ color: C.textMuted, fontSize: 13, marginBottom: 8 }}>No tracks yet — add one above.</Text>
          )}
          {profile.playlist!.tracks.map((track, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.bgLighter, borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: "700" }}>{track.name}</Text>
                <Text style={{ color: C.textMuted, fontSize: 12 }}>
                  {track.durationMs > 0 ? `${track.durationMs / 1000}s` : "no timer"}
                  {track.details ? ` · ${track.details}` : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeTrack(i)} style={{ padding: 6 }}>
                <Text style={{ color: C.danger, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {/* ── TAB: PRESETS ── */}
      {activeTab === "presets" && (
        <>
          <SectionHeader title="Built-in Presets" />
          <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>
            Loads data into the active profile. You can edit it afterwards.
          </Text>
          {Object.entries(BUILTIN_PRESETS).map(([key, preset]) => (
            <View key={key} style={{ backgroundColor: C.bgLighter, borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>{preset.name}</Text>
                  <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>
                    {ACTIVITY_TYPE_LABELS[preset.type]} · {preset.details}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => applyPreset(key)}
                  style={{ backgroundColor: C.brand, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Load</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* ── TAB: ABOUT ── */}
      {activeTab === "about" && (
        <>
          <SectionHeader title="Plugin Author" />
          <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>
            Saved locally and shown in the manifest. Doesn't affect RPC functionality.
          </Text>
          <Input
            label="Your username"
            placeholder="e.g. KotekXD"
            value={store.authorName}
            onChange={(v) => (store.authorName = v)}
          />
          <Input
            label="Your Discord ID"
            placeholder="e.g. 123456789012345678"
            value={store.authorId}
            onChange={(v) => (store.authorId = v)}
            numeric
          />
          {(store.authorName || store.authorId) ? (
            <View style={{ backgroundColor: C.bgLighter, borderRadius: 10, padding: 14, marginTop: 8 }}>
              <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 6 }}>manifest.json preview:</Text>
              <Text style={{ color: C.text, fontFamily: "monospace", fontSize: 12 }}>
                {JSON.stringify({
                  name: "CustomRPC",
                  authors: [{ name: store.authorName || "you", id: store.authorId || "000000000000000000" }]
                }, null, 2)}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {/* Apply / Clear */}
      <View style={{ marginTop: 24, gap: 10 }}>
        <Btn label="✅  Apply Presence" onPress={apply} />
        <Btn label="🗑  Clear Presence" color={C.danger} onPress={() => clearActivity()} />
      </View>

    </ScrollView>
  );
}
