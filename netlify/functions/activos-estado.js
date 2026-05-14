import { supabase, json, handleOptions } from "./_shared.js";

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "PUT") return json(405, { error: "Método no permitido" });

    try {
        const { id_activo, estado } = JSON.parse(event.body || "{}");

        if (!id_activo || !estado) {
            return json(400, { error: "Faltan campos requeridos: id_activo, estado" });
        }

        const estadosValidos = ["operativo", "mantenimiento", "danado"];
        if (!estadosValidos.includes(estado)) {
            return json(400, { error: "Estado no válido. Use: operativo, mantenimiento o danado" });
        }

        const { data, error } = await supabase
            .from("activos")
            .update({ estado })
            .eq("id_activo", id_activo)
            .select();

        if (error) {
            console.error("Error al actualizar activo:", error);
            return json(500, { error: "Error al actualizar estado del activo", details: error.message });
        }

        if (!data || data.length === 0) {
            return json(404, { error: "Activo no encontrado" });
        }

        return json(200, {
            message: "Estado del activo actualizado correctamente",
            activo: data[0],
        });

    } catch (error) {
        console.error("Error en activos-estado:", error);
        return json(500, { error: "Error del servidor" });
    }
};
