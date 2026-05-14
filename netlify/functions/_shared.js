import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

/** Cabeceras CORS estándar */
export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
};

/** Respuesta JSON lista para devolver a Netlify */
export function json(statusCode, body) {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body),
    };
}

/** Manejo de preflight CORS (OPTIONS) */
export function handleOptions() {
    return { statusCode: 204, headers: corsHeaders, body: "" };
}
