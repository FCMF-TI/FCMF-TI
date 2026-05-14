// usuario.js - Estructura organizada

// ============================================================
// 1. INICIALIZACIÓN PRINCIPAL
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    // Variables globales del módulo
    let ticketACancelar = null;
    let isDark = true;

    // ============================================================
    // 2. VERIFICACIÓN DE SESIÓN
    // ============================================================
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const tipo = localStorage.getItem("tipo");

    if (!usuario) {
        alert("Debe iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }

    if (tipo !== "usuario") {
        redirigirPorTipo(tipo);
        return;
    }

    console.log(`Bienvenido usuario: ${usuario.correo}`);

    // ============================================================
    // 3. FUNCIONES AUXILIARES
    // ============================================================
    function redirigirPorTipo(tipoUsuario) {
        const mensajes = {
            admin: "Acceso denegado. Esta página es solo para usuarios.",
            pasante: "Acceso denegado. Esta página es solo para usuarios."
        };
        
        if (mensajes[tipoUsuario]) {
            alert(mensajes[tipoUsuario]);
            window.location.href = `${tipoUsuario}.html`;
        } else {
            window.location.href = "index.html";
        }
    }

    function mostrarToast(msg) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMsg');
        if (toast && toastMsg) {
            toastMsg.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3500);
        }
    }

    function actualizarStats() {
        const cards = document.querySelectorAll('#ticketsList .ticket-card');
        let espera = 0, intervencion = 0;
        
        cards.forEach(card => {
            if (card.querySelector('.badge-espera')) espera++;
            if (card.querySelector('.badge-intervencion')) intervencion++;
        });
        
        const statTotal = document.getElementById('statTotal');
        const statEspera = document.getElementById('statEspera');
        const statIntervencion = document.getElementById('statIntervencion');
        
        if (statTotal) statTotal.textContent = cards.length;
        if (statEspera) statEspera.textContent = espera;
        if (statIntervencion) statIntervencion.textContent = intervencion;
    }

    function irAReporte() {
        const reportLink = document.querySelector('[data-view="reporte"]');
        if (reportLink) {
            document.querySelectorAll('.nav-link[data-view]').forEach(l => l.classList.remove('active'));
            reportLink.classList.add('active');
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            const viewReporte = document.getElementById('view-reporte');
            if (viewReporte) viewReporte.classList.add('active');
        }
    }

    function closeMobileSidebar() {
        const sidebar = document.querySelector(".sidebar");
        if (sidebar && window.innerWidth < 1024) {
            sidebar.classList.remove("menu-active");
            const menuToggler = document.querySelector(".menu-toggler");
            if (menuToggler) {
                menuToggler.querySelector("span").innerText = "menu";
                sidebar.style.height = "56px";
            }
        }
    }

    // ============================================================
    // 4. PERFIL DE USUARIO
    // ============================================================
    function mostrarPerfilUsuario() {
        const profileName = document.getElementById("profileName");
        const profileRole = document.getElementById("profileRole");
        const profileEmail = document.getElementById("profileEmail");

        if (profileName) {
            const nombreCompleto = usuario.nombre_completo || 
                `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
            profileName.textContent = nombreCompleto || usuario.correo.split('@')[0];
        }

        if (profileRole) {
            profileRole.textContent = "Usuario";
        }

        if (profileEmail) {
            profileEmail.textContent = usuario.correo;
        }
    }

    // ============================================================
    // 5. CIERRE DE SESIÓN
    // ============================================================
    function cerrarSesion() {
        const itemsToRemove = [
            "usuario", "tipo", "sesion_expiracion", "theme", "sidebarCollapsed"
        ];
        itemsToRemove.forEach(item => localStorage.removeItem(item));
        
        alert("Sesión cerrada correctamente");
        window.location.href = "index.html";
    }

    // ============================================================
    // 6. NAVEGACIÓN ENTRE VISTAS
    // ============================================================
    function initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-view]');
        const views = document.querySelectorAll('.view');
        const viewTitles = {
            'inicio': 'Mis Tickets',
            'historial': 'Historial',
            'reporte': 'Reportar Incidente'
        };

        function cerrarMenuEnMovil() {
            const sidebar = document.querySelector('.sidebar');
            const menuToggler = document.querySelector('.menu-toggler');

            if (window.innerWidth < 1024 && sidebar && sidebar.classList.contains('menu-active')) {
                sidebar.classList.remove('menu-active');
                sidebar.style.height = '56px';
                if (menuToggler) {
                    menuToggler.querySelector('span').innerText = 'menu';
                }
            }
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.dataset.view;
                
                // Actualizar clases activas
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                views.forEach(v => v.classList.remove('active'));
                
                // Mostrar vista seleccionada
                const targetView = document.getElementById('view-' + target);
                if (targetView) targetView.classList.add('active');
                
                // Actualizar título móvil
                const mobileTitle = document.getElementById('mobileViewTitle');
                if (mobileTitle && viewTitles[target]) {
                    mobileTitle.textContent = viewTitles[target];
                }

                // Cargar datos según la vista
                if (target === 'inicio') cargarMisTickets();
                if (target === 'historial') cargarHistorial();
                
                closeMobileSidebar();
            });
        });
    }

    // ============================================================
    // 7. SIDEBAR (Colapsable y Responsive)
    // ============================================================
    function initSidebar() {
        const sidebar = document.querySelector(".sidebar");
        const sidebarToggler = document.querySelector(".sidebar-toggler");
        const menuToggler = document.querySelector(".menu-toggler");
        
        
        
        let collapsedSidebarHeight = "56px";
        let fullSidebarHeight = "calc(100vh - 32px)";

        // Sidebar toggler (colapsar en desktop)
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

        // Menu toggler (móvil)
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

        // Evento resize
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

        // Cargar estado guardado en desktop
        if (window.innerWidth >= 1024) {
            const savedState = localStorage.getItem("sidebarCollapsed");
            if (savedState === "true") {
                sidebar.classList.add("collapsed");
            }
        }
    }

    // ============================================================
    // 8. TICKETS — Carga desde la BD y renderizado
    // ============================================================

    // Exponer toggleTicket globalmente (para onclick en HTML)
    window.toggleTicket = function(ticketId) {
        const card = document.getElementById(ticketId);
        if (card) card.classList.toggle('expanded');
    };

    function formatFecha(isoString) {
        if (!isoString) return '—';
        const d = new Date(isoString);
        const hoy = new Date();
        const esHoy = d.toDateString() === hoy.toDateString();
        if (esHoy) {
            return `Hoy, ${d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatFechaHistorial(isoString) {
        if (!isoString) return '—';
        const d = new Date(isoString);
        return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function calcularTiempoResolucion(fechaInicio, fechaCierre) {
        if (!fechaInicio || !fechaCierre) return null;
        const inicio = new Date(fechaInicio);
        const cierre = new Date(fechaCierre);
        const diff = Math.round((cierre - inicio) / 60000); // minutos
        if (diff < 60) return `${diff} min`;
        const horas = Math.floor(diff / 60);
        const mins  = diff % 60;
        return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }

    function renderTimeline(ticket) {
        const estado = ticket.estado;
        const tecnico = ticket.tecnicos;
        const nombreTecnico = tecnico
            ? `${tecnico.nombres} ${tecnico.apellidos}`
            : null;
        const rolTecnico = tecnico
            ? (tecnico.rol === 'admin' ? 'Ingeniero TI' : 'Pasante TI')
            : '';

        const stepRecibido = `
            <div class="timeline-step done">
                <div class="timeline-left">
                    <div class="timeline-dot"><span class="material-symbols-rounded">check</span></div>
                    <div class="timeline-connector"></div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-step-title">Recibido</div>
                    <div class="timeline-time">${formatFecha(ticket.fecha)}</div>
                </div>
            </div>`;

        const stepAsignado = nombreTecnico
            ? `<div class="timeline-step done">
                <div class="timeline-left">
                    <div class="timeline-dot"><span class="material-symbols-rounded">check</span></div>
                    <div class="timeline-connector"></div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-step-title">Asignado</div>
                    <div class="timeline-person">
                        <span class="timeline-person-name">${nombreTecnico}</span>
                        <span class="timeline-person-role">${rolTecnico}</span>
                    </div>
                </div>
            </div>`
            : `<div class="timeline-step ${estado === 'en espera' ? 'current' : 'pending'}">
                <div class="timeline-left">
                    <div class="timeline-dot"><span class="material-symbols-rounded">hourglass_top</span></div>
                    <div class="timeline-connector"></div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-step-title">En Espera de Asignación</div>
                    <div class="timeline-time">${estado === 'en espera' ? 'Ahora' : 'Pendiente'}</div>
                </div>
            </div>`;

        const stepIntervencion = estado === 'en intervencion'
            ? `<div class="timeline-step current">
                <div class="timeline-left">
                    <div class="timeline-dot"><span class="material-symbols-rounded">build</span></div>
                    <div class="timeline-connector"></div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-step-title">En Intervención</div>
                    <div class="timeline-time">Ahora</div>
                    ${ticket.tiempo_aproximacion ? `
                    <div class="eta-card" style="margin-top:10px;">
                        <span class="material-symbols-rounded eta-icon">schedule</span>
                        <div>
                            <div class="eta-label">Tiempo estimado de resolución</div>
                            <div class="eta-value">${ticket.tiempo_aproximacion}</div>
                        </div>
                    </div>` : ''}
                </div>
            </div>`
            : `<div class="timeline-step pending">
                <div class="timeline-left">
                    <div class="timeline-dot"><span class="material-symbols-rounded">build</span></div>
                    <div class="timeline-connector"></div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-step-title">En Intervención</div>
                    <div class="timeline-time">Pendiente</div>
                </div>
            </div>`;

        const stepResuelto = `
            <div class="timeline-step pending">
                <div class="timeline-left">
                    <div class="timeline-dot"><span class="material-symbols-rounded">task_alt</span></div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-step-title">Resuelto</div>
                    <div class="timeline-time">Pendiente</div>
                </div>
            </div>`;

        return stepRecibido + stepAsignado + stepIntervencion + stepResuelto;
    }

    function renderComentarios(ticket) {
        const tecnico = ticket.tecnicos;
        const nombreTecnico = tecnico
            ? `${tecnico.nombres} ${tecnico.apellidos}`
            : null;
        const rolTecnico = tecnico
            ? (tecnico.rol === 'admin' ? 'Ingeniero TI' : 'Pasante TI')
            : '';

        if (ticket.linea_tiempo && ticket.linea_tiempo.trim()) {
            return `
                <div class="comments-list">
                    <div class="comment-bubble">
                        <div class="comment-header">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span class="comment-author">${nombreTecnico || 'Equipo TI'}</span>
                                <span class="comment-role-tag">${rolTecnico}</span>
                            </div>
                        </div>
                        <div class="comment-text">${ticket.linea_tiempo}</div>
                    </div>
                </div>`;
        }

        return `
            <div class="no-comments">
                <span class="material-symbols-rounded">chat_bubble_outline</span>
                <p>Sin mensajes aún. El equipo TI escribirá aquí cuando tome su caso.</p>
            </div>`;
    }

    function renderTicketCard(ticket, index) {
        const id = `ticket-${ticket.id_ticket}`;
        const urgenciaCap = ticket.urgencia
            ? ticket.urgencia.charAt(0).toUpperCase() + ticket.urgencia.slice(1)
            : '—';
        const estadoBadge = ticket.estado === 'en intervencion'
            ? `<span class="badge badge-intervencion">En Intervención</span>`
            : `<span class="badge badge-espera">En Espera</span>`;
        const tipoProblemaCap = ticket.tipo_problema
            ? ticket.tipo_problema.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            : '—';
        const deptCap = ticket.departamento
            ? ticket.departamento.charAt(0).toUpperCase() + ticket.departamento.slice(1)
            : '—';
        const descripcionCorta = ticket.descripcion
            ? (ticket.descripcion.length > 90
                ? ticket.descripcion.substring(0, 90) + '...'
                : ticket.descripcion)
            : '';
        const expandedClass = index === 0 ? 'expanded' : '';

        return `
        <div class="ticket-card ${expandedClass}" id="${id}">
            <div class="ticket-card-header" onclick="toggleTicket('${id}')">
                <div class="ticket-priority-dot priority-${ticket.urgencia || 'bajo'}"></div>
                <div class="ticket-card-main">
                    <div class="ticket-card-top">
                        <span class="ticket-number">#TK-${String(ticket.id_ticket).padStart(4, '0')}</span>
                        <div class="ticket-badges">${estadoBadge}</div>
                    </div>
                    <div class="ticket-title">${tipoProblemaCap}${ticket.programa ? ' — ' + ticket.programa : ''}</div>
                    <div class="ticket-desc">${descripcionCorta}</div>
                </div>
            </div>
            <div class="ticket-card-footer">
                <div class="ticket-meta-info">
                    <div class="ticket-meta-item">
                        <span class="material-symbols-rounded">calendar_today</span>
                        <span>${formatFecha(ticket.fecha)}</span>
                    </div>
                    <div class="ticket-meta-item">
                        <span class="material-symbols-rounded">priority_high</span>
                        <span>Prioridad ${urgenciaCap}</span>
                    </div>
                    <div class="ticket-meta-item">
                        <span class="material-symbols-rounded">apartment</span>
                        <span>${deptCap}</span>
                    </div>
                </div>
                <div class="ticket-expand-btn" onclick="toggleTicket('${id}')">
                    <span>Ver detalle</span>
                    <span class="material-symbols-rounded">expand_more</span>
                </div>
            </div>

            <div class="ticket-detail">
                <div class="ticket-detail-inner">
                    <div class="timeline-section">
                        <h4>📍 Línea de tiempo</h4>
                        <div class="timeline">
                            ${renderTimeline(ticket)}
                        </div>
                    </div>
                    <div class="comments-section">
                        <h4>💬 Mensajes del equipo TI</h4>
                        ${renderComentarios(ticket)}
                        <button class="btn-cancelar-ticket"
                            onclick="abrirModalCancelar('${ticket.id_ticket}', '${ticket.descripcion.replace(/'/g, "\\'").substring(0, 60)}')"
                            style="margin-top:16px; width:100%;">
                            <span class="material-symbols-rounded">cancel</span>
                            Cancelar ticket — Lo resolví solo
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    async function cargarMisTickets() {
        const ticketsList = document.getElementById('ticketsList');
        if (!ticketsList) return;

        ticketsList.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-rounded" style="animation:spin 1s linear infinite">sync</span>
                <p>Cargando tickets...</p>
            </div>`;

        try {
            const resp = await fetch(`/.netlify/functions/mis-tickets?id_usuario=${usuario.id}`);
            const data = await resp.json();

            if (!resp.ok) throw new Error(data.error || 'Error al cargar tickets');

            const tickets = data.tickets || [];

            if (tickets.length === 0) {
                ticketsList.innerHTML = `
                    <div class="empty-state">
                        <span class="material-symbols-rounded">task_alt</span>
                        <h3>¡Todo en orden!</h3>
                        <p>No tienes tickets activos en este momento.</p>
                        <button class="btn-goto-report" onclick="irAReporte()">Crear un nuevo reporte</button>
                    </div>`;
            } else {
                ticketsList.innerHTML = tickets.map((t, i) => renderTicketCard(t, i)).join('');
            }

            actualizarStats();

        } catch (err) {
            console.error(err);
            ticketsList.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded">error</span>
                    <p>Error al cargar los tickets. Intenta recargar la página.</p>
                </div>`;
        }
    }

    function initTickets() {
        cargarMisTickets();
    }

    // ============================================================
    // 9. MODAL DE CANCELACIÓN — con llamada real a la API
    // ============================================================
    function initCancelModal() {
        const modal = document.getElementById('modalCancelar');
        const btnCerrar = document.getElementById('btnCerrarModal');
        const btnConfirmar = document.getElementById('btnConfirmarCancelar');

        if (!modal) return;

        let ticketIdACancelar = null;

        window.abrirModalCancelar = function(idTicket, nombre) {
            ticketIdACancelar = idTicket;
            const modalTicketNombre = document.getElementById('modalTicketNombre');
            if (modalTicketNombre) modalTicketNombre.textContent = nombre;
            modal.classList.add('visible');
        };

        if (btnCerrar) {
            btnCerrar.addEventListener('click', () => {
                modal.classList.remove('visible');
                ticketIdACancelar = null;
            });
        }

        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', async () => {
                if (!ticketIdACancelar) return;

                btnConfirmar.disabled = true;
                btnConfirmar.textContent = 'Cancelando...';

                try {
                    const resp = await fetch('/.netlify/functions/cancelar-ticket', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_ticket: ticketIdACancelar })
                    });

                    const data = await resp.json();

                    if (!resp.ok) throw new Error(data.error || 'Error al cancelar');

                    modal.classList.remove('visible');
                    mostrarToast('Ticket cancelado. El equipo TI ha sido notificado.');

                    // Recargar los tickets activos
                    await cargarMisTickets();

                } catch (err) {
                    console.error(err);
                    mostrarToast('Error al cancelar el ticket. Intenta nuevamente.');
                } finally {
                    btnConfirmar.disabled = false;
                    btnConfirmar.textContent = 'Sí, cancelar ticket';
                    ticketIdACancelar = null;
                }
            });
        }
    }

    // ============================================================
    // 9b. HISTORIAL — Carga desde incidentes
    // ============================================================
    function renderHistorialCard(inc) {
        const esCancelado = inc.observacion &&
            inc.observacion.includes('Cancelado por el usuario');
        const badgeClass = esCancelado ? 'badge-cancelado' : 'badge-resuelto';
        const badgeLabel = esCancelado ? 'Cancelado' : 'Resuelto';

        const tecnico = inc.tecnicos;
        const nombreTecnico = tecnico
            ? `${tecnico.nombres} ${tecnico.apellidos} · ${tecnico.rol === 'admin' ? 'Ingeniero TI' : 'Pasante TI'}`
            : null;

        const tiempoRes = calcularTiempoResolucion(inc.fecha, inc.fecha_cierre);
        const deptCap = inc.departamento
            ? inc.departamento.charAt(0).toUpperCase() + inc.departamento.slice(1)
            : '—';
        const titulo = inc.descripcion
            ? (inc.descripcion.length > 60 ? inc.descripcion.substring(0, 60) + '...' : inc.descripcion)
            : 'Incidente';
        const descripcion = inc.descripcion
            ? (inc.descripcion.length > 100 ? inc.descripcion.substring(0, 100) + '...' : inc.descripcion)
            : '';

        return `
        <div class="historial-card">
            <div class="historial-card-top">
                <div>
                    <div style="font-size:11px; color:${esCancelado ? '#64748b' : '#3b82f6'}; font-weight:600; margin-bottom:4px;">
                        #TK-${String(inc.id_ticket_h).substring(0, 8).toUpperCase()}
                    </div>
                    <div class="historial-title">${titulo}</div>
                </div>
                <span class="badge ${badgeClass}">${badgeLabel}</span>
            </div>
            ${inc.observacion
                ? `<div class="historial-desc">${inc.observacion}</div>`
                : ''}
            <div class="historial-footer">
                <div class="historial-footer-item">
                    <span class="material-symbols-rounded">calendar_today</span>
                    <span>${formatFechaHistorial(inc.fecha_cierre || inc.fecha)}</span>
                </div>
                ${nombreTecnico
                    ? `<div class="historial-footer-item">
                        <span class="material-symbols-rounded">person</span>
                        <span>${nombreTecnico}</span>
                       </div>`
                    : `<div class="historial-footer-item">
                        <span class="material-symbols-rounded">person_off</span>
                        <span>No asignado</span>
                       </div>`
                }
                ${tiempoRes
                    ? `<div class="historial-footer-item">
                        <span class="material-symbols-rounded">timer</span>
                        <span>Resuelto en ${tiempoRes}</span>
                       </div>`
                    : esCancelado
                        ? `<div class="historial-footer-item">
                            <span class="material-symbols-rounded">cancel</span>
                            <span>Cancelado por usuario</span>
                           </div>`
                        : ''
                }
                <div class="historial-footer-item">
                    <span class="material-symbols-rounded">apartment</span>
                    <span>${deptCap}</span>
                </div>
            </div>
        </div>`;
    }

    async function cargarHistorial() {
        const historialList = document.getElementById('historialList');
        if (!historialList) return;

        historialList.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-rounded" style="animation:spin 1s linear infinite">sync</span>
                <p>Cargando historial...</p>
            </div>`;

        try {
            const resp = await fetch(`/.netlify/functions/mis-incidentes?id_usuario${usuario.id}`);
            const data = await resp.json();

            if (!resp.ok) throw new Error(data.error || 'Error al cargar historial');

            const incidentes = data.incidentes || [];

            if (incidentes.length === 0) {
                historialList.innerHTML = `
                    <div class="empty-state">
                        <span class="material-symbols-rounded">history</span>
                        <h3>Sin historial</h3>
                        <p>Aquí aparecerán tus tickets cerrados o cancelados.</p>
                    </div>`;
            } else {
                historialList.innerHTML = incidentes.map(renderHistorialCard).join('');
            }

        } catch (err) {
            console.error(err);
            historialList.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded">error</span>
                    <p>Error al cargar el historial. Intenta recargar la página.</p>
                </div>`;
        }
    }

    // ============================================================
    // 10. TEMA (Modo Claro/Oscuro)
    // ============================================================
    function initTheme() {
        const body = document.body;
        const modeBtn = document.getElementById('modeToggleBtn');
        const modeIcon = document.getElementById('modeIcon');
        const modeText = document.getElementById('modeText');
        
        if (!modeBtn) return;
        
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            isDark = false;
            body.classList.remove('dark');
            body.classList.add('light');
            if (modeIcon) modeIcon.textContent = 'light_mode';
            if (modeText) modeText.textContent = 'Modo Claro';
        }
        
        modeBtn.addEventListener('click', () => {
            isDark = !isDark;
            body.classList.toggle('dark', isDark);
            body.classList.toggle('light', !isDark);
            
            if (modeIcon) modeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
            if (modeText) modeText.textContent = isDark ? 'Modo Oscuro' : 'Modo Claro';
            
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    // ============================================================
// 11. FORMULARIO DE REPORTE
// ============================================================
function initReportForm() {
    const dispositivoSelect = document.getElementById('dispositivo');
    const softwareGroup = document.getElementById('softwareProgramaGroup');
    const softwareSelect = document.getElementById('softwarePrograma');
    const reportForm = document.getElementById('reportForm');

    // Mostrar/ocultar campo de software
    if (dispositivoSelect && softwareGroup) {
        function toggleSoftwareGroup() {
            if (dispositivoSelect.value === "software") {
                softwareGroup.style.display = "block";
                if (softwareSelect) softwareSelect.required = true;
            } else {
                softwareGroup.style.display = "none";
                if (softwareSelect) {
                    softwareSelect.required = false;
                    softwareSelect.value = "";
                }
            }
        }

        dispositivoSelect.addEventListener("change", toggleSoftwareGroup);
        toggleSoftwareGroup();
    }
    
    // ==========================
    // ENVÍO DEL FORMULARIO
    // ==========================
    
    if (reportForm) {
        reportForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const usuarioActual = JSON.parse(
                localStorage.getItem("usuario")
            );

            if (!usuarioActual) {
                alert("No se encontró la sesión del usuario");
                window.location.href = "index.html";
                return;
            }

            const urgencia = document.getElementById("urgencia").value;
            const departamento = document.getElementById("departamento").value;
            const tipoProblema = document.getElementById("dispositivo").value;
            const descripcion = document.getElementById("descripcion").value.trim();
            
            let programa = null;
            
            // Si es software, obtener el programa seleccionado (solo para la columna programa)
            if (tipoProblema === "software") {
                programa = document.getElementById("softwarePrograma").value;
                
                if (!programa) {
                    alert("Por favor seleccione el programa/software afectado");
                    return;
                }
            }

            if (!urgencia || !departamento || !tipoProblema || !descripcion) {
                alert("Todos los campos deben estar llenos");
                return;
            }

            // Preparar datos para la tabla tickets
            // La descripción se guarda EXACTAMENTE como la escribió el usuario
            const ticketData = {
                descripcion: descripcion,  // Solo lo que el usuario escribió
                estado: "en espera",
                fecha: new Date().toISOString(),
                urgencia: urgencia,
                id_usuario: usuarioActual.id,
                departamento: departamento,
                tipo_problema: tipoProblema,
                programa: programa  // El programa se guarda en su propia columna
            };

            console.log("Enviando ticket:", ticketData);

            try {
                const response = await fetch("/.netlify/functions/reportar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ticketData)
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.error || "Error enviando reporte");
                    return;
                }

                console.log("Ticket creado:", data);
                
                mostrarToast("Reporte enviado correctamente");
                
                // Resetear formulario
                reportForm.reset();
                if (softwareGroup) softwareGroup.style.display = 'none';
                
                // Redirigir a vista de inicio después de 1 segundo
                setTimeout(() => {
                    const inicioLink = document.querySelector('[data-view="inicio"]');
                    if (inicioLink) {
                        document.querySelectorAll('.nav-link[data-view]').forEach(l => l.classList.remove('active'));
                        inicioLink.classList.add('active');
                        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                        const viewInicio = document.getElementById('view-inicio');
                        if (viewInicio) viewInicio.classList.add('active');
                        
                        const mobileTitle = document.getElementById('mobileViewTitle');
                        if (mobileTitle) mobileTitle.textContent = 'Mis Tickets';

                        cargarMisTickets();
                    }
                }, 1000);

            } catch (error) {
                console.error(error);
                alert("Error conectando con el servidor");
            }
        });
    }
}

    // ============================================================
    // 12. EJECUCIÓN DE INICIALIZACIÓN
    // ============================================================
    mostrarPerfilUsuario();
    initSidebar();
    initNavigation();
    initTickets();
    initCancelModal();
    initTheme();
    initReportForm();
    actualizarStats();

    // Exponer función irAReporte globalmente
    window.irAReporte = irAReporte;

    // Configurar botón de cierre de sesión
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }
});