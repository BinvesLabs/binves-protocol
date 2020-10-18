// Load compiled artifacts
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const MockErc20 = contract.fromArtifact('MockErc20');
const UniswapV2FactoryArtifact = require('@uniswap/v2-core/build/UniswapV2Factory');
const UniswapV2PairArtifact = require('@uniswap/v2-core/build/UniswapV2Pair');
const UniswapV2RouterArtifact = require('@uniswap/v2-periphery/build/UniswapV2Router02');
const UniswapSimpleOracleArtifact = require('@uniswap/v2-periphery/build/ExampleOracleSimple');
const UniswapFactory = contract.fromABI(UniswapV2FactoryArtifact.abi, UniswapV2FactoryArtifact.bytecode);
const UniswapRouter = contract.fromABI(UniswapV2RouterArtifact.abi, UniswapV2RouterArtifact.bytecode);
const UniswapOracle = contract.fromABI(UniswapSimpleOracleArtifact.abi, UniswapSimpleOracleArtifact.bytecode);
const {BN, constants, time} = require('@openzeppelin/test-helpers');
const Fund = contract.fromArtifact('Fund');
const { expect } = require('chai');

function expandTo18Decimals(number) {
  return new BN(number).mul(new BN(10).pow(new BN(18)));
  // return new BN(number).mul(new BN(1));
}

function retractFrom18Decimals(number) {
  let realnumber = web3.utils.fromWei(number, 'ether');
  return realnumber;
}

describe('MyContract', function () {
  const [ owner ] = accounts;
  const overrides = { from: owner };

  beforeEach(async function() {
    this.factory = await UniswapFactory.new(owner, overrides);
    this.wether = await MockErc20.new("wethereum", "WETH", overrides);
    this.tether = await MockErc20.new("tether", "USDT", overrides);
    await this.factory.createPair(this.wether.address, this.tether.address, overrides);
    const ethUsdtPairAddress = await this.factory.getPair(this.wether.address, this.tether.address);
    this.wethUsdtPair = contract.fromABI(UniswapV2PairArtifact.abi, UniswapV2PairArtifact.bytecode, ethUsdtPairAddress);
    this.router = await UniswapRouter.new(this.factory.address, this.wether.address, overrides);
    await this.wether.approve(this.router.address, expandTo18Decimals(100), overrides);
    await this.tether.approve(this.router.address, expandTo18Decimals(30000), overrides);
    await this.router.addLiquidity(
      this.wether.address,
      this.tether.address,
      expandTo18Decimals(100),
      expandTo18Decimals(30000),
      0,
      0,
      owner,
      constants.MAX_UINT256,
      overrides
    );
    this.oracle = await UniswapOracle.new(this.factory.address, this.wether.address, this.tether.address, overrides);
    await time.increase(time.duration.days(1));
  });

  it('investErc20', async function () {
    const fund = await Fund.new("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
    await this.tether.approve(fund.address, new BN(1000000), overrides);
    await this.wether.approve(fund.address, new BN(1000000), overrides);
    await fund.investErc20(this.tether.address, new BN(10000), overrides);
    let shares = await fund.balanceOf(owner);
    expect(shares).to.be.bignumber.equal(new BN(1000));
    await fund.investErc20(this.wether.address, new BN(10), overrides);
    shares = await fund.balanceOf(owner);
    expect(shares).to.be.bignumber.equal(new BN(1300));
  });

  it('swapErc20', async function() {
    const approveamount = expandTo18Decimals(1000000)
    const investamount = expandTo18Decimals(10000)
    const usdtswapamount = expandTo18Decimals(700);
    const fund = await Fund.new("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
    await this.tether.approve(fund.address, approveamount, overrides);
    await this.wether.approve(fund.address, approveamount, overrides);
    await fund.investErc20(this.tether.address, investamount, overrides);
    let shares = await fund.balanceOf(owner);
    fund.swapErc20(this.tether.address, this.wether.address, usdtswapamount);
    let amountUSDT = retractFrom18Decimals(await this.tether.balanceOf(fund.address));
    let amountweth = retractFrom18Decimals(await this.wether.balanceOf(fund.address));
    expect(amountUSDT).equal('9300');
    expect(amountweth).equal('2.273445414832936454');

  });

  it('withdrawErc20', async function() {
    const approveamount = expandTo18Decimals(1000000)
    const investamount = expandTo18Decimals(10000)
    const withdrawshare = expandTo18Decimals(500);
    const fund = await Fund.new("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address, this.router.address);
    await this.tether.approve(fund.address, approveamount, overrides);
    await this.wether.approve(fund.address, approveamount, overrides);
    await fund.investErc20(this.tether.address, investamount, overrides);
    let shares = await fund.balanceOf(owner);
    await fund.withdrawErc20(this.wether.address, withdrawshare);
    let wethbalance = await this.wether.balanceOf(owner);
    console.log(retractFrom18Decimals(wethbalance));
  });
});

