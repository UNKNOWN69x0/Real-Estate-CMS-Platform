import { Route, Routes } from 'react-router-dom';
import { SectionsProvider } from './context/SectionsContext.jsx';
import { InquiryProvider } from './context/InquiryContext.jsx';
import HomePage from './pages/public/HomePage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

export default function App() {
  return (
    <SectionsProvider>
      <InquiryProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </InquiryProvider>
    </SectionsProvider>
  );
}
