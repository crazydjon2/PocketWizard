# Roguelike TG

A roguelike game for Telegram Mini Apps built with Three.js + React.

## Stack

- **Three.js** — 3D scene rendering
- **React 18** — UI
- **Zustand** — state management
- **Vite** — build tool
- **TypeScript**
- **@tma.js/sdk** — Telegram Mini Apps integration
- **Capacitor** — native builds (Android / iOS)

## Structure

```
src/
  AppThree.tsx        # Root component (Three.js scene)
  main.tsx            # Entry point
  game/
    engine/           # Combat mechanics
    map/              # Map generation
    types/            # Game types
  store/
    gameStore.ts      # Global state
  ui/
    components/       # UI components
    screens/          # Screens (map, combat)
  tg/
    telegram.ts       # Telegram SDK
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Mobile platforms

```bash
npm run cap:sync
npm run cap:android   # Android Studio
npm run cap:ios       # Xcode
```
