// ==========================
// VERIFICAR SESIÓN Y TIPO DE USUARIO
// ==========================

document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const tipo = localStorage.getItem("tipo");

    // Si no hay sesión iniciada
    if (!usuario) {
        alert("Debe iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }

    // Si no es pasante, redirigir según su tipo
    if (tipo !== "pasante") {
        if (tipo === "admin") {
            alert("Acceso denegado. Esta página es solo para pasantes.");
            window.location.href = "admin.html";
        } else if (tipo === "usuario") {
            alert("Acceso denegado. Esta página es solo para pasantes.");
            window.location.href = "usuario.html";
        } else {
            window.location.href = "index.html";
        }
        return;
    }

    console.log(`Bienvenido pasante: ${usuario.correo}`);

    // ==========================
    // SIDEBAR
    // ==========================

    const sidebar = document.querySelector(".sidebar");
    const sidebarToggler = document.querySelector(".sidebar-toggler");
    const menuToggler = document.querySelector(".menu-toggler");

    let collapsedSidebarHeight = "56px";
    let fullSidebarHeight = "calc(100vh - 32px)";

    if (sidebarToggler) {
        sidebarToggler.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            if (sidebar.classList.contains("collapsed")) {
                localStorage.setItem("sidebarCollapsed", "true");
            } else {
                localStorage.setItem("sidebarCollapsed", "false");
            }
        });
    }

    const toggleMenu = (isMenuActive) => {
        if (sidebar && menuToggler) {
            sidebar.style.height = isMenuActive ? `${sidebar.scrollHeight}px` : collapsedSidebarHeight;
            menuToggler.querySelector("span").innerText = isMenuActive ? "close" : "menu";
        }
    }

    if (menuToggler) {
        menuToggler.addEventListener("click", () => {
            toggleMenu(sidebar.classList.toggle("menu-active"));
        });
    }

    window.addEventListener("resize", () => {
        if (window.innerWidth >= 1024) {
            sidebar.style.height = fullSidebarHeight;
            const savedState = localStorage.getItem("sidebarCollapsed");
            if (savedState === "true") {
                sidebar.classList.add("collapsed");
            } else {
                sidebar.classList.remove("collapsed");
            }
        } else {
            sidebar.classList.remove("collapsed");
            sidebar.style.height = "auto";
            toggleMenu(sidebar.classList.contains("menu-active"));
        }
    });

    if (window.innerWidth >= 1024) {
        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState === "true") {
            sidebar.classList.add("collapsed");
        }
    }

    // ==========================
    // MOSTRAR PERFIL DE USUARIO
    // ==========================

    function mostrarPerfilUsuario() {
        const profileName = document.getElementById("profileName");
        const profileRole = document.getElementById("profileRole");
        const profileEmail = document.getElementById("profileEmail");

        if (profileName) {
            const nombreCompleto = usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
            profileName.textContent = nombreCompleto || usuario.correo.split('@')[0];
        }

        if (profileRole) {
            const rolTexto = tipo === "admin" ? "Administrador" : "Pasante";
            profileRole.textContent = rolTexto;
        }

        if (profileEmail) {
            profileEmail.textContent = usuario.correo;
        }
    }

    mostrarPerfilUsuario();

    // ==========================
    // MODO OSCURO / CLARO
    // ==========================

    const body = document.querySelector(".dashboard-body");
    const modeToggleBtn = document.getElementById("modeToggleBtn");
    const modeIcon = document.getElementById("modeIcon");
    const modeText = document.getElementById("modeText");

    function toggleTheme() {
        const isDark = body.classList.contains("dark");

        if (isDark) {
            body.classList.remove("dark");
            body.classList.add("light");
            if (modeIcon) modeIcon.textContent = "light_mode";
            if (modeText) modeText.textContent = "Modo Claro";
            localStorage.setItem("theme", "light");
        } else {
            body.classList.remove("light");
            body.classList.add("dark");
            if (modeIcon) modeIcon.textContent = "dark_mode";
            if (modeText) modeText.textContent = "Modo Oscuro";
            localStorage.setItem("theme", "dark");
        }
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        body.classList.remove("dark");
        body.classList.add("light");
        if (modeIcon) modeIcon.textContent = "light_mode";
        if (modeText) modeText.textContent = "Modo Claro";
    } else {
        body.classList.remove("light");
        body.classList.add("dark");
        if (modeIcon) modeIcon.textContent = "dark_mode";
        if (modeText) modeText.textContent = "Modo Oscuro";
    }

    if (modeToggleBtn) {
        modeToggleBtn.addEventListener("click", toggleTheme);
    }

    // ==========================
    // CERRAR SESIÓN
    // ==========================

    function cerrarSesion() {
        localStorage.removeItem("usuario");
        localStorage.removeItem("tipo");
        localStorage.removeItem("sesion_expiracion");
        localStorage.removeItem("theme");
        localStorage.removeItem("sidebarCollapsed");

        alert("Sesión cerrada correctamente");
        window.location.href = "index.html";
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }

    // ==========================
    // VARIABLES GLOBALES
    // ==========================

    let ticketsData = [];
    const API_URL = "/.netlify/functions";
    const id_tecnico = usuario.id;

    // Elementos del DOM
    const modal = document.getElementById("modalIntervenir");
    const nombreIncidenteSpan = document.getElementById("nombreIncidente");
    const reportadoPorSpan = document.getElementById("reportadoPor");
    const departamentoTicketSpan = document.getElementById("departamentoTicket");
    const estadoTicketActualSpan = document.getElementById("estadoTicketActual");
    const descripcionTicketSpan = document.getElementById("descripcionTicket");
    const nivelProblemaSelect = document.getElementById("nivelProblema");
    const selectorActivo = document.getElementById("selectorActivo");
    const estadoActivoSelect = document.getElementById("estadoActivo");
    const solucionDescripcionTextarea = document.getElementById("solucionDescripcion");
    const cancelarModalBtn = document.getElementById("cancelarModalBtn");
    const btnAccionModal = document.getElementById("btnAccionModal");

    let ticketIdActual = null;
    let ticketTipoActual = null;
    let ticketDepartamentoActual = null;
    let ticketEstadoActual = null;

    // ==========================
    // FUNCIONES PARA ACTIVOS
    // ==========================

    async function cargarActivosPorDepartamento(departamento) {
        try {
            const response = await fetch(`${API_URL}/activos/departamento/${encodeURIComponent(departamento)}`);
            
            if (!response.ok) {
                throw new Error("Error al cargar activos");
            }
            
            const data = await response.json();
            return data.activos || [];
        } catch (error) {
            console.error("Error cargando activos:", error);
            return [];
        }
    }

    // Función para ocultar/mostrar el selector de estado del activo
    function toggleEstadoActivoVisibility() {
        const estadoActivoGroup = document.querySelector(".input-group:has(#estadoActivo)");
        
        if (selectorActivo.value === "otro") {
            // Si selecciona "OTRO", ocultar el selector de estado del activo
            if (estadoActivoGroup) {
                estadoActivoGroup.style.display = "none";
            }
            if (estadoActivoSelect) {
                estadoActivoSelect.value = "";
                estadoActivoSelect.disabled = true;
            }
        } else if (selectorActivo.value && selectorActivo.value !== "") {
            // Si selecciona un activo normal, mostrar el selector como flex
            if (estadoActivoGroup) {
                estadoActivoGroup.style.display = "flex";
            }
            if (estadoActivoSelect) {
                estadoActivoSelect.disabled = false;
            }
        } else {
            // Si no hay selección, ocultar por defecto
            if (estadoActivoGroup) {
                estadoActivoGroup.style.display = "none";
            }
        }
    }

    function llenarSelectorActivos(activos, departamento) {
        if (!selectorActivo) return;
        
        // Crear opciones base
        let opcionesHTML = `
            <option value="" disabled selected>Seleccione un activo afectado</option>
        `;
        
        // Agregar activos existentes
        if (activos.length > 0) {
            opcionesHTML += activos.map(activo => `
                <option value="${activo.id_activo}" data-tipo="${activo.tipo}" data-estado="${activo.estado}">
                    ${activo.nombre_activo} (${activo.tipo}) - Estado actual: ${activo.estado}
                </option>
            `).join('');
        } else {
            opcionesHTML += `
                <option value="" disabled>⚠️ No hay activos registrados en ${departamento}</option>
            `;
        }
        
        // Agregar la opción OTRO al final
        opcionesHTML += `
            <option value="otro" data-tipo="otro" data-estado="nuevo">
                🆕 OTRO - Activo no listado
            </option>
        `;
        
        selectorActivo.innerHTML = opcionesHTML;
        
        // Quitar evento anterior y agregar nuevo
        selectorActivo.removeEventListener("change", toggleEstadoActivoVisibility);
        selectorActivo.addEventListener("change", toggleEstadoActivoVisibility);
        
        // Ejecutar una vez para establecer el estado inicial
        toggleEstadoActivoVisibility();
    }

    async function actualizarEstadoActivo(id_activo, nuevoEstado) {
        try {
            console.log(`Intentando actualizar activo ${id_activo} a estado: ${nuevoEstado}`);
            
            const response = await fetch(`${API_URL}/activos/estado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_activo: id_activo,
                    estado: nuevoEstado
                })
            });
            
            // Obtener la respuesta como texto primero para mejor debug
            const responseText = await response.text();
            console.log("Respuesta del servidor:", responseText);
            
            // Intentar parsear como JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("Error al parsear respuesta:", e);
                throw new Error(`Respuesta inválida del servidor: ${responseText.substring(0, 100)}`);
            }
            
            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar estado del activo");
            }
            
            console.log("Estado del activo actualizado:", data);
            return data;
            
        } catch (error) {
            console.error("Error detallado actualizando estado:", error);
            throw new Error(`No se pudo actualizar el estado del activo: ${error.message}`);
        }
    }

    // ==========================
    // FUNCIONES PARA CARGAR TICKETS
    // ==========================

    async function cargarTicketsDesdeAPI() {
        try {
            const contenedorTickets = document.getElementById("contenedorTickets");
            if (contenedorTickets) {
                contenedorTickets.innerHTML = '<div class="loading-tickets"><p>Cargando tickets...</p></div>';
            }

            const response = await fetch(`${API_URL}/tickets-pendientes`);

            if (!response.ok) {
                throw new Error("Error al cargar tickets");
            }

            const data = await response.json();
            ticketsData = data.tickets || [];

            renderizarTickets();

        } catch (error) {
            console.error("Error:", error);
            const contenedorTickets = document.getElementById("contenedorTickets");
            if (contenedorTickets) {
                contenedorTickets.innerHTML = `
                    <div class="error-message-show">
                        <p>❌ Error al cargar los tickets</p>
                        <button class="btn-refresh" onclick="location.reload()">Reintentar</button>
                    </div>
                `;
            }
        }
    }

    function renderizarTickets() {
        const contenedorTickets = document.getElementById("contenedorTickets");
        if (!contenedorTickets) return;

        if (ticketsData.length === 0) {
            contenedorTickets.innerHTML = `
                <div class="no-tickets-message">
                    <p>🎉 No hay tickets pendientes</p>
                    <p>Todos los incidentes han sido resueltos</p>
                </div>
            `;
            return;
        }

        contenedorTickets.innerHTML = ticketsData.map(ticket => {
            const urgencia = ticket.urgencia;

            const fecha = new Date(ticket.fecha);
            const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
            const horaFormateada = `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;

            let titulo = "";
            if (ticket.tipo === "hardware") {
                const tipoActivo = ticket.tipo_activo === "pc" ? "PC" :
                    ticket.tipo_activo === "impresora" ? "Impresora" : "Red";
                titulo = `[Hardware] ${tipoActivo} - ${ticket.departamento || "Sin departamento"}`;
            } else {
                const programaTexto = ticket.programa ? ` ${ticket.programa}` : "";
                titulo = `[Software]${programaTexto} - ${ticket.departamento || "Sin departamento"}`;
            }

            const reportadoPor = ticket.usuario ?
                `${ticket.usuario.nombre || ''} ${ticket.usuario.apellido || ''}`.trim() || ticket.usuario.correo :
                "Usuario desconocido";

            const botonTexto = ticket.estado === 'en intervencion' ? 'EN INTERVENCIÓN' : 'INTERVENIR';
            const claseBoton = ticket.estado === 'en intervencion' ? 'btn-intervenir btn-en-intervencion' : 'btn-intervenir';

            let urgenciaTexto = "";
            let urgenciaClase = "";
            let urgenciaIcono = "";

            switch (urgencia) {
                case "bajo":
                    urgenciaTexto = "Baja";
                    urgenciaClase = "bajo";
                    urgenciaIcono = "check_circle";
                    break;
                case "medio":
                    urgenciaTexto = "Media";
                    urgenciaClase = "medio";
                    urgenciaIcono = "priority_high";
                    break;
                case "alto":
                    urgenciaTexto = "Alta";
                    urgenciaClase = "alta";
                    urgenciaIcono = "warning";
                    break;
                default:
                    urgenciaTexto = "Media";
                    urgenciaClase = "medio";
                    urgenciaIcono = "info";
            }

            return `
                <div class="ticket-card-item">
                    <div class="ticket-badge-container">
                        <div class="ticket-badge ${urgenciaClase}">
                            <span class="material-symbols-rounded" style="font-size: 14px; margin-right: 4px;">
                                ${urgenciaIcono}
                            </span>
                            ${urgenciaTexto}
                        </div>
                    </div>
                    <div class="ticket-details">
                        <h3>${titulo}</h3>
                        <p class="ticket-meta">Recibido: ${fechaFormateada} - ${horaFormateada}</p>
                        <p class="ticket-desc">${ticket.descripcion.substring(0, 150)}${ticket.descripcion.length > 150 ? '...' : ''}</p>
                        <p class="ticket-reportado">📋 Reportado por: ${reportadoPor}</p>
                    </div>
                    <div class="ticket-actions">
                        <button class="${claseBoton}" 
                            data-id="${ticket.id}" 
                            data-tipo="${ticket.tipo}" 
                            data-titulo="${titulo.replace(/[<>]/g, '')}" 
                            data-reportado="${reportadoPor}"
                            data-departamento="${ticket.departamento || ''}"
                            data-estado="${ticket.estado}"
                            data-descripcion="${ticket.descripcion.replace(/[<>]/g, '').replace(/"/g, '&quot;')}">
                            ${botonTexto}
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        document.querySelectorAll(".btn-intervenir").forEach(btn => {
            btn.removeEventListener("click", handleIntervenirClick);
            btn.addEventListener("click", handleIntervenirClick);
        });
    }

    function handleIntervenirClick(event) {
        const btn = event.currentTarget;
        const ticketId = btn.dataset.id;
        const ticketTipo = btn.dataset.tipo;
        const ticketTitulo = btn.dataset.titulo;
        const ticketReportado = btn.dataset.reportado;
        const ticketDepartamento = btn.dataset.departamento;
        const ticketEstado = btn.dataset.estado;
        const ticketDescripcion = btn.dataset.descripcion;
        
        abrirModal(ticketId, ticketTipo, ticketTitulo, ticketReportado, ticketDepartamento, ticketEstado, ticketDescripcion);
    }

    // ==========================
    // FUNCIONES DEL MODAL
    // ==========================

    async function abrirModal(id, tipo, titulo, reportadoPor, departamento, estadoActual, descripcion) {
        ticketIdActual = id;
        ticketTipoActual = tipo;
        ticketDepartamentoActual = departamento;
        ticketEstadoActual = estadoActual;

        if (nombreIncidenteSpan) nombreIncidenteSpan.textContent = titulo;
        if (reportadoPorSpan) reportadoPorSpan.textContent = reportadoPor;
        if (departamentoTicketSpan) departamentoTicketSpan.textContent = departamento || "No especificado";
        
        // Mostrar la descripción del ticket
        if (descripcionTicketSpan && descripcion) {
            descripcionTicketSpan.textContent = descripcion;
        }
        
        if (estadoTicketActualSpan) {
            const estadoTexto = estadoActual === "en espera" ? "En Espera" : 
                               estadoActual === "en intervencion" ? "En Intervención" : estadoActual;
            estadoTicketActualSpan.textContent = estadoTexto;
            
            if (estadoActual === "en espera") {
                estadoTicketActualSpan.style.color = "#3b82f6";
            } else if (estadoActual === "en intervencion") {
                estadoTicketActualSpan.style.color = "#f59e0b";
            }
        }

        if (nivelProblemaSelect) nivelProblemaSelect.value = "";
        if (solucionDescripcionTextarea) solucionDescripcionTextarea.value = "";
        if (estadoActivoSelect) {
            estadoActivoSelect.value = "";
            estadoActivoSelect.disabled = true;
        }

        // Resetear visibilidad del estado del activo - por defecto oculto
        const estadoActivoGroup = document.querySelector(".input-group:has(#estadoActivo)");
        if (estadoActivoGroup) {
            estadoActivoGroup.style.display = "none";
        }

        // Cargar activos del departamento
        if (departamento) {
            const activos = await cargarActivosPorDepartamento(departamento);
            llenarSelectorActivos(activos, departamento);
        } else {
            if (selectorActivo) {
                selectorActivo.innerHTML = '<option value="" disabled selected>⚠️ No se especificó departamento</option>';
            }
        }

        // Configurar el botón según el estado actual
        if (btnAccionModal) {
            if (estadoActual === "en intervencion") {
                btnAccionModal.textContent = "✅ Cerrar Ticket";
                btnAccionModal.className = "btn-finalizar";
                btnAccionModal.removeEventListener("click", cambiarEstadoEnIntervencion);
                btnAccionModal.removeEventListener("click", cerrarTicket);
                btnAccionModal.addEventListener("click", cerrarTicket);
            } else {
                btnAccionModal.textContent = "🔄 Marcar como En Intervención";
                btnAccionModal.className = "btn-intervenir-ticket";
                btnAccionModal.removeEventListener("click", cambiarEstadoEnIntervencion);
                btnAccionModal.removeEventListener("click", cerrarTicket);
                btnAccionModal.addEventListener("click", cambiarEstadoEnIntervencion);
            }
        }

        if (modal) {
            modal.style.display = "flex";
        }
    }

    function cerrarModal() {
        if (modal) modal.style.display = "none";
        ticketIdActual = null;
        ticketTipoActual = null;
        ticketDepartamentoActual = null;
        ticketEstadoActual = null;
    }

    async function cambiarEstadoEnIntervencion() {
        if (!ticketIdActual || !ticketTipoActual) {
            mostrarNotificacion("Error: No hay ticket seleccionado", "error");
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/ticket-estado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: ticketIdActual,
                    tipo: ticketTipoActual,
                    estado: "en intervencion"
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al cambiar estado");
            }
            
            mostrarNotificacion("Ticket marcado como En Intervención", "success");
            
            ticketEstadoActual = "en intervencion";
            
            if (estadoTicketActualSpan) {
                estadoTicketActualSpan.textContent = "En Intervención";
                estadoTicketActualSpan.style.color = "#3b82f6";
            }
            
            if (btnAccionModal) {
                btnAccionModal.textContent = "✅ Cerrar Ticket";
                btnAccionModal.className = "btn-finalizar";
                btnAccionModal.removeEventListener("click", cambiarEstadoEnIntervencion);
                btnAccionModal.removeEventListener("click", cerrarTicket);
                btnAccionModal.addEventListener("click", cerrarTicket);
            }
            
            await cargarTicketsDesdeAPI();
            
        } catch (error) {
            console.error("Error:", error);
            mostrarNotificacion(error.message || "Error al cambiar estado del ticket", "error");
        }
    }

    async function cerrarTicket() {
    if (!ticketIdActual || !ticketTipoActual) return;

    const nivel = nivelProblemaSelect ? nivelProblemaSelect.value : "";
    const solucion = solucionDescripcionTextarea ? solucionDescripcionTextarea.value.trim() : "";
    const id_activo = selectorActivo ? selectorActivo.value : "";
    const nuevoEstadoActivo = estadoActivoSelect ? estadoActivoSelect.value : "";

    if (!nivel) {
        mostrarNotificacion("Por favor, seleccione el nivel del problema", "error");
        return;
    }

    if (!solucion) {
        mostrarNotificacion("Por favor, describa la solución aplicada", "error");
        return;
    }

    if (!id_activo) {
        mostrarNotificacion("Por favor, seleccione el activo afectado", "error");
        return;
    }

    // Solo validar el estado del activo si NO es "otro" Y si hay un activo seleccionado que no esté vacío
    if (id_activo !== "otro" && id_activo && id_activo !== "" && !nuevoEstadoActivo) {
        mostrarNotificacion("Por favor, seleccione el nuevo estado del activo", "error");
        return;
    }

    if (!confirm(`¿Está seguro de cerrar este ticket?`)) return;

    // Mostrar notificación de proceso
    mostrarNotificacion("Procesando cierre de ticket...", "info");

    try {
        // Obtener el nombre del activo para guardarlo en incidentes
        let nombreActivoTexto = null;
        
        if (id_activo === "otro") {
            // Si es "OTRO", guardar directamente como "OTRO" sin preguntar
            nombreActivoTexto = "OTRO";
        } else {
            // Obtener el texto seleccionado del option
            const selectedOption = selectorActivo.options[selectorActivo.selectedIndex];
            if (selectedOption && selectedOption.textContent) {
                // Extraer solo el nombre del activo (antes del paréntesis)
                const textoCompleto = selectedOption.textContent;
                nombreActivoTexto = textoCompleto.split(' (')[0];
            }
        }

        // Solo actualizar estado del activo si NO es "otro"
        if (id_activo !== "otro") {
            try {
                mostrarNotificacion("Actualizando estado del activo...", "info");
                await actualizarEstadoActivo(id_activo, nuevoEstadoActivo);
                mostrarNotificacion("Estado del activo actualizado", "success");
            } catch (error) {
                console.error("Error al actualizar activo:", error);
                mostrarNotificacion(`Error al actualizar activo: ${error.message}`, "error");
                // No continuamos si falla la actualización del activo
                return;
            }
        }

        // Cerrar el ticket
        mostrarNotificacion("Guardando incidente y cerrando ticket...", "info");
        
        const response = await fetch(`${API_URL}/cerrar-ticket`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: ticketIdActual,
                tipo: ticketTipoActual,
                nivel_problema: nivel,
                solucion: solucion,
                id_tecnico: id_tecnico,
                id_activo: id_activo === "otro" ? null : id_activo,
                nombre_activo_texto: nombreActivoTexto
            })
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("Error al parsear respuesta:", responseText);
            throw new Error(`Error del servidor: ${responseText.substring(0, 100)}`);
        }

        if (!response.ok) {
            throw new Error(data.error || "Error al cerrar ticket");
        }

        cerrarModal();
        mostrarNotificacion("✅ Ticket cerrado exitosamente", "success");
        await cargarTicketsDesdeAPI();

    } catch (error) {
        console.error("Error detallado al cerrar ticket:", error);
        mostrarNotificacion(`❌ ${error.message}`, "error");
    }
}

    function mostrarNotificacion(mensaje, tipo = "info") {
        const notificacion = document.createElement("div");
        notificacion.className = `notification ${tipo}`;
        notificacion.textContent = mensaje;
        notificacion.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 3000;
            animation: slideIn 0.3s ease;
            background: ${tipo === "success" ? "#10b981" : tipo === "error" ? "#ef4444" : "#3b82f6"};
        `;

        document.body.appendChild(notificacion);
        setTimeout(() => notificacion.remove(), 3000);
    }

    // ==========================
    // EVENT LISTENERS
    // ==========================

    if (cancelarModalBtn) cancelarModalBtn.addEventListener("click", cerrarModal);
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", () => {
        cargarTicketsDesdeAPI();
        mostrarNotificacion("Lista actualizada", "info");
    });

    // ==========================
    // INICIALIZAR
    // ==========================

    cargarTicketsDesdeAPI();

});