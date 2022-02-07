const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("TokenBar", function () {

    before(async function () {
        this.signers = await ethers.getSigners();
        this.Token = await ethers.getContractFactory("Token");
        this.Bar = await ethers.getContractFactory("TokenBar");
        this.owner = this.signers[0];
        this.alice = this.signers[1];
        this.bob = this.signers[2];
    });

    this.beforeEach(async function () {
        this.token = await this.Token.deploy(432000);
        this.bar = await this.Bar.deploy(this.token.address);
        this.token.ownerMint(this.owner.address, "1000");
        this.token.ownerMint(this.alice.address, "1000");
        this.token.ownerMint(this.bob.address, "1000");
    });

    it("Cannot enter if deposit > allowance", async function () {
        // Attempt to transfer more than approved
        await expect(this.bar.connect(this.alice).deposit("1000")).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        // Approve token
        await this.token.connect(this.alice).approve(this.bar.address, "500");
        await this.bar.connect(this.alice).deposit("500");
        // Attempt to transfer more than approved again
        await expect(this.bar.connect(this.alice).deposit("500")).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        //Confirm balances
        expect(await this.bar.balanceOf(this.alice.address)).to.equal("500");
        expect(await this.token.balanceOf(this.alice.address)).to.equal("500");
    });

    it("Cannot withdraw if withdrawal amount is more than their balance", async function () {
        //aprove and deposit 500
        await this.token.connect(this.alice).approve(this.bar.address, "500");
        await this.bar.connect(this.alice).deposit("500");
        // attempt to withdraw 1000
        await expect(this.bar.connect(this.alice).withdraw("1000")).to.be.revertedWith("ERC20: burn amount exceeds balance");
        // withdraw and confirm
        await this.bar.connect(this.alice).withdraw("500");
        expect(await this.token.balanceOf(this.alice.address)).to.equal("1000");
        expect(await this.bar.balanceOf(this.alice.address)).to.equal("0");
    });

    it("Check if ratios work and stuff", async function () {
        // Alice deposits 100 bob deposits 50
        await this.token.connect(this.alice).approve(this.bar.address, "1000");
        await this.token.connect(this.bob).approve(this.bar.address, "1000");
        await this.bar.connect(this.alice).deposit("100");
        await this.bar.connect(this.bob).deposit("50");
        // Verify balances
        expect(await this.token.balanceOf(this.bar.address)).to.equal("150");
        expect(await this.bar.balanceOf(this.alice.address)).to.equal("100");
        expect(await this.bar.balanceOf(this.bob.address)).to.equal("50");
        // Transfer 10 into contract
        await this.token.connect(this.owner).transfer(this.bar.address, "50");
        expect(await this.token.balanceOf(this.bar.address)).to.equal("200");
        expect(await this.bar.totalSupply()).to.equal("150");
        // Alice burning 10 xToken should transfer 10 * (200/150) = 13 Token
        await this.bar.connect(this.alice).withdraw("10");
        expect(await this.token.balanceOf(this.alice.address)).to.equal("913");
        // Bob deposits 20 more Token where he will get 20 * (140/187) = 14 xToken
        await this.bar.connect(this.bob).deposit("20");
        expect(await this.bar.balanceOf(this.bob.address)).to.equal("64");
        // Bob apes into the staking pool and deposits 900 Token
        // 900 * (154/207) = 669 xToken
        await this.bar.connect(this.bob).deposit("900");
        expect(await this.bar.balanceOf(this.bob.address)).to.equal("733");
        // transfer 100 to contract
        await this.token.connect(this.owner).transfer(this.bar.address, "100");
        expect(await this.bar.totalSupply()).to.equal("823");
        expect(await this.token.balanceOf(this.bar.address)).to.equal("1207");
        expect(await this.token.balanceOf(this.bob.address)).to.equal("30");
        // Bob withdraws from pool
        // 700 * (1207/823) = 1026 Token
        await this.bar.connect(this.bob).withdraw("700");
        expect(await this.token.balanceOf(this.bob.address)).to.equal("1056");
    });

}); 