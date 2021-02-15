import { app } from 'electron';
import { spawn } from 'child_process';
import * as O from 'fp-ts/Option';
import { is, platform } from 'electron-util';
import * as path from 'path';
import { flow, constVoid } from 'fp-ts/lib/function';

const mkLineBuffer = (buffer: string[] = []) => (
  chunk: string
): O.Option<string> => {
  const chunkS = chunk.toString();
  buffer.push(chunkS);

  if (!chunkS.includes('\n')) {
    return O.none;
  }

  const finalState = buffer.join('').replace('\n', '');
  buffer.length = 0;
  return O.some(finalState);
};

const binaryPath = (): string => {
  const platformFolder = platform({
    macos: 'mac',
    windows: 'win',
  })!;
  const binaryName = platform({
    macos: 'csv-manager',
    windows: 'csv-manager.exe',
  })!;

  return !is.development && app.isPackaged
    ? path.join(
        path.dirname(app.getAppPath()),
        '..',
        './Resources',
        './bin',
        binaryName
      )
    : path.join(
        __dirname,
        '..',
        '..',
        '/resources',
        platformFolder,
        '/bin',
        binaryName
      );
};

// TODO: convert to xs
export const spawnLazy = (filePath: string) => {
  console.log(filePath);
  const { stderr, stdin, stdout } = spawn(binaryPath(), [filePath]);

  const onData = (fa: (a: unknown) => void) =>
    stdout.on(
      'data',
      flow(
        mkLineBuffer(),
        O.map((s) => JSON.parse(s)),
        O.fold(constVoid, fa)
      )
    );

  const onError = (fa: (a: string) => void) =>
    stderr.on(
      'data',
      flow((chunk) => chunk.toString(), fa)
    );

  const sendData = (term: string) => {
    stdin.write(`${term}\n`);
  };

  return { onData, onError, sendData };
};
