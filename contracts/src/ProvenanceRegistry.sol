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

    struct Correction {
        address[] wallets;
        uint16[] bps;
        string[] roles;
        string reason;
        uint256 timestamp;
    }

    // bytes32-encoded MBID -> array of corrections proposed
    mapping(bytes32 => Correction[]) private _corrections;

    event CorrectionProposed(
        bytes32 indexed mbid,
        address[] wallets,
        uint16[] bps,
        string[] roles,
        string reason,
        uint256 timestamp
    );

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

    /// @notice Propose a correction to an existing registered split.
    function proposeCorrection(
        bytes32 mbid,
        address[] calldata newWallets,
        uint16[] calldata newBps,
        string[] calldata newRoles,
        string calldata reason
    ) external {
        if (!_registered[mbid])          revert InvalidSplits();
        if (newWallets.length == 0)      revert EmptyWallets();
        if (newWallets.length != newBps.length || newWallets.length != newRoles.length) revert InvalidSplits();

        uint16 total;
        for (uint256 i; i < newBps.length; i++) {
            total += newBps[i];
        }
        if (total != 10000) revert InvalidSplits();

        _corrections[mbid].push(Correction({
            wallets: newWallets,
            bps: newBps,
            roles: newRoles,
            reason: reason,
            timestamp: block.timestamp
        }));

        emit CorrectionProposed(mbid, newWallets, newBps, newRoles, reason, block.timestamp);
    }

    /// @notice Returns all splits for a registered MBID.
    function getSplits(bytes32 mbid) external view returns (Split[] memory) {
        return _registry[mbid];
    }

    /// @notice Returns true if the MBID has a registered split.
    function isRegistered(bytes32 mbid) external view returns (bool) {
        return _registered[mbid];
    }

    /// @notice Returns count of proposed corrections.
    function getCorrectionsCount(bytes32 mbid) external view returns (uint256) {
        return _corrections[mbid].length;
    }

    /// @notice Returns details of a specific correction.
    function getCorrection(bytes32 mbid, uint256 index) external view returns (
        address[] memory wallets,
        uint16[] memory bps,
        string[] memory roles,
        string memory reason,
        uint256 timestamp
    ) {
        Correction storage c = _corrections[mbid][index];
        return (c.wallets, c.bps, c.roles, c.reason, c.timestamp);
    }
}
