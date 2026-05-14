import bcrypt from "bcrypt";
import { supabase, json, handleOptions } from "./_shared.js";

export const handler = async (event) => {

    if (event.httpMethod === "OPTIONS") return handleOptions();
    if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

    try {
        const { correo, password } = JSON.parse(event.body || "{}");

        let user = null;
        let tipo = null;
        let nombre = "";
        let apellido = "";

        // Buscar en usuarios
        const { data: usuarioNormal } = await supabase
            .from("usuarios")
            .select("*")
            .eq("correo_inst", correo)
            .single();

        if (usuarioNormal) {
            user = usuarioNormal;
            tipo = "usuario";
            nombre = user.nombres || "";
            apellido = user.apellidos || "";
        }

        // Buscar en técnicos
        if (!user) {
            const { data: tecnico } = await supabase
                .from("tecnicos")
                .select("*")
                .eq("correo_inst", correo)
                .single();

            if (tecnico) {
                user = tecnico;
                tipo = tecnico.rol; // 'pasante' o 'admin'
                nombre = user.nombre || "";
                apellido = user.apellido || "";
            }
        }

        if (!user) return json(401, { error: "Correo no encontrado" });

        const validPassword = await bcrypt.compare(password, user["contraseña"]);
        if (!validPassword) return json(401, { error: "Contraseña incorrecta" });

        const nombreCompleto = `${nombre} ${apellido}`.trim();

        return json(200, {
            message: "Login correcto",
            tipo,
            user: {
                id: user.id_usuario || user.id_tecnico,
                correo: user.correo_inst,
                nombre,
                apellido,
                nombre_completo: nombreCompleto,
                rol_texto:
                    tipo === "admin" ? "Administrador" :
                    tipo === "pasante" ? "Pasante" :
                    "Usuario",
            },
        });

    } catch (error) {
        console.error(error);
        return json(500, { error: "Error del servidor" });
    }
};
