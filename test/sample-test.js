const { expect } = require("chai");
const IERC20Artifact = require("@openzeppelin/contracts/build/contracts/IERC20");

describe("Greeter", function() {
    it("Should return the new greeting once it's changed", async function() {
        const [owner] = await ethers.getSigners();
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF"]
        });
        const daiContract = await ethers.getContractAt(IERC20Artifact.abi, "0x6b175474e89094c44da98b954eedeac495271d0f");
        const dummy = await daiContract.connect(ethers.provider.getSigner("0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF")).transfer(owner.getAddress(), 100);
    });
});
