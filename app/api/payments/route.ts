import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_PACKAGES } from '@/lib/utils'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`pay:${userId}`, RATE_LIMITS.payments)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

  try {
    const { credits } = await req.json()
    const pkg = CREDIT_PACKAGES.find(p => p.credits === credits)
    if (!pkg) return NextResponse.json({ error: 'Paquete inválido' }, { status: 400 })

    const appId = process.env.WOMPI_APP_ID!
    const apiSecret = process.env.WOMPI_API_SECRET!
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const reference = `${userId}-${credits}-${Date.now()}`

    // Wompi El Salvador — crear enlace de pago via API REST
    const wompiResponse = await fetch('https://api.wompi.sv/EnlacePago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Buffer.from(`${appId}:${apiSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        NombreProducto: `${pkg.credits} Créditos — SLOVO AI`,
        Descripcion: `Paquete de ${pkg.credits} créditos para generar scripts de ventas`,
        Cantidad: 1,
        Monto: pkg.price,
        Referencia: reference,
        UrlRetorno: `${appUrl}/dashboard?payment=success`,
        UrlWebhook: `${appUrl}/api/wompi-webhook`,
        EsMontoEditable: false,
        EsCantidadEditable: false,
        MetaData: JSON.stringify({ userId, credits: pkg.credits }),
      }),
    })

    if (!wompiResponse.ok) {
      const errText = await wompiResponse.text()
      console.error('Wompi error:', wompiResponse.status, errText)

      // Fallback: construir URL de checkout directamente con query params
      const checkoutUrl = buildWompiCheckoutUrl({ appId, pkg, reference, appUrl, userId })
      return NextResponse.json({ checkoutUrl, reference })
    }

    const data = await wompiResponse.json()
    const checkoutUrl =
      data?.Data?.Url ||
      data?.Data?.url ||
      data?.url ||
      data?.checkout_url ||
      buildWompiCheckoutUrl({ appId, pkg, reference, appUrl, userId })

    return NextResponse.json({ checkoutUrl, reference })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
  }
}

function buildWompiCheckoutUrl(params: {
  appId: string
  pkg: { price: number; credits: number; label: string }
  reference: string
  appUrl: string
  userId: string
}) {
  const { appId, pkg, reference, appUrl, userId } = params
  const base = 'https://checkout.wompi.sv/p/'
  const search = new URLSearchParams({
    'public-key': appId,
    currency: 'USD',
    'amount-in-cents': String(pkg.price * 100),
    reference,
    'redirect-url': `${appUrl}/dashboard?payment=success`,
  })
  return `${base}?${search.toString()}`
}
