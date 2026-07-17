'use client';

import { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

function PayButton({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
    });

    // Only reachable if confirmation failed immediately (e.g. a declined
    // card) — a successful payment redirects to return_url automatically.
    if (error) {
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{errorMessage}</p>}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!stripe || submitting}
        style={{ width: '100%', marginTop: 16 }}
      >
        {submitting ? 'Processing…' : 'Pay Now'}
      </button>
    </form>
  );
}

export function CheckoutForm({ clientSecret, orderId, publishableKey }) {
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  if (!publishableKey) {
    return (
      <div className="payment-box">
        <h2>Payments not set up yet</h2>
        <p style={{ color: 'var(--red)' }}>Missing Stripe publishable key — add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.</p>
      </div>
    );
  }

  // Reads the live theme directly (rather than via state) since this only
  // configures Stripe's own internal iframe styling, not literal rendered
  // markup — so it can't cause a React hydration mismatch either way.
  const theme = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? 'stripe' : 'night';

  return (
    <div className="payment-box">
      <h2>Pay Securely</h2>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme,
            variables: { colorPrimary: '#d0263b' },
          },
        }}
      >
        <PayButton orderId={orderId} />
      </Elements>
    </div>
  );
}
