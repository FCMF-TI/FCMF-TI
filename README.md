# Migración a Netlify Functions

## Estructura de archivos

```
netlify.toml
package.json
netlify/
  functions/
    _shared.js              ← Supabase + helpers CORS/JSON
    login.js
    reportar.js
    tickets-pendientes.js
    ticket-estado.js
    activos-departamento.js
    activos-estado.js
    cerrar-ticket.js
    mis-tickets.js
    cancelar-ticket.js
    mis-incidentes.js
```

---

## Tabla de equivalencias (rutas antiguas → nuevas)

| Método | Ruta Express original            | URL en Netlify                                          | Cambio en el frontend |
|--------|----------------------------------|---------------------------------------------------------|-----------------------|
| POST   | `/login`                         | `/.netlify/functions/login`                             | Ninguno               |
| POST   | `/reportar`                      | `/.netlify/functions/reportar`                          | Ninguno               |
| GET    | `/tickets-pendientes`            | `/.netlify/functions/tickets-pendientes`                | Ninguno               |
| PUT    | `/ticket/estado`                 | `/.netlify/functions/ticket-estado`                     | Cambiar URL           |
| GET    | `/activos/departamento/:dep`     | `/.netlify/functions/activos-departamento?departamento=XXX` | Cambiar a query string |
| PUT    | `/activos/estado`                | `/.netlify/functions/activos-estado`                    | Cambiar URL           |
| PUT    | `/cerrar-ticket`                 | `/.netlify/functions/cerrar-ticket`                     | Ninguno               |
| GET    | `/mis-tickets/:id_usuario`       | `/.netlify/functions/mis-tickets?id_usuario=XXX`        | Cambiar a query string |
| POST   | `/cancelar-ticket`               | `/.netlify/functions/cancelar-ticket`                   | Ninguno               |
| GET    | `/mis-incidentes/:id_usuario`    | `/.netlify/functions/mis-incidentes?id_usuario=XXX`     | Cambiar a query string |

> **Nota:** Las rutas con parámetros de tipo `:param` se convierten a query strings
> porque Netlify Functions estándar no soporta rutas dinámicas por defecto.

---

## Variables de entorno en Netlify

En **Site settings → Environment variables**, agrega:

```
SUPABASE_URL       = https://xxxx.supabase.co
SUPABASE_ANON_KEY  = eyJh...
```

---

## Pasos para desplegar

1. Copia todos estos archivos a la raíz de tu repositorio.
2. Sube los cambios a GitHub.
3. En Netlify, conecta el repositorio y despliega.
4. Agrega las variables de entorno (ver arriba).
5. Actualiza las URLs en tu frontend según la tabla de arriba.

---

## Tip: alias de rutas (opcional)

Si quieres mantener las rutas originales (ej. `/login` en vez de `/.netlify/functions/login`),
agrega esto en `netlify.toml`:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

Y llama a `/api/login`, `/api/reportar`, etc. desde tu frontend.
