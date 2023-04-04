// SEGURIDAD: Si no se encuentra en localStorage info del usuario
// no lo deja acceder a la página, redirigiendo al login inmediatamente.
if(!localStorage.jwt) {
  location.replace("./index.html")
}


/* ------ comienzan las funcionalidades una vez que carga el documento ------ */
window.addEventListener('load', function () {

  /* ---------------- variables globales y llamado a funciones ---------------- */
    const URL = "https://todo-api.ctd.academy/v1"
    const uriGetUser = URL + "/users/getMe"
    const uriTasks =  URL + "/tasks"
    const token = localStorage.jwt

    // const uriTasksId =  `${uriTasks}/{${id}}`

    const btnCerrarSesion = document.querySelector("#closeApp")
    const formCrearTarea = document.querySelector(".nueva-tarea")
    const nuevaTarea = document.querySelector("#nuevaTarea")

    obtenerNombreUsuario()
    consultarTareas()


  /* -------------------------------------------------------------------------- */
  /*                          FUNCIÓN 1 - Cerrar sesión                         */
  /* -------------------------------------------------------------------------- */

  btnCerrarSesion.addEventListener('click', function () {
    const cerrarSesion = confirm("¿Está seguro de que desea cerrar sesión?")

    if (cerrarSesion) {
      localStorage.clear()
      location.replace("./index.html")
      // location.reload("./index.html")
    }
  });

  /* -------------------------------------------------------------------------- */
  /*                 FUNCIÓN 2 - Obtener nombre de usuario [GET]                */
  /* -------------------------------------------------------------------------- */

  function obtenerNombreUsuario() {
    const settings = {
      method: 'GET',
      headers: {
        authorization: token
      }
    }
     console.log("Consultando datos de usuario...");
     fetch(uriGetUser, settings)
      .then(response => response.json())
      .then( data => {
        console.log("Nombre de usuario: ");
        console.log(data);
        const nombreUsuario = document.querySelector(".user-info p")
        nombreUsuario.textContent = data.firstName || "UserName"
      })
      .catch(err => console.log(err))
  };


  /* -------------------------------------------------------------------------- */
  /*                 FUNCIÓN 3 - Obtener listado de tareas [GET]                */
  /* -------------------------------------------------------------------------- */

  function consultarTareas() {
  const settings = {
    method: 'GET',
    headers: {
      authorization: token
    }
  }
  console.log("Consultando mis tareas...");
  fetch(uriTasks, settings)
    .then(response => response.json())
    .then( tareas => {
      console.log("Tareas  del usuario");
      console.log(tareas);

      renderizarTareas(tareas)
      botonesCambioEstado()
      botonBorrarTarea()

    } )
    .catch(err => console.log(err))
    
  };


  /* -------------------------------------------------------------------------- */
  /*                    FUNCIÓN 4 - Crear nueva tarea [POST]                    */
  /* -------------------------------------------------------------------------- */

  formCrearTarea.addEventListener('submit', function (event) {
    event.preventDefault()
    console.log("Crear tarea");
    console.log(nuevaTarea.value);

    const payload = {
      description: nuevaTarea.value.trim()
    }
    const settings = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        authorization: token
      }, 
    }

    console.log("Creando una tarea en la DB");
    fetch(uriTasks, settings)
      .then( response => response.json())
      .then( tarea => {
        console.log(tarea);
        consultarTareas()
      })
      .catch(err => console.log(err))

      // limpio el formulario 
      formCrearTarea.reset()
  });


  /* -------------------------------------------------------------------------- */
  /*                  FUNCIÓN 5 - Renderizar tareas en pantalla                 */
  /* -------------------------------------------------------------------------- */
  function renderizarTareas(listado) {
    // obtengo listados, y limpio cualquier contenido interno
    const tareasPendientes = document.querySelector(".tareas-pendientes")
    const tareasTerminadas = document.querySelector(".tareas-terminadas")
    tareasPendientes.innerHTML = ""
    tareasTerminadas.innerHTML = ""

    // Buscamos el numero de finalizados. 
    const numeroFinalizadas = document.querySelector("#cantidad-finalizadas")
    let contador = 0
    numeroFinalizadas.innerHTML = contador

    listado.forEach(tarea => {
      //tarea intermedia para analizar la fecha
      let fecha = new Date(tarea.createdAt);
      if (tarea.completed) {
        contador++
        tareasTerminadas.innerHTML  += `
           <li class="tarea">
            <div class="hecha">
              <i class="fa-regular fa-circle-check"></i>
            </div>
            <div class="descripcion">
              <p class="nombre">${tarea.description}</p>
              <div class="cambios-estados">
                <button class="change incompleta" id="${tarea.id}" ><i class="fa-solid fa-rotate-left"></i></button>
                <button class="borrar" id="${tarea.id}"><i class="fa-regular fa-trash-can"></i></button>
              </div>
            </div>
          </li>
        `
      } else {
        tareasPendientes.innerHTML += `
              <li class="tarea">
                <button class="change" id="${tarea.id}"><i class="fa-regular fa-circle"></i></button>
                <div class="descripcion">
                  <p class="nombre">${tarea.description}</p>
                  <p class="timestamp">${fecha.toLocaleDateString()}</p>
                </div>
              </li>
                        `
      }
      //  actualizar el contador en la pantalla 
      numeroFinalizadas.innerHTML = contador
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                  FUNCIÓN 6 - Cambiar estado de tarea [PUT]                 */
  /* -------------------------------------------------------------------------- */
  function botonesCambioEstado() {   
    const btnCambioEstado = document.querySelectorAll(".change")

    btnCambioEstado.forEach( boton => {
      // a cada boton le agrego la funcionalidad 
      boton.addEventListener("click", function (event) {
        console.log("Cambia ndo el estado de la tarea...");
        console.log(event.target);
        // console.log(event.target.id);

        const id = event.target.id
        const uriTareaId = `${uriTasks}/${id}`
        const payload = {}

        //segun el tipo de boton que fue clickeado, cambiamos el estado de la tarea
        if (event.target.classList.contains("incompleta")) {
          // Si la tarea está completada, le paso a pendiente
          payload.completed = false
        } else {
          // sino, la tarea está pendiente y la paso a completada
          payload.completed = true
        }
        console.log(payload);

        const settings = {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            authorization: token
          }, 
          body: JSON.stringify(payload),
        }
        // hacemos el fetch
        fetch(uriTareaId, settings)
          .then( response => {
            console.log(response.status);
            // Vuelvo a consultar las tareas actualizadas y pintarlas nuevamente en pantalla
            consultarTareas() 
          })
          .catch( err => console.log(err) )
      })
    })



  }


  /* -------------------------------------------------------------------------- */
  /*                     FUNCIÓN 7 - Eliminar tarea [DELETE]                    */
  /* -------------------------------------------------------------------------- */
  function botonBorrarTarea() {
   
    

    

  };

});