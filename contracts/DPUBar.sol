// contracts/DPUBar.sol
// SPDX-License-Identifier: GNU General Public License v3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DPUBar is ERC20("xDePaul", "xDPU") {
    IERC20 public dpu;

    // Defining DPU token
    constructor(IERC20 _dpu) {
        dpu = _dpu;
    }

    // Deposit DPU for xDPU at a ratio of current supply / DPU balance in contract
    function deposit(uint256 _amount) public {
        // Amount of DPU in contract;
        uint256 dpuBalance = dpu.balanceOf(address(this));
        // Total supply of xDPU
        uint256 supply = totalSupply();

        // If it doesn't exist then ratio is 1:1
        if (dpuBalance == 0 || supply == 0) {
            // Mint token 1:1
            _mint(msg.sender, _amount);
        } else {
            // Mint xDPU where 1 xDPU = DPU * calculated ratio;
            uint256 toMint = (_amount * (supply * 1e18) / dpuBalance) / 1e18;
            _mint(msg.sender, toMint);
        }

        // Take DPU from staker
        dpu.transferFrom(msg.sender, address(this), _amount);
    }

    // Burn xDPU to get DPU back at the ratio of 1 xDPU = DPU balance / supply
    function withdraw(uint256 _amount) public {
        // Amount of DPU in contract;
        uint256 dpuBalance = dpu.balanceOf(address(this));

        // Total supply of xDPU
        uint256 supply = totalSupply();

        // Burn xDPU
        _burn(msg.sender, _amount);

        // transfer token to msg.sender
        uint256 toReturn = ((_amount * dpuBalance * 1e18) / supply) / 1e18;
        dpu.transfer(msg.sender, toReturn);
    }
}
