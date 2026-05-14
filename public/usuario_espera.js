document.addEventListener("DOMContentLoaded", () => {

    const usuario = JSON.parse(
        localStorage.getItem("usuario")
    );

    if (!usuario) {

        window.location.href = "login.html";
        return;

    }

    // Ejecutar al cargar
    obtenerEstado();

    // Ejecutar cada 5 segundos
    setInterval(obtenerEstado, 5000);



    async function obtenerEstado() {

        try {

            const response = await fetch(

                `http://localhost:3000/estado-ticket/${usuario.id}`

            );

            const data = await response.json();

            if (!response.ok) {

                console.error(data.error);
                return;

            }

            const estado = data.estado;

            const divEspera =
                document.getElementById("estadoEspera");

            const divIntervencion =
                document.getElementById("estadoIntervencion");


            // Resetear vista
            divEspera.style.display = "none";
            divIntervencion.style.display = "none";


            // Mostrar según estado

            if (estado === "en espera") {

                divEspera.style.display = "flex";

            }

            else if (estado === "en intervencion") {

                divIntervencion.style.display = "flex";

            }

        }

        catch (error) {

            console.error(
                "Error obteniendo estado:",
                error
            );

        }

    }

});