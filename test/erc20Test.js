/* global describe it before ethers */

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')

const { assert, expect } = require('chai')

describe('DiamondTest', async function () {
  let diamondAddress
  let usdTokenAddress
  let diamondCutFacet
  let diamondLoupeFacet
  let ownershipFacet
  let tx
  let receipt
  let result
  const addresses = [];
  let account1, account2;
  const depositProceedsValue = 400;
  let ERC20Facet, USDToken;

  before(async function () {
    diamondAddress = await deployDiamond()
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress);
    [account1, account2] = await ethers.getSigners();
  })

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address)
    }

    assert.equal(addresses.length, 3)
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(diamondCutFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(diamondLoupeFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(ownershipFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2])
    assert.sameMembers(result, selectors)
  })

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress('0x1f931c1c')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0x01ffc9a7')
    )
    assert.equal(
      addresses[2],
      await diamondLoupeFacet.facetAddress('0xf2fde38b')
    )
  })

  it('should deploy USDToken', async () => {
    const usdToken = await ethers.getContractFactory("USDToken");
    const _usdToken = await usdToken.deploy()
    await _usdToken.deployed();
    usdTokenAddress = _usdToken.address
    USDToken = await ethers.getContractAt('USDToken', usdTokenAddress)
  });

  it('should test mint function call', async () => {
    const mintValue = 100;
    await USDToken.mint(account1.address,mintValue);
    const balance = await USDToken.balanceOf(account1.address);
    expect(balance).to.equal(mintValue);
  })

  it('should add ERC20Facet functions', async () => {
    const erc20Facet = await ethers.getContractFactory('ERC20Facet')
    const _erc20Facet = await erc20Facet.deploy()
    await _erc20Facet.deployed();
    addresses.push(_erc20Facet.address)
    const selectors = getSelectors(_erc20Facet)
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: _erc20Facet.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(_erc20Facet
      .address)
    ERC20Facet = await ethers.getContractAt('ERC20Facet', diamondAddress);

    assert.sameMembers(result, selectors)
  })

  it('should test setUsdTokenAddress function call', async () => {
    await ERC20Facet.setUsdTokenAddress(usdTokenAddress);
    const _usdTokenAddress = await ERC20Facet.usdTokenAddress();
    expect(_usdTokenAddress).to.equal(usdTokenAddress);
  })

  it('should test approve function call', async () => {
    const approveValue = 100;
    await USDToken.approve(diamondAddress,approveValue);
    const balance = await USDToken.allowance(account1.address,diamondAddress);
    expect(Number(balance)).to.equal(approveValue);
  })

  it('should test deposit function call', async () => {
    const depositValue = 50;
    
    await ERC20Facet.deposit(depositValue);

    const balanceERC20Facet = await ERC20Facet.balanceOf(account1.address);
    const balanceUSDTokenAccount1 = await USDToken.balanceOf(account1.address);
    const balanceUSDTokenDiamondAddress = await USDToken.balanceOf(diamondAddress);
    
    const totalSupply = await ERC20Facet.totalSupply();

    expect(Number(balanceERC20Facet)).to.equal(depositValue);
    expect(Number(balanceUSDTokenAccount1)).to.equal(depositValue);
    expect(Number(balanceUSDTokenDiamondAddress)).to.equal(depositValue);
    expect(Number(totalSupply)).to.equal(depositValue);

  })

  it('should test mint, approve ans deposit with a second acount', async () => {
    const mintValue = 100;

    await USDToken.connect(account2).mint(account2.address,mintValue);
    const balanceUSDToken = await USDToken.connect(account2).balanceOf(account2.address);
    expect(balanceUSDToken).to.equal(mintValue);

    await USDToken.connect(account2).approve(diamondAddress,mintValue);

    const balance = await USDToken.connect(account2).allowance(account2.address,diamondAddress);
    expect(Number(balance)).to.equal(mintValue);
    
    await ERC20Facet.connect(account2).deposit(mintValue);

    const balanceERC20Facet = await ERC20Facet.balanceOf(account2.address);
    expect(balanceERC20Facet).to.equal(mintValue);
  })

  it('should test depositProceeds function call', async () => {
    const balanceUSDTokenBefore = await USDToken.balanceOf(diamondAddress);
    const proceedsBalanceERC20FacetBefore = await ERC20Facet.proceedsBalance();
    await ERC20Facet.depositProceeds(depositProceedsValue);
    const balanceUSDTokenAfter = await USDToken.balanceOf(diamondAddress);
    const proceedsBalanceERC20FacetAfter = await ERC20Facet.proceedsBalance();

    expect(Number(balanceUSDTokenBefore) + depositProceedsValue).to.equal(Number(balanceUSDTokenAfter));
    expect(Number(proceedsBalanceERC20FacetBefore) + depositProceedsValue).to.equal(Number(proceedsBalanceERC20FacetAfter));
  })

  it('should test withdrawProceeds function call', async () => {
    const balanceERC20FacetBefore = await ERC20Facet.balanceOf(account1.address);
    const balanceUSDTokenBefore = await USDToken.balanceOf(account1.address);
    await ERC20Facet.withdrawProceeds();
    const balanceERC20FacetAfter = await ERC20Facet.balanceOf(account1.address);
    const balanceUSDTokenAfter = await USDToken.balanceOf(account1.address);
    const proceedsBalanceERC20Facet = await ERC20Facet.proceedsBalance();

    const totalSupply = await ERC20Facet.totalSupply();
    const proceeds = Math.round((depositProceedsValue * 50) / totalSupply); // 183

    expect(Number(balanceUSDTokenBefore) + proceeds).to.equal(Number(balanceUSDTokenAfter));
    expect(Number(balanceERC20FacetBefore)).to.equal(Number(balanceERC20FacetAfter));
    expect(depositProceedsValue - proceeds).to.equal(Number(proceedsBalanceERC20Facet));

  })

  it('should test withdrawProceeds revert because of cooldown', async () => {
      await expect(ERC20Facet.withdrawProceeds()).to.be.revertedWith(`Withdrawal cooldown in effect`)
  })

  it('should test withdraw function call', async () => {
    const withdrawValue = 10;
    
    const balanceERC20FacetBefore = await ERC20Facet.balanceOf(account1.address);
    const balanceUSDTokenBefore = await USDToken.balanceOf(account1.address);
    await ERC20Facet.withdraw(withdrawValue);
    const balanceERC20FacetAfter = await ERC20Facet.balanceOf(account1.address);
    const balanceUSDTokenAfter = await USDToken.balanceOf(account1.address);

    expect(Number(balanceUSDTokenBefore) + withdrawValue).to.equal(Number(balanceUSDTokenAfter));
    expect(Number(balanceERC20FacetBefore) - withdrawValue).to.equal(balanceERC20FacetAfter);
  })


})
