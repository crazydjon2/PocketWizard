import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

const GRASS_SRCS = [
  '/assets/Grass_1_64x64.png',
  '/assets/Grass_2_85x64.png',
  '/assets/Grass_3_61x64.png',
  '/assets/Grass_4_59x64.png',
]

const TRACK_LEN     = 80
const ROAD_HALF     = 3.2
const GRASS_PER_TEX = 30

function tween(setter: (v: number) => void, from: number, to: number, ms: number) {
  return new Promise<void>(resolve => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1)
      setter(from + (to - from) * t)
      t < 1 ? requestAnimationFrame(tick) : resolve()
    }
    requestAnimationFrame(tick)
  })
}

export function App() {
  const mountRef  = useRef<HTMLDivElement>(null)
  const [transitioning, setTransitioning] = useState(false)
  const speedRef  = useRef(0)
  const movingRef = useRef(false)

  const handleMove = useCallback(async () => {
    if (transitioning) return
    setTransitioning(true)
    movingRef.current = true
    await tween(v => { speedRef.current = v }, 0, 4, 1200)
    await tween(v => { speedRef.current = v }, 4, 0, 1400)
    movingRef.current = false
    setTransitioning(false)
  }, [transitioning])

  useEffect(() => {
    const mount = mountRef.current!
    const W = mount.clientWidth
    const H = mount.clientHeight

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    mount.appendChild(renderer.domElement)

    // ── Scene ─────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x7ab3d4)
    scene.fog = new THREE.Fog(0x7ab3d4, 45, 95)

    // ── Camera ────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 150)
    camera.position.set(0, 2.2, 0)
    camera.lookAt(0, 1.4, -50)

    const loader  = new THREE.TextureLoader()
    const loadTex = (src: string) => {
      const t = loader.load(src)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    }

    // ── Земля — следует за камерой, бесконечная ───────────────────
    const dirtTex = loadTex('/assets/dirt.png')
    dirtTex.wrapS = dirtTex.wrapT = THREE.RepeatWrapping
    dirtTex.repeat.set(5, 60)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, TRACK_LEN * 2.5),
      new THREE.MeshBasicMaterial({ map: dirtTex }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    scene.add(ground)

    // ── Небо — огромная плоскость позади всего ───────────────────
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 300),
      new THREE.MeshBasicMaterial({ color: 0x7ab3d4, fog: false, depthWrite: false }),
    )
    sky.position.set(0, 60, 0)
    sky.renderOrder = -1
    scene.add(sky)

    // ── Город — поверх неба, у горизонта ─────────────────────────
    const cityTex = loadTex('/assets/Fon2.png')
    const city = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 14),
      new THREE.MeshBasicMaterial({ map: cityTex, transparent: true, fog: false }),
    )
    city.position.set(0, 4.5, 0)
    scene.add(city)

    // ── Облака — тоже следуют за камерой ─────────────────────────
    const cloudTex = loadTex('/assets/cloud.png')
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

    // ── Трава: InstancedMesh (4 draw calls) ───────────────────────
    const dummy = new THREE.Object3D()

    interface GrassInst { x: number; z: number; sc: number; side: 1 | -1 }

    const pools: { im: THREE.InstancedMesh; inst: GrassInst[] }[] = []

    const grassTextures = GRASS_SRCS.map(loadTex)

    const spawnGrass = (): GrassInst => {
      const side = (Math.random() < 0.5 ? -1 : 1) as 1 | -1
      return {
        side,
        x:  side * (ROAD_HALF + 0.4 + Math.random() * 7),
        z:  -(Math.random() * TRACK_LEN),
        sc: 0.7 + Math.random() * 0.9,
      }
    }

    const setMatrix = (im: THREE.InstancedMesh, i: number, g: GrassInst) => {
      const h = 1.9 * g.sc
      dummy.position.set(g.x, h / 2, g.z)
      dummy.scale.set(1.7 * g.sc, h, 1)
      dummy.rotation.y = g.side * (Math.PI * 0.12 + Math.random() * 0.22)
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
        const g = spawnGrass()
        inst.push(g)
        setMatrix(im, i, g)
      }
      im.instanceMatrix.needsUpdate = true
      scene.add(im)
      pools.push({ im, inst })
    })

    // ── Персонаж — дочерний объект камеры ────────────────────────
    const charMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 1.05),
      new THREE.MeshBasicMaterial({
        map: loadTex('/assets/character/Characters_1_64x103.png'),
        transparent: true, depthWrite: false,
      }),
    )
    // Позиция относительно камеры: чуть ниже центра, прямо перед ней
    charMesh.position.set(0, -1.1, -3.5)
    camera.add(charMesh)
    scene.add(camera) // camera нужно добавить в scene чтобы дочерние объекты работали

    // ── Враг ──────────────────────────────────────────────────────
    const enemyMat = new THREE.MeshBasicMaterial({
      map: loadTex('/assets/enemy/Enemy_1_42x28.png'),
      transparent: true, depthWrite: false,
    })
    const enemyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.87), enemyMat)
    const ENEMY_DIST  = 16  // дистанция перед камерой
    const ENEMY_BASE_Y = 0.6
    enemyMesh.position.set(0, ENEMY_BASE_Y, 0)
    scene.add(enemyMesh)

    // ── Состояние ─────────────────────────────────────────────────
    let cameraZ   = 0
    let walkTime  = 0
    let wasMoving = false
    let enemyState: 'idle' | 'dying' | 'dead' | 'appearing' = 'idle'
    let enemyTimer = 0

    // Инициализируем позицию врага и земли
    ground.position.z      = -TRACK_LEN
    enemyMesh.position.z   = -ENEMY_DIST
    city.position.z        = -85
    cloudData.forEach(c => { /* уже в мировых координатах */ })

    // ── Render loop ───────────────────────────────────────────────
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const speed  = speedRef.current
      const moving = movingRef.current

      if (moving && !wasMoving) {
        enemyState = 'dying'
        enemyTimer = 0
      }
      wasMoving = moving

      if (moving) {
        cameraZ -= speed * 0.055
        camera.position.z = cameraZ

        // Боб персонажа
        walkTime += 0.1
        charMesh.position.y = -1.1 + Math.abs(Math.sin(walkTime)) * 0.07

        // Земля скроллит текстуру и следует за камерой
        dirtTex.offset.y  -= speed * 0.003
        ground.position.z  = cameraZ - TRACK_LEN

        // Трава: телепорт прошедших за камеру
        for (const { im, inst } of pools) {
          let dirty = false
          for (let i = 0; i < inst.length; i++) {
            const g = inst[i]
            if (g.z - cameraZ > 2) {
              g.z -= TRACK_LEN
              g.side  = (Math.random() < 0.5 ? -1 : 1) as 1 | -1
              g.x     = g.side * (ROAD_HALF + 0.4 + Math.random() * 7)
              g.sc    = 0.7 + Math.random() * 0.9
              setMatrix(im, i, g)
              dirty = true
            }
          }
          if (dirty) im.instanceMatrix.needsUpdate = true
        }
      } else {
        charMesh.position.y = -1.1
        ground.position.z   = cameraZ - TRACK_LEN
      }

      // Фон: небо, город и облака — всегда на горизонте
      sky.position.z  = cameraZ - 140
      city.position.z = cameraZ - 88
      for (const c of cloudData) {
        c.mesh.position.z = cameraZ + c.relZ
        c.mesh.position.x += 0.008 * (cloudData.indexOf(c) % 2 === 0 ? 1 : -1)
      }

      // Враг billboards по Y
      enemyMesh.rotation.y = Math.atan2(
        camera.position.x - enemyMesh.position.x,
        camera.position.z - enemyMesh.position.z,
      )

      // ── Враг: dying → dead → appearing ────────────────────────
      if (enemyState === 'dying') {
        enemyTimer += 0.04
        enemyMat.opacity     = Math.max(0, 1 - enemyTimer)
        enemyMesh.position.y = ENEMY_BASE_Y + enemyTimer * 0.5
        if (enemyTimer >= 1) {
          enemyState = 'dead'; enemyTimer = 0; enemyMat.opacity = 0
        }
      }
      if (enemyState === 'dead' && !moving) {
        enemyState = 'appearing'; enemyTimer = 0
        enemyMesh.position.set(0, ENEMY_BASE_Y - 0.5, cameraZ - ENEMY_DIST)
      }
      if (enemyState === 'appearing') {
        enemyTimer += 0.025
        enemyMat.opacity     = Math.min(1, enemyTimer)
        enemyMesh.position.y = ENEMY_BASE_Y - 0.5 + enemyTimer * 0.5
        if (enemyTimer >= 1) {
          enemyState = 'idle'; enemyMesh.position.y = ENEMY_BASE_Y
        }
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
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <button
        onClick={handleMove}
        disabled={transitioning}
        style={{
          position: 'absolute', bottom: 32, left: '50%',
          transform: 'translateX(-50%)',
          padding: '14px 36px', fontSize: 18, fontWeight: 700,
          background: transitioning ? '#444' : '#e8a020',
          color: '#fff', border: 'none', borderRadius: 12,
          cursor: transitioning ? 'default' : 'pointer',
          boxShadow: transitioning ? 'none' : '0 4px 20px #e8a02066',
          transition: 'background 0.2s',
        }}
      >
        {transitioning ? 'Идём...' : 'Идти вперёд →'}
      </button>
    </div>
  )
}
