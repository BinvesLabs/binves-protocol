import { ethers, network } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { expect } from "chai";
import makerAddresses from "./shared/makerAddress.json";
import { getProxy } from "./shared/utilities";
import { DsProxy, DsProxyInterface } from "../typechain/DsProxy";
import { ProxyRegistryInterface } from "../typechain/ProxyRegistryInterface";
import { DsGuard } from "../typechain/DsGuard";
import DSGuard from "../artifacts/contracts/DSProxy/DSGuard.sol/DSGuard.json"
import DSAuth from "../artifacts/contracts/DSProxy/DSAuth.sol/DSAuth.json"
import {
  ProxyPermission,
  DsAuth,
  DsAuthFactory,
  FlashSwapCompoundHandler,
  FlashSwapCompoundHandlerFactory,
  CompoundTaker,
  CompoundTakerFactory,
} from "../typechain";


const BINANCE_ADDRESS = "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const srcAddr = WETH_ADDRESS;
const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const destAddr = USDT_ADDRESS;
const C_ETH_ADDRESS = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";
const cCollAddr: string = C_ETH_ADDRESS;
const C_USDT_ADDRESS = "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9";
const cBorrAddr: string = C_USDT_ADDRESS;
const overrides = {
  gasLimit: 999999,
  gasPrice: 0,
};

describe("Leverage", function () {
  let proxyAddr: string;
  let web3Proxy: DsProxy;
  let web3ProxySigned: DsProxy;
  let compoundTakerFactory: CompoundTakerFactory;
  let compoundTaker: CompoundTaker;
  let flashSwapCompoundHandler: FlashSwapCompoundHandler;
  let flashSwapCompoundHandlerFactory: FlashSwapCompoundHandlerFactory;
  let destTokenContract: Contract;
  let dsAuthFactory: DsAuthFactory;
  let dsAuth: DsAuth;
  let dsGuard: DsGuard;
  let proxyPermission: ContractFactory;
  let account: string;

  beforeEach(async () => {
    const provider = ethers.provider;
    const signer = provider.getSigner();
    const registry: ProxyRegistryInterface = (await ethers.getContractAt(
      "ProxyRegistryInterface",
      makerAddresses["PROXY_REGISTRY"]
    )) as ProxyRegistryInterface;
    const proxyInfo = await getProxy(registry, signer, provider);
    proxyAddr = proxyInfo.proxyAddr;
    flashSwapCompoundHandlerFactory = (await ethers.getContractFactory(
      "FlashSwapCompoundHandler"
    )) as FlashSwapCompoundHandlerFactory;
    compoundTakerFactory = (await ethers.getContractFactory(
      "CompoundTaker"
    )) as CompoundTakerFactory;
    compoundTaker = await compoundTakerFactory.deploy();
    await compoundTaker.deployed();
    destTokenContract = await ethers.getContractAt("IERC20", destAddr)
    proxyPermission = await ethers.getContractFactory("ProxyPermission")
    const proxyPerm = await proxyPermission.deploy();
    await proxyPerm.deployed();
    // proxyPerm.givePermission(proxyAddr);
    // dsAuth = await ethers.getContractAt("DSAuth", proxyAddr);
    // dsAuth = await dsAuthFactory.deploy();
    // dsAuth.deployed();
    // dsGuardContract = await ethers.getContractAt(DSGuard.abi, await dsAuth.authority());
    // dsGuardContract.permit(proxyAddr);
    account = await signer.getAddress();
    console.log("User address", account);
    console.log("dest address", destAddr);
    console.log("Proxy address", proxyAddr);
    await network.provider.request({
            method: "hardhat_impersonateAccount",
            // Binance account
            params: [BINANCE_ADDRESS]
    })
    // wbtc = await ethers.getContractAt("IERC20", "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599") as Ierc20;
    await destTokenContract.connect(provider.getSigner(BINANCE_ADDRESS)).transfer(await signer.getAddress(), 10);
    const destTokenBal = await destTokenContract.balanceOf(account);
    // expect(destTokenBal.to.equal(10));
    console.log(ethers.utils.formatUnits(destTokenBal, 'wei'));
    web3Proxy = (await ethers.getContractAt("DSProxy", proxyAddr)) as DsProxy;
    web3ProxySigned = web3Proxy.connect(signer);
    flashSwapCompoundHandler = await flashSwapCompoundHandlerFactory.deploy();
    // await destTokenContract.connect(signer).approve(proxyAddr, 10);
    await destTokenContract.connect(signer).transfer(proxyAddr, 10);
    await flashSwapCompoundHandler.deployed();
  });

  it("creates", async () => {
    const srcAmount = ethers.utils.parseEther("1");
    const destAmount = ethers.utils.parseEther("1");
    // await destTokenContract.approve(proxyAddr, ethers.utils.parseEther('1'));
    const proxyBal = await destTokenContract.balanceOf(proxyAddr)
    console.log(ethers.utils.formatUnits(proxyBal, 'wei'));
    const callData = compoundTaker.interface.encodeFunctionData(
      "startLeveragedLoan",
      [
        cCollAddr,
        cBorrAddr,
        srcAddr,
        destAddr,
        srcAmount,
        destAmount,
        flashSwapCompoundHandler.address,
      ]
    );
    await web3ProxySigned.execute(compoundTaker.address, callData, overrides);

  });
});
