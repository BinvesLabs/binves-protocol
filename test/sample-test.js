const { expect } = require("chai");
const IERC20Artifact = require("@openzeppelin/contracts/build/contracts/IERC20");

describe("Greeter", function() {
    it("Should return the new greeting once it's changed", async function() {
        const [owner] = await ethers.getSigners();
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x6b175474e89094c44da98b954eedeac495271d0f"]
        });
        const daiContract = await ethers.getContractAt(IERC20Artifact.abi, "0x6b175474e89094c44da98b954eedeac495271d0f");
        // const dummy = await daiContract.transfer(owner, 100);
        const dummy = await daiContract.connect("0x6b175474e89094c44da98b954eedeac495271d0f").transfer(owner.getAddress(), 100);
    });
});
