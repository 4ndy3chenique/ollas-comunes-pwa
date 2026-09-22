import { useState, type FormEvent } from 'react'

import type { Beneficiary } from '../types/beneficiary'

import { useDniValidation } from '../hooks/useDniValidation'


// Estado inicial del formulario

const inicial: Beneficiary = {
  dni: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  direccion: '',
  telefono: '',
}


export default function BeneficiaryForm() {

  // Función de validación del DNI

  const { validarDni } = useDniValidation()


  // Estado del formulario

  const [datos, setDatos] = useState<Beneficiary>(inicial)


  // Estado de errores

  const [errores, setErrores] =
    useState<Partial<Record<keyof Beneficiary, string>>>({})


  // Beneficiarios registrados temporalmente

  const [registrados, setRegistrados] =
    useState<Beneficiary[]>([])


  // Mensaje de confirmación

  const [mensaje, setMensaje] = useState('')


  // Actualizar los datos ingresados

  const actualizar = (
    campo: keyof Beneficiary,
    valor: string
  ) => {

    setDatos((prev) => ({
      ...prev,
      [campo]: valor
    }))

    setErrores((prev) => ({
      ...prev,
      [campo]: undefined
    }))

    setMensaje('')

  }


  // Registrar beneficiario

  const registrar = (evento: FormEvent<HTMLFormElement>) => {

    evento.preventDefault()

    const nuevosErrores:
      Partial<Record<keyof Beneficiary, string>> = {}


    // Validar DNI

    const resultadoDni = validarDni(datos.dni)

    if (!resultadoDni.valido) {

      nuevosErrores.dni = resultadoDni.mensaje

    }


    // Validar nombres

    if (!datos.nombres.trim()) {

      nuevosErrores.nombres = 'Ingresa los nombres.'

    }


    // Validar apellidos

    if (!datos.apellidos.trim()) {

      nuevosErrores.apellidos = 'Ingresa los apellidos.'

    }


    // Validar fecha de nacimiento

    if (!datos.fechaNacimiento) {

      nuevosErrores.fechaNacimiento =
        'Selecciona la fecha de nacimiento.'

    } else if (
      datos.fechaNacimiento >
      new Date().toISOString().slice(0, 10)
    ) {

      nuevosErrores.fechaNacimiento =
        'La fecha no puede ser futura.'

    }


    // Validar dirección

    if (!datos.direccion.trim()) {

      nuevosErrores.direccion = 'Ingresa la dirección.'

    }


    // Validar teléfono

    if (
      datos.telefono &&
      !/^\d{9}$/.test(datos.telefono)
    ) {

      nuevosErrores.telefono =
        'El teléfono debe tener 9 números.'

    }


    // Evitar DNI duplicado

    if (
      resultadoDni.valido &&
      registrados.some(
        (persona) => persona.dni === datos.dni
      )
    ) {

      nuevosErrores.dni =
        'Este DNI ya se encuentra registrado.'

    }


    // Guardar errores

    setErrores(nuevosErrores)


    // Detener si existen errores

    if (Object.keys(nuevosErrores).length > 0) {

      return

    }


    // Registrar beneficiario

    setRegistrados((prev) => [
      { ...datos },
      ...prev
    ])


    // Limpiar formulario

    setDatos(inicial)


    // Mostrar confirmación

    setMensaje(
      'Beneficiario registrado correctamente.'
    )

  }


  // Limpiar formulario manualmente

  const limpiarFormulario = () => {

    setDatos(inicial)

    setErrores({})

    setMensaje('')

  }


  return (

    <div className="app">

      {/* CABECERA */}

      <header className="cabecera">

        <div className="marca">

          <span className="marca-icono">
            ✳
          </span>

          <div>

            <strong>
              Ollas Comunes
            </strong>

            <small>
              Gestión de beneficiarios
            </small>

          </div>

        </div>

      </header>


      {/* CONTENIDO PRINCIPAL */}

      <main className="contenedor">

        <div className="intro">

          <span className="seccion">
            EMPADRONAMIENTO
          </span>

          <h1>
            Registro de beneficiarios
          </h1>

          <p>
            Ingresa la información de las personas
            que participan en la olla común.
          </p>

        </div>


        <div className="columnas">


          {/* FORMULARIO DE BENEFICIARIOS */}

          <section className="tarjeta">

            <div className="tarjeta-encabezado">

              <h2>
                Nuevo beneficiario
              </h2>

            </div>


            <form
              onSubmit={registrar}
              noValidate
            >


              {/* DNI */}

              <div className="campo">

                <label htmlFor="dni">
                  DNI *
                </label>

                <input
                  id="dni"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Ej. 12345678"
                  value={datos.dni}
                  onChange={(e) =>
                    actualizar('dni', e.target.value)
                  }
                  aria-invalid={!!errores.dni}
                />

                {errores.dni && (

                  <small className="error">
                    {errores.dni}
                  </small>

                )}

              </div>


              {/* NOMBRES Y APELLIDOS */}

              <div className="fila">


                <div className="campo">

                  <label htmlFor="nombres">
                    Nombres *
                  </label>

                  <input
                    id="nombres"
                    placeholder="Nombres"
                    value={datos.nombres}
                    onChange={(e) =>
                      actualizar(
                        'nombres',
                        e.target.value
                      )
                    }
                  />

                  {errores.nombres && (

                    <small className="error">
                      {errores.nombres}
                    </small>

                  )}

                </div>


                <div className="campo">

                  <label htmlFor="apellidos">
                    Apellidos *
                  </label>

                  <input
                    id="apellidos"
                    placeholder="Apellidos"
                    value={datos.apellidos}
                    onChange={(e) =>
                      actualizar(
                        'apellidos',
                        e.target.value
                      )
                    }
                  />

                  {errores.apellidos && (

                    <small className="error">
                      {errores.apellidos}
                    </small>

                  )}

                </div>

              </div>


              {/* FECHA Y TELÉFONO */}

              <div className="fila">


                <div className="campo">

                  <label htmlFor="fecha">
                    Fecha de nacimiento *
                  </label>

                  <input
                    id="fecha"
                    type="date"
                    max={
                      new Date()
                        .toISOString()
                        .slice(0, 10)
                    }
                    value={datos.fechaNacimiento}
                    onChange={(e) =>
                      actualizar(
                        'fechaNacimiento',
                        e.target.value
                      )
                    }
                  />

                  {errores.fechaNacimiento && (

                    <small className="error">
                      {errores.fechaNacimiento}
                    </small>

                  )}

                </div>


                <div className="campo">

                  <label htmlFor="telefono">
                    Teléfono (opcional)
                  </label>

                  <input
                    id="telefono"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="Ej. 987654321"
                    value={datos.telefono}
                    onChange={(e) =>
                      actualizar(
                        'telefono',
                        e.target.value
                      )
                    }
                  />

                  {errores.telefono && (

                    <small className="error">
                      {errores.telefono}
                    </small>

                  )}

                </div>

              </div>


              {/* DIRECCIÓN */}

              <div className="campo">

                <label htmlFor="direccion">
                  Dirección *
                </label>

                <input
                  id="direccion"
                  placeholder="Distrito, calle o referencia"
                  value={datos.direccion}
                  onChange={(e) =>
                    actualizar(
                      'direccion',
                      e.target.value
                    )
                  }
                />

                {errores.direccion && (

                  <small className="error">
                    {errores.direccion}
                  </small>

                )}

              </div>


              {/* BOTONES */}

              <div className="acciones">

                <button
                  className="secundario"
                  type="button"
                  onClick={limpiarFormulario}
                >

                  Limpiar

                </button>


                <button
                  className="primario"
                  type="submit"
                >

                  Registrar beneficiario →

                </button>

              </div>


              {/* MENSAJE DE CONFIRMACIÓN */}

              {mensaje && (

                <p
                  className="exito"
                  role="status"
                >

                  ✓ {mensaje}

                </p>

              )}


            </form>

          </section>


          {/* CONTADOR DE BENEFICIARIOS */}

          <aside className="lateral">

            <div className="resumen">

              <span>
                BENEFICIARIOS REGISTRADOS
              </span>

              <strong>
                {registrados.length}
              </strong>

              <p>
                Total de beneficiarios registrados
                durante la sesión actual.
              </p>

            </div>

          </aside>


        </div>

      </main>


      {/* PIE DE PÁGINA */}

      <footer>

        Ollas Comunes PWA |
        Sistema de Gestión de Beneficiarios

      </footer>

    </div>

  )

}