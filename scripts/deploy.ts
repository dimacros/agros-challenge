import { ethers, upgrades } from 'hardhat';
import { deployAgrosSales, deployAgrosToken } from '../solidity/utils';

async function main() {
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
    const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

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
        await AgrosSalesProxy.grantRole(VERIFIER_ROLE, process.env.RELAYER_ADDRESS);
    }

    // Print addresses
    console.table({
        AgrosTokenProxy: AgrosTokenProxy.target,
        AgrosSalesProxy: AgrosSalesProxy.target,
    });
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});