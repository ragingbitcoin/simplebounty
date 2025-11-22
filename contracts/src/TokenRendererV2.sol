/* SPDX-License-Identifier: GPL-3.0-only
  ▄▄▄▄▄▄▄▄▄▄  ▄▄  ▄                                           ▄  ▄▄  ▄▄▄▄▄▄▄▄▄▄
 █▄▓▄                                                                       ▄▓▄█
 █         ▒██████  █▓ ▓██▄ ▄██▄ ██▓███  ██▓   ███████ ██████ ██████▒          █
 █         ██▒      ██ ▒██▀█▀ █▓██░  ██▒██▒    ▓█   ▀  ██  ██ ██  ██           █
 █          ██████  ██ ▓██ █  █▓██░ ██▓▒██░    ▒███    ██████ ██ ▄▄▒           █
 █              ██▒ ██ ▓██ █  █▒██▄█▓▒ ▒██░    ▒▓█  ▄  ██     ██  ██           █
 █         ███████▒ ██▒▒██ █  █▒██▒ ░  ░██████▒▓█████▒ ██     ██████           █
 █         ░ ▒░▒░▒░ ▓ ░ ▒░ ░  ▒▒▓▒░ ░  ░▒ ▒░▓  ░░ ▒░ ░ ░░▒    ░░▒▒▓▒           █
 █           ░ ▒ ▒░ ▒ ░ ░░    ▒░▒ ░     ░ ░ ▒  ░░ ░  ░ ░   ░  ░ ░▒░            █
 █         ░ ░ ░ ▒ ▒    ░     ░░░         ░ ░     ░         ░   ░ ░            █
 █            ░ ░  ░            ░              ░  ░   ░  ░   ░░ ░              █
  ▄▄▄▄▄▄▄ ▄         ░            ░            ░  ░              ░     ▄ ▄▄▄▄▄▄▄
 █▄▓▄▄                           ░                                         ▄▄▓▄█
 █                                                                             █
 █  ░  Release Information                                                     █
 █  ░ ---------------- -                                                       █
 █                                                                             █
 █  ░  Contract . : TokenRendererV2                                            █
 █  ░  License .. : GPL-3.0-only                                               █
 █  ░  Language . : Solidity                                                   █
 █  ░  Standard . : N/A                                                        █
 ▓  ░  Version .. : 2.0.0                                                      ▓
 ▒  ░  Deployed . : 2025-08-19                                                 ▒
 ░                                                                             ░
*/
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ITokenRenderer.sol";

