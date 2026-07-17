import Image from 'next/image';
import Link from 'next/link';
import { getProducts } from '@/lib/store';
import { formatCents } from '@/lib/format';
import { addToCartAction } from '@/app/actions/cart';
import { ServerStatus } from '@/components/ServerStatus';

export default async function HomePage() {
  const products = await getProducts();
  const joinLink = process.env.ROBLOX_JOIN_LINK || '#';
  const discordLink = process.env.DISCORD_SUPPORT_LINK || '#';

  return (
    <>
      <section className="server-banner">
        <div className="banner-card">
          <Image
            src="/images/banner.png"
            alt=""
            fill
            priority
            className="banner-bg-img"
            sizes="(max-width: 860px) 100vw, 1216px"
          />
          <div className="banner-bg-overlay" aria-hidden="true" />
          <div className="banner-art">
            <Image src="/images/server-icon.png" alt="District RP" width={96} height={96} priority />
          </div>
          <div className="banner-body">
            <div className="banner-top">
              <h1>DISTRICT RP <span className="badge">ERLC</span></h1>
              <p className="tagline">Serious Roleplay, Realistic Emergency Response, Custom Liveries &amp; Departments</p>
            </div>
            <div className="banner-stats">
              <ServerStatus />
            </div>
            <div className="banner-tags">
              <span className="tag">roleplay</span>
              <span className="tag">erlc</span>
              <span className="tag">police</span>
              <span className="tag">fire &amp; ems</span>
            </div>
            <div className="banner-actions">
              <a href={joinLink} className="btn btn-primary">Join Server</a>
              <a href={discordLink} className="btn btn-outline" target="_blank" rel="noopener noreferrer">Discord</a>
              <a href="#store" className="btn btn-outline">Visit Store</a>
            </div>
          </div>
        </div>
      </section>

      <section id="store" className="store-section">
        <div className="store-heading">
          <h2>Store</h2>
          <p>Support District RP and unlock community perks. All purchases are cosmetic or quality-of-life &mdash; nothing here bypasses training, applications, or department requirements.</p>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <h3>{product.name}</h3>
              {product.is_donation ? (
                <span className="price price-choose">Customer Chooses</span>
              ) : (
                <span className="price">{formatCents(product.price_cents)}</span>
              )}
              <p>{product.description}</p>
              {product.note && (
                <p className="product-note"><strong>NOTE:</strong> {product.note}</p>
              )}

              <form action={addToCartAction}>
                <input type="hidden" name="productId" value={product.id} />
                {product.is_donation ? (
                  <>
                    <div className="donation-input">
                      <span>$</span>
                      <input
                        type="number"
                        name="customAmount"
                        min="1"
                        step="0.01"
                        defaultValue="10"
                        required
                      />
                    </div>
                    <button className="btn btn-buy" type="submit" style={{ marginTop: 10 }}>
                      Donate
                    </button>
                  </>
                ) : (
                  <button className="btn btn-buy" type="submit">
                    Add to Cart
                  </button>
                )}
              </form>

              {product.id === 'discord-unban-review' && (
                <Link href="/unban-review" className="btn-ghost" style={{ textAlign: 'center' }}>
                  Already purchased? Submit your application &rarr;
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
