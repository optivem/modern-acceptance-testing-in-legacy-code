import { Link } from 'react-router-dom';

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Optivem eShop
        </Link>
        {title && <span className="navbar-text text-white">{title}</span>}
      </div>
    </nav>
  );
}
