import { useRef, useEffect, useCallback } from 'react'
import { Text, Image as KonvaImage, Transformer, Group } from 'react-konva'
import Konva from 'konva'
import type { Overlay } from '../../types'
import { useCanvasStore } from '../../store/useCanvasStore'
import { useImageLoader } from './useImageLoader'

interface OverlayNodeProps {
  overlay: Overlay
  isSelected: boolean
  onSelect: () => void
}

function TextOverlayNode({ overlay, isSelected, onSelect }: OverlayNodeProps) {
  const shapeRef = useRef<Konva.Text>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const { updateOverlay } = useCanvasStore()

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    updateOverlay(overlay.id, { x: e.target.x(), y: e.target.y() })
  }, [overlay.id, updateOverlay])

  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    updateOverlay(overlay.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation(),
      fontSize: Math.max(8, Math.round((overlay.fontSize ?? 24) * scaleY))
    })
  }, [overlay.id, overlay.fontSize, updateOverlay])

  return (
    <>
      <Text
        ref={shapeRef}
        x={overlay.x}
        y={overlay.y}
        width={overlay.width}
        text={overlay.text ?? 'Your headline here'}
        fontSize={overlay.fontSize ?? 24}
        fontFamily={overlay.fontFamily ?? 'Inter, system-ui, sans-serif'}
        fontStyle={overlay.fontWeight === 700 ? 'bold' : overlay.fontWeight === 500 ? '500' : 'normal'}
        fill={overlay.fill ?? '#FFFFFF'}
        align={overlay.align ?? 'center'}
        rotation={overlay.rotation}
        draggable
        onMouseDown={(e) => {
          if (e.evt.button === 0) onSelect()
        }}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(_, newBox) => ({
            ...newBox,
            width: Math.max(20, newBox.width),
            height: Math.max(20, newBox.height)
          })}
        />
      )}
    </>
  )
}

function BadgeOverlayNode({ overlay, isSelected, onSelect }: OverlayNodeProps) {
  const shapeRef = useRef<Konva.Image>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const { updateOverlay } = useCanvasStore()
  const image = useImageLoader(overlay.imageSrc ?? null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    updateOverlay(overlay.id, { x: e.target.x(), y: e.target.y() })
  }, [overlay.id, updateOverlay])

  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    updateOverlay(overlay.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation()
    })
  }, [overlay.id, updateOverlay])

  if (!image) return null

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        x={overlay.x}
        y={overlay.y}
        width={overlay.width}
        height={overlay.height}
        image={image}
        rotation={overlay.rotation}
        draggable
        onMouseDown={(e) => {
          if (e.evt.button === 0) onSelect()
        }}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(_, newBox) => ({
            ...newBox,
            width: Math.max(20, newBox.width),
            height: Math.max(20, newBox.height)
          })}
        />
      )}
    </>
  )
}

interface OverlayLayerProps {
  selectedOverlayId: string | null
  onSelectOverlay: (id: string | null) => void
}

export default function OverlayLayer({ selectedOverlayId, onSelectOverlay }: OverlayLayerProps) {
  const { overlays } = useCanvasStore()

  return (
    <Group>
      {overlays.map((overlay) => {
        const isSelected = selectedOverlayId === overlay.id
        const selectHandler = () => onSelectOverlay(overlay.id)

        if (overlay.type === 'text') {
          return (
            <TextOverlayNode
              key={overlay.id}
              overlay={overlay}
              isSelected={isSelected}
              onSelect={selectHandler}
            />
          )
        }
        if (overlay.type === 'badge') {
          return (
            <BadgeOverlayNode
              key={overlay.id}
              overlay={overlay}
              isSelected={isSelected}
              onSelect={selectHandler}
            />
          )
        }
        return null
      })}
    </Group>
  )
}
