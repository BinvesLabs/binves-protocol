import { ethers } from "hardhat";
import { expect } from "chai";
import {DsProxy} from "../typechain/DsProxy";
import {ProxyRegistryInterface} from "../typechain/ProxyRegistryInterface";
import makerAddresses from "./shared/makerAddress.json";
import {getProxy} from "./shared/utilities";
import {FlashSwapCompoundHandler, FlashSwapCompoundHandlerFactory} from "../typechain";

describe("FlashSwapCompoundHandler", function () {
    let proxy: DsProxy;

    beforeEach(async () => {
        const provider = ethers.provider;
        const signer = provider.getSigner();
        const registry : ProxyRegistryInterface = await ethers.getContractAt(
            "ProxyRegistryInterface",
            makerAddresses["PROXY_REGISTRY"]
        ) as ProxyRegistryInterface;
        const proxyInfo = await getProxy(registry, signer, provider);
        proxy = proxyInfo.proxy;
    });

    it("deploy", async () => {
        const flashSwapCompoundHandlerFactory: FlashSwapCompoundHandlerFactory = await ethers.getContractFactory("FlashSwapCompoundHandler") as FlashSwapCompoundHandlerFactory;
        const flashSwapCompoundHandler: FlashSwapCompoundHandler = await flashSwapCompoundHandlerFactory.deploy();
        await flashSwapCompoundHandler.deployed();
        expect(await flashSwapCompoundHandler.UNISWAP_V2_FACTORY_ADDR()).to.equal("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
    });
});