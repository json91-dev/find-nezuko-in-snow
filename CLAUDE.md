# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

눈보라 속 여동생 찾기 - A minimal sensory exploration web game where players find their sister in a blizzard using only sound and color cues (no UI/minimap/markers). Target play time: 1-5 minutes. See `PRD.md` for full requirements.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **3D Rendering**: Three.js via @react-three/fiber and @react-three/drei
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript (strict mode)

## Project Structure & Assets

```
/public
  /audio
    - bgm.MP3 (background music)
    - sister-sound-1/2/3.mp3 (sister's crying sounds)
  /model
    - sister.glb (sister 3D model)
    - swordman.glb (player character model)
```

### Asset Loading

- **Models**: Load `.glb` files from `/public/model/` using drei's `useGLTF` hook
- **Audio**: Load `.mp3` files from `/public/audio/` using Web Audio API or Howler.js

## Core Game Systems

Per `PRD.md`, implement these systems:

1. **Movement System**: First-person WASD/arrow controls with mouse look
2. **Snowstorm Particles**: Three.js particle system limiting visibility to 5-10m
3. **Distance-based Audio**: 3D spatial audio using Web Audio API for sister sounds
4. **Color Temperature Hints**: Screen tint shifts from cool blue (far) to warm (near)
5. **Game States**:
   - Start screen (with snow particle background)
   - Gameplay (player movement, detection logic)
   - Clear screen (with elapsed time and share buttons)

## Key Implementation Notes

- Use `@react-three/fiber` for declarative Three.js components
- Wrap 3D content in `<Canvas>` component
- Use drei helpers (e.g., `OrbitControls`, effects) for common patterns
- Audio via Web Audio API for 3D positional sound (PannerNode)
- Keep UI minimal - avoid minimap, markers, quest indicators
