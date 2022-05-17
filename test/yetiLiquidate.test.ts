import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import troveManagerAbi from '../scripts/yeti/TroveManager.abi.json';
import { main } from '../scripts/yeti/index';

describe('Yeti liquidation bot', () => {
    let account: any;
    let troveManagerContract: any;
    const troveManagerAddress = '0x000000000000614c27530d24B5f039EC15A61d8d'; // proxy

    before(async () => {
        await network.provider.request({
            method: "hardhat_reset",
            params: [
                {
                    forking: {
                        jsonRpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
                        blockNumber: 14587843
                    }
                }
            ]
        });
        [account] = await ethers.getSigners();
        troveManagerContract = await ethers.getContractAt(troveManagerAbi, troveManagerAddress, account);
    });

    it('fork reset is correct (liquidate opportunity exist)', async () => {
        const targetBorrowerAddress = '0x7f662a11cc7e07e21a28b34a80bbf719bf5a33b4';
        const targetTroveICR = await troveManagerContract.getCurrentICR(targetBorrowerAddress);
        expect(targetTroveICR).to.be.lt(ethers.BigNumber.from('1100000000000000000'));
        console.log('targetTroveICR', targetTroveICR.toString()/1e18);
    });

    it('can liquidate', async () => {
        // await main(true, account);
    });
});
