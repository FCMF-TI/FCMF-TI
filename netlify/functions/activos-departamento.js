import { supabase, json, handleOptions } from "./_shared.js";

// Ruta: /api/activos-departamento?departamento=NOMBRE
// (Netlify Functions no soporta parámetros de ruta tipo :param fuera de Next.js;
//  se usa query string como alternativa estándar)

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "GET") return json(405, { error: "Método no permitido" });

    try {
        const departamento = event.queryStringParameters?.departamento;

        if (!departamento) {
            return json(400, { error: "Falta el parámetro: departamento" });
        }

        const { data, error } = await supabase
            .from("activos")
            .select("*")
            .eq("departamento", departamento)
            .order("nombre_activo", { ascending: true });

        if (error) {
            console.error("Error al obtener activos:", error);
            return json(500, { error: "Error al obtener activos" });
        }

        return json(200, { activos: data });

    } catch (error) {
        console.error("Error en activos-departamento:", error);
        return json(500, { error: "Error del servidor" });
    }
};
