import Link from "next/link";
import type { AuthUser } from "@/features/auth/auth-layout.mock";
import { NAV_ITEMS } from "@/features/auth/auth-layout.mock";

interface NavSidebarProps {
  user: AuthUser;
  currentPath?: string;
}

export default function NavSidebar({ user, currentPath }: NavSidebarProps) {
  const items = NAV_ITEMS[user.role];

  return (
    <nav className="nav-sidebar" aria-label="Navegação principal">
      <ul className="nav-sidebar__list" role="list">
        {items.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <li key={item.href} className="nav-sidebar__item">
              <Link
                href={item.href}
                className={`nav-sidebar__link${isActive ? " nav-sidebar__link--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
