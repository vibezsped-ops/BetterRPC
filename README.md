# CustomRPC — Revenge Plugin

Lepszy Custom Rich Presence dla [Revenge](https://github.com/revenge-mod/revenge-bundle).

## Funkcje

- 🎨 **Wiele profili** — twórz i przełączaj między profilami
- 🎭 **Wszystkie tryby aktywności** — Playing, Streaming, Listening, Watching, Competing
- 🖼️ **Obrazki** — URL (imgur, cdn, etc.) lub Discord asset key
- 🎵 **Playlista** — automatyczne zmienianie tracka co X sekund, z zapętleniem
- ⏱️ **Timestamps** — pokaż czas gry lub "do końca" dla tracka
- 🔘 **Przyciski** — do 2 przycisków z linkami
- ⚡ **Presety** — Netflix, Spotify, Minecraft, Competitive

## Instalacja

Wklej URL do Revenge → Plugins:

```
https://TWOJ_USERNAME.github.io/CustomRPC/CustomRPC/
```

## Build

```bash
pnpm install
pnpm build
```

## Obrazki

- **URL**: wklej link bezpośredni do obrazka (jpg/png), np. z imgur
- **Asset key**: nazwa assetu uploadowanego w [Discord Developer Portal](https://discord.com/developers/applications) → twoja aplikacja → Rich Presence → Art Assets

## Playlista

1. Włącz tryb playlisty w zakładce "Playlista"
2. Dodaj tracki z nazwą i czasem trwania (w sekundach)
3. Włącz zapętlenie jeśli chcesz żeby wracała do początku
4. Kliknij **Zastosuj** — plugin będzie automatycznie zmieniać tracki

Każdy track może mieć własną nazwę, details, state i obrazki.
