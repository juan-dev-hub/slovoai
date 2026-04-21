import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateSalesScript } from '@/lib/groq-client'
import { getUser, saveScript } from '@/lib/db'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const ALLOWED_CANALES = [
  'llamada telefónica',
  'videollamada',
  'email',
  'mensaje directo (DM)',
  'cara a cara',
]

const ALLOWED_TONOS = ['agresivo', 'medio', 'suave']
const ALLOWED_CLIENTES = ['escéptico', 'degen', 'corporativo']

const MAX_FIELD_LENGTH = 500
const MAX_OBJECIONES = 10

function sanitizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_FIELD_LENGTH) return null
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

function sanitizeOptional(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (trimmed.length > MAX_FIELD_LENGTH) return ''
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`gen:${userId}`, RATE_LIMITS.generate)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const user = await getUser(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()

    const producto  = sanitizeText(body.producto)
    const nicho     = sanitizeText(body.nicho)
    const problema  = sanitizeText(body.problema)
    const resultado = sanitizeText(body.resultado)
    const precio    = sanitizeText(body.precio)
    const canal     = typeof body.canal === 'string' && ALLOWED_CANALES.includes(body.canal.trim())
      ? body.canal.trim()
      : null

    const tono = typeof body.tono === 'string' && ALLOWED_TONOS.includes(body.tono.trim())
      ? body.tono.trim()
      : null

    const nivelHype = typeof body.nivelHype === 'number' && body.nivelHype >= 0 && body.nivelHype <= 10
      ? Math.round(body.nivelHype)
      : null

    const tipoCliente = typeof body.tipoCliente === 'string' && ALLOWED_CLIENTES.includes(body.tipoCliente.trim())
      ? body.tipoCliente.trim()
      : null

    if (!Array.isArray(body.objeciones) || body.objeciones.length === 0) {
      return NextResponse.json({ error: 'Debes ingresar al menos una objeción' }, { status: 400 })
    }
    if (body.objeciones.length > MAX_OBJECIONES) {
      return NextResponse.json({ error: `Máximo ${MAX_OBJECIONES} objeciones permitidas` }, { status: 400 })
    }

    const objeciones: string[] = []
    for (const raw of body.objeciones) {
      const clean = sanitizeText(raw)
      if (clean) objeciones.push(clean)
    }
    if (objeciones.length === 0) {
      return NextResponse.json({ error: 'Objeciones inválidas o vacías' }, { status: 400 })
    }

    const prueba    = sanitizeOptional(body.prueba)
    const garantia  = sanitizeOptional(body.garantia)
    const urgencia  = sanitizeOptional(body.urgencia)

    if (!producto || !nicho || !problema || !resultado || !precio || !canal || !tono || nivelHype === null || !tipoCliente) {
      return NextResponse.json({ error: 'Campos inválidos o faltantes' }, { status: 400 })
    }

    const sections = await generateSalesScript({
      producto, nicho, problema, resultado, precio, canal,
      objeciones, prueba, garantia, urgencia, tono, nivelHype, tipoCliente,
    })

    const script = await saveScript({
      usuarioId: userId,
      producto,
      nicho,
      problema,
      resultado,
      precio,
      canal,
      objecion: objeciones.join(' | '),
      scriptCompleto: sections.full,
      desbloqueado: false,
    })

    return NextResponse.json({
      scriptId: script.id,
      gancho: sections.gancho,
      problema: sections.problema,
      solucion: sections.solucion,
      prueba: sections.prueba,
      oferta: sections.oferta,
      cierre: sections.cierre,
      manejoObjecion: sections.manejoObjecion,
      versionHablada: sections.versionHablada,
      full: sections.full,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error generando script' }, { status: 500 })
  }
}
