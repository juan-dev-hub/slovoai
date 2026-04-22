'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { CreditPackages } from './CreditPackages'

interface ScriptData {
  scriptId: string
  gancho: string
  problema: string
  solucion: string
  prueba: string
  oferta: string
  cierre: string
  manejoObjecion: string
  versionHablada: string
  full: string
}

interface ScriptDisplayProps {
  script: ScriptData
  credits: number
  onUnlocked: (newCredits: number) => void
}

const SECTIONS = [
  { key: 'gancho',         label: 'GANCHO',             emoji: '⚡', free: true  },
  { key: 'problema',       label: 'PROBLEMA',            emoji: '🎯', free: true  },
  { key: 'solucion',       label: 'SOLUCIÓN',            emoji: '💡', free: false },
  { key: 'prueba',         label: 'PRUEBA',              emoji: '📊', free: false },
  { key: 'oferta',         label: 'OFERTA',              emoji: '💰', free: false },
  { key: 'cierre',         label: 'CIERRE',              emoji: '🔥', free: false },
  { key: 'manejoObjecion', label: 'MANEJO DE OBJECIÓN',  emoji: '🛡️', free: false },
  { key: 'versionHablada', label: 'VERSIÓN HABLADA',     emoji: '🗣️', free: false },
]

export function ScriptDisplay({ script, credits, onUnlocked }: ScriptDisplayProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState('')
  const [showPurchase, setShowPurchase] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') e.preventDefault()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const downloadPDF = useCallback(async () => {
    setPdfLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - margin * 2
      let y = 20

      doc.setFillColor(10, 15, 30)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      doc.setFontSize(22)
      doc.setTextColor(0, 198, 255)
      doc.text('SCRIPT DE VENTAS — ESTILO HORMOZI', pageWidth / 2, y, { align: 'center' })
      y += 12

      doc.setFontSize(11)
      doc.setTextColor(180, 180, 180)
      doc.text(`Generado por SLOVO AI — ${new Date().toLocaleDateString('es-SV')}`, pageWidth / 2, y, { align: 'center' })
      y += 16

      const sections = [
        { title: '1. GANCHO', content: script.gancho },
        { title: '2. PROBLEMA', content: script.problema },
        { title: '3. SOLUCIÓN', content: script.solucion },
        { title: '4. PRUEBA', content: script.prueba },
        { title: '5. OFERTA', content: script.oferta },
        { title: '6. CIERRE', content: script.cierre },
        { title: '7. MANEJO DE OBJECIÓN', content: script.manejoObjecion },
        { title: '8. VERSIÓN HABLADA', content: script.versionHablada },
      ]

      for (const section of sections) {
        if (y > pageHeight - 40) {
          doc.addPage()
          doc.setFillColor(10, 15, 30)
          doc.rect(0, 0, pageWidth, pageHeight, 'F')
          y = 20
        }

        doc.setFontSize(13)
        doc.setTextColor(0, 198, 255)
        doc.text(section.title, margin, y)
        y += 7

        doc.setFontSize(10)
        doc.setTextColor(220, 220, 220)
        const lines = doc.splitTextToSize(section.content || '', maxWidth)
        lines.forEach((line: string) => {
          if (y > pageHeight - 20) {
            doc.addPage()
            doc.setFillColor(10, 15, 30)
            doc.rect(0, 0, pageWidth, pageHeight, 'F')
            y = 20
          }
          doc.text(line, margin, y)
          y += 6
        })
        y += 8
      }

      doc.save('script-ventas-hormozi.pdf')
    } catch (err) {
      console.error(err)
    } finally {
      setPdfLoading(false)
    }
  }, [script])

  async function handleUnlock() {
    if (credits < 1) {
      setShowPurchase(true)
      return
    }

    setUnlocking(true)
    setError('')
    try {
      // Only send scriptId — content is stored server-side, never trusted from client
      const res = await fetch('/api/unlock-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: script.scriptId }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'NO_CREDITS') {
          setShowPurchase(true)
          return
        }
        throw new Error(data.error)
      }

      setUnlocked(true)
      onUnlocked(credits - 1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUnlocking(false)
    }
  }

  function handlePurchaseSuccess() {
    setShowPurchase(false)
  }

  return (
    <div
      className="space-y-4"
      onContextMenu={e => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      {SECTIONS.map((section, idx) => {
        const content = script[section.key as keyof ScriptData] as string
        const isVisible = section.free || unlocked

        return (
          <motion.div
            key={section.key}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.12, duration: 0.5 }}
          >
            <Card className={`p-6 ${isVisible ? '' : 'relative overflow-hidden'}`} glow={section.free}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{section.emoji}</span>
                <h3 className="font-bold text-electric tracking-wider text-sm">
                  {idx + 1}. {section.label}
                </h3>
              </div>

              {isVisible ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-white/85 leading-relaxed text-sm whitespace-pre-wrap"
                >
                  {content}
                </motion.p>
              ) : (
                <div className="relative">
                  <p className="text-white/85 leading-relaxed text-sm blur-md select-none pointer-events-none line-clamp-4">
                    {content || 'Este contenido está protegido y disponible después de desbloquear el script completo.'}
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg/80" />
                </div>
              )}
            </Card>
          </motion.div>
        )
      })}

      <AnimatePresence>
        {!unlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky bottom-6 z-40"
          >
            <Card className="p-6 border-electric/40 bg-bg/90 backdrop-blur-xl" glow>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">🔒 Script completo bloqueado</p>
                  <p className="text-white/60 text-sm mt-0.5">
                    {credits > 0
                      ? `Tienes ${credits} crédito${credits !== 1 ? 's' : ''}. Cuesta 1 crédito desbloquear.`
                      : 'No tienes créditos. Compra un paquete para continuar.'}
                  </p>
                </div>
                <Button onClick={handleUnlock} loading={unlocking} size="lg">
                  {unlocking ? 'Desbloqueando...' : '🔓 Desbloquear Script (-1 crédito)'}
                </Button>
              </div>
              {error && (
                <p className="mt-3 text-red-400 text-sm text-center">{error}</p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {unlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-3"
              >
                🎉
              </motion.div>
              <h3 className="text-xl font-bold text-white">¡Script desbloqueado!</h3>
              <p className="text-white/60 text-sm mt-1">Descarga tu PDF. Puedes volver a descargarlo sin gastar créditos.</p>
            </div>
            <Button onClick={downloadPDF} loading={pdfLoading} size="lg" variant="secondary">
              {pdfLoading ? 'Generando PDF...' : '📥 Descargar PDF'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPurchase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowPurchase(false) }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-3xl"
            >
              <Card className="p-6" glow>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Comprar créditos</h3>
                    <p className="text-white/60 text-sm mt-1">Elige el paquete que mejor se adapte a ti</p>
                  </div>
                  <button onClick={() => setShowPurchase(false)} className="text-white/50 hover:text-white transition-colors text-2xl leading-none">✕</button>
                </div>
                <CreditPackages onSuccess={handlePurchaseSuccess} />
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
