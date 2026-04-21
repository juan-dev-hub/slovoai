'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { CREDIT_PACKAGES } from '@/lib/utils'

type Provider = 'nowpayments' | 'moonpay' | 'helio'

const PROVIDERS: { id: Provider; label: string; desc: string }[] = [
  { id: 'nowpayments', label: '🪙 Crypto', desc: '+300 criptos' },
  { id: 'moonpay',    label: '💳 Tarjeta',  desc: 'Visa / Mastercard' },
  { id: 'helio',      label: '◎ Solana',   desc: 'USDC / SOL' },
]

interface CreditPackagesProps {
  onSuccess?: () => void
}

export function CreditPackages({ onSuccess }: CreditPackagesProps) {
  const [provider, setProvider] = useState<Provider>('nowpayments')
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function handlePurchase(credits: number) {
    setLoading(credits)
    setError('')
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits, provider }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear el pago')

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No se recibió URL de pago')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Payment method selector */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
        {PROVIDERS.map(p => (
          <button
            key={p.id}
            onClick={() => setProvider(p.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 text-center ${
              provider === p.id
                ? 'bg-white/15 text-white shadow'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <div>{p.label}</div>
            <div className="text-xs opacity-60 mt-0.5">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CREDIT_PACKAGES.map((pkg, idx) => (
          <motion.div
            key={pkg.credits}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card
              className={`p-6 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 ${
                'popular' in pkg && pkg.popular
                  ? 'border-electric/60 bg-electric/10'
                  : ''
              }`}
              hover
              glow={'popular' in pkg && pkg.popular}
            >
              {'popular' in pkg && pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-electric to-deep text-white text-xs font-bold rounded-full">
                    MÁS POPULAR
                  </span>
                </div>
              )}

              <div className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-electric to-aqua bg-clip-text text-transparent">
                  {pkg.credits}
                </div>
                <div className="text-white/70 text-sm font-medium">créditos</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-white">{pkg.priceLabel}</div>
                <div className="text-white/50 text-xs mt-1">
                  ${(pkg.price / pkg.credits).toFixed(2)} por crédito
                </div>
              </div>

              <Button
                onClick={() => handlePurchase(pkg.credits)}
                loading={loading === pkg.credits}
                className="w-full"
                variant={'popular' in pkg && pkg.popular ? 'primary' : 'secondary'}
              >
                Comprar
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-sm text-center p-3 bg-red-500/10 border border-red-400/20 rounded-xl"
        >
          {error}
        </motion.p>
      )}

      <p className="text-white/40 text-xs text-center">
        Pagos seguros. Los créditos se acreditan inmediatamente tras confirmación.
      </p>
    </div>
  )
}
