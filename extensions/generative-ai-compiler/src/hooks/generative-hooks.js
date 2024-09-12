import mensajes from "../utils/collections/mensajes.js"
import destinos from "../utils/collections/destinos.js";
import validate_json_schema from "../utils/helpers/validate_json_schema.js";
import axios from 'axios'

// import {readPdfText} from 'pdf-text-reader';
import { fileURLToPath } from 'url';

const l2DistanceSquared = (vector1, vector2) => {
    if (vector1.length !== vector2.length) {
        throw new Error('Vectors must have the same length');
    }
    return vector1.reduce((sum, value, index) => {
        const diff = value - vector2[index];
        return sum + diff * diff;
    }, 0);
};

const calculateAndSortDistances = (inputVector, vectorObjects, distanceFunction) => {
    return vectorObjects.map((obj) => ({
        ...obj,
        distance: distanceFunction(inputVector, obj.vector)
    }))
    .sort((a, b) => a.distance - b.distance);
    
};



const generar_vector_destino = async({
    context,
    id_destino,
    documento
}) => {
    

    const {env} = context
    const { GEMINI_KEY } = env
    const key_gemini = GEMINI_KEY;
    const url_embedding_gemini = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${key_gemini}`

    try {
        const { services, getSchema } = context
        const { ItemsService } = services
        const schema = await getSchema()
        const DestinosService = new ItemsService('destinos', {
            schema
        })

        const {data} = await axios.post(url_embedding_gemini, {
            "model": "models/text-embedding-004",
            "content": {
                "parts":[
                    {
                        "text": documento
                    }
                ]
            }
        })

        const vector = data.embedding.values

        await DestinosService.updateOne(id_destino, {
            vector
        })

        // console.log('vector generado', vector)


    } catch (error) {
        console.error('@generar_vector_destino', error)
    }
   
    return true
}

export default ({ filter, action, schedule }, context) => {


    schedule('*/5 * * * * *', async()=> {

        try {
            const schema = {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "title": "Generated schema for Root",
                "type": "object",
                "properties": {
                    "title":{
                        default: "asd"
                    },
                  "data": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "destino_id": {
                          "type": "string"
                        },
                        "descripcion": {
                          "type": "string",
                          "default": "Hola a todos"
                        }
                      },
                      "required": [
                        "destino_id",
                      ]
                    }
                  }
                },
                "required": [
                  "data"
                ]
            }
    
    
            console.log('res', validate_json_schema(schema,
                {
                    data: [
                        {
                            destino_id: 'aaui',
                        }
                    ]
                }
            ).data)
        } catch (error) {
            console.error('@validate', error)   
        }
        

    })


    schedule('*/15 * * * * *', async()=> {

        try {
            // const {generar_activides_destinos_para_destinos_pendientes} = destinos
            await generar_activides_destinos_para_destinos_pendientes({
                context,
                cantidad_destinos: 2,
            })

            console.log('generando destinos')
            const { services, getSchema } = context
            const { ItemsService } = services
            const schema = await getSchema()
            const DestinosService = new ItemsService('destinos', {
                schema
            })

            const destinos_ids = await DestinosService.readByQuery({
                limit: -1,
                fields: ['id']
            })
            const destinos_totales = destinos_ids.length



            const { generar_destinos } = destinos

            if(destinos_totales < 200){
                await generar_destinos({
                    context,
                    cantidad: 20
                })
            } 

            if(destinos_totales >= 200){
                console.log('destinos objetivos ya completados')
            }
            
        } catch (error) {
            
        }
    })

    schedule('*/3 * * * * *', async()=> {


        try {
            // const pdfParser = new PDFParser();
            // const schemasPath = fileURLToPath(new URL('./documentos/pdfturismo.pdf', import.meta.url));
            // const text = await readPdfText({url: schemasPath});

            // console.log('text', text)
            // console.log('text')


        } catch (error) {
            console.log('error', error)
        }

        
    })
    schedule('*/3 * * * * *', async()=> {
        const nuestrabusqueda = "Muéstrame un destino donde haya un archipiélago"

        const {env} = context
		const { GEMINI_KEY } = env
        const key_gemini = GEMINI_KEY;
        const url_embedding_gemini = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${key_gemini}`

        try {

            const { services, getSchema } = context
            const { ItemsService } = services
            const schema = await getSchema()
            const DestinosService = new ItemsService('destinos', {
                schema
            })

            // const destinosData = await DestinosService.readByQuery({
            //     fields: ['nombre','descripcion','vector'],
            //     limit: -1
            // })


            // const {data} = await axios.post(url_embedding_gemini, {
            //     "model": "models/text-embedding-004",
            //     "content": {
            //         "parts":[
            //             {
            //                 "text": nuestrabusqueda
            //             }
            //         ]
            //     }
            // })
            // const vector = data.embedding.values
            // const resultado = calculateAndSortDistances(vector, destinosData, l2DistanceSquared)


            // console.log('RESULTADO===============================')
            // console.log('universo de destinos', resultado)

            
        } catch (error) {
            
        }

        // console.log('prueba búsqueda vectorial')

    })

    schedule('* * * * *', async()=> {

        try {

            const { services, getSchema } = context
            const { ItemsService } = services
            const schema = await getSchema()
            const DestinosService = new ItemsService('destinos', {
                schema
            })

            const destinosPendientes = await DestinosService.readByQuery({
                filter: {
                    vector: {
                        _null: true 
                    }
                }
            })

            for (let index = 0; index < destinosPendientes.length; index++) {
            // for (let index = 0; index < 1; index++) {
                const {id, nombre, descripcion} = destinosPendientes[index];
                const documentoVectorizado = `
                    ${nombre}
                    ${descripcion}
                `
                await generar_vector_destino({
                    context,
                    id_destino: id,
                    documento: documentoVectorizado
                })
            }

            
        } catch (error) {
            console.error('@generar_vector_destino', error)
        }
        // console.log('cada 2')
	})

    action('mensajes.items.create', (e) => {
		const {event,payload,key,collection} = e
		const {meta,request,response,code} = payload

        const { generar_respuesta } = mensajes
        generar_respuesta({ context,id:key }).catch(e=>{
            console.error('@mensajes.items.create > generar_respuesta',e)
        })

        // console.log('mensaje creado', key, payload)
    })
}