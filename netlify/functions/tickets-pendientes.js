import { supabase, json, handleOptions } from "./_shared.js";

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "GET") return json(405, { error: "Método no permitido" });

    try {
        const { data, error } = await supabase
            .from("tickets")
            .select(`
                id_ticket,
                urgencia,
                descripcion,
                fecha,
                estado,
                departamento,
                tipo_problema,
                programa,
                id_usuario,
                usuarios: id_usuario (nombres, apellidos, correo_inst)
            `)
            .in("estado", ["en espera", "en intervencion"])
            .order("fecha", { ascending: false });

        if (error) {
            console.error("Error al obtener tickets:", error);
            return json(500, { error: "Error al obtener tickets" });
        }

        const tickets = (data || []).map((ticket) => {
            let tipoActivo = null;
            if (ticket.tipo_problema === "hardware_pc") tipoActivo = "pc";
            else if (ticket.tipo_problema === "hardware_impresora") tipoActivo = "impresora";
            else if (ticket.tipo_problema === "red_conectividad") tipoActivo = "red";

            return {
                id: ticket.id_ticket,
                tipo: ticket.tipo_problema === "software" ? "software" : "hardware",
                tipo_activo: tipoActivo,
                urgencia: ticket.urgencia,
                descripcion: ticket.descripcion,
                fecha: ticket.fecha,
                estado: ticket.estado,
                departamento: ticket.departamento,
                programa: ticket.programa,
                usuario: ticket.usuarios
                    ? {
                        nombre: ticket.usuarios.nombres,
                        apellido: ticket.usuarios.apellidos,
                        correo: ticket.usuarios.correo_inst,
                      }
                    : null,
            };
        });

        return json(200, { tickets });

    } catch (error) {
        console.error("Error en tickets-pendientes:", error);
        return json(500, { error: "Error del servidor" });
    }
};
