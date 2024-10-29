import { task } from "hardhat/config";

// async function main() {
//     //Args
//     const args = process.argv.slice(2);

//     if (!args) 
//         throw new Error("No args provided.");

//     const contractArg = args.find((arg) => arg.startsWith("--arg="));
//     const contractName = contractArg ? contractArg.split("=")[1] : "default";

//     console.log(contractName);

//     // Compile the contracts (optional if already compiled)
//     // await hre.run('compile');

//     // Replace with your contract name
//     const ContractFactory = await hre.ethers.getContractFactory(contractName);

//     const contract = await ContractFactory.deploy();
            
//     await contract.waitForDeployment();

//     console.log("Contract deployed to address:", await contract.getAddress());

//     // Optionally, verify the contract on Etherscan (if using the Etherscan plugin)
//     // await hre.run("verify:verify", {
//     //   address: contract.address,
//     //   constructorArguments: [constructorArg1, constructorArg2],
//     // });
// }

//Task
task("deploy", "deploy contract with contract name as params")
.addPositionalParam("contractName")
.addOptionalPositionalParam("args")
.setAction(async (taskArgs, hre) => {
    console.log(`Deploying ${taskArgs.contractName}...`);

    const ContractFactory = await hre.ethers.getContractFactory(taskArgs.contractName);

    const contract = await ContractFactory.deploy(taskArgs.args);
            
    await contract.waitForDeployment();

    console.log("Contract deployed to address:", await contract.getAddress());
});
