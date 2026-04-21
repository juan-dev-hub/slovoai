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
  versionHablada: string
  full: string
}

// Matches section headers with or without leading number, bold/markdown variants
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
  return s.replace(/\*\*/g, '').replace(/^[#>*_\-=→]+\s*/, '').trim()
}

function parseScriptSections(text: string): ScriptSections {
  console.log('[Groq raw output]\n', text.slice(0, 500))

  // Split into Version 1 (structured) and Version 2 (spoken)
  const v2Re = /VERSI[OÓ]N\s*2[:\-\s]*/i
  const v2Match = text.search(v2Re)
  const v1Text = v2Match > 0 ? text.slice(0, v2Match) : text
  const versionHablada = v2Match > 0
    ? text.slice(v2Match).replace(v2Re, '').replace(/^VERSI[OÓ]N\s*HABLADA[:\-\s]*/i, '').trim()
    : ''

  const sections: Record<string, string[]> = {}
  let currentKey = ''

  for (const rawLine of v1Text.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    // Skip version headers like "VERSIÓN 1: SCRIPT ESTRUCTURADO"
    if (/VERSI[OÓ]N\s*1/i.test(trimmed)) continue

    const key = keyFromLine(trimmed)
    if (key) {
      currentKey = key
      if (!sections[key]) sections[key] = []
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
    versionHablada,
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

const HYPE_DESC = (n: number) =>
  n <= 3
    ? 'Nivel de hype bajo: sin afirmaciones grandiosas, solo hechos y lógica.'
    : n <= 6
    ? 'Nivel de hype moderado: energía controlada, alguna emoción pero basada en datos.'
    : 'Nivel de hype alto: energía máxima, urgencia real, lenguaje de oportunidad única.'

export async function generateSalesScript(inputs: {
  producto: string
  nicho: string
  problema: string
  resultado: string
  precio: string
  canal: string
  objeciones: string[]
  prueba: string
  garantia: string
  urgencia: string
  tono: string
  nivelHype: number
  tipoCliente: string
}): Promise<ScriptSections> {
  const objecionPrincipal = inputs.objeciones[0] || ''
  const objecionesFormateadas = inputs.objeciones.map((o, i) => `${i + 1}. ${o}`).join('\n')

  const tonoDesc = TONO_DESC[inputs.tono] || TONO_DESC['medio']
  const clienteDesc = CLIENTE_DESC[inputs.tipoCliente] || CLIENTE_DESC['escéptico']
  const hypeDesc = HYPE_DESC(inputs.nivelHype)

  const prompt = `Eres un copywriter de ventas directas. No un asistente. No un marketer.
Alguien que ya cerró ventas reales con este mismo tipo de producto.

Tu única tarea: generar un script que provoque "ok, explícame más."
No "suena bien." No "qué interesante." "Explícame más."

════════════════════════════════════
INPUT DEL USUARIO
════════════════════════════════════

Producto: ${inputs.producto}
Nicho: ${inputs.nicho}
Problema: ${inputs.problema}
Resultado concreto: ${inputs.resultado}
Precio: ${inputs.precio}
Canal: ${inputs.canal}
Objeción principal: ${objecionPrincipal}
Prueba social o dato real: ${inputs.prueba || 'No proporcionada'}
Garantía: ${inputs.garantia || 'No especificada'}
Urgencia o escasez: ${inputs.urgencia || 'No especificada'}

Tono: ${inputs.tono} — ${tonoDesc}
Nivel de hype: ${inputs.nivelHype}/10 — ${hypeDesc}
Tipo de cliente: ${inputs.tipoCliente} — ${clienteDesc}

════════════════════════════════════
ANTES DE ESCRIBIR — ANÁLISIS OBLIGATORIO
════════════════════════════════════

Identifica esto primero (no lo escribas en el output):

1. ¿Cuál es el dolor real, no el superficial?
2. ¿Qué creencia falsa tiene el cliente que le impide comprar?
3. ¿Qué hace este producto diferente en mecanismo, no en promesa?
4. ¿Qué dato del INPUT es el más creíble y específico?

Si el INPUT no tiene datos reales en Prueba social:
→ Usa lógica causal. No inventes números.

════════════════════════════════════
ESTRUCTURA DEL SCRIPT
════════════════════════════════════

1. GANCHO
- Ataca una creencia falsa o resultado pobre
- Debe ser incómodo o confrontativo
- Máximo 3 líneas

2. PROBLEMA
- Explica por qué está fallando realmente
- Rompe la excusa más común del nicho
- 3 a 5 líneas cortas

3. SOLUCIÓN
- Explica el mecanismo del producto
- Sin buzzwords. Sin hype.
- 3 a 5 líneas

4. PRUEBA
- Usa la prueba social del input si existe
- Si es número, úsalo exacto
- Si es testimonio, úsalo con nombre y resultado
- Si no hay nada, usa lógica: "si X entonces Y"
- 2 a 4 líneas

5. OFERTA
- Precio exacto: ${inputs.precio}
- Incluye garantía si existe: ${inputs.garantia || 'ninguna'}
- 2 a 3 líneas

6. CIERRE
- Directo. Sin emoción falsa.
- Usa urgencia si existe: ${inputs.urgencia || 'ninguna'}
- Máximo 2 líneas

7. OBJECIONES
- Una respuesta por objeción
- Máximo 2 líneas cada una
- Empieza con la objeción principal del input
- Agrega respuestas para estas objeciones:
${objecionesFormateadas}

════════════════════════════════════
REGLAS DE ESCRITURA — NO NEGOCIABLES
════════════════════════════════════

FORMATO:
- Cada línea: máximo 12 palabras
- Máximo 5 líneas por sección
- Sin párrafos. Sin bloques largos.
- Saltos de línea constantes.
- Títulos numerados exactos (1. GANCHO, 2. PROBLEMA, etc.)
- Sin emojis

TONO:
- Directo
- Seguro
- Como alguien que ya vendió esto antes
- Sin introducciones tipo "oye", "mira", "escucha"
- Sin lenguaje emocional genérico

PROHIBIDO escribir:
- "no es una promesa"
- "tenemos clientes satisfechos"
- "solución innovadora"
- "científicamente probado"
- Cualquier frase que cualquier marketer diría

════════════════════════════════════
VALIDACIÓN — OBLIGATORIA ANTES DE ENTREGAR
════════════════════════════════════

Revisa línea por línea:

¿Alguna línea tiene más de 12 palabras? → Recórtala.
¿Hay frases genéricas? → Elimínalas o reescríbelas.
¿Suena como IA o marketer? → Hazlo más específico.
¿Hay párrafos? → Divídelos.
¿Cada sección se lee en menos de 3 segundos? → Si no, simplifica.

SI NO CUMPLE TODO → NO ENTREGUES → REESCRIBE.

════════════════════════════════════
OUTPUT FINAL — DOS VERSIONES
════════════════════════════════════

Escribe exactamente en este formato:

VERSIÓN 1: SCRIPT ESTRUCTURADO

1. GANCHO
[contenido]

2. PROBLEMA
[contenido]

3. SOLUCIÓN
[contenido]

4. PRUEBA
[contenido]

5. OFERTA
[contenido]

6. CIERRE
[contenido]

7. OBJECIONES
[contenido]

VERSIÓN 2: VERSIÓN HABLADA
→ El mismo mensaje convertido a lenguaje real de conversación
→ Como si lo dijeras hablando con alguien, en ${inputs.canal}
→ Puede tener muletillas naturales del nicho
→ No perfecto. No copywriter. Humano.
→ El usuario debe poder leerlo y decir: "yo sí diría esto"`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 4500,
  })

  const text = completion.choices[0]?.message?.content || ''
  return parseScriptSections(text)
}
