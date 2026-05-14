import { supabase, json, handleOptions } from "./_shared.js";

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

    try {
        const {
            descripcion,
            estado,
            fecha,
            urgencia,
            id_usuario,
            departamento,
            tipo_problema,
            programa,
        } = JSON.parse(event.body || "{}");

        if (!descripcion || !estado || !fecha || !urgencia || !id_usuario || !departamento || !tipo_problema) {
            return json(400, { error: "Todos los campos obligatorios deben estar llenos" });
        }

        const { data, error } = await supabase
            .from("tickets")
            .insert([{
                descripcion,
                estado,
                fecha,
                urgencia,
                id_usuario,
                departamento,
                tipo_problema,
                programa: programa || null,
            }])
            .select();

        if (error) {
            console.error("SUPABASE ERROR:", error);
            return json(500, { error: error.message });
        }

        return json(200, { message: "Ticket creado correctamente", ticket: data[0] });

    } catch (error) {
        console.error(error);
        return json(500, { error: "Error del servidor" });
    }
};
