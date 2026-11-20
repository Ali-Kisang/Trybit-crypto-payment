import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft, BadgeCheck, Bitcoin, Check, CheckCircle2, Clock3,
  Copy, Crown, ExternalLink, LockKeyhole, ShieldCheck, Wallet,
  AlertTriangle, LoaderCircle, RefreshCw
} from "lucide-react";

const COINS = [
  { code: "BTC", name: "Bitcoin", symbol: "₿", color: "#f7931a" },
  { code: "ETH", name: "Ethereum", symbol: "◆", color: "#6474a8" },
  { code: "USDT", name: "Tether", symbol: "₮", color: "#26a17b" },
  { code: "LTC", name: "Litecoin", symbol: "Ł", color: "#345d9d" }
];

const DEMO_INVOICES = {
  BTC: {
    id: "demo-btc-invoice",
    currency: "BTC",
    amountCrypto: "0.001234",
    amountFiat: "76.80",
    address: "bc1qexamplewalletaddressreplaceinlivemode",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: "pending"
  },
  ETH: {
    id: "demo-eth-invoice",
    currency: "ETH",
    amountCrypto: "0.034500",
    amountFiat: "76.80",
    address: "0xExampleEthereumWalletAddressReplaceInLiveMode",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: "pending"
  },
  USDT: {
    id: "demo-usdt-invoice",
    currency: "USDT",
    amountCrypto: "76.800000",
    amountFiat: "76.80",
    address: "TExampleTetherWalletAddressReplaceInLiveMode",
    network: "TRC20",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: "pending"
  },
  LTC: {
    id: "demo-ltc-invoice",
    currency: "LTC",
    amountCrypto: "0.850000",
    amountFiat: "76.80",
    address: "ltc1qexamplewalletaddressreplaceinlivemode",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: "pending"
  }
};

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function getRemaining(expiresAt) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export default function TryBitCheckout({
  plan = {},
  demoMode = true,
  onCreateInvoice,
  onCheckStatus,
  onBack,
  onPaymentComplete
}) {
  const [coin, setCoin] = useState("BTC");
  const [invoice, setInvoice] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [checking, setChecking] = useState(false);

  const selectedCoin = useMemo(
    () => COINS.find((item) => item.code === coin) || COINS[0],
    [coin]
  );

  useEffect(() => {
    if (!invoice?.expiresAt) return undefined;
    const update = () => setRemaining(getRemaining(invoice.expiresAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [invoice?.expiresAt]);

  useEffect(() => {
    if (!invoice?.id || !onCheckStatus || demoMode) return undefined;
    let active = true;

    const check = async () => {
      if (!active) return;
      try {
        const result = await onCheckStatus(invoice.id);
        if (!active || !result?.status) return;
        setPaymentStatus(result.status);
        if (result.status === "paid") onPaymentComplete?.(result);
      } catch {
        // A temporary status-check failure should not erase the invoice.
      }
    };

    check();
    const timer = window.setInterval(check, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [invoice?.id, onCheckStatus, onPaymentComplete, demoMode]);

  useEffect(() => {
    if (remaining === 0 && invoice && paymentStatus === "pending") {
      setPaymentStatus("expired");
    }
  }, [remaining, invoice, paymentStatus]);

  const createInvoice = async () => {
    setError("");
    setCreating(true);
    setCopied(false);
    try {
      let result;
      if (demoMode) {
        result = {
          ...DEMO_INVOICES[coin],
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
      } else {
        if (!onCreateInvoice) {
          throw new Error("Payment service is not configured. Please contact support.");
        }
        result = await onCreateInvoice({ currency: coin, plan });
        if (!result?.id || !result?.address || !result?.amountCrypto || !result?.expiresAt) {
          throw new Error("The server returned incomplete invoice details.");
        }
      }
      setInvoice(result);
      setPaymentStatus(result.status || "pending");
    } catch (err) {
      setError(err?.message || "Unable to create payment invoice.");
    } finally {
      setCreating(false);
    }
  };

  const copyAddress = async () => {
    if (!invoice?.address) return;
    try {
      await navigator.clipboard.writeText(invoice.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy automatically. Please select and copy the address.");
    }
  };

  const copyAmount = async () => {
    if (!invoice?.amountCrypto) return;
    try {
      await navigator.clipboard.writeText(invoice.amountCrypto);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy amount.");
    }
  };

  const manuallyCheck = async () => {
    if (!invoice || !onCheckStatus || demoMode) {
      setError("Connect payment-status verification to your backend to check live payments.");
      return;
    }
    setChecking(true);
    try {
      const result = await onCheckStatus(invoice.id);
      if (result?.status) {
        setPaymentStatus(result.status);
        if (result.status === "paid") onPaymentComplete?.(result);
      }
    } catch {
      setError("Could not check payment status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const paid = paymentStatus === "paid";
  const expired = paymentStatus === "expired";
  const failed = paymentStatus === "failed";

  return (
    <main className="tb-page">
      <div className="tb-orb tb-orb-one" />
      <div className="tb-orb tb-orb-two" />

      <header className="tb-header">
        <a className="tb-brand" href="/" onClick={(e) => e.preventDefault()}>
          <span className="tb-brand-mark"><span /></span>
          <span>TryBit</span>
        </a>
        <p className="tb-tagline">Secure. <strong>Fast.</strong> Crypto Payments.</p>
        <div className="tb-secure"><ShieldCheck size={21} /> <span>Your payment is secure and encrypted</span></div>
      </header>

      <div className="tb-layout">
        <aside className="tb-summary card">
          <div className="tb-plan-heading">
            <div className="tb-crown"><Crown size={31} fill="currentColor" /></div>
            <div>
              <h2>Premium Membership</h2>
              <p>{plan.description || "Unlock exclusive features and get more from our platform."}</p>
            </div>
          </div>

          <div className="tb-features">
            {(plan.features || ["Unlimited premium access", "Exclusive features", "Priority support"]).map((feature) => (
              <div className="tb-feature" key={feature}><Check size={19} /> <span>{feature}</span></div>
            ))}
          </div>

          <div className="tb-rule" />
          <h3 className="tb-section-title">Order Summary</h3>

          <div className="tb-summary-row">
            <div className="tb-row-icon"><Wallet size={21} /></div>
            <div className="tb-row-label"><span>Plan</span><strong>{plan.name || "Annual Premium"}</strong></div>
            <strong className="tb-row-value">${Number(plan.originalPrice ?? 96).toFixed(2)}</strong>
          </div>
          <div className="tb-summary-row">
            <div className="tb-row-icon"><BadgeCheck size={21} /></div>
            <div className="tb-row-label"><span>Discount</span><strong className="tb-green">Save {Math.round((Number(plan.discount ?? 19.2) / Number(plan.originalPrice ?? 96)) * 100)}%</strong></div>
            <strong className="tb-row-value tb-green">−${Number(plan.discount ?? 19.2).toFixed(2)}</strong>
          </div>

          <div className="tb-rule" />
          <div className="tb-total">
            <strong>Total Amount</strong>
            <strong>${Number(plan.total ?? 76.8).toFixed(2)}</strong>
          </div>
          <div className="tb-valid"><Clock3 size={17} /> Invoice valid for 30 minutes</div>

          <button className="tb-back" onClick={onBack || (() => window.history.back())}>
            <ArrowLeft size={19} /> Back to Plans
          </button>
        </aside>

        <section className="tb-checkout card">
          <div className="tb-steps">
            <div className={`tb-step ${!invoice || paid ? "active" : "done"}`}>
              <span>{invoice && !paid ? <Check size={17} /> : "1"}</span><b>Payment</b>
            </div>
            <i />
            <div className={`tb-step ${invoice ? "active" : ""}`}>
              <span>2</span><b>Confirm</b>
            </div>
            <i />
            <div className={`tb-step ${paid ? "active" : ""}`}>
              <span>{paid ? <Check size={17} /> : "3"}</span><b>Complete</b>
            </div>
          </div>

          <div className="tb-title-row">
            <div>
              <h1>{paid ? "Payment Confirmed" : invoice ? "Complete Your Payment" : "Choose Your Payment Method"}</h1>
              <p>{paid ? "Your premium membership payment has been verified." : invoice ? "Send the exact amount using the details below." : "Choose a cryptocurrency to continue securely."}</p>
            </div>
            <div className="tb-lock"><LockKeyhole size={18} /> Secure checkout</div>
          </div>

          {!invoice && (
            <>
              <div className="tb-coin-grid">
                {COINS.map((item) => (
                  <button
                    type="button"
                    className={`tb-coin ${coin === item.code ? "selected" : ""}`}
                    key={item.code}
                    onClick={() => setCoin(item.code)}
                  >
                    <span className="tb-coin-symbol" style={{ background: item.color }}>{item.symbol}</span>
                    <span className="tb-coin-name"><strong>{item.name}</strong><small>{item.code}{item.code === "USDT" ? " · TRC20 demo" : ""}</small></span>
                    {coin === item.code && <span className="tb-selected"><Check size={13} /></span>}
                  </button>
                ))}
              </div>

              {error && <div className="tb-error"><AlertTriangle size={18} />{error}</div>}

              <div className="tb-create-panel">
                <div className="tb-create-icon"><Wallet size={24} /></div>
                <div className="tb-create-copy">
                  <strong>Pay with {selectedCoin.name}</strong>
                  <span>Your payment invoice will show the exact amount and wallet address.</span>
                </div>
                <button className="tb-primary" onClick={createInvoice} disabled={creating}>
                  {creating ? <><LoaderCircle className="spin" size={18} /> Creating...</> : "Continue to payment"}
                </button>
              </div>
              {demoMode && <p className="tb-demo-note"><AlertTriangle size={15} /> Preview mode: sample wallet details only. Do not send real funds.</p>}
            </>
          )}

          {invoice && !paid && (
            <>
              <div className="tb-invoice-top">
                <div className="tb-invoice-coin">
                  <span className="tb-coin-symbol" style={{ background: selectedCoin.color }}>{selectedCoin.symbol}</span>
                  <span><strong>{invoice.currency || coin}</strong><small>{invoice.network || selectedCoin.name}</small></span>
                </div>
                <button className="tb-change" onClick={() => { setInvoice(null); setPaymentStatus("idle"); setError(""); }}>Change coin</button>
              </div>

              <div className="tb-payment-grid">
                <div className="tb-qr-column">
                  <div className="tb-qr-frame">
                    <QRCodeSVG value={invoice.address} size={220} level="H" includeMargin />
                  </div>
                  <button className="tb-copy-address" onClick={copyAddress}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? "Copied" : "Copy wallet address"}
                  </button>
                </div>

                <div className="tb-payment-details">
                  <div className="tb-amount-card">
                    <span>Send exactly</span>
                    <strong>{invoice.amountCrypto} {invoice.currency || coin}</strong>
                    <small>≈ ${invoice.amountFiat || Number(plan.total ?? 76.8).toFixed(2)} USD</small>
                    <div className="tb-countdown"><Clock3 size={19} /><span>Time remaining</span><b>{formatTime(remaining)}</b></div>
                  </div>

                  <div className="tb-address-block">
                    <label>Wallet address</label>
                    <div className="tb-address-value">{invoice.address}</div>
                    <button onClick={copyAddress}><Copy size={15} /> Copy address</button>
                  </div>

                  <ol className="tb-instructions">
                    <li><span>1</span>Open your crypto wallet app</li>
                    <li><span>2</span>Scan the QR code or copy the address</li>
                    <li><span>3</span>Send the exact amount shown above</li>
                    <li><span>4</span>Wait for blockchain confirmation</li>
                  </ol>
                </div>
              </div>

              <div className="tb-warning"><AlertTriangle size={21} /><p><strong>Important:</strong> Send only {invoice.currency || coin} on the correct network. Sending a different asset, network or amount may result in lost funds or delayed credit.</p></div>

              {error && <div className="tb-error"><AlertTriangle size={18} />{error}</div>}
              <div className="tb-payment-actions">
                <button className="tb-secondary" onClick={manuallyCheck} disabled={checking}>
                  {checking ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={17} />}
                  Check payment status
                </button>
                {invoice.paymentUrl && <a className="tb-secondary tb-external" href={invoice.paymentUrl} target="_blank" rel="noreferrer">Open invoice <ExternalLink size={16} /></a>}
              </div>
              {demoMode && <p className="tb-demo-note"><AlertTriangle size={15} /> Demo invoice only. The address and QR code are not valid payment destinations.</p>}
              {expired && <div className="tb-error"><Clock3 size={18} />This invoice has expired. Create a new invoice to try again.</div>}
              {failed && <div className="tb-error"><AlertTriangle size={18} />Payment was not completed. Please create a new invoice or contact support.</div>}
            </>
          )}

          {paid && (
            <div className="tb-success-panel">
              <div className="tb-success-icon"><CheckCircle2 size={48} /></div>
              <h2>Payment successful!</h2>
              <p>Your payment has been verified. Your premium membership can now be activated.</p>
              <div className="tb-success-detail"><span>Invoice</span><strong>{invoice?.id}</strong></div>
              <div className="tb-success-detail"><span>Amount</span><strong>{invoice?.amountCrypto} {invoice?.currency || coin}</strong></div>
              <button className="tb-primary" onClick={() => window.location.assign("/account/subscription")}>View membership</button>
            </div>
          )}

          <footer className="tb-footer">
            <div className="tb-powered">Powered by <span className="tb-mini-mark" /> <strong>TryBit</strong></div>
            <div className="tb-safe"><ShieldCheck size={18} /> Safe &amp; Secure</div>
          </footer>
        </section>
      </div>
      <p className="tb-bottom-note">Payments are processed by the payment provider. Never share your wallet recovery phrase or private keys.</p>
    </main>
  );
}