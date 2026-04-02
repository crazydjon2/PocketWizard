import { useEffect } from 'react'
import type { MutableRefObject, RefObject } from 'react'
import * as THREE from 'three'
import { STARTING_ENEMY } from '@game/data/enemies'
import {
  GRASS_SRCS, TRACK_LEN, ROAD_TILES, ROAD_HALF, ROAD_TILE_W,
  BIOME_EVERY, GROUND_D, BIOME_AHEAD, GRASS_PER_TEX,
  ENEMY_SPRITE_FRAMES, ENEMY_SPRITE_UV,
} from '../constants'

export interface ThreeSceneRefs {
  mountRef:         RefObject<HTMLDivElement>
  speedRef:         MutableRefObject<number>
  movingRef:        MutableRefObject<boolean>
  grassLeanYRef:    MutableRefObject<number>
  grassSnapRef:     MutableRefObject<boolean>
  stepCountRef:     MutableRefObject<number>
  roadTexsRef:      MutableRefObject<THREE.Texture[]>
  enemyMaterialRef: MutableRefObject<THREE.MeshBasicMaterial | null>
  enemyMeshRef:     MutableRefObject<THREE.Mesh | null>
  enemyBaseScaleRef:MutableRefObject<[number, number]>
  enemyHitRef:      MutableRefObject<boolean>
  enemyAttackRef:   MutableRefObject<boolean>
}

