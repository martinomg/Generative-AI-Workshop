import Ajv from 'ajv'

const validate_json_schema = (schema,validatedItem, options = { 
  allErrors: true,
  useDefaults: true,
}) => {
    
    const ajv = new Ajv({
        allErrors: options.allErrors
    })
    const result = {
        data: validatedItem,
        result: null,
        errors: null,
    }
    
    try {
        result.result = ajv.validate(schema, validatedItem)
    } catch (error) {
        console.error('@validate_json_schema schema error', error)
    } finally {
        if(ajv.errors){
            result.errors = ajv.errors
        }
    }

    return result;
}


export default validate_json_schema;


