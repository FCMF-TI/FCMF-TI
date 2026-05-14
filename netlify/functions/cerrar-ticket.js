import { v4 as uuidv4 } from "uuid";
import { supabase, json, handleOptions } from "./_shared.js";

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "PUT") return json(405, { error: "Método no permitido" });

    try {
        const {
            id,
            tipo,
            nivel_problema,
            solucion,
            id_tecnico,
            id_activo,
            nombre_activo_texto,
        } = JSON.parse(event.body || "{}");

        if (!id || !tipo || !nivel_problema || !solucion || !id_tecnico) {
            return json(400, { error: "Faltan campos requeridos: id, tipo, nivel_problema, solucion, id_tecnico" });
        }

        const nivelesValidos = ["bajo", "medio", "alto"];
        if (!nivelesValidos.includes(nivel_problema)) {
            return json(400, { error: "Nivel de problema no válido" });
        }

        // 1. Obtener datos del ticket
        const { data: ticketData, error: fetchError } = await supabase
            .from("tickets")
            .select(`
                id_ticket, descripcion, fecha, urgencia,
                id_usuario, departamento, tipo_problema, programa
            `)
            .eq("id_ticket", id)
            .single();

        if (fetchError || !ticketData) {
            return json(404, { error: "Ticket no encontrado" });
        }

        // 2. Resolver nombre del activo
        let nombreActivo = nombre_activo_texto || null;

        if (id_activo && id_activo !== "otro") {
            const { data: activoData, error: activoError } = await supabase
                .from("activos")
                .select("nombre_activo")
                .eq("id_activo", id_activo)
                .single();

            if (!activoError && activoData) {
                nombreActivo = activoData.nombre_activo;
            }
        } else if (id_activo === "otro") {
            nombreActivo = nombre_activo_texto || "Activo no registrado";
        }

        // 3. Insertar en incidentes
        const fecha_cierre = new Date().toISOString();
        const id_ticket_h = uuidv4();

        const { data: incidenteData, error: insertError } = await supabase
            .from("incidentes")
            .insert([{
                id_ticket_h,
                descripcion:    ticketData.descripcion,
                fecha:          ticketData.fecha,
                observacion:    solucion,
                urgencia:       ticketData.urgencia,
                id_usuario:     ticketData.id_usuario,
                id_tecnico,
                nivel_problema,
                departamento:   ticketData.departamento,
                programa:       ticketData.programa || null,
                fecha_cierre,
                nombre_activo:  nombreActivo,
            }])
            .select();

        if (insertError) {
            console.error("Error al insertar en incidentes:", insertError);
            return json(500, { error: "Error al guardar el incidente en el historial", details: insertError.message });
        }

        // 4. Eliminar ticket
        const { error: deleteError } = await supabase
            .from("tickets")
            .delete()
            .eq("id_ticket", id);

        if (deleteError) {
            console.warn("El ticket no pudo ser eliminado automáticamente. ID:", id);
        }

        return json(200, {
            message: "Ticket cerrado exitosamente",
            incidente: incidenteData[0],
            ticket_eliminado: !deleteError,
        });

    } catch (error) {
        console.error("Error en cerrar-ticket:", error);
        return json(500, { error: "Error del servidor" });
    }
};
