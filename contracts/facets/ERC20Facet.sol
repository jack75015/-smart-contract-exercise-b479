// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../OpenZeppelin/ERC20/ERC20.sol";
import "../USDToken.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract ERC20Facet is ERC20 {
    USDToken private usdToken;
    address public usdTokenAddress;

    // Mapping pour stocker le temps du dernier retrait par adresse
    mapping(address => uint256) private lastWithdrawTime;

    // Solde total des fonds à distribuer (proceeds)
    uint256 public proceedsBalance;

    constructor() ERC20("Pool Token", "POOL") {}

    // modifier pour s'assurer que l'appelant est le propriétaire du contrat
    modifier onlyOwner() {
        require(LibDiamond.contractOwner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    // Fonction pour définir l'adresse du contrat USDToken
    function setUsdTokenAddress(address _usdTokenAddress) external onlyOwner {
        require(_usdTokenAddress != address(0), "Invalid USDToken address");

        usdToken = USDToken(_usdTokenAddress);
        usdTokenAddress = _usdTokenAddress;
    }

    // Fonction pour déposer des fonds (USD) dans le contrat et recevoir des tokens de pool en échange
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        _mint(msg.sender, amount);
    }

    // Fonction pour déposer des fonds proceeds dans le contrat par le owner
    function depositProceeds(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        usdToken.mint(address(this), amount);
        proceedsBalance += amount;
    }

    // Fonction pour retirer des proceeds proportionnels à la part du pool détenue par le msg.sender
    function withdrawProceeds() external {
        uint256 cooldownTime = 30 days;
        require(block.timestamp >= lastWithdrawTime[msg.sender] + cooldownTime, "Withdrawal cooldown in effect");

        uint256 totalSupply_ = totalSupply();
        require(totalSupply_ > 0, "No pool tokens minted");

        uint256 userShare = balanceOf(msg.sender);
        require(userShare > 0, "No pool tokens owned by the user");

        // Calcul des proceeds proportionnels à la part du pool détenue par le msg.sender
        uint256 proceeds = (proceedsBalance * userShare) / totalSupply_;
        require(usdToken.transfer(msg.sender, proceeds), "Transfer failed");

        lastWithdrawTime[msg.sender] = block.timestamp;
        proceedsBalance -= proceeds;
    }

    // Fonction pour retirer des fonds (USD) en échange de tokens de pool

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        require(usdToken.transfer(msg.sender, amount), "Transfer failed");

        _burn(msg.sender, amount);
    }
}
