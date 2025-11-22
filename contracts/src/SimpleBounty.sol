/* SPDX-License-Identifier: GPL-3.0-only
  ▄▄▄▄▄▄▄▄▄▄  ▄▄  ▄                  ▄█▄                      ▄  ▄▄  ▄▄▄▄▄▄▄▄▄▄
 █▄▓▄                               ██▀██                                   ▄▓▄█
 █                                ▄█▀   ▀█    ▄█▄                              █
 █                               ▄█       █  ██▀██                             █
 █                              ██   ▄█▄   ▄█▀   ▀█▄                           █
 █                            ▄█▀   ██▀██  █ ▄     █▄                          █
 █                           ▄█   ▄█▀   ▀█▄   █     ██                         █
 █                          ██   ▄█     ▄ █▄   ██    ▀█▄                       █
 █                         █▀   ▀▀    ▄█   ▀▀   ▀█     █▄                      █
 █                         ▀▀▀▀▀▀▀▀▀ ██  ▀▀▀▀▀▀▀▀▀      ██                     █
 █                           ▄█     █▀        █▄         ▀█                    █
 █                          ██      ▀▀▀▀▀▀▀▀▀  ██ ▀▀▀▀▀▀▀▀▀                    █
 █                         █▀                   ▀█
 █▄▓▄▄                     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀                         ▄▄▓▄█
 █                                                                             █
 █  ░  Release Information                                                     █
 █  ░ ---------------- -                                                       █
 █                                                                             █
 █  ░  Contract . : SimpleBounty                                               █
 █  ░  License .. : GPL-3.0-only                                               █
 █  ░  Language . : Solidity                                                   █
 █  ░  Standard . : ERC1155                                                    █
 ▓  ░  Version .. : 1.0.0                                                      ▓
 ▒  ░  Deployed . : 2025-XX-XX                                                 ▒
 ░                                                                             ░
*/
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ReverseIndexable.sol";
import "./ITokenRenderer.sol";
import "./SimpleStorage.sol";

