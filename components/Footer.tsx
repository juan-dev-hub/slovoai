import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-auto border-t border-white/10 bg-white/[0.02] backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div>
            <span className="text-lg font-black bg-gradient-to-r from-[#00c6ff] to-[#6366f1] bg-clip-text text-transparent">
              SLOVO AI
            </span>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              Genera scripts de ventas de alto impacto con inteligencia artificial.
              Método Alex Hormozi, adaptado a tu producto.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Plataforma</p>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-white/40 text-sm hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/referidos" className="text-white/40 text-sm hover:text-white transition-colors">
                  Programa de referidos
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
            <ul className="space-y-2">
              <li>
                <Link href="/conditions" className="text-white/40 text-sm hover:text-white transition-colors">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/40 text-sm hover:text-white transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="text-white/40 text-sm hover:text-white transition-colors">
                  Política de reembolso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/25 text-xs">
            © {year} SLOVO AI. Todos los derechos reservados.
          </p>
          <p className="text-white/25 text-xs">
            Hecho con IA para vendedores reales.
          </p>
        </div>
      </div>
    </footer>
  )
}
