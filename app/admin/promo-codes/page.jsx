import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { isAdmin, getAllPromoCodes } from '@/lib/store';
import { formatCents } from '@/lib/format';
import { createPromoCodeAction, togglePromoCodeActiveAction, deletePromoCodeAction } from '@/app/actions/admin';

export const metadata = { title: 'Promo Codes | District RP' };

export default async function PromoCodesAdminPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin/promo-codes');
  }

  const admin = await isAdmin(session.user.id);
  if (!admin) notFound();

  const codes = await getAllPromoCodes();

  return (
    <div className="page">
      <h1>Promo Codes</h1>
      <p>Create and manage discount codes customers can apply at checkout.</p>

      <form action={createPromoCodeAction} className="application-form">
        <div className="field">
          <label htmlFor="code">Code</label>
          <input id="code" name="code" type="text" placeholder="e.g. SAVE5" required />
        </div>

        <div className="field">
          <label htmlFor="discountType">Discount Type</label>
          <select id="discountType" name="discountType" defaultValue="fixed" required>
            <option value="fixed">Fixed amount ($ off)</option>
            <option value="percent">Percentage (% off)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">Amount (dollars if fixed, whole number if percent)</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
        </div>

        <div className="field">
          <label htmlFor="maxUses">Max Uses (leave blank for unlimited)</label>
          <input id="maxUses" name="maxUses" type="number" min="1" step="1" />
        </div>

        <button type="submit" className="btn btn-primary">Create Code</button>
      </form>

      <h2>Existing Codes</h2>
      {codes.length === 0 ? (
        <div className="empty-state">
          <p>No promo codes yet.</p>
        </div>
      ) : (
        <div className="inbox-list">
          {codes.map((c) => (
            <div className={`inbox-item${c.active ? '' : ' unread'}`} key={c.id}>
              <div className="inbox-item-header">
                <strong>{c.code}</strong>
                <span>{c.active ? 'Active' : 'Disabled'}</span>
              </div>
              <p>
                {c.discount_type === 'percent' ? `${c.discount_value}% off` : `${formatCents(c.discount_value)} off`}
                {' — '}
                {c.max_uses ? `${c.used_count} / ${c.max_uses} uses` : `${c.used_count} uses (unlimited)`}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <form action={togglePromoCodeActiveAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="btn btn-outline">{c.active ? 'Disable' : 'Enable'}</button>
                </form>
                <form action={deletePromoCodeAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="btn-ghost">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
