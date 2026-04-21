import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export interface ScriptSections {
  gancho: string
  problema: string
  solucion: string
  prueba: string
  oferta: string
  cierre: string
  manejoObjecion: string
  full: string
}

// Matches section headers with OR without leading number, handling bold/markdown variants:
// "1. GANCHO", "**GANCHO**", "## 2. PROBLEMA", "SOLUCIÓN:", etc.
const HEADER_RE = /^[#*>\s_]*(?:\d+[.):\-]\s*)?[*_]*(GANCHO|PROBLEMA|SOLUC[IÍ]ON|PRUEBA|OFERTA|CIERRE|OBJECIONES|MANEJO\s+(?:DE\s+)?OBJECCI[OÓ]N)[*_\s]*:?$/i

const KEYWORD_TO_KEY: Record<string, string> = {
  gancho: 'gancho',
  problema: 'problema',
  solucion: 'solucion',
  solución: 'solucion',
  prueba: 'prueba',
  oferta: 'oferta',
  cierre: 'cierre',
  objeciones: 'manejoObjecion',
}

function keyFromLine(line: string): string | null {
  const m = line.match(HEADER_RE)
  if (!m) return null
  const word = m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (word.startsWith('manejo') || word.startsWith('objecion')) return 'manejoObjecion'
  return KEYWORD_TO_KEY[word] ?? null
}

function stripMarkdown(s: string): string {
  return s.replace(/\*\*/g, '').replace(/^[#>*_\-=]+\s*/, '').trim()
}

function parseScriptSections(text: string): ScriptSections {
  console.log('[Groq raw output]\n', text.slice(0, 500))

  const sections: Record<string, string[]> = {}
  let currentKey = ''

  for (const rawLine of text.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    const key = keyFromLine(trimmed)
    if (key) {
      currentKey = key
      sections[key] = []
      continue
    }

    if (currentKey) {
      const cleaned = stripMarkdown(trimmed)
      if (cleaned) sections[currentKey].push(cleaned)
    }
  }

  return {
    gancho: sections['gancho']?.join('\n') || '',
    problema: sections['problema']?.join('\n') || '',
    solucion: sections['solucion']?.join('\n') || '',
    prueba: sections['prueba']?.join('\n') || '',
    oferta: sections['oferta']?.join('\n') || '',
    cierre: sections['cierre']?.join('\n') || '',
    manejoObjecion: sections['manejoObjecion']?.join('\n') || '',
    full: text,
  }
}

const TONO_DESC: Record<string, string> = {
  agresivo: 'Directo, sin filtros, confrontativo. Presiona sin disculparse.',
  medio: 'Firme pero amigable. Directo sin ser ofensivo.',
  suave: 'Empático y consultivo. Guía sin presionar.',
}

const CLIENTE_DESC: Record<string, string> = {
  escéptico: 'No cree en promesas. Necesita lógica y prueba antes de moverse.',
  degen: 'Tolerante al riesgo, busca upside rápido, habla el lenguaje cripto/trading.',
  corporativo: 'Formal, evalúa ROI, necesita validación institucional.',
}

export async function generateSalesScript(inputs: {
  producto: string
  nicho: string
  problema: string
  resultado: string
  precio: string
  canal: string
  objeciones: string[]
  tono: string
  nivelHype: number
  tipoCliente: string
}): Promise<ScriptSections> {
  const objecionesFormateadas = inputs.objeciones
    .map((o, i) => `${i + 1}. ${o}`)
    .join('\n')

  const tonoDesc = TONO_DESC[inputs.tono] || TONO_DESC['medio']
  const clienteDesc = CLIENTE_DESC[inputs.tipoCliente] || CLIENTE_DESC['escéptico']
  const hypeNote =
    inputs.nivelHype <= 3
      ? 'Nivel de hype bajo: sin afirmaciones grandiosas, solo hechos y lógica.'
      : inputs.nivelHype <= 6
      ? 'Nivel de hype moderado: energía controlada, alguna emoción pero basada en datos.'
      : 'Nivel de hype alto: energía máxima, urgencia real, lenguaje de oportunidad única.'

  const prompt = `Eres un vendedor de élite y copywriter estilo Alex Hormozi. Escribe un script de ventas real, completo y personalizado con los datos que te doy abajo.

INFORMACIÓN DEL PRODUCTO:
Producto: ${inputs.producto}
Cliente ideal: ${inputs.nicho}
Problema que resuelve: ${inputs.problema}
Resultado concreto: ${inputs.resultado}
Precio: ${inputs.precio}
Canal: ${inputs.canal}

ESTILO:
Tono: ${inputs.tono} — ${tonoDesc}
Nivel de hype ${inputs.nivelHype}/10: ${hypeNote}
Tipo de cliente: ${inputs.tipoCliente} — ${clienteDesc}

INSTRUCCIONES:
- Usa el nombre del producto, el nicho y el resultado en cada sección.
- Escribe oraciones completas, no palabras sueltas.
- Tono directo como vendedor real hablando por ${inputs.canal}.
- Sin emojis, sin asteriscos, sin markdown, sin bullets con guión.
- Mínimo 4 oraciones por sección.

FORMATO DE SALIDA OBLIGATORIO — usa exactamente estos encabezados en mayúsculas, solos en su línea:

GANCHO
[escribe aquí el gancho con mínimo 3 oraciones directas y confrontativas para ${inputs.nicho}]

PROBLEMA
[escribe aquí el problema: por qué ${inputs.nicho} sigue fallando con ${inputs.problema}, con detalle real]

SOLUCIÓN
[escribe aquí cómo ${inputs.producto} resuelve ${inputs.problema}, explicando el mecanismo real]

PRUEBA
[escribe aquí evidencia lógica o ejemplos creíbles de que ${inputs.producto} entrega ${inputs.resultado}]

OFERTA
[escribe aquí la oferta: precio ${inputs.precio}, valor vs costo de no actuar, condición de urgencia]

CIERRE
[escribe aquí el llamado a acción directo por ${inputs.canal}]

OBJECIONES
${objecionesFormateadas.split('\n').map(o => `Para la objeción "${o.replace(/^\d+\.\s*/, '')}": escribe una respuesta de 2 oraciones directas y un remate de 1 línea que regrese al cliente al sí.`).join('\n')}

Escribe el script completo ahora usando los datos reales. Empieza directamente con el encabezado GANCHO.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 4000,
  })

  const text = completion.choices[0]?.message?.content || ''
  return parseScriptSections(text)
}
