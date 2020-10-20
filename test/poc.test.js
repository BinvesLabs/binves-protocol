// Load compiled artifacts

const web3 = require('web3');
const UniswapV2FactoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory');
const UniswapV2PairArtifact = require('@uniswap/v2-core/build/UniswapV2Pair');
const UniswapV2RouterArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02');
const UniswapSimpleOracleArtifact = require('@uniswap/v2-periphery/build/ExampleOracleSimple');

// const { BN, constants, time } = require('@openzeppelin/test-helpers');
const { time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

function expandTo18Decimals(number) {
  return ethers.BigNumber.from(number)
    .mul(ethers.BigNumber.from(10)
    .pow(ethers.BigNumber.from(18)));
}


describe('Proof of concept', function () {

  beforeEach(async function() {
    const [owner] = await ethers.getSigners();
    this.owner_address = owner.getAddress();
    const overrides = { from: owner };
    const MockErc20 = await ethers.getContractFactory('MockErc20');
    this.Fund = await ethers.getContractFactory('Fund');

    const UniswapFactoryContract = await ethers.getContractFactory(UniswapV2FactoryArtifact.abi, UniswapV2FactoryArtifact.bytecode);
    const UniswapRouterContract = await ethers.getContractFactory(UniswapV2RouterArtifact.abi, UniswapV2RouterArtifact.bytecode);
    const UniswapOracleContract = await ethers.getContractFactory(UniswapSimpleOracleArtifact.abi, UniswapSimpleOracleArtifact.bytecode);

    this.wether = await MockErc20.deploy("wethereum", "WETH");
    await this.wether.deployed();
    this.tether = await MockErc20.deploy("tether", "USDT");
    await this.tether.deployed();
    this.factory = await UniswapFactoryContract.deploy(this.owner_address);
    await this.factory.deployed();
    this.router = await UniswapRouterContract.deploy(this.factory.address, this.wether.address );
    await this.router.deployed();
    await this.factory.createPair(this.wether.address, this.tether.address);
    // const ethUsdtPairAddress = await this.factory.getPair(this.wether.address, this.tether.address);
    // console.log(ethers.Signer.isSigner(ethers.provider.getSigner(ethUsdtPairAddress)));
    // this.wethUsdtPair = await ethers.getContractFactory(UniswapV2PairArtifact.abi, UniswapV2PairArtifact.bytecode, ethers.provider.getSigner(ethUsdtPairAddress));
    await this.wether.approve(this.router.address, expandTo18Decimals(100));
    await this.tether.approve(this.router.address, expandTo18Decimals(30000));
    // console.log(await this.wether.balanceOf(owner_address));
    await this.router.addLiquidity(
      this.wether.address,
      this.tether.address,
      expandTo18Decimals(100),
      expandTo18Decimals(30000),
      expandTo18Decimals(0),
      expandTo18Decimals(0),
      this.owner_address,
      ethers.constants.MaxUint256
      // overrides
    );
    this.oracle = await UniswapOracleContract.deploy(this.factory.address, this.wether.address, this.tether.address);
  });

  it('should be able to invest ERC20', async function () {
    const fund = await this.Fund.deploy("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
    await fund.deployed();
    await this.tether.approve(fund.address, expandTo18Decimals(1000000));
    await this.wether.approve(fund.address, expandTo18Decimals(1000000));
    await fund.investErc20(this.tether.address, expandTo18Decimals(10000));
    let shares = await fund.balanceOf(this.owner_address);
    expect(ethers.utils.formatEther(shares)).to.equal('1000.0');
    ethers.provider.send("evm_increaseTime", [86400])   // add 24 hours
    ethers.provider.send("evm_mine")      // mine the next block
    await fund.investErc20(this.wether.address, expandTo18Decimals(10));
    shares = await fund.balanceOf(this.owner_address);
    expect(ethers.utils.formatEther(shares)).equal('1300.0');
  });

  it('should be able to swap ERC20', async function() {
    const approveamount = expandTo18Decimals(1000000)
    const investamount = expandTo18Decimals(10000)
    const usdtswapamount = expandTo18Decimals(5000);
    const fund = await this.Fund.deploy("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
    await fund.deployed();
    await this.tether.approve(fund.address, approveamount);
    await this.wether.approve(fund.address, approveamount);
    await fund.investErc20(this.tether.address, investamount);
    let shares = await fund.balanceOf(this.owner_address);
    fund.swapErc20(this.tether.address, this.wether.address, usdtswapamount);
    let amountUSDT = await this.tether.balanceOf(fund.address);
    let amountweth = await this.wether.balanceOf(fund.address);
    expect(ethers.utils.formatEther(amountUSDT)).to.equal('5000.0');
    expect(ethers.utils.formatEther(amountweth)).to.equal('14.248963841646419894');

  });

  it('withdrawErc20', async function() {
    const approveamount = expandTo18Decimals(1000000)
    const investamount = expandTo18Decimals(10000)
    const withdrawshare = expandTo18Decimals(500);
    let wethbalance = await this.wether.balanceOf(this.owner_address);
    // const withdrawshare = 500;
    const fund = await this.Fund.deploy("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
    await fund.deployed();
    await this.tether.approve(fund.address, approveamount);
    await this.wether.approve(fund.address, approveamount);
    await fund.investErc20(this.tether.address, investamount);
    let shares = await fund.balanceOf(this.owner_address);
    ethers.provider.send("evm_increaseTime", [86400])   // add 24 hours
    ethers.provider.send("evm_mine")      // mine the next block
    await fund.withdrawErc20(this.wether.address, withdrawshare);
    wethbalance = await this.wether.balanceOf(this.owner_address);
    expect(ethers.utils.formatEther(wethbalance)).to.equal('999999914.248963841646419894');
  });
});

