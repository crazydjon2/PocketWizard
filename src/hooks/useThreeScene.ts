import { useEffect } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import * as THREE from 'three'
import {
  TRACK_LEN, ROAD_HALF, ROAD_TILE_W,
  BIOME_EVERY, GROUND_D, BIOME_AHEAD,
  ENEMY_SPRITE_FRAMES, ENEMY_SPRITE_UV, ENEMY_BASE_HEIGHT,
  ENEMY_SPRITE_FRAMES_16, ENEMY_SPRITE_UV_16,
} from '../constants'
import { FOREST_BIOME } from '../game/biomes/forest'
import type { BiomeObjectSpec } from '../game/biomes/forest'

export interface ThreeSceneRefs {
  mountRef:           RefObject<HTMLDivElement>
  cameraRef:          MutableRefObject<THREE.PerspectiveCamera | null>
  speedRef:           MutableRefObject<number>
  movingRef:          MutableRefObject<boolean>
  grassLeanYRef:      MutableRefObject<number>
  grassSnapRef:       MutableRefObject<boolean>
  stepCountRef:       MutableRefObject<number>
  roadTexsRef:        MutableRefObject<THREE.Texture[]>
  enemyMaterialRef:   MutableRefObject<THREE.MeshBasicMaterial | null>
  enemyMeshRef:       MutableRefObject<THREE.Mesh | null>
  enemyBaseScaleRef:  MutableRefObject<[number, number]>
  enemyHitRef:          MutableRefObject<boolean>
  enemyAttackRef:       MutableRefObject<boolean>
  enemyFramesRef:       MutableRefObject<1 | 4 | 16>
  enemyIdleTexRef:      MutableRefObject<THREE.Texture | null>
  enemyAttackTexRef:    MutableRefObject<THREE.Texture | null>
  enemyDieRef:          MutableRefObject<boolean>
  enemyReadyRef:        MutableRefObject<boolean>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const loadImgDims = (src: string): Promise<{ w: number; h: number }> =>
  new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = src
  })

const loadImgEl = (src: string): Promise<HTMLImageElement> =>
  new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })

// Build a canvas texture from randomly arranged tile images.
// Returns TWO different canvases for leapfrog variety.
function buildFloorCanvases(images: HTMLImageElement[], grid = 8): [HTMLCanvasElement, HTMLCanvasElement] {
  const TILE = images[0].naturalWidth
  const make = () => {
    const canvas = document.createElement('canvas')
    canvas.width  = TILE * grid
    canvas.height = TILE * grid
    const ctx = canvas.getContext('2d')!
    for (let y = 0; y < grid; y++)
      for (let x = 0; x < grid; x++) {
        const img = images[Math.floor(Math.random() * images.length)]
        ctx.drawImage(img, x * TILE, y * TILE, TILE, TILE)
      }
    return canvas
  }
  return [make(), make()]
}

function makeFloorTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT  = THREE.RepeatWrapping
  tex.minFilter          = THREE.NearestFilter
  tex.magFilter          = THREE.NearestFilter
  // 1 canvas = 8 tiles × ROAD_TILE_W world units → square tiles
  const worldSpan = 8 * ROAD_TILE_W          // 40 world units per canvas
  tex.repeat.set(30 / worldSpan, GROUND_D / worldSpan)
  return tex
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useThreeScene(refs: ThreeSceneRefs): void {
  useEffect(() => {
    const {
      mountRef, cameraRef, speedRef, movingRef,
      stepCountRef, roadTexsRef,
      enemyMaterialRef, enemyMeshRef, enemyBaseScaleRef,
      enemyHitRef, enemyAttackRef, enemyFramesRef,
      enemyIdleTexRef, enemyAttackTexRef, enemyDieRef, enemyReadyRef,
    } = refs

    const biome = FOREST_BIOME

    const mount = mountRef.current!
    const W = mount.clientWidth
    const H = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.domElement.style.pointerEvents = 'none'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(biome.fogColor, biome.fogNear, biome.fogFar)

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 150)
    camera.position.set(0, 1.8, 0)
    camera.lookAt(0, 2.0, -50)
    cameraRef.current = camera

    const loader  = new THREE.TextureLoader()
    const loadTex = (src: string) => {
      const t = loader.load(src)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    }

    // ── Ground planes (leapfrog) ──────────────────────────────────────
    const groundGeo  = new THREE.PlaneGeometry(30, GROUND_D)
    // Start with fog-colored ground; real texture applied async below
    const groundMatA = new THREE.MeshBasicMaterial({ color: biome.fogColor })
    const groundMatB = new THREE.MeshBasicMaterial({ color: biome.fogColor })
    const groundA    = new THREE.Mesh(groundGeo, groundMatA)
    const groundB    = new THREE.Mesh(groundGeo, groundMatB)
    groundA.rotation.x = -Math.PI / 2
    groundA.position.set(0, 0,    -BIOME_AHEAD + GROUND_D / 2)
    groundB.rotation.x = -Math.PI / 2
    groundB.position.set(0, 0.01, -BIOME_AHEAD - GROUND_D / 2)
    scene.add(groundA, groundB)

    // Load floor tiles → build two different canvas textures for leapfrog variety
    Promise.all(biome.floorTiles.map(loadImgEl)).then(images => {
      const [canvasA, canvasB] = buildFloorCanvases(images)
      const texA = makeFloorTex(canvasA)
      const texB = makeFloorTex(canvasB)
      groundMatA.map   = texA
      groundMatA.color.setHex(0xffffff)
      groundMatA.needsUpdate = true
      groundMatB.map   = texB
      groundMatB.color.setHex(0xffffff)
      groundMatB.needsUpdate = true
      roadTexsRef.current = [texA, texB]
    })

    // ── Background — fills the full viewport ──────────────────────────
    const bgTex = loadTex(biome.bgSrc)
    bgTex.colorSpace = THREE.SRGBColorSpace
    scene.background = bgTex

    // ── Clouds (sparse, fits forest) ──────────────────────────────────
    const cloudTex  = loadTex('/assets/cloud.png')
    const cloudData: { mesh: THREE.Mesh; relX: number; relZ: number }[] = []
    for (let i = 0; i < 5; i++) {
      const s = 7 + Math.random() * 9
      const c = new THREE.Mesh(
        new THREE.PlaneGeometry(s * 2.5, s),
        new THREE.MeshBasicMaterial({
          map: cloudTex, transparent: true, opacity: 0.3,
          depthWrite: false, fog: false,
        }),
      )
      const relX = (Math.random() - 0.5) * 80
      const relZ = -(30 + Math.random() * 50)
      c.position.set(relX, 10 + Math.random() * 5, relZ)
      scene.add(c)
      cloudData.push({ mesh: c, relX, relZ })
    }

    // ── Object pools (forest decorations) ────────────────────────────
    const dummy = new THREE.Object3D()

    interface ObjInst {
      x: number; z: number; sc: number
      side: 1 | -1; ry: number; lf: number
      xMin: number; xMax: number
      scMin: number; scMax: number
      road: boolean
    }
    interface PoolEntry {
      im:     THREE.InstancedMesh
      inst:   ObjInst[]
      aspect: number
    }

    const pools: PoolEntry[] = []

    const spawnObj = (spec: BiomeObjectSpec, index = -1, total = 1): ObjInst => {
      const side = (Math.random() < 0.5 ? -1 : 1) as 1 | -1
      const z = index >= 0
        ? -(index / total * TRACK_LEN + Math.random() * (TRACK_LEN / total))
        : -(Math.random() * TRACK_LEN)
      const x = spec.road
        ? (Math.random() - 0.5) * 2 * spec.xMax
        : side * (ROAD_HALF + spec.xMin + Math.random() * (spec.xMax - spec.xMin))
      return {
        side, x, z,
        sc:   spec.scMin + Math.random() * (spec.scMax - spec.scMin),
        ry:   side * (Math.PI * 0.08 + Math.random() * 0.18),
        lf:   0.4 + Math.random() * 0.6,
        xMin: spec.xMin, xMax: spec.xMax,
        scMin: spec.scMin, scMax: spec.scMax,
        road: !!spec.road,
      }
    }

    const setMatrix = (im: THREE.InstancedMesh, i: number, g: ObjInst, aspect: number, billboardRy = 0) => {
      const h = 2.0 * g.sc
      dummy.position.set(g.x, h * 0.3, g.z)
      dummy.scale.set(h * aspect, h, 1)
      dummy.rotation.set(0, billboardRy, 0)
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
    }

    // Load each object image for its aspect ratio, then build the pool
    Promise.all(biome.objects.map(s => loadImgDims(s.src))).then(dims => {
      biome.objects.forEach((spec, i) => {
        const aspect = dims[i].w / dims[i].h
        const tex    = loadTex(spec.src)
        const im     = new THREE.InstancedMesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide }),
          spec.count,
        )
        im.frustumCulled = false
        const inst: ObjInst[] = []
        for (let j = 0; j < spec.count; j++) {
          const g = spawnObj(spec, j, spec.count); inst.push(g); setMatrix(im, j, g, aspect)
        }
        im.instanceMatrix.needsUpdate = true
        scene.add(im)
        pools.push({ im, inst, aspect })
      })
    })

    // ── Enemy sprite (initial — first enemy of the biome) ─────────────
    const startEnemy = biome.enemies[0]
    const enemyTex = loadTex(startEnemy.sprite)
    if (startEnemy.frames === 4) {
      enemyTex.repeat.set(0.5, 0.5)
      enemyTex.offset.set(...ENEMY_SPRITE_UV[0])
    } else if (startEnemy.frames === 16) {
      enemyTex.repeat.set(0.25, 0.25)
      enemyTex.offset.set(...ENEMY_SPRITE_UV_16[0])
    }
    enemyIdleTexRef.current = enemyTex
    if (startEnemy.attackSprite && startEnemy.frames === 16) {
      const atkTex = loadTex(startEnemy.attackSprite)
      atkTex.repeat.set(0.25, 0.25)
      atkTex.offset.set(...ENEMY_SPRITE_UV_16[0])
      enemyAttackTexRef.current = atkTex
    }

    const enemyMat = new THREE.MeshBasicMaterial({
      map: enemyTex, transparent: true, depthWrite: false, depthTest: false, alphaTest: 0.05,
    })
    if (startEnemy.tint !== undefined) enemyMat.color.setHex(startEnemy.tint)
    enemyMaterialRef.current = enemyMat

    const enemyMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), enemyMat)
    enemyMesh.renderOrder = 10   // всегда поверх объектов биома
    const [ifw, ifh] = startEnemy.framePx
    const rs = startEnemy.renderScale ?? 1.0
    const initH = ENEMY_BASE_HEIGHT * rs; const initW = initH * ifw / ifh
    enemyMesh.scale.set(initW, initH, 1)
    enemyBaseScaleRef.current = [initW, initH]
    enemyMeshRef.current      = enemyMesh

    const ENEMY_DIST   = 10
    const ENEMY_BASE_Y = initH / 2   // ноги на уровне земли (y=0)
    enemyMesh.position.set(0, ENEMY_BASE_Y, -ENEMY_DIST)
    scene.add(enemyMesh)

    // ── Scene state ───────────────────────────────────────────────────
    let cameraZ       = 0
    let wasMoving     = false
    let enemyState: 'idle' | 'dying' | 'dead' | 'appearing' = 'idle'
    let enemyTimer    = 0
    let enemyBaseZ    = -ENEMY_DIST
    let spriteFrame            = 0
    let spriteTick             = 0
    let attackSpriteFramesLeft = 0
    const SPRITE_INTERVAL        = 15
    const ATTACK_SPRITE_INTERVAL = 7
    let biomeIsANear  = true
    let biomeCounter  = 1
    let biomeLastSeg  = 0

    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const speed  = speedRef.current
      const moving = movingRef.current

      if (enemyDieRef.current && enemyState === 'idle') {
        enemyState = 'dying'; enemyTimer = 0; enemyDieRef.current = false
      }
      if (moving && !wasMoving && enemyState === 'idle') { enemyState = 'dying'; enemyTimer = 0 }
      wasMoving = moving

      // ── Sprite sheet animation ─────────────────────────────────────
      spriteTick++
      const inAttackAnim  = attackSpriteFramesLeft > 0
      const tickThreshold = inAttackAnim ? ATTACK_SPRITE_INTERVAL : SPRITE_INTERVAL
      if (spriteTick >= tickThreshold) {
        spriteTick = 0
        if (enemyFramesRef.current === 4) {
          spriteFrame = (spriteFrame + 1) % ENEMY_SPRITE_FRAMES
          if (enemyMat.map) {
            const [ox, oy] = ENEMY_SPRITE_UV[spriteFrame]
            enemyMat.map.offset.set(ox, oy)
          }
        } else if (enemyFramesRef.current === 16) {
          spriteFrame = (spriteFrame + 1) % ENEMY_SPRITE_FRAMES_16
          if (enemyMat.map) {
            const [ox, oy] = ENEMY_SPRITE_UV_16[spriteFrame]
            enemyMat.map.offset.set(ox, oy)
          }
          if (inAttackAnim) {
            attackSpriteFramesLeft--
            if (attackSpriteFramesLeft === 0) {
              const idleTex = enemyIdleTexRef.current
              if (idleTex) { enemyMat.map = idleTex; enemyMat.needsUpdate = true; spriteFrame = 0 }
            }
          }
        }
      }

      // ── Camera movement + object recycling ────────────────────────
      if (moving) {
        cameraZ -= speed * 0.055
        camera.position.z = cameraZ

        for (const { inst } of pools) {
          for (let i = 0; i < inst.length; i++) {
            const g = inst[i]
            if (g.z - cameraZ > 2) {
              // Spawn in fog zone (60–80 units ahead) to avoid pop-in
              g.z    = cameraZ - 60 - Math.random() * 20
              g.sc   = g.scMin + Math.random() * (g.scMax - g.scMin)
              g.lf   = 0.4 + Math.random() * 0.6
              if (g.road) {
                g.x = (Math.random() - 0.5) * 2 * g.xMax
              } else {
                g.side = (Math.random() < 0.5 ? -1 : 1) as 1 | -1
                g.x    = g.side * (ROAD_HALF + g.xMin + Math.random() * (g.xMax - g.xMin))
              }
            }
          }
        }
      }

      // ── Billboard all objects toward camera ───────────────────────
      for (const { im, inst, aspect } of pools) {
        for (let i = 0; i < inst.length; i++) {
          const billboardRy = Math.atan2(-inst[i].x, cameraZ - inst[i].z)
          setMatrix(im, i, inst[i], aspect, billboardRy)
        }
        im.instanceMatrix.needsUpdate = true
      }

      // ── Leapfrog ground planes (biome swap) ───────────────────────
      const curSeg = Math.floor(stepCountRef.current / BIOME_EVERY)
      if (curSeg > biomeLastSeg && !movingRef.current) {
        biomeLastSeg = curSeg
        const near    = biomeIsANear ? groundA : groundB
        const curFar  = biomeIsANear ? groundB : groundA
        const nearMat = near.material as THREE.MeshBasicMaterial
        biomeCounter++
        const texs = roadTexsRef.current
        if (texs.length > 0) {
          nearMat.map = texs[biomeCounter % texs.length]
          nearMat.needsUpdate = true
        }
        const boundary  = cameraZ - BIOME_AHEAD
        near.position.z = boundary - GROUND_D / 2
        near.position.y = 0.01
        curFar.position.y = 0
        biomeIsANear = !biomeIsANear
      }

      // ── Parallax (bg / clouds) ────────────────────────────────────
