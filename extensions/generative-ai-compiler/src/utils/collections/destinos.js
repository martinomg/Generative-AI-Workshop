import axios from 'axios'
import { firstJson } from 'log-parsed-json';

const sample = {
    "data": [
        {
            "nombre": "Petra, Jordania",
            "descripcion": "Petra, una de las nuevas Siete Maravillas del Mundo, es una antigua ciudad excavada en piedra rosa en el desierto jordano. Esta ciudad arqueológica, que fue un importante centro comercial en la antigüedad, ofrece monumentos impresionantes como el Tesoro y el Monasterio, ambos tallados en acantilados de roca. Los visitantes pueden explorar el desfiladero del Siq y descubrir la rica historia de este icónico destino."
        },
        {
            "nombre": "Kyoto, Japón",
            "descripcion": "Kyoto es una ciudad rica en cultura e historia, conocida por sus templos antiguos, jardines zen y casas de té tradicionales. Famosa por sus flores de cerezo en primavera, Kyoto ofrece una experiencia auténtica de la cultura japonesa. Entre sus principales atracciones se encuentran el Templo Kinkaku-ji (Pabellón Dorado) y el Santuario Fushimi Inari con sus miles de puertas torii rojas."
        }
    ]
}

const generar_destinos = async({
    context,
    cantidad
}) => {

    const {env} = context
    const {GEMINI_KEY} = env

    const { services, getSchema } = context
    const { ItemsService } = services
    const schema = await getSchema()
    const DestinosService = new ItemsService('destinos', {
        schema
    })

    const destinos_existentes = await DestinosService.readByQuery({
        limit: -1,
        fields: ['nombre']
    })

    const nombres_destinos_existentes = destinos_existentes.map(destino=>{
        return destino.nombre
    })

    const nombres_texto = nombres_destinos_existentes.join('\n')


    const payload = {
        "system_instruction": {
        "parts":
            { 
                "text": `
                Eres un agente que lista destinos turísticos paradisíacos no existentes en la base actual de destinos.
                Los destinos que existen son:
                ${nombres_texto}
                
                Los destinos que definas debes hacerlo siguiendo la siguiente estructura de datos:
                \`\`\`json
                ${JSON.stringify(sample)}
                \`\`\`
                
                El usuario te dirá una cantidad de destinos a generar y tú debes generar una lista en formato JSON dentro de un json codeblock al igual que el ejemplo.                `
            }
        },
        "contents":[
            {
                "parts":[
                    {
                        "text":`genera ${cantidad} destinos`
                    }
                ]
            }
        ]
    }

    const nuestro_key = GEMINI_KEY;

    try {
        const {data} = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${nuestro_key}`, payload)
        const respuesta_gemini = data.candidates[0].content.parts[0].text
        const respuesta_gemini_json = JSON.parse(firstJson(respuesta_gemini))
        const {data:datos_importar} = respuesta_gemini_json
        
        if(datos_importar && Array.isArray(datos_importar) && datos_importar.length){
            await DestinosService.createMany(datos_importar)
            console.log('destinos generados')
        }

    } catch (error) {
        console.error('@generar_destinos', error)
    }

    return; 
}


const generar_activides_destinos_para_destinos_pendientes = async({
    context,
    cantidad_destinos = 1,
    cantidad_actividades = 5
}) => {
    const {env} = context
    const {GEMINI_KEY} = env
    const nuestro_key = GEMINI_KEY;
    const { services, getSchema } = context
    const { ItemsService } = services
    const schema = await getSchema()

    const DestinosService = new ItemsService('destinos', {
        schema
    })
    const ActividadesService = new ItemsService('actividades', {
        schema
    })

    const destinos_pendientes = await DestinosService.readByQuery({
        fields: ['id','nombre'],
        limit: cantidad_destinos,
        filter: {
            actividades: {
                _null: true
            }
        }
    })


    const muestra_actividades = {
        data: [
            {
                "id_destino": "2d6a635e-...",
                "nombre_actividad": "Aurora Boreal",
                "descripcion_actividad": "Reikiavik es uno de los mejores lugares del mundo para observar la aurora boreal, un fenómeno natural de luces danzantes en el cielo nocturno que se puede disfrutar durante los meses de invierno.",
                "numero_actividad": 1
            }
        ]
    }

    const payload = {
        "system_instruction": {
        "parts":
            { 
                "text": `
                Eres un agente que enriquece destinos con actividades.
                Los destinos se definen en el siguiente formato
                \`\`\`json  
                ${JSON.stringify(muestra_actividades)}
                \`\`\`
                Algunos guidelines para los campos:
                - El campo "descripcion" debe ser de tamaño medio-pequeño como está en el ejemplo
                - El campo "descripcion" no debe tener estilos como negritas, cursivas ni nada. Sólo texto plano.
                
                El usuario te entregará una lista de destinos con sus identificadores únicos y una cantidad de actividades que debes generar por destino.
                Tu debes generar la lista de destinos en el formato entregado en JSON dentro de un codeblock como en la referencia.`
            }
        },
        // - El campo "descripcion" debe ser funcional, no uses palabras expresiones como "Disfruta" ni "Relájate". Debe ser más como de wikipedia.
        "contents":[
            {
                "role":"user",
                "parts":[
                    {
                        "text":`
                        Genera ${cantidad_actividades} actividades para uno de los siguientes destinos:
                        ${JSON.stringify(destinos_pendientes)}
                        `
                    }
                ],
            },
        ]
    }

    try {
        const {data} = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${nuestro_key}`, payload)
        const respuesta_gemini = data.candidates[0].content.parts[0].text
        const respuesta_gemini_json = JSON.parse(firstJson(respuesta_gemini))
        const {data:datos_importar} = respuesta_gemini_json
        
        if(datos_importar && Array.isArray(datos_importar) && datos_importar.length){

            console.log('destintos trabajados', destinos_pendientes, datos_importar.length)

            const datos_finales = datos_importar.map(actividad => {
                return {
                    destino: actividad.id_destino,
                    nombre: actividad.nombre_actividad,
                    descripcion: actividad.descripcion_actividad
                }
            })

            await ActividadesService.createMany(datos_finales)

            // console.log('actividades generadas', datos_finales)
        }

    } catch (error) {
        console.error('@generar_activides_destinos_para_destinos_pendientes', error)
    }

    console.log('generando actividades',{
        destinos: destinos_pendientes.length,
        actividades: cantidad_actividades,
    })


    return;
}


export default {
    generar_destinos,
    generar_activides_destinos_para_destinos_pendientes
}