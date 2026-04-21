import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { addCredits, savePago, pagoYaProcesado, isFirstPurchase, activateReferralLink, getUser } from '@/lib/db'

const USER_ID_PATTERN = /^user_[a-zA-Z0-9]+$/

function verifySignature(body: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac('sha256', secret).update(body).digest('base64')
  return computed === signature
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('moonpay-signature') || ''
    const secret = process.env.MOONPAY_WEBHOOK_SECRET

    if (secret && signature) {
      if (!verifySignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)

    // MoonPay sends { type: 'transaction_completed', data: { ... } }
    const txData = payload?.data || payload
    const status = txData?.status || payload?.type

    const isCompleted =
      status === 'completed' ||
      payload?.type === 'transaction_completed'

    if (!isCompleted) {
      return NextResponse.json({ received: true, processed: false, reason: status })
    }

    const txId = String(txData?.id || '')
    const orderId = String(txData?.externalTransactionId || '')
    const amount = Number(txData?.baseCurrencyAmount || txData?.quoteCurrencyAmount || 0)

    if (!txId || !orderId) {
      return NextResponse.json({ error: 'Datos de transacción inválidos' }, { status: 400 })
    }

    const [userId, creditsStr] = orderId.split('|')
    const credits = Number(creditsStr)

    if (!userId || !USER_ID_PATTERN.test(userId) || !credits || credits < 1) {
      console.warn('[MoonPay webhook] Invalid orderId:', orderId)
      return NextResponse.json({ error: 'Order ID inválido' }, { status: 400 })
    }

    if (await pagoYaProcesado(txId)) {
      return NextResponse.json({ received: true, processed: false, reason: 'duplicate' })
    }

    const firstPurchase = await isFirstPurchase(userId)

    await savePago({ usuarioId: userId, wompiIdTransaccion: txId, creditosComprados: credits, monto: amount })
    await addCredits(userId, credits)

    if (firstPurchase) await activateReferralLink(userId)

    const user = await getUser(userId)
    if (user?.referido_por) {
      await addCredits(user.referido_por, Math.ceil(credits * 0.2))
    }

    return NextResponse.json({ received: true, processed: true })
  } catch (err) {
    console.error('[MoonPay webhook]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
