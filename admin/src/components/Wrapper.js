import styled from 'styled-components'

export const Wrapper = styled.div`
  margin-bottom: 35px;
  background: ${({ theme }) => theme.colors.backgroundColor};
  padding: 22px 28px 18px;
  border-radius: 2px;
  box-shadow: 0 2px 4px ${({ theme }) => theme.colors.shadows};
  -webkit-font-smoothing: antialiased;
`
