let ioInstance = null;

export const setSocketIO = (io) => { ioInstance = io; };

export const emitTestEvent = (testId, event, payload) => {
  if (ioInstance) ioInstance.of('/live-monitor').to(`test:${testId}`).emit(event, payload);
};
