pragma solidity >=0.6.6;
pragma experimental ABIEncoderV2;

import "./DSProxy/DSProxy.sol";
import "./ProxyPermission.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./FlashSwapCompoundHandler.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "hardhat/console.sol";


contract CompoundTaker is ProxyPermission {
    using SafeERC20 for IERC20;
    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    IUniswapV2Factory constant UniswapV2Factory = IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f); // same for all networks
    // ILendingPool public constant lendingPool = ILendingPool(0x398eC7346DcD622eDc5ae82352F02bE94C62d119);

    // solhint-disable-next-line const-name-snakecase
    // DefisaverLogger public constant logger = DefisaverLogger(0x5c55B921f590a89C1Ebe84dF170E655a82b62126);

    struct CreateInfo {
        address cCollAddress;
        address cBorrowAddress;
        uint depositAmount;
    }

    struct ExchangeData {
        address srcAddr;
        address destAddr;
        uint srcAmount;
        uint destAmount;
    }

    /// @notice Main function which will take a FL and open a leverage position
    /// @dev Call through DSProxy, if _exchangeData.destAddr is a token approve DSProxy
    function startLeveragedLoan(
      address cCollAddress,
      address cBorrowAddress,
      address srcAddr,
      address destAddr,
      uint srcAmount,
      uint destAmount,
      address payable _FlashSwapCompoundHandler
    ) public payable {
        address pairAddr;

        // IERC20(destAddr).safeIncreaseAllowance(address(this), 10);
        console.log("User USDT balance: %d", IERC20(destAddr).balanceOf(msg.sender));
        console.log("User Allowance USDT balance: %d", IERC20(destAddr).allowance(msg.sender, msg.sender));
        console.log("address(this) in CompoundTaker: %s", address(this));
        // IERC20(destAddr).safeTransferFrom(msg.sender, address(this), destAmount);
        // if (destAddr != ETH_ADDRESS) {
            // IERC20(destAddr).transferFrom(msg.sender, address(this), destAmount);
        // } else {
        //     require(msg.value >= destAmount, "Must send correct amount of eth");
        // }

        // Send tokens to FL receiver
        // sendDeposit(_compReceiver, _exchangeData.destAddr);

        // Pack the struct data
        // (uint[4] memory numData, address[6] memory cAddresses, bytes memory callData)
                                            // = _packData(_createInfo, _exchangeData);
        // bytes memory paramsData = abi.encode(numData, cAddresses, callData, address(this));
        bytes memory paramsData = abi.encode(cCollAddress, cBorrowAddress, address(this));

        givePermission(_FlashSwapCompoundHandler);
        console.log("=====================");
        pairAddr = UniswapV2Factory.getPair(srcAddr, destAddr);
        require(pairAddr != address(0), "Requested token not available");
        IUniswapV2Pair(pairAddr).swap(
            srcAmount,
            destAmount,
            _FlashSwapCompoundHandler,
            paramsData);

        removePermission(_FlashSwapCompoundHandler);

        // logger.Log(address(this), msg.sender, "CompoundLeveragedLoan",
            // abi.encode(_exchangeData.srcAddr, _exchangeData.destAddr, loanAmount, _exchangeData.destAmount));
    }

    function sendDeposit(address payable _compoundReceiver, address _token) internal {
        if (_token != ETH_ADDRESS) {
            IERC20(_token).transfer(_compoundReceiver, IERC20(_token).balanceOf(address(this)));
        }

        _compoundReceiver.transfer(address(this).balance);
    }

//    function _packData(
//        CreateInfo memory _createInfo,
//        SaverExchangeCore.ExchangeData memory exchangeData
//    ) internal pure returns (uint[4] memory numData, address[6] memory cAddresses, bytes memory callData) {
//
//        numData = [
//            exchangeData.srcAmount,
//            exchangeData.destAmount,
//            exchangeData.minPrice,
//            exchangeData.price0x
//        ];
//
//        cAddresses = [
//            _createInfo.cCollAddress,
//            _createInfo.cBorrowAddress,
//            exchangeData.srcAddr,
//            exchangeData.destAddr,
//            exchangeData.exchangeAddr,
//            exchangeData.wrapper
//        ];
//
//        callData = exchangeData.callData;
//    }
}

