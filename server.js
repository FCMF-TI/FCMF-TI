console.log("Iniciando servidor...");

// =============================
// IMPORTACIONES
// =============================

import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// =============================
// CONFIGURACIÓN
// =============================

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// =============================
// SUPABASE
// =============================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);


// =============================
// LOGIN (ACTUALIZADO CON NOMBRE, APELLIDO)
// =============================

app.post("/login", async (req, res) => {

    try {

        const { correo, password } = req.body;

        let user = null;
        let tipo = null;
        let nombreCompleto = "";
        let nombre = "";
        let apellido = "";

        // ==========================
        // BUSCAR EN USUARIOS
        // ==========================

        const { data: usuarioNormal } =
            await supabase
                .from("usuarios")
                .select("*")
                .eq("correo_inst", correo)
                .single();

        if (usuarioNormal) {

            user = usuarioNormal;
            tipo = "usuario";
            nombre = user.nombre || "";
            apellido = user.apellido || "";
            nombreCompleto = `${nombre} ${apellido}`.trim();

        }


        // ==========================
        // BUSCAR EN TECNICOS
        // ==========================

        if (!user) {

            const { data: tecnico } =
                await supabase
                    .from("tecnicos")
                    .select("*")
                    .eq("correo_inst", correo)
                    .single();

            if (tecnico) {

                user = tecnico;
                tipo = tecnico.rol; // 'pasante' o 'admin'
                nombre = user.nombre || "";
                apellido = user.apellido || "";
                nombreCompleto = `${nombre} ${apellido}`.trim();

            }

        }


        if (!user) {

            return res
                .status(401)
                .json({
                    error: "Correo no encontrado"
                });

        }


        // ==========================
        // VALIDAR PASSWORD
        // ==========================

        const validPassword =
            await bcrypt.compare(
                password,
                user["contraseña"]
            );

        if (!validPassword) {

            return res
                .status(401)
                .json({
                    error: "Contraseña incorrecta"
                });

        }


        // ==========================
        // RESPUESTA LOGIN (ACTUALIZADA)
        // ==========================

        res.json({

            message: "Login correcto",

            tipo: tipo,

            user: {

                id: user.id_usuario || user.id_tecnico,
                correo: user.correo_inst,
                nombre: nombre,
                apellido: apellido,
                nombre_completo: nombreCompleto,
                rol_texto: tipo === "admin" ? "Administrador" :
                    tipo === "pasante" ? "Pasante" :
                        "Usuario"

            }

        });

    }

    catch (error) {

        console.error(error);

        res
            .status(500)
            .json({
                error: "Error del servidor"
            });

    }

});


// =============================
// REPORTAR INCIDENTE (TABLA TICKETS)
// =============================

