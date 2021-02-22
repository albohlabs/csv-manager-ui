import { ipcRenderer } from 'electron';
import xs from 'xstream';
import { Model } from './common.internalTypes';

export const error$ = xs.create({
  start: (listener) => {
    ipcRenderer.on('binary:error', (_, res) => {
      listener.next(res);
    });
  },

  stop: () => {
    ipcRenderer.removeAllListeners('binary:error');
  },
});

export const data$ = xs.create<readonly Model[]>({
  start: (listener) => {
    ipcRenderer.on('binary:out', (_, { data }) => {
      console.log('out', data);
      listener.next(data);
    });
  },

  stop: () => {
    ipcRenderer.removeAllListeners('binary:out');
  },
});

export const send = (value: string) => {
  ipcRenderer.send('binary:in', value);
};
