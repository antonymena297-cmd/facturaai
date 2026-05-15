import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = { title: 'FacturaAI — Validación Inteligente', description: 'Sistema de validación de facturas con IA' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body className={inter.className} style={{ margin:0, background:'#f8fafc' }}>{children}</body></html>
}
