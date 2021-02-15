import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import { is } from 'electron-util';
import { spawnLazy } from './binary.adapter';
import * as ipc from './ipc.adapter';
import * as TE from 'fp-ts/TaskEither';
import * as RTE from 'fp-ts/ReaderTaskEither';
import * as T from 'fp-ts/Task';
import * as RA from 'fp-ts/ReadonlyArray';
import { pipe } from 'fp-ts/lib/function';
import { error, log } from 'fp-ts/lib/Console';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null;

function createMainWindow() {
  const window = new BrowserWindow({
    webPreferences: { nodeIntegration: true },
  });

  if (is.development) {
    window.webContents.openDevTools();
  }

  if (is.development) {
    void window.loadURL(
      `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT!}`
    );
  } else {
    void window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      })
    );
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});

export interface Environment {
  readonly win: BrowserWindow;
}

const getFilePathFromDialog = pipe(
  RTE.ask<Environment, string>(),
  RTE.chainTaskEitherK(({ win }) =>
    TE.tryCatch(
      () => dialog.showOpenDialog(win, { properties: ['openFile'] }),
      String
    )
  ),
  RTE.chain((event) =>
    RTE.fromOption(() => 'no file selected')(RA.head(event.filePaths))
  )
);

const spawnWithPath = pipe(
  RTE.ask<Environment, string>(),
  RTE.chain(({ win }) =>
    pipe(
      getFilePathFromDialog,
      RTE.map(spawnLazy),
      // eslint-disable-next-line array-callback-return
      RTE.map((binary) => {
        binary.onData(ipc.sendData(win));
        binary.onError(ipc.sendError(win));

        ipcMain.on('binary:in', (_, term: string) => {
          binary.sendData(term);
        });
      })
    )
  )
);

const onLeft = (e: string): T.Task<void> => T.fromIO(error(e));
const onRight: T.Task<void> = T.fromIO(log('succeeded!'));

const exit: (program: TE.TaskEither<string, void>) => T.Task<void> = TE.fold(
  onLeft,
  () => onRight
);

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();

  void pipe(spawnWithPath({ win: mainWindow }), exit)();
});
