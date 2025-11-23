import React from 'react';
import { useEnsName } from 'wagmi';

/**
 * Username - Displays ENS name or formatted address
 * 
 * @param {string} address - The Ethereum address
 * @param {string} className - Additional CSS classes
 */
const Username = ({ address, className = '' }) => {
  const { data: ensName, isLoading } = useEnsName({
    address: address,
  });

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!address) {
    return <span className={`text-base-content/60 ${className}`}>Unknown</span>;
  }

  // Show address immediately while loading or if no ENS name
  return (
    <span className={`font-semibold text-base-content ${className}`}>
      {ensName || formatAddress(address)}
    </span>
  );
};

export default Username;

