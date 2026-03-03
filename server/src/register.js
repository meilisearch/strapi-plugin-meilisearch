import registerDocumentMiddleware from './services/document-middleware'

const register = async ({ strapi }) => {
  await registerDocumentMiddleware({ strapi })
}

export default register
