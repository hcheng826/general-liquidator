import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import troveManagerAbi from '../scripts/yeti/TroveManager.abi.json';
import {
    readFromHotCache,
    estimateProfitBeforeGas,
    updateHotCache,
    getYetiStatus,
} from '../scripts/yeti/stateMonitoring';
import { sendTransaction } from '../scripts/yeti/transactionSubmission';
import { Position } from '../scripts/yeti/types';
import { init } from '../scripts/yeti/config';
import erc20Abi from './ERC20.abi.json';

describe('Yeti liquidation', () => {
    let account: any;
    let troveManagerContract: any;
    const troveManagerAddress = '0x000000000000614c27530d24B5f039EC15A61d8d'; // proxy

    before(async () => {
        await network.provider.request({
            method: 'hardhat_reset',
            params: [
                {
                    forking: {
                        jsonRpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
                        blockNumber: 14587843,
                    },
                },
            ],
        });
        [account] = await ethers.getSigners();
        troveManagerContract = await ethers.getContractAt(troveManagerAbi, troveManagerAddress, account);
    });

    it('fork reset is correct (liquidate opportunity exist)', async () => {
        const targetBorrowerAddress = '0x7f662a11cc7e07e21a28b34a80bbf719bf5a33b4';
        const targetTroveICR = await troveManagerContract.getCurrentICR(targetBorrowerAddress);
        expect(targetTroveICR).to.be.lt(ethers.BigNumber.from('1100000000000000000'));
        console.log('targetTroveICR', targetTroveICR.toString() / 1e18);
    });

    it('can liquidate', async () => {
        // copy the flow from main() but remove the while loop
        await init();
        let yetiStatus = await getYetiStatus();
        let positions = readFromHotCache('./test/');
        positions = await updateHotCache(positions);
        let potentialPositions = new Array<Position>();
        for (let position of positions) {
            const profitBeforeGasFromPosition = estimateProfitBeforeGas(position, yetiStatus);
            if (profitBeforeGasFromPosition > 0) {
                position.profitBeforeGasFromPosition = profitBeforeGasFromPosition;
                potentialPositions.push(position);
            }
        }
        const profitablePositions = potentialPositions;
        await sendTransaction(profitablePositions);

        const YusdContract = await ethers.getContractAt(erc20Abi, '0x111111111111ed1D73f860F57b2798b683f2d325');
        const YusdBalance = await YusdContract.balanceOf(account.address);
        expect(YusdBalance).to.eql(ethers.utils.parseEther('200'));
        console.log('YUSD balance:', YusdBalance.toString() / 1e18);
    });
});
