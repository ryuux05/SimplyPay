// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract USDTClone {
    string public name = "Tether USD";
    string public symbol = "USDT";
    uint8 public decimals = 6; // USDT uses 6 decimals
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Events as per ERC20 standard
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Mint initial supply to the deployer
    constructor(uint256 initialSupply) {
        balanceOf[msg.sender] = initialSupply;
        totalSupply = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }

    // Non-standard transfer function (no return value)
    function transfer(address to, uint256 value) external {
        _transfer(msg.sender, to, value);
    }

    // Non-standard transferFrom function (no return value)
    function transferFrom(address from, address to, uint256 value) external {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "Allowance exceeded");
        allowance[from][msg.sender] = allowed - value;
        _transfer(from, to, value);
    }

    // Non-standard approve function (no return value)
    function approve(address spender, uint256 value) external {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
    }

    // Internal transfer function
    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "Invalid address");
        uint256 senderBalance = balanceOf[from];
        require(senderBalance >= value, "Insufficient balance");
        balanceOf[from] = senderBalance - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    // Additional functions to mint and burn tokens (for testing purposes)
    function mint(address to, uint256 value) external {
        require(to != address(0), "Invalid address");
        balanceOf[to] += value;
        totalSupply += value;
        emit Transfer(address(0), to, value);
    }

    function burn(address from, uint256 value) external {
        uint256 accountBalance = balanceOf[from];
        require(accountBalance >= value, "Burn amount exceeds balance");
        balanceOf[from] = accountBalance - value;
        totalSupply -= value;
        emit Transfer(from, address(0), value);
    }
}
