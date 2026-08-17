import 'server-only';

import { Ed25519Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { DecibelReadDex, DecibelWriteDex, TESTNET_CONFIG } from '@decibeltrade/sdk';

const apiKey = process.env.APTOS_API_KEY;
const privateKey = process.env.API_WALLET_PRIVATE_KEY;

if (!apiKey) throw new Error('Missing APTOS_API_KEY');
if (!privateKey) throw new Error('Missing APTOS_API_KEY');

export const account = new Ed25519Account({
  privateKey: new Ed25519PrivateKey(privateKey),
});

export const decibelWrite = new DecibelWriteDex(TESTNET_CONFIG, account, {
  nodeApiKey: apiKey,
  skipSimulate: true,
});

export const decibelRead = new DecibelReadDex(TESTNET_CONFIG, {
  nodeApiKey: apiKey,
});

export const config = TESTNET_CONFIG;
