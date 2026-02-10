import { useState } from 'react';

interface Props {
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  onCardNumberChange?: (v: string) => void;
  onExpiryChange?: (v: string) => void;
  onCvcChange?: (v: string) => void;
}

export default function PaymentDetails(props: Props) {
  const [localCard, setLocalCard] = useState(props.cardNumber ?? '');
  const [localExpiry, setLocalExpiry] = useState(props.expiry ?? '');
  const [localCvc, setLocalCvc] = useState(props.cvc ?? '');

  const cardNumber = props.onCardNumberChange !== undefined ? (props.cardNumber ?? '') : localCard;
  const expiry = props.onExpiryChange !== undefined ? (props.expiry ?? '') : localExpiry;
  const cvc = props.onCvcChange !== undefined ? (props.cvc ?? '') : localCvc;

  const setCardNumber = props.onCardNumberChange ?? setLocalCard;
  const setExpiry = props.onExpiryChange ?? setLocalExpiry;
  const setCvc = props.onCvcChange ?? setLocalCvc;
  return (
    <>
      <div className="mb-3">
        <label className="form-label small text-body-secondary">Card number</label>
        <input
          type="text"
          className="form-control form-control-lg"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />
      </div>
      <div className="row g-2">
        <div className="col-8">
          <label className="form-label small text-body-secondary">Expiry (MM/YY)</label>
          <input
            type="text"
            className="form-control"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>
        <div className="col-4">
          <label className="form-label small text-body-secondary">CVC</label>
          <input
            type="text"
            className="form-control"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
