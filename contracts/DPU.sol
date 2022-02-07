// contracts/DPU.sol
// SPDX-License-Identifier: GNU General Public License v3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DPU is ERC20("DePaul", "DPU"), Ownable {
    uint256 public cooldown;

    constructor(uint256 _cooldown) {
        cooldown = _cooldown;
    }

    // Events
    event Mint(address indexed src, uint256 amt);

    // Assigns cooldown time to address
    mapping(address => uint256) cooldownTime;

    // Allows the owner to mint whatever amount tokens
    function ownerMint(address _destination, uint256 _amount) public onlyOwner {
        _mint(_destination, _amount);
        emit Mint(_destination, _amount);
    }

    function changeCooldown(uint256 _time) public onlyOwner {
        cooldown = _time;
    }

    // Allows wallet to mint tokens every x days
    function mintTokens() public {
        // Makes sure that cooldown has expired by checking if current block timestamp is higher than cooldown timestamp assigned.
        require(
            block.timestamp > cooldownTime[msg.sender],
            "Cooldown has not expired."
        );
        uint256 decimals = decimals();
        // Mints 100 tokens
        _mint(msg.sender, 100 * (10**decimals));
        // Assigns new cooldown time to address
        cooldownTime[msg.sender] = block.timestamp + cooldown;
        emit Mint(msg.sender, 100 * (10**decimals));
    }
}
