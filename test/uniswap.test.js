// Load compiled artifacts
const { accounts, contract } = require('@openzeppelin/test-environment');
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
    await this.wether.approve(this.router.address, new BN(100), overrides);
    await this.tether.approve(this.router.address, new BN(30000), overrides);
    await this.router.addLiquidity(
      this.wether.address,
      this.tether.address,
      new BN(100),
      new BN(30000),
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
    const fund = await Fund.new("Cook", "COK", this.wether.address, this.tether.address, this.oracle.address);
    await this.tether.approve(fund.address, new BN(1000000), overrides);
    await this.wether.approve(fund.address, new BN(1000000), overrides);
    await fund.investErc20(this.tether.address, new BN(10000), overrides);
    let shares = await fund.balanceOf(owner);
    expect(shares).to.be.bignumber.equal(new BN(1000));
    await fund.investErc20(this.wether.address, new BN(10), overrides);
    shares = await fund.balanceOf(owner);
    expect(shares).to.be.bignumber.equal(new BN(1300));
  });
});

