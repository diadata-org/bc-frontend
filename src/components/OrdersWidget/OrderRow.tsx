import React, { useMemo } from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons'

import Highlight from 'components/Highlight'
import { EtherscanLink } from 'components/EtherscanLink'

import { TokenDetails, AuctionElement } from 'types'
import { safeTokenName, formatAmount, formatAmountFull, isBatchIdFarInTheFuture, formatDateFromBatchId } from 'utils'
import { MIN_UNLIMITED_SELL_ORDER } from 'const'

const OrderRowWrapper = styled.div`
  .container {
    display: grid;
    position: relative;
  }

  .order-details {
    grid-template-columns: 6em 3em 5em;
    grid-template-rows: repeat(2, 1fr);
    justify-self: start;
  }

  .sub-columns {
    gap: 0.5em;

    div:first-child {
      justify-self: end;
    }
  }

  .two-columns {
    grid-template-columns: repeat(2, 1fr);
  }

  .three-columns {
    grid-template-columns: minmax(4em, 60%) minmax(3em, 30%) minmax(1em, 10%);
  }

  .pendingCell {
    place-items: center;

    a {
      top: 100%;
      position: absolute;
    }
  }

  &.pending {
    color: grey;
  }
`

const PendingLink: React.FC<Pick<Props, 'pending'>> = ({ pending }) => {
  if (!pending) {
    return null
  }

  // TODO: use proper pending tx hash for link
  return (
    <div className="container pendingCell">
      <FontAwesomeIcon icon={faSpinner} size="lg" spin />
      <EtherscanLink identifier="bla" type="tx" label={<small>view</small>} />
    </div>
  )
}

interface OrderDetailsProps extends Pick<Props, 'buyToken' | 'sellToken' | 'pending'> {
  price: string
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ price, buyToken, sellToken, pending }) => (
  <div className="container order-details">
    <div>Sell</div>
    <div>
      <Highlight color={pending ? 'grey' : ''}>1</Highlight>
    </div>
    <div>
      <strong>{safeTokenName(sellToken)}</strong>
    </div>

    <div>
      for <strong>at least</strong>
    </div>
    <div>
      <Highlight color={pending ? 'grey' : 'red'}>{price}</Highlight>
    </div>
    <div>
      <strong>{safeTokenName(buyToken)}</strong>
    </div>
  </div>
)

interface UnfilledAmountProps extends Pick<Props, 'sellToken' | 'pending'> {
  unfilledAmount: string
  unlimited: boolean
}

const UnfilledAmount: React.FC<UnfilledAmountProps> = ({ sellToken, unfilledAmount, unlimited, pending }) => (
  <div className={'container' + (unlimited ? '' : ' sub-columns two-columns')}>
    {unlimited ? (
      <Highlight color={pending ? 'grey' : ''}>no limit</Highlight>
    ) : (
      <>
        <div>{unfilledAmount}</div>
        <div>
          <strong>{safeTokenName(sellToken)}</strong>
        </div>
      </>
    )}
  </div>
)

interface AccountBalanceProps extends Pick<Props, 'sellToken' | 'isOverBalance'> {
  accountBalance: string
}

const AccountBalance: React.FC<AccountBalanceProps> = ({ sellToken, accountBalance, isOverBalance }) => (
  <div className="container sub-columns three-columns">
    <div>{accountBalance}</div>
    <strong>{safeTokenName(sellToken)}</strong>
    <div className="warning">{isOverBalance && <FontAwesomeIcon icon={faExclamationTriangle} />}</div>
  </div>
)

interface ExpiresProps extends Pick<Props, 'pending'> {
  isNeverExpires: boolean
  expiresOn: string
}

const Expires: React.FC<ExpiresProps> = ({ pending, isNeverExpires, expiresOn }) => (
  <div>{isNeverExpires ? <Highlight color={pending ? 'grey' : ''}>Never</Highlight> : expiresOn}</div>
)

interface Props {
  sellToken: TokenDetails
  buyToken: TokenDetails
  order: AuctionElement
  isOverBalance: boolean
  pending?: boolean
}

function calculatePrice(_numerator?: string | null, _denominator?: string | null): string {
  if (!_numerator || !_denominator) {
    return 'N/A'
  }
  const numerator = new BigNumber(_numerator)
  const denominator = new BigNumber(_denominator)
  const price = numerator.dividedBy(denominator)
  return price.toFixed(2)
}

const OrderRow: React.FC<Props> = props => {
  const { buyToken, sellToken, order, pending = false } = props

  const price = useMemo(
    () =>
      calculatePrice(
        formatAmountFull(order.priceNumerator, buyToken.decimals, false),
        formatAmountFull(order.priceDenominator, sellToken.decimals, false),
      ),
    [buyToken.decimals, order.priceDenominator, order.priceNumerator, sellToken.decimals],
  )
  const unfilledAmount = useMemo(() => formatAmount(order.remainingAmount, sellToken.decimals) || '0', [
    order.remainingAmount,
    sellToken.decimals,
  ])
  const accountBalance = useMemo(() => formatAmount(order.sellTokenBalance, sellToken.decimals) || '0', [
    order.sellTokenBalance,
    sellToken.decimals,
  ])
  const unlimitedAmount = useMemo(() => order.priceDenominator.gt(MIN_UNLIMITED_SELL_ORDER), [order.priceDenominator])

  const { isNeverExpires, expiresOn } = useMemo(() => {
    const isNeverExpires = isBatchIdFarInTheFuture(order.validUntil)
    const expiresOn = isNeverExpires ? '' : formatDateFromBatchId(order.validUntil)
    return { isNeverExpires, expiresOn }
  }, [order.validUntil])

  return (
    <OrderRowWrapper className={'orderRow' + (pending ? ' pending' : '')}>
      <PendingLink {...props} />
      <div className="checked">
        <input type="checkbox" />
      </div>
      <OrderDetails {...props} price={price} />
      <UnfilledAmount {...props} unfilledAmount={unfilledAmount} unlimited={unlimitedAmount} />
      <AccountBalance {...props} accountBalance={accountBalance} />
      <Expires {...props} isNeverExpires={isNeverExpires} expiresOn={expiresOn} />
    </OrderRowWrapper>
  )
}

export default OrderRow
