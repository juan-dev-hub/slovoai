'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { formatDate } from '@/lib/utils'

interface Script {
  id: string
  producto: string
  nicho: string
  canal: string
  desbloqueado: boolean
  fecha_creacion: string
  script_completo: string | null
  gancho?: string
  problema?: string
}

interface ScriptHistoryProps {
  scripts: Script[]
  credits: number
  onCreditUsed: (newCredits: number) => void
}

export function ScriptHistory({ scripts, credits, onCreditUsed }: ScriptHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  const downloadPDF = useCallback(async (script: Script) => {
    if (!script.script_completo) return
    setPdfLoading(script.id)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let y = 20

      doc.setFillColor(10, 15, 30)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      doc.setFontSize(22)
      doc.setTextColor(0, 198, 255)
      doc.text('SCRIPT DE VENTAS', pageWidth / 2, y, { align: 'center' })
      y += 12

      doc.setFontSize(11)
      doc.setTextColor(180, 180, 180)
      doc.text(`${script.producto} | ${script.nicho}`, pageWidth / 2, y, { align: 'center' })
      y += 16

      doc.setFontSize(10)
      doc.setTextColor(220, 220, 220)
      const lines = doc.splitTextToSize(script.script_completo, pageWidth - margin * 2)
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

      doc.save(`script-${script.producto.slice(0, 20).replace(/\s+/g, '-')}.pdf`)
    } catch (err) {
      console.error(err)
    } finally {
      setPdfLoading(null)
    }
  }, [])

  if (scripts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-5xl mb-4">📝</div>
        <h3 className="text-white font-semibold text-lg mb-2">Sin scripts generados</h3>
        <p className="text-white/50 text-sm">Genera tu primer script de ventas arriba</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {scripts.map((script, idx) => (
        <motion.div
          key={script.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card className="overflow-hidden" hover>
            <div
              className="p-5 flex items-center justify-between cursor-pointer"
              onClick={() => setExpanded(expanded === script.id ? null : script.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${script.desbloqueado ? 'bg-aqua' : 'bg-white/30'}`} />
                <div>
                  <p className="text-white font-medium text-sm">{script.producto}</p>
                  <p className="text-white/50 text-xs">{script.nicho} · {script.canal}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-xs hidden sm:block">{formatDate(script.fecha_creacion)}</span>
                {script.desbloqueado ? (
                  <span className="px-2 py-0.5 text-xs bg-aqua/20 text-aqua border border-aqua/30 rounded-full">Desbloqueado</span>
                ) : (
                  <span className="px-2 py-0.5 text-xs bg-white/10 text-white/50 border border-white/10 rounded-full">Bloqueado</span>
                )}
                <svg
                  className={`w-4 h-4 text-white/50 transition-transform duration-200 ${expanded === script.id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <AnimatePresence>
              {expanded === script.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-white/10 pt-4">
                    {script.desbloqueado && script.script_completo ? (
                      <div className="space-y-3">
                        <div
                          className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-2"
                          onContextMenu={e => e.preventDefault()}
                          style={{ userSelect: 'none' }}
                        >
                          {script.script_completo}
                        </div>
                        <Button
                          onClick={() => downloadPDF(script)}
                          loading={pdfLoading === script.id}
                          variant="secondary"
                          size="sm"
                        >
                          📥 Descargar PDF
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-white/50 text-sm mb-3">Este script no está desbloqueado aún</p>
                        <p className="text-white/30 text-xs">Regresa al formulario para generarlo de nuevo</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
