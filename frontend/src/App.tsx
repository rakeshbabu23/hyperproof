import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container } from '@radix-ui/themes';
import { RiskDashboard } from './pages/RiskDashboard';
import { CreateRiskPage } from './pages/CreateRiskPage';
import { RiskDetailPage } from './pages/RiskDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Container size="4" py="6" px="4">
        <Routes>
          <Route path="/" element={<RiskDashboard />} />
          <Route path="/risks/new" element={<CreateRiskPage />} />
          <Route path="/risks/:id" element={<RiskDetailPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
