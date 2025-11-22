import React from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useNavigate } from 'react-router';
import { ROUTES } from '../config/routes';

const Connect = () => {
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const navigate = useNavigate();

  // Auto-navigate when connected
  React.useEffect(() => {
    if (isConnected) {
      navigate(ROUTES.ADDRESS_INPUT);
    }
  }, [isConnected, navigate]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">
            Triune
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300">
            A meditation ceremony for three
          </p>
        </div>

        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body p-6">
            <h2 className="card-title justify-center text-xl mb-4">Connect Wallet</h2>
            
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Connect your wallet to begin your meditation ceremony
            </p>

            <div className="flex flex-col gap-3">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  className="btn btn-primary"
                >
                  {connector.name}
                </button>
              ))}
            </div>

            <div className="divider my-3">OR</div>
            
            <a 
              href="https://ethereum.org/en/wallets/find-wallet/"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary text-center text-sm"
            >
              I don't have a wallet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connect;