contract TokenRendererV2 is ITokenRenderer {
    /// @notice Renders a SimpleBounty token as metadata
    /// @param tokenId The bounty token ID
    /// @param data The bounty data/description
    /// @param tokenAddr The token address (address(0) for ETH)
    /// @param amount The bounty amount
    /// @return The base64-encoded JSON metadata URI
    function renderBounty(uint256 tokenId, bytes32 data, address tokenAddr, uint256 amount) public pure returns (string memory) {
        
        // Determine token display info
        string memory tokenDisplay;
        string memory tokenSymbol;
        if (tokenAddr == address(0)) {
            tokenDisplay = "ETH";
            tokenSymbol = "ETH";
        } else {
            tokenDisplay = _addressToShortString(tokenAddr);
            tokenSymbol = _addressToShortString(tokenAddr);
        }
        
        // Format amount display (for ETH, show in readable format)
        string memory amountDisplay = _formatAmount(amount, tokenAddr == address(0));
        
        // Calculate card height based on content
        uint256 cardHeight = 480;
        
        // Create SVG
        string memory svg = string(
            abi.encodePacked(
                '<svg width="400" height="',
                Strings.toString(cardHeight),
                '" viewBox="0 0 400 ',
                Strings.toString(cardHeight),
                '" xmlns="http://www.w3.org/2000/svg">',
                "<defs>",
                // Bounty gradient (gold/bounty theme)
                '<radialGradient id="bountySplash" cx="30%" cy="25%" r="85%">',
                '<stop offset="0%" stop-color="#fff9e6" stop-opacity="1" />',
                '<stop offset="30%" stop-color="#ffe6cc" stop-opacity="0.95" />',
                '<stop offset="60%" stop-color="#ffcc99" stop-opacity="0.9" />',
                '<stop offset="100%" stop-color="#ffb366" stop-opacity="0.7" />',
                "</radialGradient>",
                // Premium card shadow
                '<filter id="premiumShadow" x="-50%" y="-50%" width="200%" height="200%">',
                '<feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.08"/>',
                '<feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.12"/>',
                "</filter>",
                // Bounty header gradient (golden theme)
                '<linearGradient id="bountyHeaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" stop-color="#f59e0b" />',
                '<stop offset="50%" stop-color="#fbbf24" />',
                '<stop offset="100%" stop-color="#fcd34d" />',
                "</linearGradient>",
                // Subtle border gradient
                '<linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" stop-color="#fef3c7" />',
                '<stop offset="50%" stop-color="#fde68a" />',
                '<stop offset="100%" stop-color="#fcd34d" />',
                "</linearGradient>",
                "</defs>",
                // Main card container
                '<rect x="25" y="25" width="350" height="',
                Strings.toString(cardHeight - 50),
                '" rx="24" ry="24" fill="url(#bountySplash)" stroke="url(#borderGradient)" stroke-width="1.5" filter="url(#premiumShadow)"/>',
                // Header section
                '<rect x="45" y="45" width="310" height="70" rx="20" ry="20" fill="white" opacity="0.8"/>',
                '<text x="200" y="90" text-anchor="middle" font-family="\'Segoe UI\', system-ui, sans-serif" font-size="32" font-weight="600" fill="#78350f" letter-spacing="-0.5">Simple Bounty</text>',
                // Bounty ID section
                '<rect x="45" y="135" width="310" height="60" rx="16" ry="16" opacity="0.4" fill="rgba(255,255,255,0.7)" stroke="#fde68a" stroke-width="1"/>',
                '<text x="65" y="155" font-family="\'Segoe UI\', system-ui, sans-serif" font-size="13" font-weight="500" fill="#92400e" text-transform="uppercase" letter-spacing="0.5">Bounty ID</text>',
                '<text x="65" y="180" font-family="\'SF Mono\', \'Monaco\', \'Cascadia Code\', monospace" font-size="18" font-weight="600" fill="#78350f">#',
                Strings.toString(tokenId),
                "</text>"
            )
        );
        
        // Amount section
        svg = string(
            abi.encodePacked(
                svg,
                '<rect x="45" y="215" width="310" height="70" rx="16" ry="16" opacity="0.4" fill="rgba(255,255,255,0.7)" stroke="#fde68a" stroke-width="1"/>',
                '<text x="65" y="240" font-family="\'Segoe UI\', system-ui, sans-serif" font-size="13" font-weight="500" fill="#92400e" text-transform="uppercase" letter-spacing="0.5">Bounty Amount</text>',
                '<text x="65" y="265" font-family="\'Segoe UI\', system-ui, sans-serif" font-size="22" font-weight="700" fill="#78350f">',
                amountDisplay,
                " ",
                tokenSymbol,
                "</text>"
            )
        );
        
        // Token address section
        svg = string(
            abi.encodePacked(
                svg,
                '<rect x="45" y="305" width="310" height="70" rx="16" ry="16" opacity="0.4" fill="rgba(255,255,255,0.7)" stroke="#fde68a" stroke-width="1"/>',
                '<text x="65" y="330" font-family="\'Segoe UI\', system-ui, sans-serif" font-size="13" font-weight="500" fill="#92400e" text-transform="uppercase" letter-spacing="0.5">Token</text>',
                '<text x="65" y="355" font-family="\'SF Mono\', \'Monaco\', \'Cascadia Code\', monospace" font-size="16" font-weight="600" fill="#78350f">',
                tokenDisplay,
                "</text>"
            )
        );
        
        // Bounty data section
        string memory dataHex = _bytes32ToHex(data);
        svg = string(
            abi.encodePacked(
                svg,
                '<rect x="45" y="395" width="310" height="70" rx="16" ry="16" opacity="0.4" fill="rgba(255,255,255,0.7)" stroke="#fde68a" stroke-width="1"/>',
                '<text x="65" y="420" font-family="\'Segoe UI\', system-ui, sans-serif" font-size="13" font-weight="500" fill="#92400e" text-transform="uppercase" letter-spacing="0.5">Bounty Data</text>',
                '<text x="65" y="445" font-family="\'SF Mono\', \'Monaco\', \'Cascadia Code\', monospace" font-size="11" font-weight="500" fill="#78350f">',
                _truncateHex(dataHex, 20),
                "</text>"
            )
        );
        
        // Branding
        svg = string(
            abi.encodePacked(
                svg,
                '<text x="200" y="',
                Strings.toString(cardHeight - 35),
                '" text-anchor="middle" font-family="\'SF Mono\', \'Monaco\', \'Cascadia Code\', monospace" font-size="11" fill="#a16207" letter-spacing="1">simplebounty.eth</text>',
                "</svg>"
            )
        );
        
        // Create attributes array
        string memory attributes = string(
            abi.encodePacked(
                ',"attributes":[',
                '{"trait_type":"Token","value":"',
                tokenSymbol,
                '"},',
                '{"trait_type":"Amount","value":"',
                amountDisplay,
                '"},',
                '{"trait_type":"TokenAddress","value":"',
                _addressToHexString(tokenAddr),
                '"},',
                '{"trait_type":"BountyData","value":"',
                dataHex,
                '"}'
            )
        );
        
        // Add status trait
        string memory status = amount > 0 ? "Active" : "Claimed";
        attributes = string(
            abi.encodePacked(
                attributes,
                ',{"trait_type":"Status","value":"',
                status,
                '"}'
            )
        );
        
        attributes = string(abi.encodePacked(attributes, "]"));
        
        // Create JSON metadata
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Bounty #',
                        Strings.toString(tokenId),
                        '", "description": "A Simple Bounty with ',
                        amountDisplay,
                        ' ',
                        tokenSymbol,
                        '", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"',
                        attributes,
                        "}"
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /// @notice Converts an address to a short hex string (0x + first 6 chars + ... + last 4 chars)
    /// @param addr The address to convert
    /// @return A shortened hex string representation
    function _addressToShortString(address addr) internal pure returns (string memory) {
        if (addr == address(0)) {
            return "ETH";
        }
        string memory fullHex = _addressToHexString(addr);
        return _truncateHex(fullHex, 8);
    }

    /// @notice Converts an address to a hex string (without 0x prefix for internal use)
    /// @param addr The address to convert
    /// @return A hex string representation
    function _addressToHexString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42); // 2 for "0x" + 40 for address
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    /// @notice Converts bytes32 to a hex string
    /// @param data The bytes32 value to convert
    /// @return A hex string representation with 0x prefix
    function _bytes32ToHex(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66); // 2 for "0x" + 64 for bytes32
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }

    /// @notice Truncates a hex string to show first N chars + ... + last 4 chars
    /// @param hexStr The hex string to truncate
    /// @param firstChars The number of characters to show at the start
    /// @return A truncated hex string
    function _truncateHex(string memory hexStr, uint256 firstChars) internal pure returns (string memory) {
        bytes memory hexBytes = bytes(hexStr);
        if (hexBytes.length <= firstChars + 4) {
            return hexStr;
        }
        
        bytes memory result = new bytes(firstChars + 7); // firstChars + "..." (3) + 4
        for (uint256 i = 0; i < firstChars && i < hexBytes.length; i++) {
            result[i] = hexBytes[i];
        }
        result[firstChars] = ".";
        result[firstChars + 1] = ".";
        result[firstChars + 2] = ".";
        
        uint256 len = hexBytes.length;
        for (uint256 i = 0; i < 4 && i < len; i++) {
            result[firstChars + 3 + i] = hexBytes[len - 4 + i];
        }
        
        return string(result);
    }

    /// @notice Formats an amount for display (handles ETH with decimal places)
    /// @param amount The amount to format
    /// @param isETH Whether this is ETH (native token)
    /// @return A formatted string representation
    function _formatAmount(uint256 amount, bool isETH) internal pure returns (string memory) {
        if (amount == 0) {
            return "0";
        }
        
        if (isETH) {
            // Format ETH with 4 decimal places (18 decimals -> show 4)
            uint256 divisor = 1e14; // 10^14 to get 4 decimal places
            uint256 whole = amount / 1e18;
            uint256 remainder = (amount % 1e18) / divisor;
            
            if (remainder == 0) {
                return Strings.toString(whole);
            } else {
                // Format with up to 4 decimal places, removing trailing zeros
                string memory decimalStr = Strings.toString(remainder);
                // Remove trailing zeros
                bytes memory decBytes = bytes(decimalStr);
                uint256 trailingZeros = 0;
                for (uint256 i = decBytes.length; i > 0; i--) {
                    if (decBytes[i - 1] == "0") {
                        trailingZeros++;
                    } else {
                        break;
                    }
                }
                
                if (trailingZeros == decBytes.length) {
                    return Strings.toString(whole);
                }
                
                bytes memory trimmedDec = new bytes(decBytes.length - trailingZeros);
                for (uint256 i = 0; i < trimmedDec.length; i++) {
                    trimmedDec[i] = decBytes[i];
                }
                
                return string(abi.encodePacked(Strings.toString(whole), ".", string(trimmedDec)));
            }
        } else {
            // For ERC20 tokens, just show the raw number (could be enhanced with token decimals)
            return Strings.toString(amount);
        }
    }
}
