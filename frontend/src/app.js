import React from 'react';
import './app.css';
import { WagmiConfigProvider } from './components/wagmi-provider';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { useBasename } from './hooks/useBasename';
import { useRpcOverride } from './hooks/useRpcOverride';

import Connect from './pages/connect';
import AddressInput from './pages/address-input';
import Draw from './pages/draw';
import NotFound from './pages/notfound';
import { ROUTES } from './config/routes';

const App = () => {
  const basename = useBasename();
  // Get custom rpc overrides
  const rpcOverrides = useRpcOverride();

  return (
    <WagmiConfigProvider rpcOverrides={rpcOverrides}>
      <Router basename={basename}>
        <Routes>
          <Route path={ROUTES.CONNECT} element={<Connect />} />
          <Route path={ROUTES.ADDRESS_INPUT} element={<AddressInput />} />
          <Route path={ROUTES.DRAW} element={<Draw />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </WagmiConfigProvider>
  );
};

export default App;
