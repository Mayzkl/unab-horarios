// Palabras que bloquean el envío inmediatamente
const BLOCKED_WORDS = [
    'idiota', 'estupido', 'estupida', 'imbecil', 'inutil',
    'puta', 'puto', 'mierda', 'weon', 'weona', 'culiao',
    'conchetumare', 'ctm', 'hdp', 'maricón', 'maricon',
]

// Palabras que marcan como pendiente (insultos más sutiles o dudosos)
const PENDING_WORDS = [
    'odio', 'terrible', 'pesimo', 'pésimo', 'horrible',
    'basura', 'porqueria', 'porquería', 'malo', 'pésima',
]

function normalize(text: string) {
    return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
}

export type ModerationResult = 
    | { status: 'approved' }
    | { status: 'pending';   reason: string }
    | { status: 'blocked';   reason: string }

export function moderateComment(comment: string): ModerationResult {
    if (!comment.trim()) return { status: 'approved' }

    const normalized = normalize(comment)
    const words = normalized.split(/\s+/)

    // Verificar palabras bloqueadas
    for (const word of BLOCKED_WORDS) {
        if (words.some(w => w.includes(normalize(word)))) {
            return { 
                status: 'blocked', 
                reason: `El comentario contiene lenguaje inapropiado.` 
            }
        }
    }

    // Verificar palabras dudosas
    for (const word of PENDING_WORDS) {
        if (words.some(w => w.includes(normalize(word)))) {
            return { 
                status: 'pending', 
                reason: `Comentario en revisión.` 
            }
        }
    }

    return { status: 'approved' }
}