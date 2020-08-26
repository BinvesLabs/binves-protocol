// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface Compound {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
}

contract GenericFund is ERC20, ERC20Burnable, AccessControl {

    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");

    address public compoundCEthContract = address(0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5);

    mapping (address => bool) isCompoundCErc20Contract;

    modifier onlyFundManager {
        // Check that the calling account has the fund manager role
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a fund manager");
    }

    constructor(string fundName, string fundSymbol) public ERC20(fundName, fundSymbol) {
        // Grant the fund manager role to a specified account
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    // Compound Operations

    function supplyErc20ToCompound(address erc20Contract, address cErc20Contract, uint256 supplyAmount) public onlyFundManager returns (bool) {
        return true;
    }

    function redeemCErc20Tokens(address cErc20Contract, uint256 redeemAmount) public onlyFundManager returns (bool) {
        return true;
    }

    function supplyEthToCompound(uint256 supplyAmount) public onlyFundManager returns (bool) {
        return true;
    }

    function redeemEth(uint256 redeemAmount) public onlyFundManager returns (bool) {
        return true;
    }

}