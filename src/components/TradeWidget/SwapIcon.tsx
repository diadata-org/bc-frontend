import React from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRetweet } from '@fortawesome/free-solid-svg-icons'

const Wrapper = styled.span`
  padding: 0.7em 0.3em;
  cursor: pointer;
`

interface Props {
  swap: () => void
}

export const SwapIcon: React.FC<Props> = ({ swap }) => {
  return (
    <Wrapper onClick={swap}>
      <FontAwesomeIcon icon={faRetweet} />
    </Wrapper>
  )
}
