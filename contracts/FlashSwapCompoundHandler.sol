pragma solidity >=0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import './libraries/UniswapV2Library.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import "./interfaces/DSProxyInterface.sol";
import "./interfaces/CTokenInterface.sol";
import "./interfaces/ComptrollerInterface.sol";

contract FlashSwapCompoundHandler is IUniswapV2Callee {
    using SafeERC20 for IERC20;

    address public constant COMPTROLLER_ADDR = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B;
    address public constant UNISWAP_V2_FACTORY_ADDR = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

    constructor() public {}

    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        address token0 = IUniswapV2Pair(msg.sender).token0(); // fetch the address of token0
        address token1 = IUniswapV2Pair(msg.sender).token1(); // fetch the address of token1
        assert(msg.sender == IUniswapV2Factory(UNISWAP_V2_FACTORY_ADDR).getPair(token0, token1)); // ensure that msg.sender is a V2 pair
        assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
        address uniswapBorrowToken = amount0 == 0 ? token1 : token0;
        address uniswapRepayToken = amount0 == 0 ? token0 : token1;
        uint uniswapBorrowTokenAmount = amount0 == 0 ? amount1 : amount0;
        (
            address cCollateralToken,
            address cBorrowToken,
            address dsProxy
        ) = abi.decode(data, (address,address,address));
        // Send loaned asset to DsProxy
        IERC20(uniswapBorrowToken).safeTransfer(dsProxy, IERC20(uniswapBorrowToken).balanceOf(address(this)));
        // Execute the DsProxy call to open loan on Compound
        bytes memory openLoanLogicData = abi.encodeWithSignature(
            "openLoan(address,address,uint256)",
                cCollateralToken,
                cBorrowToken,
                uniswapBorrowTokenAmount);
        DSProxyInterface(dsProxy).execute(address(this), openLoanLogicData);
        // Repay the loan with the money DSProxy sent back. msg.sender here is uniswap pair.
        address[] memory path = new address[](2);
        path[0] = uniswapRepayToken;
        path[1] = uniswapBorrowToken;
        IERC20(uniswapRepayToken).safeTransfer(msg.sender, UniswapV2Library.getAmountsIn(UNISWAP_V2_FACTORY_ADDR, uniswapBorrowTokenAmount, path)[0]);
    }

    // Context: DSProxy
    function openLoan(address cCollateralToken, address cBorrowToken, uint uniswapBorrowTokenAmount) public {
        address collateralToken = CTokenInterface(cCollateralToken).underlying();
        address borrowToken = CTokenInterface(cBorrowToken).underlying();
        uint collateralTokenAmount = IERC20(collateralToken).balanceOf(address(this));
        depositCompound(collateralToken, cCollateralToken, collateralTokenAmount);
        // draw debt
        borrowCompound(cBorrowToken, uniswapBorrowTokenAmount);
        // Send back to repay uniswap flash swap. msg.sender here is FlashSwapCompoundHandler.
        IERC20(borrowToken).transfer(msg.sender, IERC20(borrowToken).balanceOf(address(this)));
    }

    // Context: DSProxy
    function depositCompound(address token, address cToken, uint amount) internal {
        IERC20(token).safeApprove(cToken, uint(-1));
        enterMarket(cToken);
        require(CTokenInterface(cToken).mint(amount) == 0, "mint error");
    }

    // Context: DSProxy
    function borrowCompound(address cToken, uint amount) internal {
        enterMarket(cToken);
        require(CTokenInterface(cToken).borrow(amount) == 0);
    }

    // Context: DSProxy
    function enterMarket(address cToken) public {
        address[] memory markets = new address[](1);
        markets[0] = cToken;
        ComptrollerInterface(COMPTROLLER_ADDR).enterMarkets(markets);
    }
}