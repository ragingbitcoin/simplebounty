import React from 'react';
import './app.css';
import { WagmiConfigProvider } from './components/wagmi-provider';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { useBasename } from './hooks/useBasename';
import { useRpcOverride } from './hooks/useRpcOverride';
import { BountiesProvider } from './contexts/BountiesContext';

import Landing from './pages/landing';
import Bounty from './pages/bounty';
import NewBounty from './pages/new-bounty';
import NotFound from './pages/notfound';
import { ROUTES } from './config/routes';

const App = () => {
  const basename = useBasename();
  // Get custom rpc overrides
  const rpcOverrides = useRpcOverride();

  return (
    <WagmiConfigProvider rpcOverrides={rpcOverrides}>
      <BountiesProvider>
        <Router basename={basename}>
          <Routes>
            <Route path={ROUTES.LANDING} element={<Landing />} />
            <Route path={ROUTES.NEW_BOUNTY} element={<NewBounty />} />
            <Route path={ROUTES.BOUNTY} element={<Bounty />} />
            <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </BountiesProvider>
    </WagmiConfigProvider>
  );
};

export default App;
