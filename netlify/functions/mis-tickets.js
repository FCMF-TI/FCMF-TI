import { supabase, json, handleOptions } from "./_shared.js";

// Ruta: /api/mis-tickets?id_usuario=XXX

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "GET") return json(405, { error: "Método no permitido" });

    try {
        const id_usuario = event.queryStringParameters?.id_usuario;

        if (!id_usuario) {
            return json(400, { error: "Falta el parámetro: id_usuario" });
        }

        const { data, error } = await supabase
            .from("tickets")
            .select(`
                id_ticket,
                descripcion,
                estado,
                fecha,
                urgencia,
                departamento,
                tipo_problema,
                programa,
                id_tecnico,
                linea_tiempo,
                tiempo_aproximacion,
                tecnicos: id_tecnico (nombres, apellidos, rol)
            `)
            .eq("id_usuario", id_usuario)
            .in("estado", ["en espera", "en intervencion"])
            .order("fecha", { ascending: false });

        if (error) {
            console.error("Error al obtener mis tickets:", error);
            return json(500, { error: "Error al obtener tickets" });
        }

        return json(200, { tickets: data || [] });

    } catch (error) {
        console.error("Error en mis-tickets:", error);
        return json(500, { error: "Error del servidor" });
    }
};
