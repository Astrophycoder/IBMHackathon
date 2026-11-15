import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage         from './pages/HomePage';
import SearchPage       from './pages/SearchPage';
import RadarPage        from './pages/RadarPage';
import ComplementaryPage from './pages/ComplementaryPage';
import AssistantPage    from './pages/AssistantPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/search"        element={<SearchPage />} />
          <Route path="/radar"         element={<RadarPage />} />
          <Route path="/complementary" element={<ComplementaryPage />} />
          <Route path="/assistant"     element={<AssistantPage />} />
          <Route path="*"              element={
            <main style={{ padding: '3rem 1.25rem', textAlign: 'center' }}>
              <h1>Page not found</h1>
              <p>Return to <a href="/">Home</a>.</p>
            </main>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
