import { ethers, network } from "hardhat";
import { expect } from "chai";
import IERC20Artifact from "@openzeppelin/contracts/build/contracts/IERC20.json";
import {Greeter} from "../typechain/Greeter";
import {GreeterFactory} from "../typechain";

describe("Greeter", function() {
    it("Should return the new greeting once it's changed", async function() {
        const [owner] = await ethers.getSigners();
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF"]
        });
        const daiContract = await ethers.getContractAt(IERC20Artifact.abi, "0x6b175474e89094c44da98b954eedeac495271d0f");
        const dummy = await daiContract.connect(ethers.provider.getSigner("0x0681d8Db095565FE8A346fA0277bFfdE9C0eDBBF")).transfer(owner.getAddress(), 100);

        const greeterFactory: GreeterFactory = (await ethers.getContractFactory("Greeter")) as GreeterFactory;
        const greeter: Greeter = await greeterFactory.deploy("Hello, world!");
        await greeter.deployed();
        expect(await greeter.greet()).to.equal("Hello, world!");
    });
});
