// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ProvenanceRegistry
/// @notice Immutable on-chain record of royalty splits keyed by MusicBrainz recording MBID.
/// @dev Deployed on Arc Testnet. USDC-as-gas; EVM-compatible; Malachite BFT sub-second finality.
///      Write-once per MBID: once a split is registered it cannot be changed — prevents royalty manipulation.
contract ProvenanceRegistry {
    struct Split {
        address payable wallet;
        uint16 basisPoints; // out of 10000 (100.00%)
    }

    // bytes32-encoded UTF-8 MBID → array of splits
    mapping(bytes32 => Split[]) private _registry;
    mapping(bytes32 => bool)    private _registered;

    event ProvenanceRegistered(
        bytes32 indexed mbid,
        address[]       wallets,
        uint16[]        basisPoints,
        string[]        roles
    );

    error AlreadyRegistered(bytes32 mbid);
    error InvalidSplits();
    error EmptyWallets();

    /// @notice Register an immutable royalty split for a recording. Write-once per MBID.
    /// @param mbid          bytes32-encoded MusicBrainz Recording ID (UTF-8, left-padded)
    /// @param wallets       contributor wallet addresses
    /// @param bps           basis points per contributor (must sum to 10000)
    /// @param roles         human-readable role labels (same length as wallets)
    function register(
        bytes32          mbid,
        address[] calldata wallets,
        uint16[]  calldata bps,
        string[]  calldata roles
    ) external {
        if (_registered[mbid])          revert AlreadyRegistered(mbid);
        if (wallets.length == 0)        revert EmptyWallets();
        if (wallets.length != bps.length) revert InvalidSplits();

        uint16 total;
        for (uint256 i; i < bps.length; i++) {
            total += bps[i];
            _registry[mbid].push(Split(payable(wallets[i]), bps[i]));
        }
        if (total != 10000) revert InvalidSplits();

        _registered[mbid] = true;
        emit ProvenanceRegistered(mbid, wallets, bps, roles);
    }

    /// @notice Returns all splits for a registered MBID.
    function getSplits(bytes32 mbid) external view returns (Split[] memory) {
        return _registry[mbid];
    }

    /// @notice Returns true if the MBID has a registered split.
    function isRegistered(bytes32 mbid) external view returns (bool) {
        return _registered[mbid];
    }
}
