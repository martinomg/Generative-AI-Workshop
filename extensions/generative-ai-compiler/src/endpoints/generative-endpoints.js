import mensajes from "../utils/collections/mensajes.js"
import destinos from "../utils/collections/destinos.js";

export default (router, context) => {
    router.get('/', (req, res) => {
        return res.json({
            id: 'hola'
        })
    });


    router.post('/generar-nuevos-destinos', (req, res) => {


        const {env} = context
		const { GEMINI_KEY } = env
        const key_gemini = GEMINI_KEY;

        const {body} = req
        const {cantidad} = body
        const {generar_destinos} = destinos

        generar_destinos({
            context,
            cantidad
        })


        return res.json(body)
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