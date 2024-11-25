export default policyContext => {
  const isAdmin = policyContext?.state?.user?.roles.find(
    role => role.code === 'strapi-super-admin',
  )
  if (isAdmin) return true
  return false
}
