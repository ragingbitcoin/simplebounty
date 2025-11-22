import React, { useState, useEffect } from 'react';
import { useAccount, useEnsAddress } from 'wagmi';
import { useNavigate } from 'react-router';
import { ROUTES } from '../config/routes';
import { isAddress } from 'viem';

const AddressInput = () => {
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();
  const [address1Input, setAddress1Input] = useState('');
  const [address2Input, setAddress2Input] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [errors, setErrors] = useState({ address1: '', address2: '' });
  
  // ENS resolution for address 1
  const { data: ens1Address, isLoading: ens1Loading, isError: ens1Error } = useEnsAddress({
    name: address1Input?.endsWith('.eth') ? address1Input : undefined,
    chainId: 1, // ENS is on mainnet
  });
  
  // ENS resolution for address 2
  const { data: ens2Address, isLoading: ens2Loading, isError: ens2Error } = useEnsAddress({
    name: address2Input?.endsWith('.eth') ? address2Input : undefined,
    chainId: 1, // ENS is on mainnet
  });
  
  // Update resolved addresses when ENS resolves or input changes
  useEffect(() => {
    if (address1Input) {
      if (address1Input.endsWith('.eth')) {
        if (ens1Address) {
          setAddress1(ens1Address);
        } else if (!ens1Loading) {
          setAddress1('');
        }
      } else {
        setAddress1(address1Input);
      }
    } else {
      setAddress1('');
    }
  }, [address1Input, ens1Address, ens1Loading]);
  
  useEffect(() => {
    if (address2Input) {
      if (address2Input.endsWith('.eth')) {
        if (ens2Address) {
          setAddress2(ens2Address);
        } else if (!ens2Loading) {
          setAddress2('');
        }
      } else {
        setAddress2(address2Input);
      }
    } else {
      setAddress2('');
    }
  }, [address2Input, ens2Address, ens2Loading]);

  // Redirect if not connected
  React.useEffect(() => {
    if (!isConnected) {
      navigate(ROUTES.CONNECT);
    }
  }, [isConnected, navigate]);

  const validateAddress = (addr, inputValue, isLoading) => {
    if (!inputValue) {
      return 'Address or ENS name is required';
    }
    if (isLoading) {
      return 'Resolving ENS name...';
    }
    if (inputValue.endsWith('.eth') && !addr) {
      return 'ENS name could not be resolved';
    }
    if (!addr || !isAddress(addr)) {
      return 'Invalid Ethereum address';
    }
    if (addr.toLowerCase() === address?.toLowerCase()) {
      return 'Cannot use your own address';
    }
    return '';
  };

  const handleContinue = () => {
    const error1 = validateAddress(address1, address1Input, ens1Loading);
    const error2 = validateAddress(address2, address2Input, ens2Loading);

    setErrors({ address1: error1, address2: error2 });

    if (!error1 && !error2) {
      if (address1.toLowerCase() === address2.toLowerCase()) {
        setErrors({ 
          address1: '', 
          address2: 'Addresses must be different' 
        });
        return;
      }
      // Navigate to draw page with addresses in state
      navigate(ROUTES.DRAW, { state: { address1, address2 } });
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Triune Ceremony
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-mono truncate px-4">
            {address}
          </p>
        </div>

        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body p-6">
            <h2 className="card-title text-lg mb-3">Invite Two Others</h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter the Ethereum addresses or ENS names of the two people you wish to join in this meditation ceremony.
            </p>

            <div className="form-control mb-3">
              <label className="label py-1">
                <span className="label-text font-semibold text-sm">First Address</span>
              </label>
              <input
                type="text"
                placeholder="0x... or vitalik.eth"
                className={`input input-bordered input-sm w-full font-mono text-xs ${errors.address1 ? 'input-error' : ''}`}
                value={address1Input}
                onChange={(e) => {
                  setAddress1Input(e.target.value);
                  setErrors({ ...errors, address1: '' });
                }}
              />
              {address1Input.endsWith('.eth') && (
                <>
                  {ens1Loading && (
                    <label className="label py-1">
                      <span className="label-text-alt text-xs">Resolving ENS name...</span>
                    </label>
                  )}
                  {!ens1Loading && address1 && (
                    <label className="label py-1">
                      <span className="label-text-alt text-success text-xs">✓ Resolved: {address1.slice(0, 6)}...{address1.slice(-4)}</span>
                    </label>
                  )}
                  {!ens1Loading && !address1 && (ens1Error || !ens1Address) && (
                    <label className="label py-1">
                      <span className="label-text-alt text-warning text-xs">⚠ Could not resolve ENS name</span>
                    </label>
                  )}
                </>
              )}
              {errors.address1 && (
                <label className="label py-1">
                  <span className="label-text-alt text-error text-xs">{errors.address1}</span>
                </label>
              )}
            </div>

            <div className="form-control mb-4">
              <label className="label py-1">
                <span className="label-text font-semibold text-sm">Second Address</span>
              </label>
              <input
                type="text"
                placeholder="0x... or vitalik.eth"
                className={`input input-bordered input-sm w-full font-mono text-xs ${errors.address2 ? 'input-error' : ''}`}
                value={address2Input}
                onChange={(e) => {
                  setAddress2Input(e.target.value);
                  setErrors({ ...errors, address2: '' });
                }}
              />
              {address2Input.endsWith('.eth') && (
                <>
                  {ens2Loading && (
                    <label className="label py-1">
                      <span className="label-text-alt text-xs">Resolving ENS name...</span>
                    </label>
                  )}
                  {!ens2Loading && address2 && (
                    <label className="label py-1">
                      <span className="label-text-alt text-success text-xs">✓ Resolved: {address2.slice(0, 6)}...{address2.slice(-4)}</span>
                    </label>
                  )}
                  {!ens2Loading && !address2 && (ens2Error || !ens2Address) && (
                    <label className="label py-1">
                      <span className="label-text-alt text-warning text-xs">⚠ Could not resolve ENS name</span>
                    </label>
                  )}
                </>
              )}
              {errors.address2 && (
                <label className="label py-1">
                  <span className="label-text-alt text-error text-xs">{errors.address2}</span>
                </label>
              )}
            </div>

            <div className="card-actions justify-end mt-2">
              <button
                className="btn btn-primary w-full"
                onClick={handleContinue}
                disabled={
                  !address1Input || 
                  !address2Input || 
                  ens1Loading || 
                  ens2Loading || 
                  (address1Input.endsWith('.eth') && !address1) ||
                  (address2Input.endsWith('.eth') && !address2)
                }
              >
                {ens1Loading || ens2Loading ? 'Resolving...' : 'Continue to Drawing'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressInput;

