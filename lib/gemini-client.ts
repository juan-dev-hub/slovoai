import { GoogleGenAI } from '@google/genai'

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
const HEADER_RE = /^[#*>\s_]*(?:\d+[.):\-]\s*)?[*_]*(GANCHO|PROBLEMA|SOLUC[IÍ][OÓ]N|PRUEBA|OFERTA|CIERRE|OBJECIONES|MANEJO\s+(?:DE\s+)?OBJECCI[OÓ]N)[*_\s]*:?$/i

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
  console.log('[Gemini raw output]\n', text.slice(0, 500))

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

  const prompt = `Eres Jordan Belfort entrenando a un vendedor real. Genera un script usando el sistema Straight Line Persuasion.

REGLAS ABSOLUTAS — SIN EXCEPCIONES:
- Certeza absoluta en cada línea. CERO palabras de duda: nunca "podría", "quizás", "tal vez", "puede que".
- El vendedor es el experto más confiable del mercado. Siempre.
- PROHIBIDO validar que un competidor, empresa o industria es estafa, fraude, timo o algo negativo. Eso destruye credibilidad. Siempre reencuadra hacia lo que el producto SÍ hace.
- NUNCA empieces una respuesta de objeción diciendo que algo externo es malo o ilegal.
- Cada sección cumple un propósito de persuasión exacto. No lo mezcles.

Producto: ${inputs.producto}
Nicho: ${inputs.nicho}
Problema: ${inputs.problema}
Resultado concreto: ${inputs.resultado}
Precio: ${inputs.precio}
Prueba social: ${inputs.prueba || 'No proporcionada'}
Garantía: ${inputs.garantia || 'No especificada'}
Escasez: ${inputs.urgencia || 'No especificada'}
Objeciones a manejar:
${objecionesFormateadas}

GENERA EL SCRIPT EXACTAMENTE CON ESTOS ENCABEZADOS Y EN ESTE ORDEN:

1. GANCHO
Rapport y diagnóstico: escribe exactamente 3 preguntas para hacerle al prospecto, en este orden:
Pregunta 1: qué usa actualmente para resolver el problema (neutral, solo diagnóstico)
Pregunta 2: qué tan bien le funciona (para que confiese que su solución actual falla)
Pregunta 3: cuánto tiempo lleva con ese problema sin resolverlo (convierte el dolor en urgencia)

2. PROBLEMA
Apertura: toma el control inmediatamente después del rapport. El prospecto acaba de confesarte su dolor. Entra directo con certeza absoluta. Di exactamente cómo el producto resuelve lo que el prospecto acaba de admitir. 2-3 frases. Sin "bueno", sin introducción. Directo al grano.

3. SOLUCIÓN
Presentación en línea recta: 3 a 5 frases. Cada frase elimina una duda específica y construye certeza. Solo habla del mecanismo del producto y el resultado concreto. Usa solo verbos de certeza: "hace", "entrega", "garantiza", "produce". CERO "podría".

4. PRUEBA
Certeza total en 3 niveles:
(1) Certeza sobre el producto: usa la prueba social o dato real. Si no hay dato, usa lógica causal. No inventes números.
(2) Certeza sobre el vendedor/empresa: razón concreta para confiar.
(3) Umbral de acción bajo: hazlo fácil de decir sí. Sin riesgo aparente.

5. OFERTA
Precio exacto. Garantía si existe. Beneficio concreto de decidir ahora. 2-3 frases. Solo hechos, sin adjetivos vacíos.

6. CIERRE
Cierre duro: asume la venta. No preguntes si quieren comprar. Da instrucciones del siguiente paso como si la decisión ya estuviera tomada. Máximo 2 frases. Incluye escasez si existe.

7. OBJECIONES
Loop de objeción para cada objeción del input.
Formato por objeción: [La objeción] → Reconoce brevemente la preocupación → Reencuadra hacia el beneficio real → Vuelve a la línea con certeza absoluta.
REGLA CRÍTICA: NUNCA digas que un competidor es malo, estafa, timo, o ilegal. Solo di qué hace este producto de forma diferente y mejor. El reencuadre es siempre positivo.

VERSIÓN 2: VERSIÓN HABLADA
El script completo en lenguaje conversacional real. Como si estuvieras en una llamada o cara a cara. Fluido, con pausas marcadas con [pausa]. Incluye las 3 preguntas de rapport, apertura, presentación, prueba, manejo de cada objeción y cierre duro. El vendedor debe poder leerlo y decir: "así es exactamente como yo hablaría."`

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 4500,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    },
  })

  const text = response.text ?? ''
  return parseScriptSections(text)
}
