// ==========================
// ADMIN.JS - PANEL DE ADMINISTRADOR
// ==========================

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================
    // VERIFICAR SESIÓN Y TIPO DE USUARIO
    // ==========================
    
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const tipo = localStorage.getItem("tipo");

    // Si no hay sesión iniciada
    if (!usuario) {
        alert("Debe iniciar sesión primero");
        window.location.href = "login.html";
        return;
    }

    // Si no es administrador, redirigir según su tipo
    if (tipo !== "admin") {
        if (tipo === "pasante") {
            alert("Acceso denegado. Esta página es solo para administradores.");
            window.location.href = "pasante.html";
        } else if (tipo === "usuario") {
            alert("Acceso denegado. Esta página es solo para administradores.");
            window.location.href = "usuario.html";
        } else {
            window.location.href = "login.html";
        }
        return;
    }

    console.log(`Bienvenido administrador: ${usuario.correo}`);

    // ==========================
    // FUNCIÓN CERRAR SESIÓN
    // ==========================
    
    function cerrarSesion() {
        // Limpiar todos los datos de sesión
        localStorage.clear();
        
        // Limpiar sessionStorage si usas
        sessionStorage.clear();
        
        // Mostrar mensaje de confirmación
        alert("🔒 Sesión cerrada correctamente");
        
        // Redirigir al login
        window.location.href = "login.html";
    }
    
    // ==========================
    // BOTÓN CERRAR SESIÓN
    // ==========================
    
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }

    // ==========================
    // CONFIGURACIÓN DEL SIDEBAR (si tiene)
    // ==========================
    
    const sidebar = document.getElementById("sidebar");
    const sidebarToggler = document.getElementById("sidebarToggler");
    const menuToggler = document.getElementById("menuToggler");

    if (sidebarToggler) {
        sidebarToggler.addEventListener("click", () => {
            if (sidebar) {
                sidebar.classList.toggle("collapsed");
                
                // Cambiar ícono del botón
                const icon = sidebarToggler.querySelector("span");
                if (sidebar.classList.contains("collapsed")) {
                    icon.innerText = "chevron_right";
                } else {
                    icon.innerText = "chevron_left";
                }
            }
        });
    }

    if (menuToggler) {
        menuToggler.addEventListener("click", () => {
            if (sidebar) {
                const isActive = sidebar.classList.toggle("menu-active");
                const icon = menuToggler.querySelector("span");
                icon.innerText = isActive ? "close" : "menu";
                
                // Ajustar altura para móvil
                if (isActive) {
                    sidebar.style.height = `${sidebar.scrollHeight}px`;
                } else {
                    sidebar.style.height = "";
                }
            }
        });
    }

    // Al redimensionar ventana, resetear estados móviles
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 1024) {
            if (sidebar) {
                sidebar.classList.remove("menu-active");
                sidebar.style.height = "";
            }
            if (menuToggler) {
                menuToggler.querySelector("span").innerText = "menu";
            }
        } else {
            if (sidebar) {
                sidebar.classList.remove("collapsed");
            }
        }
    });

    // ==========================
    // NAVEGACIÓN ENTRE SECCIONES
    // ==========================
    
    // Marcar enlace activo al hacer clic
    document.querySelectorAll('.nav-link').forEach(link => {
        // Saltar el botón de cerrar sesión
        if (link.id === 'logoutBtn') return;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover active de todos
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            // Agregar active al clickeado
            link.classList.add('active');
            
            // Obtener la sección seleccionada
            const seccion = link.querySelector('.nav-label')?.innerText;
            console.log(`Navegando a: ${seccion}`);
            
            // Cargar contenido según la sección
            cargarSeccion(seccion);
        });
    });

    // ==========================
    // FUNCIÓN PARA CARGAR SECCIONES
    // ==========================
    
    function cargarSeccion(seccion) {
        const mainContent = document.getElementById("mainContent");
        
        if (!mainContent) return;
        
        switch(seccion) {
            case "Tickets":
                cargarTickets();
                break;
            case "Historial":
                cargarHistorial();
                break;
            case "Base de Datos":
                cargarBaseDatos();
                break;
            case "Perfil":
                cargarPerfil();
                break;
            default:
                cargarTickets();
        }
    }

    // ==========================
    // FUNCIONES PARA CADA SECCIÓN
    // ==========================
    
    async function cargarTickets() {
        const mainContent = document.getElementById("mainContent");
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="loading">
                <p>Cargando tickets pendientes...</p>
            </div>
        `;
        
        try {
            // Aquí iría tu llamada a la API
            // const response = await fetch("http://localhost:3000/admin/tickets");
            // const tickets = await response.json();
            
            // Datos de ejemplo
            const tickets = [
                { id: 1, usuario: "juan.perez@ug.edu.ec", urgencia: "alta", tipo: "pc", estado: "pendiente", fecha: "2024-01-15" },
                { id: 2, usuario: "maria.garcia@ug.edu.ec", urgencia: "media", tipo: "impresora", estado: "en proceso", fecha: "2024-01-14" },
                { id: 3, usuario: "carlos.lopez@ug.edu.ec", urgencia: "critica", tipo: "red", estado: "pendiente", fecha: "2024-01-13" }
            ];
            
            if (tickets.length === 0) {
                mainContent.innerHTML = '<div class="no-data"><p>No hay tickets pendientes</p></div>';
                return;
            }
            
            mainContent.innerHTML = `
                <div class="tickets-table">
                    <h2>Tickets Pendientes</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Urgencia</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tickets.map(ticket => `
                                <tr>
                                    <td>${ticket.id}</td>
                                    <td>${ticket.usuario}</td>
                                    <td><span class="badge ${ticket.urgencia}">${ticket.urgencia}</span></td>
                                    <td>${ticket.tipo}</td>
                                    <td><span class="status ${ticket.estado}">${ticket.estado}</span></td>
                                    <td>${ticket.fecha}</td>
                                    <td>
                                        <button class="btn-view" data-id="${ticket.id}">Ver</button>
                                        <button class="btn-assign" data-id="${ticket.id}">Asignar</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            // Agregar event listeners a los botones
            document.querySelectorAll('.btn-view').forEach(btn => {
                btn.addEventListener('click', () => verTicket(btn.dataset.id));
            });
            
            document.querySelectorAll('.btn-assign').forEach(btn => {
                btn.addEventListener('click', () => asignarTicket(btn.dataset.id));
            });
            
        } catch (error) {
            console.error("Error cargando tickets:", error);
            mainContent.innerHTML = '<div class="error"><p>Error al cargar los tickets</p></div>';
        }
    }
    
    async function cargarHistorial() {
        const mainContent = document.getElementById("mainContent");
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="loading">
                <p>Cargando historial...</p>
            </div>
        `;
        
        try {
            // Aquí cargarías el historial desde la API
            mainContent.innerHTML = `
                <div class="history-section">
                    <h2>Historial de Incidentes</h2>
                    <div class="filters">
                        <input type="text" placeholder="Buscar..." id="searchInput">
                        <select id="filterStatus">
                            <option value="">Todos</option>
                            <option value="resuelto">Resueltos</option>
                            <option value="cerrado">Cerrados</option>
                        </select>
                    </div>
                    <div class="history-list">
                        <p>Aquí se mostrará el historial de tickets resueltos</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error("Error cargando historial:", error);
            mainContent.innerHTML = '<div class="error"><p>Error al cargar el historial</p></div>';
        }
    }
    
    async function cargarBaseDatos() {
        const mainContent = document.getElementById("mainContent");
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="database-section">
                <h2>Gestión de Base de Datos</h2>
                <div class="db-options">
                    <button class="db-btn" id="backupBtn">💾 Respaldo de Base de Datos</button>
                    <button class="db-btn" id="restoreBtn">🔄 Restaurar Datos</button>
                    <button class="db-btn" id="statsBtn">📊 Estadísticas</button>
                </div>
                <div class="db-stats">
                    <p>Selecciona una opción para continuar...</p>
                </div>
            </div>
        `;
        
        // Agregar event listeners
        document.getElementById("backupBtn")?.addEventListener("click", () => {
            alert("Función de respaldo en desarrollo");
        });
        
        document.getElementById("restoreBtn")?.addEventListener("click", () => {
            alert("Función de restauración en desarrollo");
        });
        
        document.getElementById("statsBtn")?.addEventListener("click", () => {
            alert("Estadísticas en desarrollo");
        });
    }
    
    async function cargarPerfil() {
        const mainContent = document.getElementById("mainContent");
        if (!mainContent) return;
        
        const usuarioActual = JSON.parse(localStorage.getItem("usuario"));
        
        mainContent.innerHTML = `
            <div class="profile-section">
                <h2>Mi Perfil</h2>
                <div class="profile-card">
                    <div class="profile-info">
                        <p><strong>Correo:</strong> ${usuarioActual?.correo || "No disponible"}</p>
                        <p><strong>Tipo:</strong> Administrador</p>
                        <p><strong>ID:</strong> ${usuarioActual?.id || "No disponible"}</p>
                    </div>
                    <div class="profile-actions">
                        <button id="changePasswordBtn" class="btn-primary">Cambiar Contraseña</button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById("changePasswordBtn")?.addEventListener("click", () => {
            alert("Funcionalidad de cambio de contraseña en desarrollo");
        });
    }
    
    function verTicket(id) {
        alert(`Ver detalles del ticket ${id}`);
        // Aquí iría la lógica para ver el ticket
    }
    
    function asignarTicket(id) {
        alert(`Asignar ticket ${id} a un técnico`);
        // Aquí iría la lógica para asignar el ticket
    }
    
    // Inicializar cargando tickets
    cargarTickets();

});