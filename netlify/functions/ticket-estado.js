import { supabase, json, handleOptions } from "./_shared.js";

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "PUT") return json(405, { error: "Método no permitido" });

    try {
        const { id, tipo, estado } = JSON.parse(event.body || "{}");

        if (!id || !tipo || !estado) {
            return json(400, { error: "Faltan campos requeridos" });
        }

        const estadosValidos = ["en espera", "en intervencion", "resuelto"];
        if (!estadosValidos.includes(estado)) {
            return json(400, { error: "Estado no válido" });
        }

        const { error } = await supabase
            .from("tickets")
            .update({ estado })
            .eq("id_ticket", id);

        if (error) {
            console.error("Error al actualizar estado:", error);
            return json(500, { error: "Error al actualizar estado del ticket" });
        }

        return json(200, {
            message: "Estado del ticket actualizado correctamente",
            nuevo_estado: estado,
        });

    } catch (error) {
        console.error("Error en ticket-estado:", error);
        return json(500, { error: "Error del servidor" });
    }
};
