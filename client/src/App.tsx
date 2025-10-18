import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import PlayerStatsPage from './pages/PlayerStatsPage';
import { Headline3 } from 'gobble-lib-react';

const AppShell = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f9fb 0%, #eef2f7 100%);
`;

const Sidebar = styled.aside`
  width: 240px;
  padding: 32px 24px;
  background-color: #101a2b;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const NavSection = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 12px;
  color: ${({ $active }) => ($active ? '#101a2b' : '#e2e8f0')};
  background-color: ${({ $active }) => ($active ? '#facc15' : 'transparent')};
  font-weight: 600;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: ${({ $active }) => ($active ? '#facc15' : 'rgba(250, 204, 21, 0.35)')};
    color: #101a2b;
  }
`;

const Content = styled.main`
  flex: 1;
  padding: 40px 48px;
  overflow: auto;
`;

const NavLabel = styled.span`
  font-size: 0.75rem;
  letter-spacing: 0.12rem;
  text-transform: uppercase;
  opacity: 0.7;
`;

const routes = [
  {
    path: '/player-stats',
    label: 'Player Stats',
    element: <PlayerStatsPage />
  }
];

const AppContent = () => {
  const location = useLocation();

  return (
    <AppShell>
      <Sidebar>
        <Headline3 as="h1">Yahoo Fantasy NBA</Headline3>
        <NavSection>
          <NavLabel>Tools</NavLabel>
          {routes.map((route) => (
            <NavLink key={route.path} to={route.path} $active={location.pathname === route.path}>
              {route.label}
            </NavLink>
          ))}
        </NavSection>
      </Sidebar>
      <Content>
        <Routes>
          <Route path="/" element={<Navigate to="/player-stats" replace />} />
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </Content>
    </AppShell>
  );
};

const App = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;
