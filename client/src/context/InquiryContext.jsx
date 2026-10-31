import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import InquiryModal from '../components/InquiryModal.jsx';

const InquiryContext = createContext(null);

// Lets any button open the single shared enquiry modal; `source` is stored with the inquiry.
export function InquiryProvider({ children }) {
  const [state, setState] = useState({ open: false, source: 'website' });

  const openInquiry = useCallback((source = 'website') => setState({ open: true, source }), []);
  const closeInquiry = useCallback(() => setState((prev) => ({ ...prev, open: false })), []);
  const value = useMemo(() => ({ openInquiry, closeInquiry }), [openInquiry, closeInquiry]);

  return (
    <InquiryContext.Provider value={value}>
      {children}
      <InquiryModal open={state.open} source={state.source} onClose={closeInquiry} />
    </InquiryContext.Provider>
  );
}

export function useInquiry() {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error('useInquiry must be used inside <InquiryProvider>');
  return ctx;
}
