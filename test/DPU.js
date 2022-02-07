const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("DPU", function () {

	before(async function () {
		this.signers = await ethers.getSigners();
		this.Token = await ethers.getContractFactory("DPU");
		this.owner = this.signers[0];
		this.alice = this.signers[1];
		this.bob = this.signers[2];
	});

	this.beforeEach(async function () {
		// Deploy with cooldown time @ 5 days
		this.token = await this.Token.deploy(432000);
	});

	// Verfies basic token info
	it("Has the right name symbol and decimals", async function () {
		expect(await this.token.name(), "DePaul");
		expect(await this.token.symbol(), "DPU");
		expect(await this.token.decimals(), "18");
	});

	it("Owner can only use ownerMint()", async function () {

		// Attempt to mint tokens with owner contract
		// Should succeed
		await this.token.connect(this.owner).ownerMint(this.owner.address, "100");

		// Attempt to mint token with alice and bob
		// NEEDS TO FAIL
		await expect(this.token.connect(this.bob).ownerMint(this.bob.address, "100")).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(this.token.connect(this.alice).ownerMint(this.alice.address, "100")).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		// Owner mints tokens to other wallets
		await this.token.connect(this.owner).ownerMint(this.alice.address, "1000");

		// Verify balances
		expect(await this.token.balanceOf(this.owner.address)).to.equal("100");
		expect(await this.token.balanceOf(this.alice.address)).to.equal("1000");
	});

	it("Cannot transfer more tokens than in wallet", async function () {
		// Mint alice 100 
		await this.token.ownerMint(this.alice.address, "100");

		// Transfer bob 50
		await this.token.connect(this.alice).transfer(this.bob.address, "50");
		// Attempt to transfer 100 to bob
		// FAILS
		await expect(this.token.connect(this.alice).transfer(this.bob.address, "100")).to.be.revertedWith("ERC20: transfer amount exceeds balance");

		// verify balance
		expect(await this.token.balanceOf(this.bob.address)).to.equal("50");
		expect(await this.token.balanceOf(this.alice.address)).to.equal("50");
	});

	it("Users cannot mint tokens before cooldown time expires", async function () {
		// Mints alice tokens
		await this.token.connect(this.alice).mintTokens();
		// alice attempts to mint before cooldown period expires
		await expect(this.token.connect(this.alice).mintTokens()).to.be.revertedWith("Cooldown has not expired.");
		// Move time forward by 5 days
		const now = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
		await ethers.provider.send("evm_mine", [now + 432000]);
		// mint tokens again
		await this.token.connect(this.alice).mintTokens();
		// confirm balances
		expect(await this.token.balanceOf(this.alice.address)).to.equal(`${200 * 1e18}`);
	});

	it("Only owner can change cooldown time", async function () {
		// Change cooldown time to one day
		await this.token.connect(this.owner).changeCooldown(86400);
		// Alice will now attempt to mint tokens
		await this.token.connect(this.alice).mintTokens();
		// Should fail cause hasn't been a day
		await expect(this.token.connect(this.alice).mintTokens()).to.be.revertedWith("Cooldown has not expired.");
		// Move time forward by 1 day
		const now = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
		await ethers.provider.send("evm_mine", [now + 86400]);
		// mint tokens again
		await this.token.connect(this.alice).mintTokens();
		// confirm balances
		expect(await this.token.balanceOf(this.alice.address)).to.equal(`${200 * 1e18}`);
		// Alice will attempt to change cooldown which will fail
		await expect(this.token.connect(this.alice).changeCooldown(1)).to.be.revertedWith("Ownable: caller is not the owner");
	});

})