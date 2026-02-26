import { supabase } from "./supabase";

//Buscar un profesor por nombre y retornar su IO
export async function getProfessorByName(name:string) {
    const { data, error } = await supabase
        .from('professors')
        .select('id, name')
        .ilike('name', name.trim())
        .single()
    
        if (error) return null
        return data
}

//Obtener todos los  profesores
export async function getAllProfessors() {
    const { data, error } = await supabase
        .from('professors')
        .select('id, name')
        .order('name')

    if (error) return null
    return data
}

//Obtener promedio calificaciones de cada profesor
export async function getProfessorReviews(professorId: string) {
    const { data, error} = await supabase
        .from('reviews')
        .select('puntualidad, claridad, exigencia, disposicion, metodologia, comentario, created_at')
        .eq('professor_id', professorId)

    if (error) return null
    return data
}