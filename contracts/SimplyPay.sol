// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SimplyPay is EIP712("SimplyPay", "1") {
    using SafeERC20 for IERC20;

    //Interface
    IERC20 public usdt;
    
    //Struct
    struct PaymentRequest {
        address sender;
        uint256 amount;
        uint256 nonce;
    }

    address public constant USDTAddress = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    // Mapping to keep track of used nonces
    mapping(address => uint256) public nonces;

    // Mapping for user funds
    mapping(address => uint256) private balances;

    // Mapping for merchants
    mapping(address => bool) private merchants;

    // EIP-712 Domain Separator
    bytes32 public DOMAIN_SEPARATOR;

    //Typehash for EIP-721
    bytes32 public constant REQUEST_TYPEHASH = keccak256(
        "PaymentRequest(address sender,uint256 amount,uint256 nonce)"
    );

    //Events
    event Deposit(address indexed _address, uint256 amount);
    event Withdraw(address indexed _address, uint256 amount);
    event Send(address from, address to, uint256 amount);
    event PaymentSucceess(address indexed from, address to);
    event SignatureVerified();

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                // EIP-712 Domain Separator TypeHash
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("SimplyPay")),        // name
                keccak256(bytes("1.0")),            // version
                1,                      // chainId
                address(this)                       // verifyingContract
            )
        );

        usdt = IERC20(USDTAddress);
    }

    function verifySignature(
        PaymentRequest memory request,
        bytes memory signature
    ) external view returns (bool) {
        // Ensure nonce is correct
        require(request.nonce == nonces[request.sender] + 1, "Invalid nonce");

        return recoverAddressOfRequest(request, signature) == request.sender;
    }

    function recoverAddressOfRequest(
        PaymentRequest memory request,
        bytes memory signature
    ) public view returns (address) {
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, keccak256(encodeRequest(request)))
        );

        return ECDSA.recover(digest, signature);
    }

    function encodeRequest(PaymentRequest memory request) public pure returns (bytes memory) {
        return (
            abi.encode(
                REQUEST_TYPEHASH,
                request.sender,
                request.amount,
                request.nonce
            )
        );
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        // Transfer USDT from user to this contract
        usdt.safeTransferFrom(msg.sender, address(this), amount);

        // Update user balance
        balances[msg.sender] += amount;

        // Emit deposit event
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {

    }

    function getUSDTBalance() external view returns (uint256){
        return usdt.balanceOf(address(this));
    }

    function getUSDTBalanceOf(address user) external view returns (uint256) {
        return usdt.balanceOf(user);
    }

}
