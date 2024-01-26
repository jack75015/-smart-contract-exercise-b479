// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./OpenZeppelin/ERC20/ERC20.sol";

contract USDToken is ERC20 {
    constructor() ERC20("USD Token", "USD") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}
