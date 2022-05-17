import { ethers } from 'hardhat';
import { Contract } from 'ethers';

export const hotTrovesWindowSize = 100;
export const MCR = ethers.BigNumber.from('1100000000000000000'); // 110%
export const gasCompensation = 200; // in YUSD, TODO: unify curreny unit

import troveManagerAbi from './TroveManager.abi.json';
const troveManagerAddress = '0x000000000000614c27530d24B5f039EC15A61d8d'; // proxy
export let troveManagerContract: Contract;

export async function init() {
    // const [signer] = await ethers.getSigners();
    troveManagerContract = await ethers.getContractAt(troveManagerAbi, troveManagerAddress);
}
