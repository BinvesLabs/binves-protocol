// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/upgrades/contracts/application/App.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol";

contract GenericFundFactory is Initializable, ContextUpgradeSafe {
    App private app;

    event GenericFundCreated(address);

    function initialize(App _app) public initializer {
        app = _app;
    }

    function createInstance(bytes memory _data) public {
        string memory packageName = "binves-protocol";
        string memory contractName = "GenericFund";
        address admin = _msgSender();

        address genericFund = address(app.create(packageName, contractName, admin, _data));

        emit GenericFundCreated(genericFund);
    }
}