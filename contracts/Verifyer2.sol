// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Verifier2 is EIP712("Verifier2", "1") { 
    // Mapping to keep track of used nonces
    mapping(address => uint256) public nonces;

    //Events
    event Verified(uint256 nonce);

    // EIP-712 Domain Separator
    bytes32 public DOMAIN_SEPARATOR;

    // EIP-712 TypeHash for Withdrawal
    bytes32 public constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(string action,uint256 amount,address recipient,uint256 nonce)"
    );

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                // EIP-712 Domain Separator TypeHash
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MyDApp")),        // name
                keccak256(bytes("1.0")),            // version
                1,                      // chainId
                address(this)                       // verifyingContract
            )
        );
    }

    function verify(
        address signer,
        string memory action,
        uint256 amount,
        address recipient,
        uint256 nonce,
        bytes memory signature
    ) public returns (bool) {

        // Ensure nonce is correct
        require(nonce == nonces[signer] + 1, "Invalid nonce");

        //Split the signature
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);

        // Create the struct hash
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                keccak256(bytes(action)),
                amount,
                recipient,
                nonce
            )
        );

        // Create the digest to sign
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        // Recover the signer address
        address recoveredSigner = ecrecover(digest, v, r, s);

        // Verify that the recovered address matches the signer's address
        return (recoveredSigner != address(0) && recoveredSigner == signer);
    }

    function executeWithdrawal(
        string memory action,
        uint256 amount,
        address recipient,
        uint256 nonce,
        bytes memory signature
    ) public {
        // Verify the signature
        require(verify(msg.sender, action, amount, recipient, nonce, signature), "Invalid signature");

        // Update the nonce to prevent replay attacks
        nonces[msg.sender] = nonce;

        // Perform the withdrawal logic
        // For example, transfer tokens or Ether
        // token.transferFrom(msg.sender, recipient, amount);

        // Emit an event if necessary
        emit Verified(nonce);
    }

    function splitSignature(bytes memory signature) internal virtual returns (bytes32 r, bytes32 s, uint8 v) {
        require(signature.length == 65, "invalid signature length");

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(signature, 32))
            // second 32 bytes
            s := mload(add(signature, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(signature, 96)))
        }
    }
}
