import hre from "hardhat"

async function SignatureTest() {

    const wallets = await hre.ethers.getSigners();    
    const wallet = wallets[0];

    // Define the domain and message
    const domain = {
        name: 'MyDApp',
        version: '1.0',
        chainId: 1,
        verifyingContract: '0xYourDAppContractAddress',
    };
    
    const types = {
        Withdrawal: [
        { name: 'action', type: 'string' },
        { name: 'amount', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        ],
    };
    
    const message = {
        action: 'Withdraw',
        amount: hre.ethers.parseEther('10').toString(),
        recipient: '0xRecipientAddress',
        nonce: 12345,
    };

    const signature = await wallet.signTypedData(domain, types, message);
    console.log('Signature:', signature);
}

SignatureTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in signature script:", error);
    process.exit(1);
  });