cloudData.forEach((c, idx) => {
        c.mesh.position.z = cameraZ + c.relZ
        c.mesh.position.x += 0.008 * (idx % 2 === 0 ? 1 : -1)
      })

      // ── Enemy billboard rotation ───────────────────────────────────
      enemyMesh.rotation.y = Math.atan2(
        camera.position.x - enemyMesh.position.x,
        camera.position.z - enemyMesh.position.z,
      )

      // ── Enemy state machine ───────────────────────────────────────
      if (enemyState === 'dying') {
        enemyTimer += 0.04
        enemyMat.opacity     = Math.max(0, 1 - enemyTimer)
        enemyMesh.position.y = ENEMY_BASE_Y + enemyTimer * 0.5
        if (enemyTimer >= 1) { enemyState = 'dead'; enemyTimer = 0; enemyMat.opacity = 0 }
      }
      if (enemyState === 'dead' && !moving && enemyReadyRef.current) {
        enemyReadyRef.current = false
        enemyState = 'appearing'; enemyTimer = 0
        enemyBaseZ = cameraZ - ENEMY_DIST
        enemyMesh.position.set(0, ENEMY_BASE_Y - 0.5, enemyBaseZ)
      }
      if (enemyState === 'appearing') {
        enemyTimer += 0.025
        enemyMat.opacity     = Math.min(1, enemyTimer)
        enemyMesh.position.y = ENEMY_BASE_Y - 0.5 + enemyTimer * 0.5
        if (enemyTimer >= 1) {
          enemyState = 'idle'
          enemyMesh.position.y = ENEMY_BASE_Y
        }
      }

      // ── Combat animations (idle only) ─────────────────────────────
      if (enemyState === 'idle') {
        if (enemyHitRef.current)    { enemyHitRef.current    = false }
        if (enemyAttackRef.current) {
          enemyAttackRef.current = false
          if (enemyAttackTexRef.current && enemyFramesRef.current === 16) {
            enemyMat.map = enemyAttackTexRef.current
            enemyMat.needsUpdate = true
            spriteFrame = 0; spriteTick = 0
            attackSpriteFramesLeft = ENEMY_SPRITE_FRAMES_16
          }
        }
        enemyMesh.position.z = enemyBaseZ
        enemyMesh.position.x = 0
        const [bw, bh] = enemyBaseScaleRef.current
        enemyMesh.scale.set(bw, bh, 1)
      }

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