/// @title Simple Bounty Contract
/// @dev Inherits from ERC1155 and ReverseIndexable. Each tokenId represents a bounty.
contract SimpleBounty is ERC1155, ReverseIndexable {
    using SafeERC20 for IERC20;

    string public name = "Simple Bounty";
    string public symbol = "SBTY";
    
    uint256 public tokenIdCounter = 0;
    address public immutable beneficiary;
    ITokenRenderer public tokenRenderer;
    SimpleStorage public immutable simpleStorage;
    
    // Fee is 0.05% = 5 / 10000
    uint256 private constant FEE_BPS = 5; // basis points (0.05%)
    uint256 private constant BPS_DENOMINATOR = 10000;

    struct Bounty {
        bytes32 data;
        address tokenAddr; // address(0) for ETH
        uint256 amount;
    }

    mapping(uint256 => Bounty) private _bounties;

    event BountyCreated(uint256 indexed tokenId, bytes32 data, address tokenAddr, uint256 amount, address creator);
    event BountyToppedUp(uint256 indexed tokenId, address tokenAddr, uint256 amount);
    event BountyUpdated(uint256 indexed tokenId, bytes32 newData);
    event ClaimAttempted(uint256 indexed tokenId, address claimant, bytes32 claimData);
    event ClaimFulfilled(uint256 indexed tokenId, address[] winners);

    /// @notice Modifier to check if the bounty token exists
    /// @param tokenId The bounty token ID
    modifier tokenExists(uint256 tokenId) {
        require(_bounties[tokenId].amount > 0, "Bounty does not exist");
        _;
    }

    /// @notice Modifier to check if the caller owns the bounty token
    /// @param tokenId The bounty token ID
    modifier onlyOwner(uint256 tokenId) {
        require(balanceOf(msg.sender, tokenId) > 0, "Only bounty owner can call this method");
        _;
    }

    /// @notice Initializes the SimpleBounty contract
    /// @param _beneficiary The address that will receive fees
    /// @param _tokenRenderer The TokenRendererV2 contract address for metadata rendering
    /// @param storageLocation The ENS name for the SimpleStorage contract (e.g., "data.simplebounty.eth")
    constructor(address _beneficiary, ITokenRenderer _tokenRenderer, string memory storageLocation) ERC1155("") {
        require(_beneficiary != address(0), "Beneficiary cannot be zero address");
        require(address(_tokenRenderer) != address(0), "TokenRenderer cannot be zero address");
        beneficiary = _beneficiary;
        tokenRenderer = _tokenRenderer;
        
        // Deploy SimpleStorage (deployer will be the owner)
        simpleStorage = new SimpleStorage(storageLocation);
    }

    /// @notice Creates a new bounty with ERC20 tokens
    /// @param data The bounty data/description
    /// @param tokenAddr The ERC20 token address (must not be address(0))
    /// @param amount The bounty amount in tokens
    function new(bytes32 data, address tokenAddr, uint256 amount) external {
        require(tokenAddr != address(0), "Use new() with ETH for native token");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 token = IERC20(tokenAddr);
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        _createBounty(data, tokenAddr, amount);
    }

    /// @notice Creates a new bounty with ETH
    /// @param data The bounty data/description
    function new(bytes32 data) external payable {
        require(msg.value > 0, "Must send ETH");
        _createBounty(data, address(0), msg.value);
    }

    /// @notice Internal function to create a bounty after funds have been received
    /// @param data The bounty data/description
    /// @param tokenAddr The token address (address(0) for ETH)
    /// @param amount The bounty amount
    function _createBounty(bytes32 data, address tokenAddr, uint256 amount) internal {
        uint256 tokenId = tokenIdCounter;
        tokenIdCounter++;
        
        Bounty storage bounty = _bounties[tokenId];
        bounty.data = data;
        bounty.tokenAddr = tokenAddr;
        bounty.amount = amount;
        
        // Store data in SimpleStorage to emit ContenthashChanged event
        simpleStorage.storeSha256(data);
        
        _mint(msg.sender, tokenId, 1, "");
        touchIndex();
        
        emit BountyCreated(tokenId, data, tokenAddr, amount, msg.sender);
    }

    /// @notice Adds funds to an existing bounty with ERC20 tokens
    /// @param tokenId The bounty token ID
    /// @param tokenAddr The ERC20 token address (must match bounty's tokenAddr)
    /// @param amount The amount to add
    function topUp(uint256 tokenId, address tokenAddr, uint256 amount) external tokenExists(tokenId) {
        Bounty storage bounty = _bounties[tokenId];
        require(bounty.tokenAddr == tokenAddr, "Token address mismatch");
        require(tokenAddr != address(0), "Use topUp() with ETH for native token");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 token = IERC20(tokenAddr);
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        _topUpBounty(tokenId, tokenAddr, amount);
    }

    /// @notice Adds funds to an existing bounty with ETH
    /// @param tokenId The bounty token ID
    function topUp(uint256 tokenId) external payable tokenExists(tokenId) {
        require(msg.value > 0, "Must send ETH");
        Bounty storage bounty = _bounties[tokenId];
        require(bounty.tokenAddr == address(0), "Bounty uses ERC20, not ETH");
        
        _topUpBounty(tokenId, address(0), msg.value);
    }

    /// @notice Internal function to add funds to a bounty after funds have been received
    /// @param tokenId The bounty token ID
    /// @param tokenAddr The token address (address(0) for ETH)
    /// @param amount The amount to add
    function _topUpBounty(uint256 tokenId, address tokenAddr, uint256 amount) internal {
        Bounty storage bounty = _bounties[tokenId];
        bounty.amount += amount;
        touchIndex();
        
        emit BountyToppedUp(tokenId, tokenAddr, amount);
    }

    /// @notice Updates the bounty data (only owner)
    /// @param tokenId The bounty token ID
    /// @param data The new bounty data
    function update(uint256 tokenId, bytes32 data) external tokenExists(tokenId) onlyOwner(tokenId) {
        Bounty storage bounty = _bounties[tokenId];
        bounty.data = data;
        
        // Store data in SimpleStorage to emit ContenthashChanged event
        simpleStorage.storeSha256(data);
        
        emit BountyUpdated(tokenId, data);
        touchIndex();
    }

    /// @notice Attempts to claim a bounty
    /// @param tokenId The bounty token ID
    /// @param data The claim data
    function makeClaim(uint256 tokenId, bytes32 data) external tokenExists(tokenId) {
        // Store data in SimpleStorage to emit ContenthashChanged event
        simpleStorage.storeSha256(data);
        
        touchIndex();
        emit ClaimAttempted(tokenId, msg.sender, data);
    }

    /// @notice Fulfills claims by distributing the bounty to winners (only owner)
    /// @param tokenId The bounty token ID
    /// @param winners Array of winner addresses to distribute the bounty to
    function fulfillClaim(uint256 tokenId, address[] memory winners) external tokenExists(tokenId) onlyOwner(tokenId) {
        require(winners.length > 0, "Must have at least one winner");
        
        Bounty storage bounty = _bounties[tokenId];
        
        // Calculate and deduct fee from bounty amount
        uint256 fee = (bounty.amount * FEE_BPS) / BPS_DENOMINATOR;
        uint256 amountAfterFee = bounty.amount - fee;
        
        // Transfer fee to beneficiary
        if (bounty.tokenAddr == address(0)) {
            // ETH
            (bool success, ) = beneficiary.call{value: fee}("");
            require(success, "ETH fee transfer failed");
        } else {
            // ERC20
            IERC20(bounty.tokenAddr).safeTransfer(beneficiary, fee);
        }
        
        uint256 amountPerWinner = amountAfterFee / winners.length;
        uint256 remainder = amountAfterFee % winners.length;
        
        if (bounty.tokenAddr == address(0)) {
            // ETH
            for (uint256 i = 0; i < winners.length; i++) {
                (bool success, ) = winners[i].call{value: amountPerWinner}("");
                require(success, "ETH transfer failed");
            }
            // Send remainder back to bounty owner (msg.sender is the owner)
            if (remainder > 0) {
                (bool success, ) = msg.sender.call{value: remainder}("");
                require(success, "ETH remainder transfer failed");
            }
        } else {
            // ERC20
            IERC20 token = IERC20(bounty.tokenAddr);
            for (uint256 i = 0; i < winners.length; i++) {
                token.safeTransfer(winners[i], amountPerWinner);
            }
            // Send remainder back to bounty owner (msg.sender is the owner)
            if (remainder > 0) {
                token.safeTransfer(msg.sender, remainder);
            }
        }
        
        bounty.amount = 0;
        touchIndex();
        
        emit ClaimFulfilled(tokenId, winners);
    }

    /// @notice Gets bounty data
    /// @param tokenId The bounty token ID
    /// @return data The bounty data
    /// @return tokenAddr The token address (address(0) for ETH)
    /// @return amount The bounty amount
    function getBounty(uint256 tokenId) external view tokenExists(tokenId) returns (bytes32 data, address tokenAddr, uint256 amount) {
        Bounty storage bounty = _bounties[tokenId];
        return (bounty.data, bounty.tokenAddr, bounty.amount);
    }

    /// @inheritdoc ERC1155
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal virtual override {
        super._update(from, to, ids, values);
        touchIndex();
    }

    /// @notice Returns the URI for a given token ID
    /// @dev Overrides the ERC1155 uri function
    /// @param tokenId The ID of the token to query
    /// @return The URI string for the token metadata
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        // Check if bounty exists
        Bounty storage bounty = _bounties[tokenId];
        if (bounty.amount == 0) {
            return "";
        }
        
        return ITokenRenderer(tokenRenderer).renderBounty(
            tokenId,
            bounty.data,
            bounty.tokenAddr,
            bounty.amount
        );
    }
}
