'use client'
import { useEffect, useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { ParticleBackground } from '@/components/ParticleBackground'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CREDIT_PACKAGES } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
}

const FEATURES = [
  { emoji: '⚡', title: 'Scripts en segundos', desc: 'La IA genera tu script de ventas completo en menos de 30 segundos.' },
  { emoji: '🎯', title: '7 secciones estratégicas', desc: 'Gancho, Problema, Solución, Prueba, Oferta, Cierre y Manejo de Objeción.' },
  { emoji: '📥', title: 'PDF descargable', desc: 'Descarga tu script en PDF listo para usar. Redescargas gratis para siempre.' },
  { emoji: '🔗', title: 'Programa de referidos', desc: 'Comparte tu link y gana 20% en créditos cada vez que alguien compra.' },
]

const TESTIMONIALS = [
  { name: 'Carlos M.', role: 'Consultor de negocios', text: 'Cerré 3 clientes nuevos la primera semana usando el script. El gancho es brutal.' },
  { name: 'Ana P.', role: 'Coach de ventas', text: 'Mis alumnos quedaron impactados. El script tiene la estructura exacta que yo enseño.' },
  { name: 'Diego F.', role: 'Agencia de marketing', text: 'Lo uso para cada cliente nuevo. En serio, los scripts cierran solos.' },
]

const TYPEWRITER_LINES = [
  '¿Cansado de que tus mensajes y llamadas de ventas no cierren?',
  'Imagina esto: en exactamente 30 segundos tu herramienta te entrega un script tan potente que…',
  '✓ Tus prospectos dejan de poner objeciones',
  '✓ Empiezan a venderse ellos mismos',
  '✓ Te preguntan "¿cómo seguimos?" o "¿dónde firmo?"',
  'Sin escribirlo tú. Sin probar durante semanas.',
  'Sin seguir sonando como todos los demás.',
  'Mientras tú usas scripts mediocres… tus competidores ya cierran más deals.',
  'Cada día sin esta ventaja estás dejando dinero sobre la mesa.',
  '¿Vas a seguir perdiendo ventas… o vas a cerrar más clientes hoy mismo?',
]

