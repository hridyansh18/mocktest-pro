export const ROLES = Object.freeze({
  ADMIN: 'admin',
  STUDENT: 'student'
});

export const TEST_STATUS = Object.freeze({
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  ARCHIVED: 'archived'
});

export const TEST_CATEGORIES = Object.freeze([
  'quantitative_aptitude',
  'logical_reasoning',
  'verbal_ability',
  'technical_mcq',
  'programming',
  'dbms',
  'dsa',
  'computer_networks',
  'operating_systems',
  'custom'
]);

export const DIFFICULTY_LEVELS = Object.freeze(['easy', 'medium', 'hard']);

export const RESULT_VISIBILITY = Object.freeze({
  IMMEDIATE: 'immediate',
  AFTER_EXPIRY: 'after_expiry',
  HIDDEN: 'hidden'
});

export const ATTEMPT_STATUS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  AUTO_SUBMITTED: 'auto_submitted',
  EXPIRED: 'expired',
  TERMINATED: 'terminated'
});

export const VIOLATION_TYPES = Object.freeze([
  'TAB_SWITCH',
  'WINDOW_BLUR',
  'FULLSCREEN_EXIT',
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT',
  'CUT_ATTEMPT',
  'DEVTOOLS_SHORTCUT',
  'PAGE_REFRESH',
  'RIGHT_CLICK'
]);
