import { ethers, upgrades } from 'hardhat';

export async function deployAgrosToken() {
    const AgrosTokenImpl = await ethers.getContractFactory('AgrosToken');
    const AgrosTokenProxy = await upgrades.deployProxy(AgrosTokenImpl, {
        kind: 'uups',
        initializer: 'initialize',
        redeployImplementation: 'onchange',
    });

    await AgrosTokenProxy.waitForDeployment();

    return AgrosTokenProxy;
}

export async function deployAgrosSales(params: { IAgrosToken: string, ipfsBaseUri: string }) {
    const AgrosSalesImpl = await ethers.getContractFactory('AgrosSales');
    const AgrosSalesProxy = await upgrades.deployProxy(AgrosSalesImpl, [
        params.IAgrosToken,
        params.ipfsBaseUri,
    ], {
        kind: 'uups',
        initializer: 'initialize',
        redeployImplementation: 'onchange'
    });

    await AgrosSalesProxy.waitForDeployment();

    return AgrosSalesProxy;
}
