import { waffle, ethers } from "hardhat";
import { Contract, Signer, providers } from "ethers";
import { expect } from "chai";
import DSProxyCache from "../artifacts/contracts/dsproxy/DSProxy.sol/DSProxyCache.json";
import makerAddresses from "./shared/makerAddress.json";
import ProxyRegistryInterfaceContract from "../artifacts/contracts/interfaces/ProxyRegistryInterface.sol/ProxyRegistryInterface.json";
import DSProxyContractFactoryContract from "../artifacts/contracts/interfaces/DSProxyInterface.sol/DSProxyInterface.json";
import {getProxy} from "./shared/utilities";
import {DsProxy, DsProxyInterface} from "../typechain/DsProxy";
import {ProxyRegistryInterface} from "../typechain/ProxyRegistryInterface";

// const ERC20 = ethers.contract.fromArtifact("ERC20");

// const compoundBasicProxyAddr = '0x0F1e33A36fA6a33Ea01460F04c6D8F1FAc2186E3';
// const compoundLoanInfoAddr = '0x4D32ECeC25d722C983f974134d649a20e78B1417';
// const uniswapWrapperAddr = '0x0B6fc157C83a9A5a64776E2183959f75180eFF27';
// const oldUniswapWrapperAddr = '0x1e30124FDE14533231216D95F7798cD0061e5cf8';
// const comptrollerAddr = '0x3d989210a31b4961b30ef54be2aed79b9c9cd3b';
//
// const compoundCreateTakerAddr = '0xf51B62641D4c472E6EC0DB7Ea50382aE66Ff092e';
// const compoundCreateReceiverAddr = '0x7B83908271437c08EAc9AfBA56d7080b8D94038C';

// const makerVersion = "1.0.6";

// async function fetchMakerAddresses(version: string, params = {}) {
//   const url = `https://changelog.makerdao.com/releases/mainnet/${version}/contracts.json`;
//   const response = await fetch(url)
//   const body = await response.json()
//
//   // const res = await Axios.get(url, params);
//
//   // console.log(res.data);
//
//   return body;
// }

describe("Leverage", function () {
  let proxy: DsProxy;
  let proxyAddr: string;
  let web3Proxy: DsProxy;

  beforeEach(async () => {
    const provider = ethers.provider;
    const signer = provider.getSigner();
    const registry : ProxyRegistryInterface = await ethers.getContractAt(
      "ProxyRegistryInterface",
      makerAddresses["PROXY_REGISTRY"]
    ) as ProxyRegistryInterface;
    const proxyInfo = await getProxy(registry, signer, provider);
    proxy = proxyInfo.proxy;
    proxyAddr = proxyInfo.proxyAddr;
    web3Proxy = await ethers.getContractAt("DSProxy", proxyAddr) as DsProxy;
  });

  it("should create", async () => {
    console.log(proxy);
    console.log(web3Proxy.interface);
    expect(proxy);
  });
});
