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

const resolver_mensajes_pendientes = () => {

}

const generar_respuesta = async({
    context,
    id
}) => {


    try {

        const key_gemini = `AIzaSyDmqjeQh4gOunGVUrInN9uF9RgB0-3fOpc`
        const url_embedding_gemini = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${key_gemini}`


        const { services, getSchema } = context
        const { ItemsService } = services
        const schema = await getSchema()
        const MensajesService = new ItemsService('mensajes', {
            schema
        })

        const DestinosService = new ItemsService('destinos', {
            schema
        })

        const {
            id: id_mensaje,
            mensaje
        } = await MensajesService.readOne(id, {
            fields: ['id','mensaje']
        })

        const destinosData = await DestinosService.readByQuery({
            fields: ['nombre','descripcion','vector'],
            limit: -1
        })

        const {data:respuesta_vector} = await axios.post(url_embedding_gemini, {
            "model": "models/text-embedding-004",
            "content": {
                "parts":[
                    {
                        "text": mensaje
                    }
                ]
            }
        })
        const vector = respuesta_vector.embedding.values
        const resultado = calculateAndSortDistances(vector, destinosData, l2DistanceSquared)

        const mejores3candidatos = resultado.slice(0,3).map(el=>{
            const {nombre,descripcion} = el
            return {
                nombre,
                descripcion
            }
        })
        
    
       

        const payload = {
            "system_instruction": {
            "parts":
                { 
                    "text": `
                    Eres un agente que responde preguntas de turismo utilizando una base de referencia de destinos que te interesa recomendar.
                    En base a la consulta del usuario se han encontrado las siguientes coincidencias:
                    ${JSON.stringify(mejores3candidatos)}
                    `
                    // Eres como marvin de hitchhiker's guide to the galaxy.
                }
            },
            "contents":[
                {
                    "parts":[
                        {
                            "text":mensaje
                        }
                    ]
                }
            ]
        }
        
        // Llamar a gemini
        const nuestro_key = "AIzaSyDmqjeQh4gOunGVUrInN9uF9RgB0-3fOpc"
        const {data} = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${nuestro_key}`, payload)
        console.log('@generar_respuesta', data)
        const respuesta_gemini = data.candidates[0].content.parts[0].text
        // const respuesta_gemini = data['candidates'][0]['content']['parts'][0]['text']

        await MensajesService.updateOne(id, {
            respuesta:respuesta_gemini
        })
    
        return respuesta_gemini
    } catch (error) {

        console.log('@generar_respuesta', error)
        return false
    }
    
   
}

export default {
    generar_respuesta
}