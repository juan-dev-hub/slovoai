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

  const prompt = `Eres un vendedor de élite y copywriter estilo Alex Hormozi. Tu trabajo es escribir scripts de venta reales, persuasivos y completamente personalizados con la información del usuario.

DATOS DEL PRODUCTO (ÚSALOS EN CADA SECCIÓN — NO INVENTES NI GENERALICES):
- Producto: ${inputs.producto}
- Cliente ideal: ${inputs.nicho}
- Problema que resuelve: ${inputs.problema}
- Resultado concreto: ${inputs.resultado}
- Precio: ${inputs.precio}
- Canal: ${inputs.canal}

PARÁMETROS DE ESTILO:
- Tono: ${inputs.tono} — ${tonoDesc}
- Nivel de hype ${inputs.nivelHype}/10: ${hypeNote}
- Tipo de cliente: ${inputs.tipoCliente} — ${clienteDesc}

REGLAS DE ESCRITURA:
- Cada línea completa una idea. No cortes ideas a la mitad.
- Escribe oraciones reales, no listas de 2 palabras.
- Usa el nombre del producto, el nicho y el resultado específico en cada sección.
- Nada genérico. Si algo puede aplicar a cualquier producto, reescríbelo con los datos reales.
- Tono directo, conversacional, como si lo dijera un vendedor top en ${inputs.canal}.
- No uses emojis, no uses asteriscos, no uses markdown.

ESTRUCTURA (escribe cada sección con al menos 4-6 líneas de contenido real):

1. GANCHO
Empieza con una pregunta incómoda o una afirmación que confronte al cliente ideal (${inputs.nicho}) directamente.
Ataca la creencia falsa que tiene sobre ${inputs.problema}.
Haz que sienta que lo que ha estado haciendo está mal o es ineficiente.

2. PROBLEMA
Explica con detalle por qué ${inputs.nicho} sigue teniendo el problema a pesar de haber intentado otras cosas.
Habla del dolor real de no resolver ${inputs.problema}.
Sé específico sobre las consecuencias de no actuar.

3. SOLUCIÓN
Explica cómo ${inputs.producto} resuelve ${inputs.problema} de manera concreta.
Describe el mecanismo real: qué hace diferente, cómo funciona, por qué funciona donde otros fallan.
No uses términos vacíos. Di exactamente qué ocurre cuando el cliente usa ${inputs.producto}.

4. PRUEBA
Presenta evidencia lógica o ejemplos creíbles de que ${inputs.producto} entrega ${inputs.resultado}.
Si no tienes casos reales, usa lógica de causa-efecto concreta.
Conecta el mecanismo de la solución con el resultado prometido.

5. OFERTA
El precio es ${inputs.precio}. Justifica ese precio en función del valor de obtener ${inputs.resultado}.
Compara el costo de NO resolver ${inputs.problema} vs. invertir en ${inputs.producto}.
Si aplica, menciona condición de urgencia o garantía.

6. CIERRE
Dile al cliente exactamente qué hacer ahora mismo a través de ${inputs.canal}.
Una sola instrucción clara. Sin rodeos, sin emoción falsa.

7. OBJECIONES
Para cada objeción, escribe una respuesta directa que no pida disculpas ni explique de más.
Luego un remate que regrese al cliente al sí.
Formato exacto:

[Objeción]: <texto de la objeción>
Respuesta: <respuesta directa de 1-2 oraciones usando el producto y resultado>
Remate: <una línea que vuelva a enfocar al cliente en el resultado>

Objeciones a responder:
${objecionesFormateadas}

---
Escribe el script completo ahora. Usa los datos reales del producto en cada sección. No escribas placeholders ni frases genéricas.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 4000,
  })

  const text = completion.choices[0]?.message?.content || ''
  return parseScriptSections(text)
}
