// SPDX-License-Identifier: MIT
pragma solidity >=0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "./Oracle/ExampleOracleSimple.sol";
import {SafeMath as SafeMath2} from "@openzeppelin/contracts/math/SafeMath.sol";

contract Fund is ERC20 {
    using SafeMath for uint;

    uint public constant MINIMUM_SHARES = 10**3;
    address _wethToken;
    address _usdtToken;
    ExampleOracleSimple _wethUsdtOracle;

    constructor(
        string memory name,
        string memory symbol,
        address wethToken,
        address usdtToken,
        address oracle
    ) public ERC20(name, symbol) {
        _wethToken = wethToken;
        _usdtToken = usdtToken;
        _wethUsdtOracle = ExampleOracleSimple(oracle);
    }

    function investErc20(address erc20Contract, uint256 depositAmount) public returns (uint shares) {
        TransferHelper.safeTransferFrom(erc20Contract, msg.sender, address(this), depositAmount);
        if (totalSupply() == 0) {
            shares = MINIMUM_SHARES;
        } else {
            // calculate the invest value
            uint totalInvestValue = 0;
            _wethUsdtOracle.update();
            if (erc20Contract == _wethToken) {
                totalInvestValue = _wethUsdtOracle.consult(erc20Contract, depositAmount);
            } else {
                totalInvestValue = depositAmount;
            }
            // calculate fund value
            uint totalFundValue = _wethUsdtOracle.consult(erc20Contract, ERC20(_wethToken).balanceOf(address(this))) + ERC20(_usdtToken).balanceOf(address(this));
            // calculate shares
            shares = totalInvestValue.mul(totalSupply()).div(totalFundValue.sub(totalInvestValue));
        }
        _mint(msg.sender, shares);
    }
}