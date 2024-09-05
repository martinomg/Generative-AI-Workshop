import mensajes from "../utils/collections/mensajes.js"
import axios from 'axios'


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
    

    const key_gemini = `AIzaSyDmqjeQh4gOunGVUrInN9uF9RgB0-3fOpc`
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

        console.log('vector generado', vector)


    } catch (error) {
        console.error('@generar_vector_destino', error)
    }
   
    return true
}

export default ({ filter, action, schedule }, context) => {

    schedule('*/3 * * * * *', async()=> {
        const nuestrabusqueda = "Muéstrame un destino donde haya un archipiélago"

        const key_gemini = `AIzaSyDmqjeQh4gOunGVUrInN9uF9RgB0-3fOpc`
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

        console.log('mensaje creado', key, payload)
    })
}