'use client'
import { motion } from 'framer-motion'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from './ui/Button'

interface NavbarProps {
  credits?: number
}

export function Navbar({ credits }: NavbarProps) {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/referidos', label: 'Referidos' },
  ]

  const legalLinks = [
    { href: '/conditions', label: 'Términos' },
    { href: '/privacy', label: 'Privacidad' },
    { href: '/refunds', label: 'Reembolsos' },
  ]

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mt-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 flex items-center justify-between shadow-lg shadow-black/20">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.png"
                alt="SLOVO AI"
                fill
                className="object-contain"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement
                  t.style.display = 'none'
                }}
              />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-electric to-aqua bg-clip-text text-transparent">
              SLOVO AI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <SignedIn>
              {links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </SignedIn>

            <div className="w-px h-4 bg-white/20 mx-2" />

            {legalLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                  pathname === link.href
                    ? 'text-white/80'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <SignedIn>
              {credits !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-electric/20 to-deep/20 border border-electric/30 rounded-xl"
                >
                  <svg className="w-4 h-4 text-electric" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.77 9.77 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.960.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                  </svg>
                  <span className="text-sm font-bold text-white">{credits}</span>
                </motion.div>
              )}
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="sm">Iniciar sesión</Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
