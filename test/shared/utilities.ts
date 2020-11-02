import {Contract, providers, Signer} from "ethers";
import {ethers} from "hardhat";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

export async function getProxy(
    registry: Contract,
    acc: Signer,
    provider: providers.JsonRpcProvider
) {
    let proxyAddr = await registry.proxies(acc.getAddress());

    if (proxyAddr === NULL_ADDRESS) {
        await registry.build(acc.getAddress(), { from: acc.getAddress() });
        proxyAddr = await registry.proxies(acc.getAddress());
    }

    const proxy = await ethers.getContractAt("DSProxy", proxyAddr);
    let web3proxy = null;

    if (provider != null) {
        web3proxy = await ethers.getContractAt("DSProxy", proxyAddr);
    }

    return { proxy, proxyAddr, web3proxy };
}