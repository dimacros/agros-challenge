import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { AgrosSales, AgrosToken } from "../types";
import { deployAgrosSales, deployAgrosToken } from "../utils";

describe("AgrosSales", function () {
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
  const ORGANIC_NFT_ID = 1;
  const ASSOCIATED_NFT_ID = 2;

  const AccessControlError = 'AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})';

  async function deployAgrosSalesFixture() {
    const [owner, producer] = await ethers.getSigners();

    const AgrosTokenProxy = await deployAgrosToken();
    const AgrosSalesProxy = await deployAgrosSales({
        IAgrosToken: AgrosTokenProxy.target as string,
        ipfsBaseUri: process.env.IPFS_BASE_URI || 'ipfs://QmepQzWZ5wFENzMGYXK35Ykzj7toaVPkEo9VKPtsoE8ZsR/'
    });

    const AgrosSales = AgrosSalesProxy.connect(owner) as AgrosSales;
    const AgrosToken = AgrosTokenProxy.connect(owner) as AgrosToken;

    await Promise.all([
        AgrosToken.grantRole(MINTER_ROLE, AgrosSales.target),
        AgrosToken.grantRole(BURNER_ROLE, AgrosSales.target),
        AgrosSales.grantRole(VERIFIER_ROLE, owner.address),
    ]);

    return { AgrosSales, AgrosToken, owner, producer };
  }

  /**
   * @url https://www.nftstandards.wtf/Standards/EIP165+Standard+Interface+Detection
   */
  it("contract can support the interface 0x01ffc9a7", async function () {
    const { AgrosSales } = await loadFixture(deployAgrosSalesFixture);

    expect(await AgrosSales.supportsInterface('0x01ffc9a7')).to.equal(true);
  });

  it("non-admin cannot upgrade contract", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    expect(AgrosSales.connect(producer).upgradeTo(ethers.ZeroAddress))
      .to.be.revertedWith(new RegExp(AccessControlError));
  });

  it("only admin can grant role", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosSales.grantRole(VERIFIER_ROLE, producer.address);

    expect(await AgrosSales.hasRole(VERIFIER_ROLE, producer.address))
      .to.be.true
  });

  it("non-admin cannot grant role", async function () {
    const { AgrosSales, owner, producer } = await loadFixture(deployAgrosSalesFixture);

    expect(AgrosSales.connect(producer).grantRole(VERIFIER_ROLE, owner.address))
      .to.be.revertedWith(new RegExp(AccessControlError));
  });

  it("only admin can revoke role", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosSales.grantRole(VERIFIER_ROLE, producer.address);
    await AgrosSales.revokeRole(VERIFIER_ROLE, producer.address);

    expect(await AgrosSales.hasRole(VERIFIER_ROLE, producer.address))
      .to.be.false;
  });

  it("non-admin cannot revoke role", async function () {
    const { AgrosSales, owner, producer } = await loadFixture(deployAgrosSalesFixture);

    expect(AgrosSales.connect(producer).revokeRole(VERIFIER_ROLE, owner.address))
      .to.be.revertedWith(new RegExp(AccessControlError));
  });

  it("only admin can mint nft token", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosSales.mintNft(producer.address, ORGANIC_NFT_ID);

    const balance = await AgrosSales.balanceOf(producer.address, ORGANIC_NFT_ID);

    expect(balance).to.equal(1);
  });

  it("account without VERIFIER_ROLE cannot verify producer", async function () {
    const { AgrosSales, owner, producer } = await loadFixture(deployAgrosSalesFixture);

    expect(AgrosSales.connect(producer).verifyProducer(owner.address, 0, true, 'cocoa'))
      .to.be.revertedWith(new RegExp(AccessControlError));
  });

  it("account with VERIFIER_ROLE can verify producer", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosSales.verifyProducer(producer.address, 5, false, '');
    
    const fields = await AgrosSales.paidFields(producer.address);

    expect(fields).to.equal(5);
  });

  it("verify producer without tokens to send", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosSales.verifyProducer(producer.address, 5, false, '');

    expect(AgrosSales.verifyProducer(producer.address, 5, false, ''))
      .to.be.revertedWith("AgrosSales: no tokens to send");
  });

  it("verify organic producer", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosSales.verifyProducer(producer.address, 5, true, 'cocoa');

    const balance = await AgrosSales.balanceOf(producer.address, ORGANIC_NFT_ID);

    expect(balance).to.equal(1);
  });

  it("verify organic producer should emit an event", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    const timestamp = await time.latest();
    const templateUri = await AgrosSales.uri(ORGANIC_NFT_ID);
    const uri = templateUri.replace('{id}', ORGANIC_NFT_ID.toString());
    
    expect(AgrosSales.verifyProducer(producer.address, 5, true, 'cocoa'))
      .to.emit(AgrosSales, 'OrganicProducer')
      .withArgs(producer.address, uri, 'cocoa', timestamp + 1);
  });

  it("buy nft associated without agros tokens", async function () {
    const { AgrosSales, producer } = await loadFixture(deployAgrosSalesFixture);

    expect(AgrosSales.connect(producer).purchaseAssociatedNFT())
      .to.be.revertedWith("AgrosSales: insufficient balance");
  });

  it("buy nft associated", async function () {
    const { AgrosSales, AgrosToken, owner, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosToken.grantRole(MINTER_ROLE, owner.address);
    await AgrosToken.mint(producer.address, ethers.parseEther('8'));
    await AgrosSales.connect(producer).purchaseAssociatedNFT();

    const nfts = await AgrosSales.balanceOf(producer.address, ASSOCIATED_NFT_ID);
    const balance = await AgrosToken.balanceOf(producer.address);

    expect(nfts).to.equal(1);
    expect(balance).to.equal(0);
  });

  it("buy nft associated twice", async function () {
    const { AgrosSales, AgrosToken, owner, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosToken.grantRole(MINTER_ROLE, owner.address);
    await AgrosToken.mint(producer.address, ethers.parseEther('8'));
    await AgrosSales.connect(producer).purchaseAssociatedNFT();

    expect(AgrosSales.connect(producer).purchaseAssociatedNFT())
      .to.be.revertedWith("AgrosSales: already purchased");
  });

  it("buy nft associated should emit an event", async function () {
    const { AgrosSales, AgrosToken, owner, producer } = await loadFixture(deployAgrosSalesFixture);

    await AgrosToken.grantRole(MINTER_ROLE, owner.address);
    await AgrosToken.mint(producer.address, ethers.parseEther('8'));

    const timestamp = await time.latest();
    const templateUri = await AgrosSales.uri(ASSOCIATED_NFT_ID);
    const uri = templateUri.replace('{id}', ASSOCIATED_NFT_ID.toString());

    expect(AgrosSales.connect(producer).purchaseAssociatedNFT())
      .to.emit(AgrosSales, 'AssociatedProducer')
      .withArgs(producer.address, uri, timestamp + 1);
  });
});