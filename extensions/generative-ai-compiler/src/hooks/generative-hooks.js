import mensajes from "../utils/collections/mensajes.js"


export default ({ filter, action, schedule }, context) => {
    schedule('* * * * *', async()=> {
        // console.log('cada 2')
	})

    action('mensajes.items.create', (e) => {
		const {event,payload,key,collection} = e
		const {meta,request,response,code} = payload

        const { generar_respuesta } = mensajes
        generar_respuesta({ context,id:key })

        console.log('mensaje creado', key, payload)
    })
}