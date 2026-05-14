import { v4 as uuidv4 } from "uuid";
import { supabase, json, handleOptions } from "./_shared.js";

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

    try {
        const { id_ticket } = JSON.parse(event.body || "{}");

        if (!id_ticket) {
            return json(400, { error: "Falta el id del ticket" });
        }

        // 1. Obtener datos del ticket
        const { data: ticketData, error: fetchError } = await supabase
            .from("tickets")
            .select("*")
            .eq("id_ticket", id_ticket)
            .single();

        if (fetchError || !ticketData) {
            return json(404, { error: "Ticket no encontrado" });
        }

        // 2. Insertar en incidentes como cancelado
        const id_ticket_h = uuidv4();
        const fecha_cierre = new Date().toISOString();

        const { error: insertError } = await supabase
            .from("incidentes")
            .insert([{
                id_ticket_h,
                descripcion:    ticketData.descripcion,
                fecha:          ticketData.fecha,
                observacion:    "Cancelado por el usuario — resuelto de forma independiente",
                urgencia:       ticketData.urgencia,
                id_usuario:     ticketData.id_usuario,
                id_tecnico:     ticketData.id_tecnico || null,
                nivel_problema: "bajo",
                departamento:   ticketData.departamento,
                programa:       ticketData.programa || null,
                fecha_cierre,
                nombre_activo:  null,
            }]);

        if (insertError) {
            console.error("Error al insertar en incidentes:", insertError);
            return json(500, { error: "Error al guardar el incidente" });
        }

        // 3. Eliminar de tickets
        const { error: deleteError } = await supabase
            .from("tickets")
            .delete()
            .eq("id_ticket", id_ticket);

        if (deleteError) {
            console.error("Error al eliminar ticket:", deleteError);
        }

        return json(200, { message: "Ticket cancelado correctamente" });

    } catch (error) {
        console.error("Error en cancelar-ticket:", error);
        return json(500, { error: "Error del servidor" });
    }
};