export function useThreeScene(refs: ThreeSceneRefs): void {
  useEffect(() => {
    const {
      mountRef, speedRef, movingRef, grassLeanYRef, grassSnapRef,
      stepCountRef, roadTexsRef,
      enemyMaterialRef, enemyMeshRef, enemyBaseScaleRef,
      enemyHitRef, enemyAttackRef,
    } = refs

    const mount = mountRef.current!
    const W = mount.clientWidth
    const H = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x7ab3d4)
    scene.fog = new THREE.Fog(0x7ab3d4, 45, 95)

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 150)
    camera.position.set(0, 2.2, 0)
    camera.lookAt(0, 1.4, -50)

    const loader  = new THREE.TextureLoader()
    const loadTex = (src: string) => {
      const t = loader.load(src)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    }

    // ── Дорога: два статичных плейна (leapfrog) ──────────────────────
    const aniso = renderer.capabilities.getMaxAnisotropy()
    const REP_X = 30 / ROAD_TILE_W         // 6
    const REP_Y = GROUND_D / ROAD_TILE_W   // 60
    const roadTexs = ROAD_TILES.map(src => {
      const t = loadTex(src)
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(REP_X, REP_Y)
      t.minFilter = THREE.LinearMipmapLinearFilter
      t.magFilter = THREE.NearestFilter
      t.anisotropy = aniso
      return t
    })
    roadTexsRef.current = roadTexs

    const groundGeo  = new THREE.PlaneGeometry(30, GROUND_D)
    const groundMatA = new THREE.MeshBasicMaterial({ map: roadTexs[0] })
    const groundA    = new THREE.Mesh(groundGeo, groundMatA)
    groundA.rotation.x = -Math.PI / 2
    groundA.position.set(0, 0,    -BIOME_AHEAD + GROUND_D / 2)
    scene.add(groundA)

    const groundMatB = new THREE.MeshBasicMaterial({ map: roadTexs[1 % ROAD_TILES.length] })
    const groundB    = new THREE.Mesh(groundGeo, groundMatB)
    groundB.rotation.x = -Math.PI / 2
    groundB.position.set(0, 0.01, -BIOME_AHEAD - GROUND_D / 2)
    scene.add(groundB)

    // ── Sky ───────────────────────────────────────────────────────────
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 300),
      new THREE.MeshBasicMaterial({ color: 0x7ab3d4, fog: false, depthWrite: false }),
    )
    sky.position.set(0, 60, 0)
    sky.renderOrder = -1
    scene.add(sky)

    // ── City ─────────────────────────────────────────────────────────
    const cityTex = loadTex('/assets/Fon2.png')
    const city = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 14),
      new THREE.MeshBasicMaterial({ map: cityTex, transparent: true, fog: false }),
    )
    city.position.set(0, 4.5, 0)
    scene.add(city)

    // ── Clouds ────────────────────────────────────────────────────────
    const cloudTex  = loadTex('/assets/cloud.png')
    const cloudData: { mesh: THREE.Mesh; relX: number; relZ: number }[] = []
    for (let i = 0; i < 8; i++) {
      const s = 10 + Math.random() * 14
      const c = new THREE.Mesh(
        new THREE.PlaneGeometry(s * 2.5, s),
        new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.6, depthWrite: false, fog: false }),
      )
      const relX = (Math.random() - 0.5) * 90
      const relZ = -(28 + Math.random() * 60)
      c.position.set(relX, 11 + Math.random() * 6, relZ)
      scene.add(c)
      cloudData.push({ mesh: c, relX, relZ })
    }

    // ── Grass (InstancedMesh) ─────────────────────────────────────────
    const dummy = new THREE.Object3D()
    interface GrassInst { x: number; z: number; sc: number; side: 1 | -1; ry: number; lf: number }
    const pools: { im: THREE.InstancedMesh; inst: GrassInst[] }[] = []
    const grassTextures = GRASS_SRCS.map(loadTex)

    const spawnGrass = (): GrassInst => {
      const side = (Math.random() < 0.5 ? -1 : 1) as 1 | -1
      return {
        side,
        x:  side * (ROAD_HALF + 0.4 + Math.random() * 7),
        z:  -(Math.random() * TRACK_LEN),
        sc: 0.7 + Math.random() * 0.9,
        ry: side * (Math.PI * 0.12 + Math.random() * 0.22),
        lf: 0.6 + Math.random() * 0.8,
      }
    }

    const setMatrix = (im: THREE.InstancedMesh, i: number, g: GrassInst, leanY = 0) => {
      const h = 1.9 * g.sc
      dummy.position.set(g.x, h * 0.5, g.z)
      dummy.scale.set(1.7 * g.sc, h, 1)
      dummy.rotation.set(0, g.ry + leanY * g.lf, 0)
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
    }

    grassTextures.forEach(tex => {
      const im = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide }),
        GRASS_PER_TEX,
      )
      im.frustumCulled = false
      const inst: GrassInst[] = []
      for (let i = 0; i < GRASS_PER_TEX; i++) {
        const g = spawnGrass(); inst.push(g); setMatrix(im, i, g)
      }
      im.instanceMatrix.needsUpdate = true
      scene.add(im)
      pools.push({ im, inst })
    })

    // ── Enemy sprite ──────────────────────────────────────────────────
    const enemyTex = loadTex(STARTING_ENEMY.sprite)
    enemyTex.repeat.set(0.5, 0.5)
    enemyTex.offset.set(...ENEMY_SPRITE_UV[0])
    const enemyMat = new THREE.MeshBasicMaterial({
      map: enemyTex, transparent: true, depthWrite: false, alphaTest: 0.05,
    })
    enemyMaterialRef.current = enemyMat

    const enemyMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), enemyMat)
    const [ifw, ifh] = STARTING_ENEMY.framePx
    const initH = 3.0; const initW = initH * ifw / ifh
    enemyMesh.scale.set(initW, initH, 1)
    enemyBaseScaleRef.current = [initW, initH]
    enemyMeshRef.current = enemyMesh

    const ENEMY_DIST   = 16
    const ENEMY_BASE_Y = 1.5
    enemyMesh.position.set(0, ENEMY_BASE_Y, -ENEMY_DIST)
    scene.add(enemyMesh)

    city.position.z = -85

    // ── Scene state ───────────────────────────────────────────────────
    let cameraZ    = 0
    let wasMoving  = false
    let enemyState: 'idle' | 'dying' | 'dead' | 'appearing' = 'idle'
    let enemyTimer = 0
    let leanYCurrent = 0
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
      if (spriteTick >= SPRITE_INTERVAL) {
        spriteTick = 0
        spriteFrame = (spriteFrame + 1) % ENEMY_SPRITE_FRAMES
        if (enemyMat.map) {
          const [ox, oy] = ENEMY_SPRITE_UV[spriteFrame]
          enemyMat.map.offset.set(ox, oy)
        }
      }

      // ── Grass lean (drag reaction) ─────────────────────────────────
      if (grassSnapRef.current) {
        leanYCurrent = 0
        grassSnapRef.current = false
        for (const { im, inst } of pools) {
          for (let i = 0; i < inst.length; i++) setMatrix(im, i, inst[i], 0)
          im.instanceMatrix.needsUpdate = true
        }
      } else {
        const prevLean = leanYCurrent
        leanYCurrent += (grassLeanYRef.current - leanYCurrent) * 0.1
        if (Math.abs(leanYCurrent - prevLean) > 0.0005) {
          for (const { im, inst } of pools) {
            for (let i = 0; i < inst.length; i++) setMatrix(im, i, inst[i], leanYCurrent)
            im.instanceMatrix.needsUpdate = true
          }
        }
      }

      // ── Camera movement + grass recycling ─────────────────────────
      if (moving) {
        cameraZ -= speed * 0.055
        camera.position.z = cameraZ

        for (const { im, inst } of pools) {
          let dirty = false
          for (let i = 0; i < inst.length; i++) {
            const g = inst[i]
            if (g.z - cameraZ > 2) {
              g.z    = cameraZ - TRACK_LEN + Math.random() * 10
              g.side = (Math.random() < 0.5 ? -1 : 1) as 1 | -1
              g.x    = g.side * (ROAD_HALF + 0.4 + Math.random() * 7)
              g.sc   = 0.7 + Math.random() * 0.9
              g.ry   = g.side * (Math.PI * 0.12 + Math.random() * 0.22)
              g.lf   = 0.6 + Math.random() * 0.8
              setMatrix(im, i, g, leanYCurrent)
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
        nearMat.map = roadTexsRef.current[biomeCounter % ROAD_TILES.length]
        nearMat.needsUpdate = true
        const boundary  = cameraZ - BIOME_AHEAD
        near.position.z = boundary - GROUND_D / 2
        near.position.y = 0.01
        curFar.position.y = 0
        biomeIsANear = !biomeIsANear
      }

      // ── Parallax (sky / city / clouds) ────────────────────────────
      sky.position.z  = cameraZ - 140
      city.position.z = cameraZ - 88
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
