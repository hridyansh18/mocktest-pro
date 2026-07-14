import { body } from 'express-validator';
export const violationBody = [
  body('violationType').isIn(['TAB_SWITCH','WINDOW_BLUR','FULLSCREEN_EXIT','COPY_ATTEMPT','PASTE_ATTEMPT','DEVTOOLS_SHORTCUT','PAGE_REFRESH']),
  body('metadata').optional().isObject()
];
