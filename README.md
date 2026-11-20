# TryBit Premium Checkout UI

Responsive React + Vite checkout UI based on the approved visual direction.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Preview mode

`src/App.jsx` sets `demoMode={true}`. This displays sample invoice data and a generated QR code for layout preview only. The sample address is deliberately fake. **Never send funds to it.**

## Connect to your backend

Set `demoMode={false}` and implement the callbacks in `src/App.jsx`.

### onCreateInvoice

Receives:

```js
{ currency: "BTC" | "ETH" | "USDT" | "LTC", plan }
```

Must call your own backend and return:

```js
{
  id: "your-internal-invoice-id",
  currency: "BTC",
  amountCrypto: "0.001234",
  amountFiat: "76.80",
  address: "real-payment-address-from-verified-provider-response",
  expiresAt: "2026-11-21T12:00:00.000Z",
  status: "pending",
  network: "optional-network-name",
  paymentUrl: "optional-provider-hosted-payment-url"
}
```

The exact fields returned by your backend are your application's normalized contract. Map TryBit's actual API response on the server, not in this React component.

### onCheckStatus

Receives the invoice ID and must return:

```js
{ status: "pending" | "paid" | "expired" | "failed" }
```

Only return `paid` after your backend has verified the provider's signed notification and independently confirmed the invoice with TryBit. The React app must never activate premium membership itself.

### Other props

- `plan`: plan name, description, originalPrice, discount, total, currency, features.
- `onBack`: optional callback for the Back to Plans action.
- `onPaymentComplete`: optional callback invoked when backend status is `paid`.

## Security notes

- Never put TryBit API credentials in Vite environment variables or browser code.
- Do not trust a browser redirect as proof of payment.
- Verify provider POSTBACK signatures on the backend and reconcile invoice status server-side.
- Confirm supported coins, networks, settlement currencies and exact API payloads with TryBit before accepting live payments.
- The QR code in this component encodes the supplied address only. If TryBit requires a payment URI containing amount/network metadata, have your backend return the exact QR payload and update the component to encode that value.
