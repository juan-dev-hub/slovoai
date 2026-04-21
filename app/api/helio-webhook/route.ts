import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { addCredits, savePago, pagoYaProcesado, isFirstPurchase, activateReferralLink, getUser } from '@/lib/db'

const USER_ID_PATTERN = /^user_[a-zA-Z0-9]+$/

function verifySignature(body: string, signature: string, secret: string): boolean {
  const computed = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return computed === signature.toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('helio-signature') || req.headers.get('x-helio-signature') || ''
    const secret = process.env.HELIO_WEBHOOK_SECRET

    if (secret && signature) {
      if (!verifySignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)

    // Helio sends { event: 'PAYMENT_SUCCESS', transaction: { ... } }
    const isCompleted =
      payload?.event === 'PAYMENT_SUCCESS' ||
      payload?.event === 'payment.completed' ||
      payload?.status === 'SUCCESS'

    if (!isCompleted) {
      return NextResponse.json({ received: true, processed: false, reason: payload?.event })
    }

    const tx = payload?.transaction || payload?.data || payload
    const txId = String(tx?.id || tx?.transactionId || '')
    // custom-data passed in the URL: "userId|credits"
    const customData = String(tx?.customData || tx?.metadata?.customData || payload?.customData || '')
    const amount = Number(tx?.amount || tx?.totalAmount || 0)

    if (!txId || !customData) {
      console.warn('[Helio webhook] Missing txId or customData', payload)
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const [userId, creditsStr] = customData.split('|')
    const credits = Number(creditsStr)

    if (!userId || !USER_ID_PATTERN.test(userId) || !credits || credits < 1) {
      console.warn('[Helio webhook] Invalid customData:', customData)
      return NextResponse.json({ error: 'customData inválido' }, { status: 400 })
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
    console.error('[Helio webhook]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
