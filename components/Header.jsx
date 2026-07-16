import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/session';
import { getCartCount } from '@/lib/store';
import { ThemeToggle } from './ThemeToggle';
import { MobileNav } from './MobileNav';
import { UserMenu } from './UserMenu';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/rules', label: 'RP Rules' },
  { href: '/support', label: 'Support' },
  { href: '/policies', label: 'Policies' },
];

export async function Header() {
  let session = null;
  try {
    session = await getSession();
  } catch (error) {
    // A misconfigured or incomplete auth setup (e.g. missing OAuth
    // credentials while they're still being set up) shouldn't take down
    // every page — just treat it as "not logged in".
    console.error('Failed to read session:', error);
  }

  let cartCount = 0;
  if (session?.user?.id) {
    try {
      cartCount = await getCartCount(session.user.id);
    } catch (error) {
      console.error('Failed to read cart count:', error);
    }
  }

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link className="brand" href="/">
          <Image
            className="brand-mark-img"
            src="/images/server-icon.png"
            alt="District RP"
            width={34}
            height={34}
            priority
          />
          <span className="brand-name">DISTRICT RP</span>
        </Link>

        <MobileNav links={LINKS} />

        <div className="nav-actions">
          <ThemeToggle />
          <Link className="cart-link" href="/cart" aria-label="Cart">
            &#128722;
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <UserMenu user={session?.user || null} />
        </div>
      </div>
    </header>
  );
}
