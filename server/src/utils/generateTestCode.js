import crypto from 'crypto';

const CATEGORY_PREFIX = {
  quantitative_aptitude: 'APT',
  logical_reasoning: 'LGC',
  verbal_ability: 'VRB',
  technical_mcq: 'TEC',
  programming: 'PRG',
  dbms: 'DBM',
  dsa: 'DSA',
  computer_networks: 'CNW',
  operating_systems: 'OSY',
  custom: 'TST'
};

const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

const randomSuffix = (length = 5) => {
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    out += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return out;
};

/**
 * Builds the public, shareable test identifier used in the URL, e.g.
 * APT-2026-X7K92. Uniqueness is enforced by the caller re-rolling on a
 * DB unique-constraint collision (astronomically rare given the charset).
 */
export const generateTestCodeId = (category = 'custom') => {
  const prefix = CATEGORY_PREFIX[category] || 'TST';
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${randomSuffix(5)}`;
};

/**
 * Builds the separate secret access code students must enter to start
 * the test (kept short for easy manual entry / verbal sharing).
 */
export const generateAccessCode = () => randomSuffix(6);
