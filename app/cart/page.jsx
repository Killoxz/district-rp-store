import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getCartItems } from '@/lib/store';
import { formatCents } from '@/lib/format';
import { updateQuantityAction, removeCartItemAction } from '@/app/actions/cart';
import { checkoutAction } from '@/app/actions/checkout';

export const metadata = { title: 'Cart | District RP' };

export default async function CartPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/cart');
  }

  const items = await getCartItems(session.user.id);
  const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

  if (items.length === 0) {
    return (
      <div className="page">
        <h1>Your Cart</h1>
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link href="/#store">Browse the store &rarr;</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Your Cart</h1>

      <div className="cart-table">
        {items.map((item) => (
          <div className="cart-row" key={item.id}>
            <div className="cart-row-info">
              <h3>{item.name}</h3>
              <span>{formatCents(item.unitPriceCents)} each{item.isDonation ? ' (donation)' : ''}</span>
            </div>

            {!item.isDonation && (
              <div className="qty-control">
                <form action={updateQuantityAction}>
                  <input type="hidden" name="cartItemId" value={item.id} />
                  <input type="hidden" name="currentQuantity" value={item.quantity} />
                  <input type="hidden" name="delta" value="-1" />
                  <button type="submit" aria-label="Decrease quantity">&minus;</button>
                </form>
                <span>{item.quantity}</span>
                <form action={updateQuantityAction}>
                  <input type="hidden" name="cartItemId" value={item.id} />
                  <input type="hidden" name="currentQuantity" value={item.quantity} />
                  <input type="hidden" name="delta" value="1" />
                  <button type="submit" aria-label="Increase quantity">+</button>
                </form>
              </div>
            )}

            <div className="cart-row-total">{formatCents(item.lineTotalCents)}</div>

            <form action={removeCartItemAction}>
              <input type="hidden" name="cartItemId" value={item.id} />
              <button type="submit" className="btn-ghost">Remove</button>
            </form>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row total">
          <span>Total</span>
          <span>{formatCents(totalCents)}</span>
        </div>
        <form action={checkoutAction}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
            Checkout
          </button>
        </form>
      </div>
    </div>
  );
}
