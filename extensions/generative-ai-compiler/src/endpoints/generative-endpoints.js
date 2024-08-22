import mensajes from "../utils/collections/mensajes.js"

export default (router, context) => {
    router.get('/', (req, res) => {
        return res.json({
            id: 'hola'
        })
    });


    router.post('/generate-mensaje-response', async(req, res) => {
        const {body} = req
        const {id} = body
        const { generar_respuesta } = mensajes
        // llamar a la función que llama a gemini y resuelve nuestra consulta
        
        
        const respuesta = await generar_respuesta({ context,id })


        return res.json(respuesta)
    });
}