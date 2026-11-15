import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const QUICK_ACTIONS = [
  { label: 'Find a Job',          path: '/search?type=job',          icon: '💼' },
  { label: 'Find an Internship',  path: '/search?type=internship',   icon: '🎓' },
  { label: 'Hire Talent',         path: '/search?type=talent',       icon: '🌟' },
  { label: 'Find Volunteers',     path: '/search?type=volunteering', icon: '🤝' },
  { label: 'Offer My Skills',     path: '/search?tab=talent',        icon: '🛠️' },
  { label: 'Find a Mentor',       path: '/search?type=mentorship',   icon: '🧭' },
];

const EXPLORE_CATEGORIES = [
  'Technology', 'Creative', 'Education', 'Community',
  'Trade Skills', 'Health & Wellness', 'Business', 'Language',
];

export default function HomePage() {
  return (
    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroContent}>
          <h1 id="hero-heading" className={styles.heroTitle}>
            More Opportunities.<br />
            <span className={styles.accent}>Greater Together.</span>
          </h1>
          <p className={styles.heroSub}>
            Connect people, businesses, NGOs and communities through paid work,
            volunteering, skill exchange and collaboration.
          </p>
          <Link to="/search" className="btn btn--primary" style={{ fontSize: '1rem', padding: '0.75rem 1.75rem' }}>
            Find Opportunities
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section className={styles.section} aria-labelledby="quick-label">
        <h2 id="quick-label" className={styles.sectionTitle}>What are you looking for?</h2>
        <div className={styles.quickGrid}>
          {QUICK_ACTIONS.map(a => (
            <Link key={a.label} to={a.path} className={styles.quickCard}>
              <span className={styles.quickIcon} aria-hidden>{a.icon}</span>
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore */}
      <section className={styles.section} aria-labelledby="explore-label">
        <h2 id="explore-label" className={styles.sectionTitle}>Explore Categories</h2>
        <div className={styles.categoryList}>
          {EXPLORE_CATEGORIES.map(c => (
            <Link
              key={c}
              to={`/search?category=${encodeURIComponent(c)}`}
              className="badge badge--teal"
              style={{ fontSize: '0.9rem', padding: '0.4rem 0.9rem' }}
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* Discovery shortcuts */}
      <section className={styles.section}>
        <div className={styles.featureGrid}>
          <Link to="/radar" className={styles.featureCard}>
            <h3>🎯 Opportunity Radar</h3>
            <p>Personalised ranked matches based on your skills and availability.</p>
          </Link>
          <Link to="/complementary" className={styles.featureCard}>
            <h3>🔗 Complementary Skills</h3>
            <p>Find people whose skills fill your gaps — and vice versa.</p>
          </Link>
          <Link to="/assistant" className={styles.featureCard}>
            <h3>💬 Assistant</h3>
            <p>Describe what you need in plain language and get matched.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
