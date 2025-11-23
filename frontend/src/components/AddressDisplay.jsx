import React, { useState, useEffect } from 'react';
import { useEnsName, useEnsAvatar } from 'wagmi';

/**
 * AddressDisplay - A standardized component for displaying Ethereum addresses
 * with ENS name and avatar support
 * 
 * @param {string} address - The Ethereum address to display
 * @param {string} size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
const AddressDisplay = ({ address, size = 'md', className = '' }) => {
  const [avatarError, setAvatarError] = useState(false);
  
  const { data: ensName, isLoading: ensNameLoading } = useEnsName({
    address: address,
  });

  const { data: ensAvatar, isLoading: ensAvatarLoading } = useEnsAvatar({
    name: ensName,
  });

  // Reset avatar error when ensAvatar changes
  useEffect(() => {
    if (ensAvatar) {
      setAvatarError(false);
    }
  }, [ensAvatar]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      avatar: 'w-6 h-6',
      text: 'text-sm',
    },
    md: {
      avatar: 'w-8 h-8',
      text: 'text-base',
    },
    lg: {
      avatar: 'w-10 h-10',
      text: 'text-lg',
    },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  // Generate a simple color-based avatar as fallback
  const getFallbackAvatar = (addr) => {
    if (!addr) return null;
    // Generate a simple colored circle based on address
    const colors = [
      'bg-primary',
      'bg-secondary',
      'bg-accent',
      'bg-success',
      'bg-warning',
      'bg-error',
    ];
    const colorIndex = parseInt(addr.slice(2, 4), 16) % colors.length;
    return (
      <div className={`${config.avatar} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold ${config.text}`}>
        {addr.slice(2, 4).toUpperCase()}
      </div>
    );
  };

  if (!address) {
    return <span className="text-base-content/60">No address</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {ensAvatarLoading ? (
          <div className={`${config.avatar} rounded-full bg-base-300 animate-pulse`} />
        ) : ensAvatar && !avatarError ? (
          <img
            src={ensAvatar}
            alt={ensName || formatAddress(address)}
            className={`${config.avatar} rounded-full object-cover`}
            onError={() => setAvatarError(true)}
          />
        ) : (
          getFallbackAvatar(address)
        )}
      </div>

      {/* Name and Address */}
      <div className="flex flex-col min-w-0">
        <span className={`${config.text} font-medium text-base-content truncate`}>
          {ensName || formatAddress(address)}
        </span>
      </div>
    </div>
  );
};

export default AddressDisplay;

