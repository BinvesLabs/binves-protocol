// SPDX-License-Identifier: MIT
pragma solidity >=0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@nomiclabs/buidler/console.sol";
import "./Oracle/ExampleOracleSimple.sol";
// import {SafeMath as SafeMath2} from "@openzeppelin/contracts/math/SafeMath.sol";

contract Fund is ERC20 {
    using SafeMath for uint;

    uint public constant MINIMUM_SHARES = 1e21;
    address _wethToken;
    address _usdtToken;
    address _router_address;
    uint256 MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    ExampleOracleSimple _wethUsdtOracle;
    IUniswapV2Router02 _router;


    constructor(
        string memory name,
        string memory symbol,
        address wethToken,
        address usdtToken,
        address oracle,
        address router
    ) public ERC20(name, symbol) {
        _wethToken = wethToken;
        _usdtToken = usdtToken;
        _wethUsdtOracle = ExampleOracleSimple(oracle);
        _router = IUniswapV2Router02(router);
        _router_address = router;
    }

    function investErc20(address erc20Contract, uint256 depositAmount) public returns (uint shares) {
	// require() to make sure depositAmount > 0
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
            uint totalFundValue = _wethUsdtOracle.consult(_wethToken, ERC20(_wethToken).balanceOf(address(this))) + ERC20(_usdtToken).balanceOf(address(this));
            // calculate shares
            shares = totalInvestValue.mul(totalSupply()).div(totalFundValue.sub(totalInvestValue));
        }
        _mint(msg.sender, shares);
    }

    function swapErc20(address tokenA, address tokenB, uint amountA) public returns (uint amountB) {
        uint[] memory amounts;
        ERC20(_wethToken).approve(_router_address, ERC20(_wethToken).balanceOf(address(this)));
        ERC20(_usdtToken).approve(_router_address, ERC20(_usdtToken).balanceOf(address(this)));
        address[] memory path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
        amounts = _router.swapExactTokensForTokens(amountA, 0, path, address(this), MAX_INT);
        console.log('Exchanged: ', amountA);
        console.log('For: ', amounts[1]);
        return amounts[1];
    }

    function withdrawErc20(address withdrawToken, uint withdrawAmount) public returns (uint tokenAmount) {
        _wethUsdtOracle.update();
	    uint _one = 1;
        uint realamount;
	    uint weth2usdt = _wethUsdtOracle.consult(_wethToken, _one);
        uint totalFundValue = _wethUsdtOracle.consult(_wethToken, ERC20(_wethToken).balanceOf(address(this))) + ERC20(_usdtToken).balanceOf(address(this));
    	uint shareValue = withdrawAmount.mul(totalFundValue).div(totalSupply());
        console.log('weth - usdt price:', weth2usdt);
        console.log('fund WETH balance: ', ERC20(_wethToken).balanceOf(address(this)));
        console.log('fund USDT Balance: ', ERC20(_usdtToken).balanceOf(address(this)));
        console.log('withdraw token amount', withdrawAmount);
        console.log('total supply:', totalSupply());
        console.log('total fund value:', totalFundValue);
        console.log('share value:', shareValue);
        if (withdrawToken == _wethToken) {
		    tokenAmount = shareValue.div(weth2usdt);
		    if (tokenAmount > ERC20(_wethToken).balanceOf(address(this))) {
                console.log('swapping usdt for weth');
			    realamount = swapErc20(_usdtToken, _wethToken, shareValue);
		    }
        } else {
        	tokenAmount = shareValue;
		    if (tokenAmount > ERC20(_usdtToken).balanceOf(address(this))) {
                console.log('swapping weth for usdt');
			    swapErc20(_wethToken, _usdtToken, tokenAmount);
		    }
        }
        console.log('fund WETH balance: ', ERC20(_wethToken).balanceOf(address(this)));
        console.log('fund USDT Balance: ', ERC20(_usdtToken).balanceOf(address(this)));
    	ERC20(withdrawToken).approve(msg.sender, tokenAmount);
        TransferHelper.safeTransfer(withdrawToken, msg.sender, realamount);
    	_burn(msg.sender, withdrawAmount);
    }
}
