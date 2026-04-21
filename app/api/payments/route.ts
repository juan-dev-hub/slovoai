import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_PACKAGES } from '@/lib/utils'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import crypto from 'crypto'

type Provider = 'nowpayments' | 'moonpay' | 'helio'

function buildNowPaymentsUrl(pkg: typeof CREDIT_PACKAGES[number], userId: string, appUrl: string) {
  const orderId = `${userId}|${pkg.credits}|${Date.now()}`
  return fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.NOWPAYMENTS_API_KEY! },
    body: JSON.stringify({
      price_amount: pkg.price,
      price_currency: 'usd',
      order_id: orderId,
      order_description: `${pkg.credits} Créditos — SLOVO AI`,
      ipn_callback_url: `${appUrl}/api/nowpayments-webhook`,
      success_url: `${appUrl}/dashboard?payment=success`,
      cancel_url: `${appUrl}/dashboard?payment=cancelled`,
      is_fixed_rate: false,
      is_fee_paid_by_user: false,
    }),
  })
    .then(r => r.json())
    .then(data => {
      if (!data.invoice_url) throw new Error('NowPayments no retornó URL')
      return data.invoice_url as string
    })
}

function buildMoonPayUrl(pkg: typeof CREDIT_PACKAGES[number], userId: string, appUrl: string) {
  const pubKey = process.env.MOONPAY_PUBLISHABLE_KEY!
  const secretKey = process.env.MOONPAY_SECRET_KEY!
  const orderId = `${userId}|${pkg.credits}|${Date.now()}`

  const params = new URLSearchParams({
    apiKey: pubKey,
    currencyCode: 'usdc_sol',
    baseCurrencyAmount: String(pkg.price),
    externalTransactionId: orderId,
    redirectURL: `${appUrl}/dashboard?payment=success`,
    walletAddress: process.env.MOONPAY_WALLET_ADDRESS || '',
  })

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`?${params.toString()}`)
    .digest('base64')

  params.append('signature', signature)
  return `https://buy.moonpay.com?${params.toString()}`
}

function buildHelioUrl(pkg: typeof CREDIT_PACKAGES[number], userId: string, appUrl: string) {
  const paylinkId = process.env.HELIO_PAYLINK_ID!
  const params = new URLSearchParams({
    amount: String(pkg.price),
    'custom-data': `${userId}|${pkg.credits}`,
    redirectUrl: `${appUrl}/dashboard?payment=success`,
    cancelUrl: `${appUrl}/dashboard?payment=cancelled`,
  })
  return `https://app.hel.io/pay/${paylinkId}?${params.toString()}`
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`pay:${userId}`, RATE_LIMITS.payments)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

  try {
    const { credits, provider = 'nowpayments' } = await req.json() as { credits: number; provider?: Provider }
    const pkg = CREDIT_PACKAGES.find(p => p.credits === credits)
    if (!pkg) return NextResponse.json({ error: 'Paquete inválido' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    let checkoutUrl: string

    if (provider === 'moonpay') {
      checkoutUrl = buildMoonPayUrl(pkg, userId, appUrl)
    } else if (provider === 'helio') {
      checkoutUrl = buildHelioUrl(pkg, userId, appUrl)
    } else {
      checkoutUrl = await buildNowPaymentsUrl(pkg, userId, appUrl)
    }

    return NextResponse.json({ checkoutUrl })
  } catch (err) {
    console.error('[Payments]', err)
    return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
  }
}
