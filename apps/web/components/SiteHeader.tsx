import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SearchDialog } from "./SearchDialog";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          Token by Token
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/learn">Course</Link>
          <Link href="/glossary">Glossary</Link>
        </nav>
        <span className="spacer" />
        <SearchDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
