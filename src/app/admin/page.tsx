'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'v.dazjorquera@uandresbello.edu' // tu correo

type Review = {
    id: string
    professor_id: string
    comentario: string
    status: string
    moderation_note: string
    created_at: string
    puntualidad: number
    claridad: number
    exigencia: number
    disposicion: number
    metodologia: number
    professors: { name: string }
}

export default function AdminPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.email !== ADMIN_EMAIL) {
                router.push('/')
                return
            }
            loadPendingReviews()
        })
    }, [])

    async function loadPendingReviews() {
        const { data } = await supabase
            .from('reviews')
            .select('*, professors(name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        setReviews(data ?? [])
        setLoading(false)
    }

    async function updateStatus(id: string, status: 'approved' | 'rejected') {
        await supabase.from('reviews').update({ status }).eq('id', id)
        setReviews(prev => prev.filter(r => r.id !== id))
    }

    if (loading) return <div className="p-8">Cargando...</div>

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Panel de moderación</h1>

            {reviews.length === 0 ? (
                <p className="text-zinc-500">No hay reseñas pendientes 🎉</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map(r => (
                        <div key={r.id} className="border rounded-2xl p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold">{r.professors?.name}</p>
                                    <p className="text-xs text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                    pendiente
                                </span>
                            </div>

                            <div className="grid grid-cols-5 gap-2 text-xs text-zinc-600 mb-3">
                                <div>Puntualidad: {r.puntualidad}</div>
                                <div>Claridad: {r.claridad}</div>
                                <div>Exigencia: {r.exigencia}</div>
                                <div>Disposición: {r.disposicion}</div>
                                <div>Metodología: {r.metodologia}</div>
                            </div>

                            {r.comentario && (
                                <p className="text-sm bg-zinc-50 rounded-xl p-3 mb-3">"{r.comentario}"</p>
                            )}

                            {r.moderation_note && (
                                <p className="text-xs text-yellow-600 mb-3">⚠ {r.moderation_note}</p>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateStatus(r.id, 'approved')}
                                    className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-green-700"
                                >
                                    ✓ Aprobar
                                </button>
                                <button
                                    onClick={() => updateStatus(r.id, 'rejected')}
                                    className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-600"
                                >
                                    ✕ Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}