app.post("/reportar", async (req, res) => {

    try {
        const {
            descripcion,
            estado,
            fecha,
            urgencia,
            id_usuario,
            departamento,
            tipo_problema,
            programa
        } = req.body;

        // ==========================
        // VALIDACIÓN CAMPOS OBLIGATORIOS
        // ==========================

        if (!descripcion || !estado || !fecha || !urgencia || !id_usuario || !departamento || !tipo_problema) {
            return res.status(400).json({
                error: "Todos los campos obligatorios deben estar llenos"
            });
        }

        // ==========================
        // INSERTAR EN TABLA TICKETS
        // ==========================

        const { data, error } = await supabase
            .from("tickets")
            .insert([{
                descripcion: descripcion,
                estado: estado,
                fecha: fecha,
                urgencia: urgencia,
                id_usuario: id_usuario,
                departamento: departamento,
                tipo_problema: tipo_problema,
                programa: programa || null
            }])
            .select();

        if (error) {
            console.error("SUPABASE ERROR:", error);
            return res.status(500).json({
                error: error.message
            });
        }

        // ==========================
        // RESPUESTA EXITOSA
        // ==========================

        res.json({
            message: "Ticket creado correctamente",
            ticket: data[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error del servidor"
        });
    }

});



// =============================
// OBTENER TICKETS PENDIENTES (PARA PASANTE/ADMIN)
// =============================

app.get("/tickets-pendientes", async (req, res) => {

    try {
        // Obtener tickets pendientes de la tabla TICKETS
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
            .in("estado", ["en espera", "en intervencion"])  // <-- CAMBIO AQUÍ
            .order("fecha", { ascending: false });

        if (error) {
            console.error("Error al obtener tickets:", error);
            return res.status(500).json({ error: "Error al obtener tickets" });
        }

        // Formatear respuesta unificada
        const tickets = [];

        if (data) {
            data.forEach(ticket => {
                let tipoActivo = null;
                if (ticket.tipo_problema === "hardware_pc") tipoActivo = "pc";
                else if (ticket.tipo_problema === "hardware_impresora") tipoActivo = "impresora";
                else if (ticket.tipo_problema === "red_conectividad") tipoActivo = "red";
                
                tickets.push({
                    id: ticket.id_ticket,
                    tipo: ticket.tipo_problema === "software" ? "software" : "hardware",
                    tipo_activo: tipoActivo,
                    urgencia: ticket.urgencia,
                    descripcion: ticket.descripcion,
                    fecha: ticket.fecha,
                    estado: ticket.estado,
                    departamento: ticket.departamento,
                    programa: ticket.programa,
                    usuario: ticket.usuarios ? {
                        nombre: ticket.usuarios.nombres,
                        apellido: ticket.usuarios.apellidos,
                        correo: ticket.usuarios.correo_inst
                    } : null
                });
            });
        }

        res.json({ tickets });

    } catch (error) {
        console.error("Error en tickets-pendientes:", error);
        res.status(500).json({ error: "Error del servidor" });
    }

});

// =============================
// CAMBIAR ESTADO DEL TICKET
// =============================

app.put("/ticket/estado", async (req, res) => {
    try {
        const { id, tipo, estado } = req.body;
        
        if (!id || !tipo || !estado) {
            return res.status(400).json({ error: "Faltan campos requeridos" });
        }
        
        // Validar que el estado sea válido
        const estadosValidos = ["en espera", "en intervencion", "resuelto"];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: "Estado no válido" });
        }
        
        // Actualizar directamente en la tabla tickets
        const { error } = await supabase
            .from("tickets")
            .update({ estado: estado })
            .eq("id_ticket", id);
        
        if (error) {
            console.error("Error al actualizar estado:", error);
            return res.status(500).json({ error: "Error al actualizar estado del ticket" });
        }
        
        res.json({ 
            message: "Estado del ticket actualizado correctamente",
            nuevo_estado: estado
        });
        
    } catch (error) {
        console.error("Error en ticket/estado:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// =============================
// OBTENER ACTIVOS POR DEPARTAMENTO
// =============================

app.get("/activos/departamento/:departamento", async (req, res) => {
    try {
        const { departamento } = req.params;
        
        const { data, error } = await supabase
            .from("activos")
            .select("*")
            .eq("departamento", departamento)
            .order("nombre_activo", { ascending: true });
        
        if (error) {
            console.error("Error al obtener activos:", error);
            return res.status(500).json({ error: "Error al obtener activos" });
        }
        
        res.json({ activos: data });
        
    } catch (error) {
        console.error("Error en activos/departamento:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// =============================
// ACTUALIZAR ESTADO DEL ACTIVO
// =============================

app.put("/activos/estado", async (req, res) => {
    try {
        const { id_activo, estado } = req.body;
        
        console.log("Recibida solicitud para actualizar activo:", { id_activo, estado });
        
        if (!id_activo || !estado) {
            return res.status(400).json({ error: "Faltan campos requeridos: id_activo, estado" });
        }
        
        // Validar que el estado sea válido
        const estadosValidos = ["operativo", "mantenimiento", "danado"];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: "Estado no válido. Use: operativo, mantenimiento o danado" });
        }
        
        // Actualizar SOLO la columna estado (sin fecha_actualizacion porque no existe)
        const { data, error } = await supabase
            .from("activos")
            .update({ 
                estado: estado
                // fecha_actualizacion eliminado porque no existe en tu tabla
            })
            .eq("id_activo", id_activo)
            .select();
        
        if (error) {
            console.error("Error al actualizar activo:", error);
            return res.status(500).json({ 
                error: "Error al actualizar estado del activo",
                details: error.message 
            });
        }
        
        if (!data || data.length === 0) {
            return res.status(404).json({ error: "Activo no encontrado" });
        }
        
        console.log("Activo actualizado exitosamente:", data[0]);
        
        res.json({ 
            message: "Estado del activo actualizado correctamente",
            activo: data[0]
        });
        
    } catch (error) {
        console.error("Error en activos/estado:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// =============================
// CERRAR TICKET Y GUARDAR EN INCIDENTES (Y ELIMINAR DE TICKETS)
// =============================

app.put("/cerrar-ticket", async (req, res) => {
    try {
        const { 
            id, 
            tipo, 
            nivel_problema, 
            solucion, 
            id_tecnico, 
            id_activo,
            nombre_activo_texto
        } = req.body;
        
        // ==========================
        // VALIDACIÓN DE CAMPOS
        // ==========================
        
        if (!id || !tipo || !nivel_problema || !solucion || !id_tecnico) {
            return res.status(400).json({ 
                error: "Faltan campos requeridos: id, tipo, nivel_problema, solucion, id_tecnico" 
            });
        }
        
        // Validar nivel del problema
        const nivelesValidos = ["bajo", "medio", "alto"];
        if (!nivelesValidos.includes(nivel_problema)) {
            return res.status(400).json({ error: "Nivel de problema no válido" });
        }
        
        // ==========================
        // 1. OBTENER DATOS DEL TICKET ANTES DE ELIMINARLO
        // ==========================
        
        const { data: ticketData, error: fetchError } = await supabase
            .from("tickets")
            .select(`
                id_ticket,
                descripcion,
                fecha,
                urgencia,
                id_usuario,
                departamento,
                tipo_problema,
                programa
            `)
            .eq("id_ticket", id)
            .single();
        
        if (fetchError || !ticketData) {
            console.error("Error al obtener ticket:", fetchError);
            return res.status(404).json({ error: "Ticket no encontrado" });
        }
        
        // ==========================
        // 2. OBTENER NOMBRE DEL ACTIVO (si se seleccionó un activo existente)
        // ==========================
        
        let nombreActivo = nombre_activo_texto || null;
        
        if (id_activo && id_activo !== "otro") {
            // Buscar el nombre del activo en la tabla activos
            const { data: activoData, error: activoError } = await supabase
                .from("activos")
                .select("nombre_activo")
                .eq("id_activo", id_activo)
                .single();
            
            if (!activoError && activoData) {
                nombreActivo = activoData.nombre_activo;
            }
        } else if (id_activo === "otro") {
            // Si seleccionó "OTRO", usar el texto que envió el frontend
            nombreActivo = nombre_activo_texto || "Activo no registrado";
        }
        
        // ==========================
        // 3. INSERTAR EN TABLA INCIDENTES (con tu estructura)
        // ==========================
        
        const fecha_cierre = new Date().toISOString();
        
        // Generar un UUID para id_ticket_h si tu tabla lo requiere
        const id_ticket_h = uuidv4();
        
        const { data: incidenteData, error: insertError } = await supabase
            .from("incidentes")
            .insert([{
                id_ticket_h: id_ticket_h,           // UUID único
                descripcion: ticketData.descripcion,
                fecha: ticketData.fecha,             // fecha del reporte original
                observacion: solucion,               // aquí va la solución aplicada
                urgencia: ticketData.urgencia,
                id_usuario: ticketData.id_usuario,
                id_tecnico: id_tecnico,
                nivel_problema: nivel_problema,
                departamento: ticketData.departamento,
                programa: ticketData.programa || null,
                fecha_cierre: fecha_cierre,
                nombre_activo: nombreActivo
            }])
            .select();
        
        if (insertError) {
            console.error("Error al insertar en incidentes:", insertError);
            return res.status(500).json({ 
                error: "Error al guardar el incidente en el historial",
                details: insertError.message
            });
        }
        
        // ==========================
        // 4. ELIMINAR TICKET DE LA TABLA TICKETS
        // ==========================
        
        const { error: deleteError } = await supabase
            .from("tickets")
            .delete()
            .eq("id_ticket", id);
        
        if (deleteError) {
            console.error("Error al eliminar ticket:", deleteError);
            console.warn("El ticket no pudo ser eliminado automáticamente. ID:", id);
        }
        
        // ==========================
        // 5. RESPUESTA EXITOSA
        // ==========================
        
        res.json({ 
            message: "Ticket cerrado exitosamente",
            incidente: incidenteData[0],
            ticket_eliminado: !deleteError
        });
        
    } catch (error) {
        console.error("Error en cerrar-ticket:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// =============================
// OBTENER MIS TICKETS ACTIVOS (PARA USUARIO)
// =============================

app.get("/mis-tickets/:id_usuario", async (req, res) => {

    try {
        const { id_usuario } = req.params;

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
            return res.status(500).json({ error: "Error al obtener tickets" });
        }

        res.json({ tickets: data || [] });

    } catch (error) {
        console.error("Error en mis-tickets:", error);
        res.status(500).json({ error: "Error del servidor" });
    }

});


// =============================
// CANCELAR TICKET (USUARIO)
// =============================

app.post("/cancelar-ticket", async (req, res) => {

    try {
        const { id_ticket } = req.body;

        if (!id_ticket) {
            return res.status(400).json({ error: "Falta el id del ticket" });
        }

        // 1. Obtener datos del ticket
        const { data: ticketData, error: fetchError } = await supabase
            .from("tickets")
            .select("*")
            .eq("id_ticket", id_ticket)
            .single();

        if (fetchError || !ticketData) {
            return res.status(404).json({ error: "Ticket no encontrado" });
        }

        // 2. Insertar en incidentes con estado cancelado
        const id_ticket_h = uuidv4();
        const fecha_cierre = new Date().toISOString();

        const { error: insertError } = await supabase
            .from("incidentes")
            .insert([{
                id_ticket_h:   id_ticket_h,
                descripcion:   ticketData.descripcion,
                fecha:         ticketData.fecha,
                observacion:   "Cancelado por el usuario — resuelto de forma independiente",
                urgencia:      ticketData.urgencia,
                id_usuario:    ticketData.id_usuario,
                id_tecnico:    ticketData.id_tecnico || null,
                nivel_problema: "bajo",
                departamento:  ticketData.departamento,
                programa:      ticketData.programa || null,
                fecha_cierre:  fecha_cierre,
                nombre_activo: null
            }]);

        if (insertError) {
            console.error("Error al insertar en incidentes:", insertError);
            return res.status(500).json({ error: "Error al guardar el incidente" });
        }

        // 3. Eliminar de tickets
        const { error: deleteError } = await supabase
            .from("tickets")
            .delete()
            .eq("id_ticket", id_ticket);

        if (deleteError) {
            console.error("Error al eliminar ticket:", deleteError);
        }

        res.json({ message: "Ticket cancelado correctamente" });

    } catch (error) {
        console.error("Error en cancelar-ticket:", error);
        res.status(500).json({ error: "Error del servidor" });
    }

});


// =============================
// OBTENER HISTORIAL DEL USUARIO (INCIDENTES)
// =============================

app.get("/mis-incidentes/:id_usuario", async (req, res) => {

    try {
        const { id_usuario } = req.params;

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
            return res.status(500).json({ error: "Error al obtener historial" });
        }

        res.json({ incidentes: data || [] });

    } catch (error) {
        console.error("Error en mis-incidentes:", error);
        res.status(500).json({ error: "Error del servidor" });
    }

});


// =============================
// SERVIDOR
// =============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});