'use client'

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import {
  GLTFLoader,
  type GLTF,
} from 'three/addons/loaders/GLTFLoader.js'

export interface Visor3D {
  fijarSol: (direccion: [number, number, number], elevacionNormalizada: number) => void
  fijarFondo: (css: string) => void
  destruir: () => void
}

export async function crearVisor(
  holder: HTMLElement,
  urlGlb: string,
  onProgreso?: (porcentaje: number) => void,
): Promise<Visor3D> {
  const ancho = Math.max(1, holder.clientWidth)
  const alto = Math.max(1, holder.clientHeight)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(ancho, alto)
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.setAttribute('aria-label', 'Maqueta tridimensional interactiva')

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, ancho / alto, 0.1, 2000)
  const ambiente = new THREE.HemisphereLight(0xdfe8f0, 0x54473a, 0.6)
  const sol = new THREE.DirectionalLight(0xfff4e0, 2)
  sol.castShadow = true
  sol.shadow.mapSize.set(2048, 2048)
  sol.shadow.bias = -0.0004
  scene.add(ambiente, sol)

  const draco = new DRACOLoader()
  draco.setDecoderPath(
    'https://www.gstatic.com/draco/versioned/decoders/1.5.7/',
  )
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)

  let gltf: GLTF
  try {
    gltf = await new Promise<GLTF>((resolver, rechazar) => {
      loader.load(
        urlGlb,
        resolver,
        (evento) => {
          if (evento.total > 0) {
            onProgreso?.(Math.round((evento.loaded / evento.total) * 100))
          }
        },
        rechazar,
      )
    })
  } finally {
    draco.dispose()
  }

  const modelo = gltf.scene
  modelo.traverse((objeto) => {
    const malla = objeto as THREE.Mesh
    if (malla.isMesh) {
      malla.castShadow = true
      malla.receiveShadow = true
    }
  })
  scene.add(modelo)

  const caja = new THREE.Box3().setFromObject(modelo)
  const dimensiones = caja.getSize(new THREE.Vector3())
  const centro = caja.getCenter(new THREE.Vector3())
  modelo.position.sub(centro)
  modelo.position.y += dimensiones.y / 2
  const diametro = Math.max(dimensiones.x, dimensiones.z, 1)

  const suelo = new THREE.Mesh(
    new THREE.CircleGeometry(diametro * 1.3, 64),
    new THREE.ShadowMaterial({ opacity: 0.45 }),
  )
  suelo.rotation.x = -Math.PI / 2
  suelo.receiveShadow = true
  scene.add(suelo)

  sol.shadow.camera.left = -diametro
  sol.shadow.camera.right = diametro
  sol.shadow.camera.top = diametro
  sol.shadow.camera.bottom = -diametro
  sol.shadow.camera.far = diametro * 6
  sol.shadow.camera.updateProjectionMatrix()

  camera.position.set(diametro * 0.9, dimensiones.y * 1.6, diametro * 0.85)
  const controles = new OrbitControls(camera, renderer.domElement)
  controles.target.set(0, dimensiones.y * 0.45, 0)
  controles.enableDamping = true
  controles.maxPolarAngle = 1.48
  controles.minDistance = diametro * 0.35
  controles.maxDistance = diametro * 2.5
  controles.update()

  const calido = new THREE.Color(0xffb877)
  const dia = new THREE.Color(0xfff6e8)
  let vivo = true
  let frame = 0

  const ciclo = () => {
    if (!vivo) return
    frame = window.requestAnimationFrame(ciclo)
    controles.update()
    renderer.render(scene, camera)
  }

  const observarTamano = new ResizeObserver(([entrada]) => {
    const nuevoAncho = Math.max(1, entrada.contentRect.width)
    const nuevoAlto = Math.max(1, entrada.contentRect.height)
    camera.aspect = nuevoAncho / nuevoAlto
    camera.updateProjectionMatrix()
    renderer.setSize(nuevoAncho, nuevoAlto)
  })
  observarTamano.observe(holder)
  holder.prepend(renderer.domElement)
  ciclo()

  return {
    fijarSol(direccion, elevacionNormalizada) {
      const elevacion = Math.max(0.03, elevacionNormalizada)
      sol.position.set(
        direccion[0] * diametro * 2,
        Math.max(0.05, direccion[1]) * diametro * 2,
        direccion[2] * diametro * 2,
      )
      sol.color.lerpColors(calido, dia, Math.min(1, elevacion * 1.7))
      sol.intensity = 0.5 + 2.1 * Math.min(1, elevacion * 1.5)
      ambiente.intensity = 0.3 + 0.5 * elevacion
    },
    fijarFondo(css) {
      if (css.trim()) scene.background = new THREE.Color(css.trim())
    },
    destruir() {
      vivo = false
      window.cancelAnimationFrame(frame)
      observarTamano.disconnect()
      controles.dispose()
      modelo.traverse((objeto) => {
        const malla = objeto as THREE.Mesh
        if (!malla.isMesh) return
        malla.geometry?.dispose()
        const materiales = Array.isArray(malla.material)
          ? malla.material
          : [malla.material]
        materiales.forEach((material) => material.dispose())
      })
      suelo.geometry.dispose()
      ;(suelo.material as THREE.Material).dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
