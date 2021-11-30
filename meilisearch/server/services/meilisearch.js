function aRandomService(strapi) {
  // I have access to strapi api here
  console.log('MeiliSearch Service')
}

module.exports = ({ strapi }) => ({
  aRandomService,
})
