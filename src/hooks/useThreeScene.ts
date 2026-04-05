import { useEffect } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import * as THREE from 'three'
import {
  TRACK_LEN, ROAD_HALF, ROAD_TILE_W,
  BIOME_EVERY, GROUND_D, BIOME_AHEAD,
  ENEMY_SPRITE_FRAMES, ENEMY_SPRITE_UV,
} from '../constants'
import { FOREST_BIOME } from '../game/biomes/forest'
import type { BiomeObjectSpec } from '../game/biomes/forest'

export interface ThreeSceneRefs {
  mountRef:           RefObject<HTMLDivElement>
  speedRef:           MutableRefObject<number>
  movingRef:          MutableRefObject<boolean>
  grassLeanYRef:      MutableRefObject<number>
  grassSnapRef:       MutableRefObject<boolean>
  stepCountRef:       MutableRefObject<number>
  roadTexsRef:        MutableRefObject<THREE.Texture[]>
  enemyMaterialRef:   MutableRefObject<THREE.MeshBasicMaterial | null>
  enemyMeshRef:       MutableRefObject<THREE.Mesh | null>
  enemyBaseScaleRef:  MutableRefObject<[number, number]>
  enemyHitRef:        MutableRefObject<boolean>
  enemyAttackRef:     MutableRefObject<boolean>
  enemyFramesRef:     MutableRefObject<1 | 4>
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
      mountRef, speedRef, movingRef, grassLeanYRef, grassSnapRef,
      stepCountRef, roadTexsRef,
      enemyMaterialRef, enemyMeshRef, enemyBaseScaleRef,
      enemyHitRef, enemyAttackRef, enemyFramesRef,
    } = refs

    const biome = FOREST_BIOME

    const mount = mountRef.current!
    const W = mount.clientWidth
    const H = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(biome.fogColor, biome.fogNear, biome.fogFar)

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 150)
    camera.position.set(0, 2.2, 0)
    camera.lookAt(0, 1.4, -50)

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
    }
    interface PoolEntry {
      im:     THREE.InstancedMesh
      inst:   ObjInst[]
      aspect: number
    }

    const pools: PoolEntry[] = []

    const spawnObj = (spec: BiomeObjectSpec): ObjInst => {
      const side = (Math.random() < 0.5 ? -1 : 1) as 1 | -1
      return {
        side,
        x:    side * (ROAD_HALF + spec.xMin + Math.random() * (spec.xMax - spec.xMin)),
        z:    -(Math.random() * TRACK_LEN),
        sc:   spec.scMin + Math.random() * (spec.scMax - spec.scMin),
        ry:   side * (Math.PI * 0.08 + Math.random() * 0.18),
        lf:   0.4 + Math.random() * 0.6,
        xMin: spec.xMin, xMax: spec.xMax,
        scMin: spec.scMin, scMax: spec.scMax,
      }
    }

    const setMatrix = (im: THREE.InstancedMesh, i: number, g: ObjInst, aspect: number, leanY = 0) => {
      const h = 2.0 * g.sc
      dummy.position.set(g.x, h * 0.5, g.z)
      dummy.scale.set(h * aspect, h, 1)
      dummy.rotation.set(0, g.ry + leanY * g.lf, 0)
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
          const g = spawnObj(spec); inst.push(g); setMatrix(im, j, g, aspect)
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
    }
    const enemyMat = new THREE.MeshBasicMaterial({
      map: enemyTex, transparent: true, depthWrite: false, depthTest: false, alphaTest: 0.05,
    })
    enemyMaterialRef.current = enemyMat

    const enemyMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), enemyMat)
    enemyMesh.renderOrder = 10   // всегда поверх объектов биома
    const [ifw, ifh] = startEnemy.framePx
    const initH = 3.0; const initW = initH * ifw / ifh
    enemyMesh.scale.set(initW, initH, 1)
    enemyBaseScaleRef.current = [initW, initH]
    enemyMeshRef.current      = enemyMesh

    const ENEMY_DIST   = 16
    const ENEMY_BASE_Y = 1.5
    enemyMesh.position.set(0, ENEMY_BASE_Y, -ENEMY_DIST)
    scene.add(enemyMesh)

    // ── Scene state ───────────────────────────────────────────────────
    let cameraZ       = 0
    let wasMoving     = false
    let enemyState: 'idle' | 'dying' | 'dead' | 'appearing' = 'idle'
    let enemyTimer    = 0
    let leanYCurrent  = 0
    let enemyBaseZ    = -ENEMY_DIST
    let eHitActive    = false; let eHitT    = 0
    let eAttackActive = false; let eAttackT = 0
    let spriteFrame   = 0
    let spriteTick    = 0
    const SPRITE_INTERVAL = 15
    let biomeIsANear  = true
    let biomeCounter  = 1
    let biomeLastSeg  = 0

    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const speed  = speedRef.current
      const moving = movingRef.current

      if (moving && !wasMoving) { enemyState = 'dying'; enemyTimer = 0 }
      wasMoving = moving

      // ── Sprite sheet animation ─────────────────────────────────────
      spriteTick++
      if (spriteTick >= SPRITE_INTERVAL && enemyFramesRef.current === 4) {
        spriteTick = 0
        spriteFrame = (spriteFrame + 1) % ENEMY_SPRITE_FRAMES
        if (enemyMat.map) {
          const [ox, oy] = ENEMY_SPRITE_UV[spriteFrame]
          enemyMat.map.offset.set(ox, oy)
        }
      }

      // ── Object lean (drag reaction) ────────────────────────────────
      if (grassSnapRef.current) {
        leanYCurrent = 0
        grassSnapRef.current = false
        for (const { im, inst, aspect } of pools) {
          for (let i = 0; i < inst.length; i++) setMatrix(im, i, inst[i], aspect, 0)
          im.instanceMatrix.needsUpdate = true
        }
      } else {
        const prevLean = leanYCurrent
        leanYCurrent += (grassLeanYRef.current - leanYCurrent) * 0.1
        if (Math.abs(leanYCurrent - prevLean) > 0.0005) {
          for (const { im, inst, aspect } of pools) {
            for (let i = 0; i < inst.length; i++) setMatrix(im, i, inst[i], aspect, leanYCurrent)
            im.instanceMatrix.needsUpdate = true
          }
        }
      }

      // ── Camera movement + object recycling ────────────────────────
      if (moving) {
        cameraZ -= speed * 0.055
        camera.position.z = cameraZ

        for (const { im, inst, aspect } of pools) {
          let dirty = false
          for (let i = 0; i < inst.length; i++) {
            const g = inst[i]
            if (g.z - cameraZ > 2) {
              g.z    = cameraZ - TRACK_LEN + Math.random() * 10
              g.side = (Math.random() < 0.5 ? -1 : 1) as 1 | -1
              g.x    = g.side * (ROAD_HALF + g.xMin + Math.random() * (g.xMax - g.xMin))
              g.sc   = g.scMin + Math.random() * (g.scMax - g.scMin)
              g.ry   = g.side * (Math.PI * 0.08 + Math.random() * 0.18)
              g.lf   = 0.4 + Math.random() * 0.6
              setMatrix(im, i, g, aspect, leanYCurrent)
              dirty = true
            }
          }
          if (dirty) im.instanceMatrix.needsUpdate = true
        }
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
      if (enemyState === 'dead' && !moving) {
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
          eHitActive = false; eAttackActive = false
        }
      }

      // ── Combat animations (idle only) ─────────────────────────────
      if (enemyState === 'idle') {
        if (enemyHitRef.current)    { eHitActive    = true; eHitT    = 0; enemyHitRef.current    = false }
        if (enemyAttackRef.current) { eAttackActive = true; eAttackT = 0; enemyAttackRef.current = false }

        let ezOff = 0, exOff = 0, esY = 1, esX = 1
        if (eHitActive) {
          eHitT += 0.072
          const p = Math.sin(eHitT * Math.PI)
          ezOff  = 1.8 * p
          exOff  = Math.sin(eHitT * Math.PI * 4) * 0.25
          esY    = 1 - 0.25 * p
          esX    = 1 + 0.18 * p
          if (eHitT >= 1) { eHitActive = false; ezOff = 0; exOff = 0; esY = 1; esX = 1 }
        }
        if (eAttackActive) {
          eAttackT += 0.06
          const p = Math.sin(eAttackT * Math.PI)
          ezOff   += -2.2 * p
          esY      = 1 + 0.15 * p
          esX      = 1 - 0.1  * p
          if (eAttackT >= 1) { eAttackActive = false }
        }
        enemyMesh.position.z = enemyBaseZ + ezOff
        enemyMesh.position.x = exOff
        const [bw, bh] = enemyBaseScaleRef.current
        enemyMesh.scale.set(bw * esX, bh * esY, 1)
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
