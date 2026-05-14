// session-manager.js - Incluir en TODAS las páginas protegidas

function verificarExpiracionSesion() {
    const usuario = localStorage.getItem("usuario");
    const tipo = localStorage.getItem("tipo");
    const expiracion = localStorage.getItem("sesion_expiracion");
    
    if (!usuario || !tipo) {
        return false; // No hay sesión
    }
    
    // Si hay expiración configurada y ya pasó el tiempo
    if (expiracion && Date.now() > parseInt(expiracion)) {
        console.log("Sesión expirada");
        cerrarSesion("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        return false;
    }
    
    return true; // Sesión válida
}

function cerrarSesion(mensaje = "Sesión cerrada") {
    localStorage.removeItem("usuario");
    localStorage.removeItem("tipo");
    localStorage.removeItem("sesion_expiracion");
    
    if (mensaje) {
        alert(mensaje);
    }
    
    window.location.href = "index.html";
}

// Ejecutar verificación al cargar cualquier página protegida
if (window.location.pathname !== "/index.html" && 
    !window.location.pathname.includes("index.html")) {
    verificarExpiracionSesion();
}