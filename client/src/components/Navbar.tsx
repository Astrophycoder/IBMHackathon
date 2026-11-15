/**
 * TEMPORARY SCAFFOLD — Navbar
 * Replace with Member 5's shared app shell Navbar when available.
 * Label: MOCK_AUTH_SCAFFOLD
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Home',          path: '/' },
  { label: 'Search',        path: '/search' },
  { label: 'Radar',         path: '/radar' },
  { label: 'Complementary', path: '/complementary' },
  { label: 'AI Assistant',  path: '/assistant' },
];

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="MORETOGETHER home">
          <span className={styles.logoMark}>MT</span>
          <span className={styles.logoText}>MORETOGETHER</span>
        </Link>

        <nav aria-label="Main navigation">
          <ul className={styles.navList}>
            {NAV_LINKS.map(link => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={[
                    styles.navLink,
                    location.pathname === link.path ? styles.active : '',
                  ].join(' ')}
                  aria-current={location.pathname === link.path ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.userArea}>
          {user ? (
            <span className={styles.userBadge} aria-label={`Signed in as ${user.displayName}`}>
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Link to="/login" className="btn btn--primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
