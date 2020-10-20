// Load compiled artifacts

const UniswapV2FactoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory');
const UniswapV2PairArtifact = require('@uniswap/v2-core/build/UniswapV2Pair');
const UniswapV2RouterArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02');
const UniswapSimpleOracleArtifact = require('@uniswap/v2-periphery/build/ExampleOracleSimple');

const { BN, constants, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

function expandTo18Decimals(number) {
  return new BN(number).mul(new BN(10).pow(new BN(18)));
}

function retractFrom18Decimals(number) {
  return web3.utils.fromWei(number, 'ether');
}

describe('MyContract', function () {

  beforeEach(async function() {
    const [owner] = await ethers.getSigners();
    const owner_address = owner.getAddress();
    const overrides = { from: owner };
    const MockErc20 = await ethers.getContractFactory('MockErc20');
    const Fund = await ethers.getContractFactory('Fund');

    const UniswapFactoryContract = await ethers.getContractFactory(UniswapV2FactoryArtifact.abi, UniswapV2FactoryArtifact.bytecode);
    const UniswapRouterContract = await ethers.getContractFactory(UniswapV2RouterArtifact.abi, UniswapV2RouterArtifact.bytecode);
    const UniswapOracleContract = await ethers.getContractFactory(UniswapSimpleOracleArtifact.abi, UniswapSimpleOracleArtifact.bytecode);

    this.wether = await MockErc20.deploy("wethereum", "WETH");
    await this.wether.deployed();
    this.tether = await MockErc20.deploy("tether", "USDT");
    await this.tether.deployed();
    this.factory = await UniswapFactoryContract.deploy(owner_address);
    await this.factory.deployed();
    this.router = await UniswapRouterContract.deploy(this.factory.address, this.wether.address );
    await this.router.deployed();
    await this.factory.createPair(this.wether.address, this.tether.address);
    const ethUsdtPairAddress = await this.factory.getPair(this.wether.address, this.tether.address);
    console.log(ethers.Signer.isSigner(ethers.provider.getSigner(ethUsdtPairAddress)));
    this.wethUsdtPair = await ethers.getContractFactory(UniswapV2PairArtifact.abi, UniswapV2PairArtifact.bytecode, ethers.provider.getSigner(ethUsdtPairAddress));
    await this.wether.approve(this.router.address, expandTo18Decimals(100));
    await this.tether.approve(this.router.address, expandTo18Decimals(30000));
    await this.router.addLiquidity(
      this.wether.address,
      this.tether.address,
      expandTo18Decimals(100),
      expandTo18Decimals(30000),
      0,
      0,
      owner_address,
      constants.MAX_UINT256
      // overrides
    );
    console.log('==========================================');
    this.oracle = await UniswapOracleContract.deploy(this.factory.address, this.wether.address, this.tether.address);
    await time.increase(time.duration.days(1));
  });

  it('investErc20', async function () {
    const fund = await Fund.deploy("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
    await this.tether.approve(fund.address, new BN(1000000), overrides);
    await this.wether.approve(fund.address, new BN(1000000), overrides);
    await fund.investErc20(this.tether.address, new BN(10000), overrides);
    let shares = await fund.balanceOf(owner_address);
    expect(shares).to.be.bignumber.equal(new BN(1000));
    await fund.investErc20(this.wether.address, new BN(10), overrides);
    shares = await fund.balanceOf(owner_address);
    expect(shares).to.be.bignumber.equal(new BN(1300));
  });

  it('swapErc20', async function() {
    const approveamount = expandTo18Decimals(1000000)
    const investamount = expandTo18Decimals(10000)
    const usdtswapamount = expandTo18Decimals(700);
    const fund = await Fund.deploy("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
    await this.tether.approve(fund.address, approveamount, overrides);
    await this.wether.approve(fund.address, approveamount, overrides);
    await fund.investErc20(this.tether.address, investamount, overrides);
    let shares = await fund.balanceOf(owner_address);
    fund.swapErc20(this.tether.address, this.wether.address, usdtswapamount);
    let amountUSDT = retractFrom18Decimals(await this.tether.balanceOf(fund.address));
    let amountweth = retractFrom18Decimals(await this.wether.balanceOf(fund.address));
    expect(amountUSDT).equal('9300');
    expect(amountweth).equal('2.273445414832936454');

  });

  //it('withdrawErc20', async function() {
  //  const approveamount = expandTo18Decimals(1000000)
  //  const investamount = expandTo18Decimals(10000)
  //  const withdrawshare = expandTo18Decimals(500);
  //  const fund = await Fund.depoly("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
  //  await this.tether.approve(fund.address, approveamount, overrides);
  //  await this.wether.approve(fund.address, approveamount, overrides);
  //  await fund.investErc20(this.tether.address, investamount, overrides);
  //  let shares = await fund.balanceOf(owner);
  //  await fund.withdrawErc20(this.wether.address, withdrawshare);
  //  let wethbalance = await this.wether.balanceOf(owner);
  //  console.log(retractFrom18Decimals(wethbalance));
  //});
});

