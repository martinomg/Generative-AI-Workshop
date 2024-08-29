import axios from 'axios'

const resolver_mensajes_pendientes = () => {

}

const generar_respuesta = async({
    context,
    id
}) => {


    try {
        const { services, getSchema } = context
        const { ItemsService } = services
        const schema = await getSchema()
        const MensajesService = new ItemsService('mensajes', {
            schema
        })
    
        const {
            id: id_mensaje,
            mensaje
        } = await MensajesService.readOne(id, {
            fields: ['id','mensaje']
        })

        const payload = {
            "system_instruction": {
            "parts":
                { 
                    "text": `
                    Eres un agente que responde preguntas de turismo 
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
        const nuestro_key = "AIzaSyAB6N7y7ug4QfGMMuQTPb4U6Hr2p8v-uUk"
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