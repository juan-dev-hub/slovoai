import Link from 'next/link'

export const metadata = { title: 'Política de Reembolso — SLOVO AI' }

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-white/40 hover:text-white/70 transition-colors">
          ← Volver
        </Link>

        <h1 className="text-3xl font-black mt-8 mb-2">Política de Reembolso</h1>
        <p className="text-white/40 text-sm mb-10">Última actualización: abril 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">Política general</h2>
            <p>
              Todos los pagos realizados en SLOVO AI son <strong className="text-white">definitivos y no reembolsables</strong>.
              Al completar una compra de créditos, aceptas expresamente esta política.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Sin reembolsos</h2>
            <p>
              No ofrecemos reembolsos bajo ninguna circunstancia, incluyendo pero no limitado a:
              créditos no utilizados, insatisfacción con el contenido generado, o cambio de opinión
              después de la compra. Los créditos adquiridos no tienen fecha de vencimiento y
              pueden usarse en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Problemas técnicos</h2>
            <p>
              Si un error técnico de nuestra plataforma consumió créditos sin generar un resultado,
              analizaremos el caso y, a nuestra discreción, podremos reponer los créditos afectados.
              Esto no constituye un reembolso monetario. Contáctanos con los detalles del incidente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Contacto</h2>
            <p>
              Para reportar un problema técnico, escríbenos a{' '}
              <span className="text-white">juandevsv503@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
