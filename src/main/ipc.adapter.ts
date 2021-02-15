import { BrowserWindow } from 'electron';

export const sendData = (browser: BrowserWindow) => (data: unknown) => {
  browser.webContents.send('binary:out', {
    data,
  });
};

export const sendError = (browser: BrowserWindow) => (data: string) => {
  browser.webContents.send('binary:error', {
    data,
  });
};
