import { ethers, upgrades } from 'hardhat';
import { deployAgrosSales, deployAgrosToken } from '../solidity/utils';

async function main() {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

    const AgrosTokenProxy = await deployAgrosToken();
    const AgrosSalesProxy = await deployAgrosSales({
        IAgrosToken: AgrosTokenProxy.target as string,
        ipfsBaseUri: process.env.IPFS_BASE_URI || 'ipfs://QmepQzWZ5wFENzMGYXK35Ykzj7toaVPkEo9VKPtsoE8ZsR/'
    });

    await Promise.all([
        AgrosTokenProxy.grantRole(MINTER_ROLE, AgrosSalesProxy.target),
        AgrosTokenProxy.grantRole(BURNER_ROLE, AgrosSalesProxy.target),
    ]);

    if (ethers.isAddress(process.env.RELAYER_ADDRESS)) {
        await AgrosSalesProxy.transferOwnership(process.env.RELAYER_ADDRESS);
    }

    const [AgrosTokenAddress, AgrosSalesAddress] = await Promise.all([
        upgrades.erc1967.getImplementationAddress(AgrosTokenProxy.target as string),
        upgrades.erc1967.getImplementationAddress(AgrosSalesProxy.target as string),
    ]);

    // Print addresses
    console.table({
        AgrosTokenProxy: AgrosTokenProxy.target,
        AgrosTokenImplementation: AgrosTokenAddress,
        AgrosSalesProxy: AgrosSalesProxy.target,
        AgrosSalesImplementation: AgrosSalesAddress,
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});