'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getProfessorByName, getProfessorReviews } from '@/lib/profesores'

type Review = {
    puntualidad: number
    claridad: number
    exigencia: number
    disposicion: number
    metodologia: number
    comentario: string | null
    created_at: string
}

type Props = {
    professorName: string
}

const CRITERIOS = [
    { key: 'puntualidad', label: 'Puntualidad' },
    { key: 'claridad', label: 'Claridad' },
    { key: 'exigencia', label: 'Exigencia' },
    { key: 'disposicion', label: 'Disposición' },
    { key: 'metodologia', label: 'Metodología' },
] as const

function StarSelector({ value, onChange }: { value: number, onChange: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className={`text-xl ${star <= value ? 'text-yellow-400' : 'text-zinc-300'}`}
                >
                    ★
                </button>
            ))}
        </div>
    )
}

function AverageBar({ label, value, count }: { label: string, value: number, count: number }) {
    const pct = count > 0 ? (value / 5) * 100 : 0
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="w-24 text-zinc-600">{label}</span>
            <div className="flex-1 bg-zinc-100 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right font-medium">
                {count > 0 ? value.toFixed(1) : '-'}
            </span>
        </div>
    )
}

export default function ProfessorRating({ professorName }: Props) {
    const [open, setOpen] = useState(false)
    const [reviews, setReviews] = useState<Review[]>([])
    const [professorId, setProfessorId] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [alreadyReviewed, setAlreadyReviewed] = useState(false)

    // Form state
    const [form, setForm] = useState({
        puntualidad: 0,
        claridad: 0,
        exigencia: 0,
        disposicion: 0,
        metodologia: 0,
        comentario: ''
    })

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })
    }, [])

    async function loadData() {
        const prof = await getProfessorByName(professorName)
        if (!prof) return
        setProfessorId(prof.id)

        const data = await getProfessorReviews(prof.id)
        setReviews(data ?? [])

        // Verificar si el usuario ya calificó
        if (user) {
            const { data: existing } = await supabase
                .from('reviews')
                .select('id')
                .eq('professor_id', prof.id)
                .eq('user_id', user.id)
                .single()
            setAlreadyReviewed(!!existing)
        }
    }

    function handleOpen() {
        setOpen(true)
        loadData()
    }

    async function handleSubmit() {
        if (!professorId || !user) return
        if (Object.values(form).slice(0, 5).some(v => v === 0)) {
            alert('Por favor califica todos los criterios')
            return
        }

    setLoading(true)
    const { error } = await supabase.from('reviews').insert({
        professor_id: professorId,
        user_id: user.id,
        ...form
    })

    if (error) {
        alert('Error al guardar la reseña')
    } else {
        setSubmitted(true)
        loadData()
    }
    setLoading(false)
    }

    // Calcular promedios
    const averages = CRITERIOS.reduce((acc, c) => {
        const vals = reviews.map(r => r[c.key]).filter(Boolean)
        acc[c.key] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        return acc
    }, {} as Record<string, number>)

    return (
        <>
            <button
                onClick={handleOpen}
                className="text-xs text-yellow-500 hover:text-yellow-600 font-medium"
                title="Ver calificaciones"
            >
                ★ ver notas
            </button>

            {open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{professorName}</h3>
                                <p className="text-zinc-500 text-sm">{reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-xl">✕</button>
                        </div>

                        {/* Promedios */}
                        <div className="space-y-2 mb-6">
                            {CRITERIOS.map(c => (
                                <AverageBar key={c.key} label={c.label} value={averages[c.key]} count={reviews.length} />
                            ))}
                        </div>

                        {/* Comentarios */}
                        {reviews.filter(r => r.comentario).length > 0 && (
                            <div className="mb-6">
                                <p className="text-sm font-semibold mb-2 text-zinc-700">Comentarios</p>
                                <div className="space-y-2">
                                    {reviews.filter(r => r.comentario).map((r, i) => (
                                        <div key={i} className="bg-zinc-50 rounded-xl p-3 text-sm text-zinc-600">
                                            {r.comentario}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Formulario */}
                        {!user && (
                            <p className="text-sm text-zinc-500 text-center py-2">
                                Inicia sesión para dejar una reseña
                            </p>
                        )}

                        {user && alreadyReviewed && !submitted && (
                            <p className="text-sm text-green-600 text-center py-2">
                                ✓ Ya calificaste a este profesor
                            </p>
                        )}

                        {user && !alreadyReviewed && !submitted && (
                            <div className="border-t pt-4 space-y-3">
                                <p className="text-sm font-semibold text-zinc-700">Deja tu calificación</p>
                                {CRITERIOS.map(c => (
                                    <div key={c.key} className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-600">{c.label}</span>
                                        <StarSelector
                                            value={form[c.key]}
                                            onChange={v => setForm(prev => ({ ...prev, [c.key]: v }))}
                                        />
                                    </div>
                                ))}
                                <textarea
                                    placeholder="Comentario opcional..."
                                    value={form.comentario}
                                    onChange={e => setForm(prev => ({ ...prev, comentario: e.target.value }))}
                                    className="w-full border rounded-xl p-2 text-sm resize-none"
                                    rows={3}
                                />
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Enviar calificación'}
                                </button>
                            </div>
                        )}

                        {submitted && (
                            <p className="text-sm text-green-600 text-center py-2 font-medium">
                                ✓ ¡Gracias por tu reseña!
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}