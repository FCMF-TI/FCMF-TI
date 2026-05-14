// AI Assistant Login Form JavaScript
class AIAssistantLoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.submitButton = this.form.querySelector('.neural-button');
        this.successMessage = document.getElementById('successMessage');
        
        this.init();
    }
    
    init() {
        // ⚡ VERIFICAR SESIÓN NUEVAMENTE (por si acaso) ⚡
        if (this.verificarSesionRedirigir()) {
            return; // Detener inicialización si ya redirigió
        }
        
        this.bindEvents();
        this.setupPasswordToggle();
        this.setupSocialButtons();
        this.setupAIEffects();
    }
    
    // ⚡ NUEVO MÉTODO: Verificar sesión y redirigir ⚡
    verificarSesionRedirigir() {
        const usuario = localStorage.getItem("usuario");
        const tipo = localStorage.getItem("tipo");
        
        if (usuario && tipo) {
            const rutas = {
                admin: "admin.html",
                pasante: "pasante.html",
                usuario: "usuario.html"
            };
            
            const rutaDestino = rutas[tipo];
            if (rutaDestino) {
                // Mostrar mensaje opcional
                const mensaje = document.createElement('div');
                mensaje.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #10b981;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    z-index: 9999;
                    font-family: monospace;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    animation: fadeOut 2s ease forwards;
                `;
                mensaje.innerHTML = `✅ Sesión activa · Redirigiendo a ${rutaDestino}...`;
                document.body.appendChild(mensaje);
                
                // Agregar animación CSS
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes fadeOut {
                        0% { opacity: 1; transform: translateX(-50%) translateY(0); }
                        70% { opacity: 1; transform: translateX(-50%) translateY(0); }
                        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); visibility: hidden; }
                    }
                `;
                document.head.appendChild(style);
                
                setTimeout(() => {
                    window.location.href = rutaDestino;
                }, 1500);
                
                return true;
            }
        }
        return false;
    }
    
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.emailInput.addEventListener('input', () => this.clearError('email'));
        this.passwordInput.addEventListener('input', () => this.clearError('password'));
        
        this.emailInput.setAttribute('placeholder', ' ');
        this.passwordInput.setAttribute('placeholder', ' ');
    }
    
    setupPasswordToggle() {
        this.passwordToggle.addEventListener('click', () => {
            const type = this.passwordInput.type === 'password' ? 'text' : 'password';
            this.passwordInput.type = type;
            this.passwordToggle.classList.toggle('toggle-active', type === 'text');
        });
    }
    
    setupAIEffects() {
        [this.emailInput, this.passwordInput].forEach(input => {
            input.addEventListener('focus', (e) => {
                this.triggerNeuralEffect(e.target.closest('.smart-field'));
            });
        });
    }
    
    triggerNeuralEffect(field) {
        const indicator = field.querySelector('.ai-indicator');
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '';
        }, 2000);
    }
    
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showError('email', 'Neural access requires email address');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showError('email', 'Invalid email format detected');
            return false;
        }
        
        this.clearError('email');
        return true;
    }
    
    validatePassword() {
        const password = this.passwordInput.value;
        
        if (!password) {
            this.showError('password', 'Security key required for access');
            return false;
        }
        
        if (password.length < 6) {
            this.showError('password', 'Security key must be at least 6 characters');
            return false;
        }
        
        this.clearError('password');
        return true;
    }
    
    showError(field, message) {
        const smartField = document.getElementById(field).closest('.smart-field');
        const errorElement = document.getElementById(`${field}Error`);
        
        smartField.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    clearError(field) {
        const smartField = document.getElementById(field).closest('.smart-field');
        const errorElement = document.getElementById(`${field}Error`);
        
        smartField.classList.remove('error');
        errorElement.classList.remove('show');
        setTimeout(() => {
            errorElement.textContent = '';
        }, 200);
    }
    
    async handleSubmit(e) {
    e.preventDefault();

    const isEmailValid = this.validateEmail();
    const isPasswordValid = this.validatePassword();

    if (!isEmailValid || !isPasswordValid) {
        return;
    }

    this.setLoading(true);

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo: this.emailInput.value,
                password: this.passwordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.error && data.error.includes("Correo")) {
                this.showError('email', data.error);
            } else {
                this.showError('password', data.error || "Error en login");
            }
            return;
        }

        console.log("Login exitoso:", data);
        console.log("Tipo:", data.tipo);

        // Guardar datos
        localStorage.setItem("usuario", JSON.stringify(data.user));
        localStorage.setItem("tipo", data.tipo);

        // ✅ REDIRECCIÓN DIRECTA SIN ANIMACIÓN
        const rutas = {
            admin: "admin.html",
            pasante: "pasante.html",
            usuario: "usuario.html"
        };

        const ruta = rutas[data.tipo];
        if (ruta) {
            window.location.href = ruta;
        } else {
            console.error("Tipo no válido:", data.tipo);
        }

    } catch (error) {
        console.error(error);
        this.showError('password', 'Error de conexión con el servidor');
    } finally {
        this.setLoading(false);
    }
}

// ELIMINA COMPLETAMENTE la función showNeuralSuccess()
// showNeuralSuccess() { ... }  ← BORRAR ESTO
    
    setLoading(loading) {
        this.submitButton.classList.toggle('loading', loading);
        this.submitButton.disabled = loading;
    }
    
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AIAssistantLoginForm();
});