// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "Libraries/TransferHelper.sol";
import "Libraries/UniswapOracle.sol";

interface Compound {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
}

contract GenericFund is ERC20UpgradeSafe, ERC20BurnableUpgradeSafe, AccessControlUpgradeSafe {

    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");

    address public compoundCEthContract = address(0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5);

    mapping (address => bool) isCompoundCErc20Contract;

    mapping (address => bool) allowedDepositAssets;

    // rinkeby oracle
    address private ethUsdtOracle = new UniswapOracle(Address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f), Address(0xc778417e063141139fce010982780140aa0cd5ab), Address());

    modifier onlyFundManager {
        // Check that the calling account has the fund manager role
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a fund manager");
    }

    function initialize(string fundName, string fundSymbol, mapping (address => bool) allowedDepositAssets) public initializer {
        __ERC20_init(fundName, fundSymbol);
        // Grant the fund manager role to a specified account
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        allowedDepositAssets = allowedDepositAssets;
    }

    function accrueManagementFee() public returns (uint) {
        return uint();
    }

    function claimManagementFee() public onlyFundManager returns (bool) {
        return true;
    }

    // Compound Operations

    function supplyErc20ToCompound(address erc20Contract, address cErc20Contract, uint256 supplyAmount) public onlyFundManager returns (bool) {
        return true;
    }

    function redeemCErc20FromCompound(address cErc20Contract, uint256 redeemAmount) public onlyFundManager returns (bool) {
        return true;
    }

    function supplyEthToCompound(uint256 supplyAmount) public onlyFundManager returns (bool) {
        return true;
    }

    function redeemEthFromCompound(uint256 redeemAmount) public onlyFundManager returns (bool) {
        return true;
    }

    // Investor Operations

    function investErc20(address erc20Contract, uint256 depositAmount) public returns (bool) {
        require(erc20Contract == Address(0xdac17f958d2ee523a2206206994597c13d831ec7), 'GenericFund: CAN_ONLY_INVEST_TETHER');
        TransferHelper.safeTransferFrom(erc20Contract, msg.sender, Address(this), depositAmount);

        return true;
    }

}