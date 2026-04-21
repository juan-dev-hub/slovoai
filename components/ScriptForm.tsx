'use client'
import { useState, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input, Textarea, Select } from './ui/Input'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface FormData {
  producto: string
  nicho: string
  problema: string
  resultado: string
  precio: string
  canal: string
  tono: string
  nivelHype: number
  tipoCliente: string
  prueba: string
  garantia: string
  urgencia: string
}

interface ScriptFormProps {
  onScriptGenerated: (data: {
    scriptId: string
    gancho: string
    problema: string
    solucion: string
    prueba: string
    oferta: string
    cierre: string
    manejoObjecion: string
    full: string
  }) => void
}

const canalOptions = [
  { value: 'llamada telefónica', label: '📞 Llamada telefónica' },
  { value: 'videollamada', label: '🎥 Videollamada' },
  { value: 'email', label: '📧 Email' },
  { value: 'mensaje directo (DM)', label: '💬 Mensaje Directo (DM)' },
  { value: 'cara a cara', label: '🤝 Cara a cara / Presencial' },
]

const tonoOptions = [
  { value: 'agresivo', label: '🔥 Agresivo — Sin filtros, confrontativo' },
  { value: 'medio',    label: '⚡ Medio — Firme pero amigable' },
  { value: 'suave',    label: '🧊 Suave — Empático y consultivo' },
]

const clienteOptions = [
  { value: 'escéptico',   label: '🤨 Escéptico — Necesita lógica y prueba' },
  { value: 'degen',       label: '🎲 Degen — Busca upside, habla cripto' },
  { value: 'corporativo', label: '💼 Corporativo — Evalúa ROI, formal' },
]

