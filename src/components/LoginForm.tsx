'use client'

import { useState } from "react"
import { supabase } from "@/lib/supabase"    

export default function LoginForm() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')

        //Validar el dominio antes de llamar a supabase
        const domain = email.split('@')[1]
        if (domain !== 'uandresbello.edu') {
            setError('Solo puedes ingresar con tu correo universitario')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })

        if (error) {
            setError('Ocurrió un error. Intenta de nuevo.')
        } else {
            setMessage('Revisa tu correo, te enviamos un  link para ingresar.')
        }
        
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto mt-10 p-6 border rounded-xl">
            <h2 className="text-xl font-bold">Ingresa a UNAB Horarios</h2>
            <p className="text-sm text-gray-500">Solo para estudiantes con correo @uandresbello.edu</p>

            <input
                type="email"
                placeholder="tucorreo@uandresbello.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded px-3 py-2"
                required
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}

            <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50 hover:bg-blue-700"
            >
                {loading ? 'Enviando...' : 'Enviar link de acceso'}
            </button>
        </form>
        )
}