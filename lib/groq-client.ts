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

const HEADER_RE = /^[#>\s*_]*(\d+)\s*[.):\-]\s*[*_]*(GANCHO|PROBLEMA|SOLUCIÓN|SOLUCION|PRUEBA|OFERTA|CIERRE|OBJECIONES|MANEJO\s+DE\s+OBJECIÓN|MANEJO\s+DE\s+OBJECION)\b[*_\s]*:?\s*/i

const NUMBER_TO_KEY: Record<string, string> = {
  '1': 'gancho',
  '2': 'problema',
  '3': 'solucion',
  '4': 'prueba',
  '5': 'oferta',
  '6': 'cierre',
  '7': 'manejoObjecion',
}

function stripMarkdown(s: string): string {
  return s.replace(/\*\*/g, '').replace(/^[#>*_\-]+\s*/, '').trim()
}

function parseScriptSections(text: string): ScriptSections {
  console.log('[Groq raw output]', text.slice(0, 300))

  const sections: Record<string, string[]> = {}
  let currentKey = ''

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const match = trimmed.match(HEADER_RE)
    if (match) {
      const key = NUMBER_TO_KEY[match[1]]
      if (key) {
        currentKey = key
        sections[key] = []
        const inline = trimmed.slice(match[0].length).trim()
        if (inline) sections[key].push(stripMarkdown(inline))
        continue
      }
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

  const prompt = `Eres un copywriter élite especializado en ventas agresivas estilo Hormozi adaptado a mercados escépticos como cripto.

Tu tarea es generar un script de ventas que convierta.

REGLAS CRÍTICAS (OBLIGATORIAS):
- Usa frases cortas (máx 12 palabras por línea)
- Escribe en formato de líneas separadas (no párrafos largos)
- Evita frases genéricas tipo: "no es una promesa", "tenemos clientes", "solución innovadora"
- No uses lenguaje de IA, marketing cliché o relleno
- Mantén tono directo, incómodo y seguro
- Prioriza claridad sobre creatividad
- El lector tiene baja atención (máx 3 segundos para enganchar)

PARÁMETROS DE ESTILO:
- Tono: ${inputs.tono} — ${tonoDesc}
- Nivel de hype (${inputs.nivelHype}/10): ${hypeNote}
- Tipo de cliente: ${inputs.tipoCliente} — ${clienteDesc}

ESTRUCTURA EXACTA:

1. GANCHO
- Debe ser incómodo o confrontativo
- Ataca una creencia falsa o resultado pobre
- Máximo 3 líneas

2. PROBLEMA
- Rompe falsas creencias
- Explica por qué está fallando realmente
- 3-5 líneas cortas

3. SOLUCIÓN
- Explica qué hace el producto SIN hype vacío
- Enfocado en mecanismo, no buzzwords
- 3-5 líneas

4. PRUEBA
- Usa ejemplos creíbles (evita números exagerados)
- Si no hay datos reales, usa lógica clara
- 2-4 líneas

5. OFERTA
- Precio claro
- Incluye riesgo inverso o condición fuerte si es posible
- 2-3 líneas

6. CIERRE
- Directo, sin emoción falsa
- Llamado a acción simple
- 2 líneas máximo

7. OBJECIONES
Para cada objeción listada abajo, genera una respuesta estilo línea recta Jordan Belfort.
Cada respuesta: máximo 2 líneas, tipo golpe, sin explicar de más.
Después de responder cada objeción, agrega un remate de cierre de una línea que regrese al prospecto al track.
Formato por objeción:
[Objeción X]: <texto de la objeción>
Respuesta: <respuesta directa>
Remate: <línea de regreso al track>

FORMATO DE SALIDA:
- Usa títulos numerados (1. GANCHO, 2. PROBLEMA, etc.)
- No uses emojis
- No uses párrafos largos
- Todo debe ser escaneable en segundos

INPUT DEL USUARIO:
Producto: ${inputs.producto}
Nicho: ${inputs.nicho}
Problema: ${inputs.problema}
Resultado: ${inputs.resultado}
Precio: ${inputs.precio}
Canal: ${inputs.canal}
Objeciones a manejar:
${objecionesFormateadas}

Genera el script ahora.
ANTES de escribir:
- Identifica el dolor real (no superficial)
- Elimina cualquier frase que suene genérica
- Reduce cada bloque a lo mínimo necesario

SI suena como algo que cualquiera podría decir:
→ reescríbelo más específico o más directo`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 3500,
  })

  const text = completion.choices[0]?.message?.content || ''
  return parseScriptSections(text)
}