function TypewriterLines() {
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [currentLineIdx, setCurrentLineIdx] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    if (currentLineIdx >= TYPEWRITER_LINES.length) {
      setDone(true)
      return
    }

    const line = TYPEWRITER_LINES[currentLineIdx]

    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setCurrentText(line.slice(0, charIdx + 1))
        setCharIdx(c => c + 1)
      }, 28)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setVisibleLines(prev => {
          const next = [...prev, line]
          return next.slice(-2)
        })
        setCurrentText('')
        setCharIdx(0)
        setCurrentLineIdx(i => i + 1)
      }, 600)
      return () => clearTimeout(t)
    }
  }, [charIdx, currentLineIdx, done])

  return (
    <div className="min-h-[96px] flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <AnimatePresence mode="popLayout">
        {visibleLines.map((line, i) => (
          <motion.p
            key={`${currentLineIdx}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: i === visibleLines.length - 1 ? 0.6 : 0.35, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-white text-sm md:text-base text-center leading-relaxed"
          >
            {line}
          </motion.p>
        ))}
      </AnimatePresence>
      {!done && currentText && (
        <p className="text-white/90 text-sm md:text-base text-center leading-relaxed">
          {currentText}
          <span className="inline-block w-0.5 h-4 bg-electric ml-0.5 animate-pulse align-middle" />
        </p>
      )}
    </div>
  )
}

function RefCapture() {
  const params = useSearchParams()
  useEffect(() => {
    const ref = params.get('ref')
    if (ref) localStorage.setItem('referral_code', ref)
  }, [params])
  return null
}

export default function LandingPage() {

  return (
    <div className="relative min-h-screen bg-bg overflow-hidden">
      <ParticleBackground />

      <Suspense fallback={null}><RefCapture /></Suspense>
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-electric/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-deep/10 blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image src="/logo.png" alt="SLOVO AI" fill className="object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-electric to-aqua bg-clip-text text-transparent">SLOVO AI</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <Link href="/conditions" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200">Términos</Link>
              <Link href="/privacy"    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200">Privacidad</Link>
              <Link href="/refunds"    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200">Reembolsos</Link>
            </div>

            <div className="flex items-center gap-3">
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="sm">Ir al Dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="sm" variant="secondary">Iniciar sesión</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Comenzar gratis</Button>
                </SignUpButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-24 pb-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-electric/10 border border-electric/30 text-electric text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-electric animate-pulse" />
          Powered by Gemini 2.0 Flash
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-4xl md:text-6xl font-black text-white leading-tight max-w-4xl mb-8"
        >
          Deja de perder ventas por scripts que suenan{' '}
          <span className="text-gradient">débiles o desesperados…</span>
          <br />
          <span className="text-2xl md:text-3xl font-bold text-white/80 block mt-4 leading-snug">
            En los próximos 30 segundos vas a tener un script de ventas tan persuasivo que tus prospectos van a{' '}
            <span className="text-electric">convencerse solos de comprar…</span>
          </span>
          <span className="text-xl md:text-2xl font-semibold text-aqua block mt-3">
            Pero solo si actúas ahora mismo.
          </span>
        </motion.h1>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="w-full max-w-2xl mb-10"
        >
          <TypewriterLines />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg">
                → Genera tu primer script imparable ahora
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg">
                → Genera tu script ahora
              </Button>
            </Link>
          </SignedIn>
          <p className="text-white/40 text-sm">Acceso de prueba limitado — se acaba cuando se llene el cupo de hoy</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          {[
            { num: '500+', label: 'Scripts generados' },
            { num: '93%', label: 'Tasa de cierre mejorada' },
            { num: '30s', label: 'Tiempo de generación' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-3xl font-black text-gradient">{stat.num}</div>
              <div className="text-white/50 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Todo lo que necesitas para vender</h2>
            <p className="text-white/50 text-lg">Diseñado para cerrar más, con menos esfuerzo.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full" hover glow>
                  <div className="text-4xl mb-4">{feat.emoji}</div>
                  <h3 className="text-white font-bold mb-2">{feat.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{feat.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Así de simple</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { step: '01', title: 'Regístrate gratis', desc: 'Crea tu cuenta en segundos. Recibes 1 crédito gratis de bienvenida.' },
              { step: '02', title: 'Llena los 7 campos', desc: 'Producto, nicho, problema, resultado, precio, canal y objeción principal.' },
              { step: '03', title: 'Ve el preview gratis', desc: 'El gancho y el problema aparecen de inmediato, sin costo.' },
              { step: '04', title: 'Desbloquea el script completo', desc: 'Usa 1 crédito para ver las 7 secciones y descargar tu PDF.' },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 flex items-start gap-6" hover>
                  <div className="text-4xl font-black text-gradient shrink-0">{item.step}</div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/55 text-sm">{item.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-4 py-24" id="precios">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Precios simples</h2>
            <p className="text-white/50 text-lg">Paga solo lo que necesitas. Sin suscripciones.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREDIT_PACKAGES.map((pkg, idx) => (
              <motion.div
                key={pkg.credits}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                {'popular' in pkg && pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-electric to-deep text-white text-xs font-bold rounded-full shadow-lg shadow-electric/30">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                <Card
                  className={`p-8 text-center h-full ${
                    'popular' in pkg && pkg.popular ? 'border-electric/50 bg-electric/5' : ''
                  }`}
                  hover
                  glow={'popular' in pkg && pkg.popular}
                >
                  <div className="text-5xl font-black text-gradient mb-2">{pkg.credits}</div>
                  <div className="text-white/60 mb-4">créditos</div>
                  <div className="text-3xl font-bold text-white mb-1">{pkg.priceLabel}</div>
                  <div className="text-white/40 text-sm mb-6">${(pkg.price / pkg.credits).toFixed(2)} por script</div>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <Button className="w-full" variant={'popular' in pkg && pkg.popular ? 'primary' : 'secondary'}>
                        Comprar
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard">
                      <Button className="w-full" variant={'popular' in pkg && pkg.popular ? 'primary' : 'secondary'}>
                        Comprar
                      </Button>
                    </Link>
                  </SignedIn>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Resultados reales</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 h-full" hover>
                  <p className="text-white/80 text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0 }}
          >
            <Card className="p-12" glow>
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-4xl font-bold text-white mb-4">
                ¿Listo para cerrar más ventas?
              </h2>
              <p className="text-white/60 mb-8 text-lg">
                Empieza hoy con 1 crédito gratis. Sin tarjeta de crédito.
              </p>
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg">
                    Crear cuenta gratis ahora →
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg">Ir al Dashboard →</Button>
                </Link>
              </SignedIn>
            </Card>
          </motion.div>
        </div>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
