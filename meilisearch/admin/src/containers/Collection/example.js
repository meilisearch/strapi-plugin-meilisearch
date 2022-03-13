import React from 'react'
import { theme } from 'twin.macro'

const BreakpointContext = React.createContext({})

const BreakpointProvider = props => {
  const smBp = theme`screens.sm`.replace('px', '')
  const mdBp = theme`screens.md`.replace('px', '')
  const lgBp = theme`screens.lg`.replace('px', '')
  const xlBp = theme`screens.xl`.replace('px', '')
  const xxlBp = theme`screens.2xl`.replace('px', '')

  const [breakpoints, setBreakpoints] = React.useState({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    xxl: false,
  })

  const handleWindowResize = () => {
    const windowWidth = window.innerWidth
    setBreakpoints({
      sm: windowWidth >= smBp,
      md: windowWidth >= mdBp,
      lg: windowWidth >= lgBp,
      xl: windowWidth >= xlBp,
      xxl: windowWidth >= xxlBp,
    })
  }

  React.useEffect(() => {
    window.addEventListener('resize', handleWindowResize)
    handleWindowResize()
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  return <BreakpointContext.Provider value={{ breakpoints }} {...props} />
}

const useBreakpoint = () => {
  const context = React.useContext(BreakpointContext)
  if (context === undefined) {
    throw new Error(`useBreakpoint must be used within a BreakpointProvider`)
  }
  return context
}

export { BreakpointProvider, useBreakpoint }

// const { breakpoints } = useBreakpoint()
