import path from 'node:path';
import { Signal } from './types';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const FILE = path.join(process.cwd(), 'data', 'signals.json');

export async function readSignals(): Promise<Signal[]> {
    try {
        return JSON.parse(await readFile(FILE, 'utf8')) as Signal[];
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw e;
    }
}

export async function addSignal(signal: Signal): Promise<void> {
  const signals = await readSignals();
  signals.unshift(signal);
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(signals, null, 2));
}

export const newId = () => `sig_${randomUUID().slice(0, 8)}`;