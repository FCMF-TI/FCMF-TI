import { supabase, json, handleOptions } from "./_shared.js";

// Ruta: /api/mis-incidentes?id_usuario=XXX

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "GET") return json(405, { error: "Método no permitido" });

    try {
        const id_usuario = event.queryStringParameters?.id_usuario;

        if (!id_usuario) {
            return json(400, { error: "Falta el parámetro: id_usuario" });
        }

        const { data, error } = await supabase
            .from("incidentes")
            .select(`
                id_ticket_h,
                descripcion,
                fecha,
                fecha_cierre,
                urgencia,
                departamento,
                observacion,
                nivel_problema,
                nombre_activo,
                programa,
                id_tecnico,
                tecnicos: id_tecnico (nombres, apellidos, rol)
            `)
            .eq("id_usuario", id_usuario)
            .order("fecha_cierre", { ascending: false });

        if (error) {
            console.error("Error al obtener historial:", error);
            return json(500, { error: "Error al obtener historial" });
        }

        return json(200, { incidentes: data || [] });

    } catch (error) {
        console.error("Error en mis-incidentes:", error);
        return json(500, { error: "Error del servidor" });
    }
};
