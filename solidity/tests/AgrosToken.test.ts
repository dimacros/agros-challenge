import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployAgrosToken } from "../utils";
import type { AgrosToken } from "../types";

describe("AgrosToken", function () {
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

  const AccessControlError = 'AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})';

  async function deployAgrosTokenFixture() {
    const [owner, producer] = await ethers.getSigners();

    const AgrosTokenProxy = await deployAgrosToken();
    const AgrosToken = AgrosTokenProxy.connect(owner) as AgrosToken;

    return { AgrosToken, owner, producer };
  }

  it('non-admin cannot upgrade contract', async function () {
    const { AgrosToken, producer } = await loadFixture(deployAgrosTokenFixture);

    expect(AgrosToken.connect(producer).upgradeTo(ethers.ZeroAddress))
      .to.be.revertedWith(new RegExp(AccessControlError));
  });

  it("account without MINTER_ROLE cannot mint tokens", async function () {
    const { AgrosToken, owner, producer } = await loadFixture(deployAgrosTokenFixture);

    const account = owner.address.toLocaleLowerCase();
    const err = `AccessControl: account ${account} is missing role ${MINTER_ROLE}`;

    expect(AgrosToken.mint(producer.address, 8)).to.revertedWith(err);
  });

  it("account with MINTER_ROLE can mint tokens", async function () {
    const { AgrosToken, owner, producer } = await loadFixture(deployAgrosTokenFixture);

    await AgrosToken.grantRole(MINTER_ROLE, owner.address);
    await AgrosToken.mint(producer.address, 8);

    const balance = await AgrosToken.balanceOf(producer.address);

    expect(balance).to.equal(8);
  });

  it("account with MINTER_ROLE cannot be minted to invalid address", async function () {
    const { AgrosToken, owner } = await loadFixture(deployAgrosTokenFixture);

    await AgrosToken.grantRole(MINTER_ROLE, owner.address);

    expect(AgrosToken.mint(ethers.ZeroAddress, 1))
      .to.revertedWith("ERC20: mint to the zero address");
  });

  it("account without BURNER_ROLE cannot burn tokens", async function () {
    const { AgrosToken, owner, producer } = await loadFixture(deployAgrosTokenFixture);

    const account = owner.address.toLocaleLowerCase();
    const err = `AccessControl: account ${account} is missing role ${BURNER_ROLE}`;
    const burnTask = () => AgrosToken.burn(producer.address, 8);

    expect(burnTask()).to.revertedWith(err);
  });

  it("account with BURNER_ROLE can burn tokens", async function () {
    const { AgrosToken, owner, producer } = await loadFixture(deployAgrosTokenFixture);

    await Promise.all([
      AgrosToken.grantRole(BURNER_ROLE, owner.address),
      AgrosToken.grantRole(MINTER_ROLE, owner.address),
    ]);

    await AgrosToken.mint(producer.address, 8);
    await AgrosToken.burn(producer.address, 8);

    const balance = await AgrosToken.balanceOf(producer.address);

    expect(balance).to.equal(0);
  });

  it("account with BURNER_ROLE cannot be burned to invalid address", async function () {
    const { AgrosToken, owner } = await loadFixture(deployAgrosTokenFixture);

    await AgrosToken.grantRole(BURNER_ROLE, owner.address);

    expect(AgrosToken.burn(ethers.ZeroAddress, 1))
      .to.revertedWith("ERC20: burn from the zero address");
  });
});