export function ScriptForm({ onScriptGenerated }: ScriptFormProps) {
  const [form, setForm] = useState<FormData>({
    producto: '',
    nicho: '',
    problema: '',
    resultado: '',
    precio: '',
    canal: '',
    tono: '',
    nivelHype: 5,
    tipoCliente: '',
    prueba: '',
    garantia: '',
    urgencia: '',
  })
  const [objeciones, setObjeciones] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const coreFields: (keyof FormData)[] = ['producto', 'nicho', 'problema', 'resultado', 'precio', 'canal', 'tono', 'tipoCliente']
  const filledCore = coreFields.filter(f => String(form[f]).trim() !== '').length
  const filledObjeciones = objeciones.filter(o => o.trim() !== '').length
  const totalFields = coreFields.length + 1
  const filledCount = filledCore + (filledObjeciones > 0 ? 1 : 0)
  const isComplete = filledCount === totalFields

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = field === 'nivelHype' ? Number(e.target.value) : e.target.value
      setForm(prev => ({ ...prev, [field]: val }))
    }
  }

  function setObjecion(idx: number, value: string) {
    setObjeciones(prev => prev.map((o, i) => (i === idx ? value : o)))
  }

  function addObjecion() {
    if (objeciones.length < 10) setObjeciones(prev => [...prev, ''])
  }

  function removeObjecion(idx: number) {
    if (objeciones.length === 1) return
    setObjeciones(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    for (const field of coreFields) {
      if (!String(form[field]).trim()) {
        setError(`El campo "${field}" es requerido`)
        return
      }
    }

    const validObjeciones = objeciones.filter(o => o.trim())
    if (validObjeciones.length === 0) {
      setError('Agrega al menos una objeción')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          objeciones: validObjeciones,
          prueba: form.prueba.trim(),
          garantia: form.garantia.trim(),
          urgencia: form.urgencia.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando script')

      onScriptGenerated(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <Card className="p-8" glow>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Genera tu script de ventas</h2>
          <p className="text-white/60 text-sm">Llena los campos y la IA generará un script estilo Hormozi personalizado para ti.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Producto y Nicho */}
          <motion.div variants={itemVariants}>
            <Input
              label="Producto o servicio"
              placeholder="Ej: Consultoría de marketing digital"
              value={form.producto}
              onChange={set('producto')}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              label="Nicho de mercado"
              placeholder="Ej: Dueños de restaurantes en El Salvador"
              value={form.nicho}
              onChange={set('nicho')}
            />
          </motion.div>

          {/* Problema y Resultado */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <Textarea
              label="Problema principal que resuelve"
              placeholder="Ej: No consiguen clientes nuevos y dependen del boca a boca"
              value={form.problema}
              onChange={set('problema')}
              rows={3}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2">
            <Textarea
              label="Resultado concreto que obtiene el cliente"
              placeholder="Ej: 30 clientes nuevos en 60 días garantizado"
              value={form.resultado}
              onChange={set('resultado')}
              rows={3}
            />
          </motion.div>

          {/* Precio y Canal */}
          <motion.div variants={itemVariants}>
            <Input
              label="Precio de la oferta"
              placeholder="Ej: $997 o $197/mes"
              value={form.precio}
              onChange={set('precio')}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Select
              label="Canal de venta"
              options={canalOptions}
              value={form.canal}
              onChange={set('canal')}
            />
          </motion.div>

          {/* Variables de estilo */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <div className="h-px bg-white/10 mb-5" />
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">Estilo del script</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Select
              label="Tono del vendedor"
              options={tonoOptions}
              value={form.tono}
              onChange={set('tono')}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Select
              label="Tipo de cliente"
              options={clienteOptions}
              value={form.tipoCliente}
              onChange={set('tipoCliente')}
            />
          </motion.div>

          {/* Nivel de hype slider */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Nivel de hype &nbsp;
              <span className="text-electric font-bold">{form.nivelHype}/10</span>
              <span className="text-white/40 text-xs ml-2">
                {form.nivelHype <= 3 ? '— Solo hechos y lógica' : form.nivelHype <= 6 ? '— Energía controlada' : '— Máxima urgencia'}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">0</span>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={form.nivelHype}
                onChange={set('nivelHype')}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-electric bg-white/10"
              />
              <span className="text-xs text-white/40">10</span>
            </div>
          </motion.div>

          {/* Campos opcionales */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <div className="h-px bg-white/10 mb-5 mt-1" />
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
              Datos opcionales — mejoran la sección de Prueba y Cierre
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2">
            <Textarea
              label="Prueba social o dato real (opcional)"
              placeholder="Ej: María perdió 8kg en 6 semanas. O: el 73% de nuestros clientes renueva."
              value={form.prueba}
              onChange={set('prueba')}
              rows={2}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              label="Garantía (opcional)"
              placeholder="Ej: 30 días de devolución sin preguntas"
              value={form.garantia}
              onChange={set('garantia')}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Input
              label="Urgencia o escasez (opcional)"
              placeholder="Ej: Solo 10 cupos este mes"
              value={form.urgencia}
              onChange={set('urgencia')}
            />
          </motion.div>

          {/* Objeciones dinámicas */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <div className="h-px bg-white/10 mb-5 mt-1" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white/80">Objeciones del cliente</p>
                <p className="text-xs text-white/40 mt-0.5">Agrega todas las que anticipes — la IA generará un loop de respuestas estilo línea recta.</p>
              </div>
              <span className="text-xs text-white/40">{objeciones.filter(o => o.trim()).length}/{objeciones.length}</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {objeciones.map((obj, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="flex gap-2 items-start"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 mt-3 font-bold">
                      {idx + 1}
                    </div>
                    <Textarea
                      placeholder={`Ej: ${idx === 0 ? 'No tengo dinero ahora mismo' : idx === 1 ? 'Necesito pensarlo' : 'Ya lo intenté y no funcionó'}`}
                      value={obj}
                      onChange={e => setObjecion(idx, e.target.value)}
                      rows={2}
                    />
                    {objeciones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjecion(idx)}
                        className="flex-shrink-0 mt-3 w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 text-sm flex items-center justify-center transition-colors"
                        title="Eliminar objeción"
                      >
                        ×
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {objeciones.length < 10 && (
                <button
                  type="button"
                  onClick={addObjecion}
                  className="w-full py-2 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white/70 hover:border-white/40 text-sm transition-all duration-200"
                >
                  + Agregar otra objeción
                </button>
              )}
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2 p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Progress + Submit */}
          <motion.div variants={itemVariants} className="md:col-span-2 space-y-3">
            {!isComplete && (
              <div className="flex items-center justify-between text-xs text-white/50 px-1">
                <span>Completa todos los campos para generar</span>
                <span className="font-bold text-white/70">{filledCount}/{totalFields}</span>
              </div>
            )}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(filledCount / totalFields) * 100}%`,
                  background: isComplete ? '#22d3ee' : '#6366f1',
                }}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!isComplete}
              className="w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Generando script...' : '⚡ Generar Script de Ventas'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </Card>
  )
}
