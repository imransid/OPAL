import { useState } from 'react';

interface Props {
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  onAddressChange?: (v: string) => void;
  onCityChange?: (v: string) => void;
  onStateChange?: (v: string) => void;
  onPostalCodeChange?: (v: string) => void;
  required?: boolean;
  addressInvalid?: boolean;
}

export default function ShippingInfo(props: Props) {
  const [localAddr, setLocalAddr] = useState(props.address ?? '');
  const [localCity, setLocalCity] = useState(props.city ?? '');
  const [localState, setLocalState] = useState(props.state ?? '');
  const [localPostal, setLocalPostal] = useState(props.postalCode ?? '');

  const address = props.onAddressChange !== undefined ? (props.address ?? '') : localAddr;
  const city = props.onCityChange !== undefined ? (props.city ?? '') : localCity;
  const state = props.onStateChange !== undefined ? (props.state ?? '') : localState;
  const postalCode = props.onPostalCodeChange !== undefined ? (props.postalCode ?? '') : localPostal;

  const setAddress = props.onAddressChange ?? setLocalAddr;
  const setCity = props.onCityChange ?? setLocalCity;
  const setState = props.onStateChange ?? setLocalState;
  const setPostalCode = props.onPostalCodeChange ?? setLocalPostal;

  return (
    <>
      <div className="mb-3">
        <label className="form-label small text-body-secondary">
          Address {props.required && <span className="text-danger">*</span>}
        </label>
        <input
          type="text"
          className={`form-control form-control-lg ${props.addressInvalid ? 'is-invalid' : ''}`}
          placeholder="Street, number"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required={props.required}
          aria-required={props.required}
        />
        {props.addressInvalid && <div className="invalid-feedback">Address is required</div>}
      </div>
      <div className="row g-2">
        <div className="col-4">
          <label className="form-label small text-body-secondary">City</label>
          <input
            type="text"
            className="form-control"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className="col-4">
          <label className="form-label small text-body-secondary">State</label>
          <input
            type="text"
            className="form-control"
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
        <div className="col-4">
          <label className="form-label small text-body-secondary">Postal code</label>
          <input
            type="text"
            className="form-control"
            placeholder="ZIP"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
