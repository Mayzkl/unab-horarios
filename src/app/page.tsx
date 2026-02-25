'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'
import LoginForm from '@/components/LoginForm'

export default function Page() {
    const [user, setUser] = useState<null | object>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Verificamos si hay sesión activa al cargar
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Escuchamos cambios en tiempo real (login / logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    // Mientras verificamos la sesión, no mostramos nada
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <p className="text-zinc-500">Cargando...</p>
        </div>
    )

    // Si no hay usuario → Login
    if (!user) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <LoginForm />
        </div>
    )

    // Si hay usuario → App
    return <AppShell />
}