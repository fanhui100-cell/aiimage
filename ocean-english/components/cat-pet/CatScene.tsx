'use client'

import { useRef, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useCatStore } from '@/store/catStore'
import { useCatAnimations } from './animations/useCatAnimations'
import { catPetConfig } from './config'

useGLTF.preload(catPetConfig.modelPath)

function CatModel() {
  const { scene }        = useGLTF(catPetConfig.modelPath)
  const setAnimState     = useCatStore(s => s.setAnimState)
  const animState        = useCatStore(s => s.animState)
  const togglePopup      = useCatStore(s => s.togglePopup)
  const touchInteraction = useCatStore(s => s.touchInteraction)

  const groupRef    = useRef<THREE.Group>(null)
  const bodyRef     = useRef<THREE.Mesh>(null)
  const leftEyeRef  = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)

  // Assign mesh refs by name after GLTF loads
  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      if (obj.name === catPetConfig.meshNames.body)     bodyRef.current     = obj
      if (obj.name === catPetConfig.meshNames.leftEye)  leftEyeRef.current  = obj
      if (obj.name === catPetConfig.meshNames.rightEye) rightEyeRef.current = obj
    })
  }, [scene])

  useCatAnimations({ group: groupRef, body: bodyRef, leftEye: leftEyeRef, rightEye: rightEyeRef })

  const handleClick = () => {
    touchInteraction()
    if (animState === 'sleeping') {
      setAnimState('idle')
    } else {
      togglePopup()
    }
  }

  const handleContextMenu = (e: { nativeEvent: Event }) => {
    e.nativeEvent.preventDefault()
    touchInteraction()
    setAnimState('rolling')
  }

  const handleDoubleClick = () => {
    touchInteraction()
    setAnimState('rolling')
  }

  return (
    <group
      ref={groupRef}
      scale={0.28}
      position={[0, -0.15, 0]}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
    >
      <primitive object={scene} />
    </group>
  )
}

export function CatScene() {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
      camera={{ position: [0, 0, 3], fov: 45 }}
    >
      <ambientLight intensity={1.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      <Suspense fallback={null}>
        <CatModel />
      </Suspense>
    </Canvas>
  )
}
