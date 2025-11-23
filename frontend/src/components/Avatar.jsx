import React, { useState, useEffect } from 'react';
import { useEnsName, useEnsAvatar } from 'wagmi';

/**
 * Avatar - A simple avatar component with ENS support
 * 
 * @param {string} address - The Ethereum address
 * @param {string} size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
const Avatar = ({ address, size = 'md', className = '' }) => {
  const [avatarError, setAvatarError] = useState(false);
  
  const { data: ensName } = useEnsName({
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

  // Size configurations
  const sizeConfig = {
    sm: {
      avatar: 'w-8 h-8',
      text: 'text-xs',
    },
    md: {
      avatar: 'w-10 h-10',
      text: 'text-sm',
    },
    lg: {
      avatar: 'w-12 h-12',
      text: 'text-base',
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
    return <div className={`${config.avatar} rounded-full bg-base-300 ${className}`} />;
  }

  return (
    <div className={`flex-shrink-0 ${className}`}>
      {ensAvatarLoading ? (
        <div className={`${config.avatar} rounded-full bg-base-300 animate-pulse`} />
      ) : ensAvatar && !avatarError ? (
        <img
          src={ensAvatar}
          alt={ensName || address}
          className={`${config.avatar} rounded-full object-cover`}
          onError={() => setAvatarError(true)}
        />
      ) : (
        getFallbackAvatar(address)
      )}
    </div>
  );
};

export default Avatar;

