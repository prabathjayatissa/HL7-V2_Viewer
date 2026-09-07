import type { ParsedMessage, SegmentNode, SegmentField, Delimiters } from './types';
import { serializeField } from './parser';

const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const STREETS = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington Blvd', 'Park Ave', 'Lake Dr', 'Hill Rd'];
const CITIES = ['Springfield', 'Riverside', 'Franklin', 'Clinton', 'Madison', 'Georgetown', 'Salem', 'Fairfield', 'Arlington', 'Bristol'];
const STATES = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'WA'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDOB(): string {
  const year = 1940 + Math.floor(Math.random() * 70);
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  return `${year}${month}${day}`;
}

function randomSSN(): string {
  const a = String(100 + Math.floor(Math.random() * 800)).padStart(3, '0');
  const b = String(10 + Math.floor(Math.random() * 80)).padStart(2, '0');
  const c = String(1000 + Math.floor(Math.random() * 8000)).padStart(4, '0');
  return `${a}${b}${c}`;
}

function randomPhone(): string {
  const area = String(200 + Math.floor(Math.random() * 700));
  const prefix = String(200 + Math.floor(Math.random() * 700));
  const suffix = String(1000 + Math.floor(Math.random() * 8000));
  return `(${area})${prefix}-${suffix}`;
}

function setComponent(field: SegmentField, delims: Delimiters, rep: number, compIdx: number, subcompIdx: number, value: string) {
  if (!field.repetitions[rep]) field.repetitions[rep] = [];
  if (!field.repetitions[rep][compIdx]) field.repetitions[rep][compIdx] = [];
  field.repetitions[rep][compIdx][subcompIdx] = value;
  field.raw = serializeField(field.repetitions, delims);
}

function anonymizePID(seg: SegmentNode, delims: Delimiters) {
  const d = delims;
  const f5 = seg.fields.find((f) => f.index === 5);
  if (f5) {
    setComponent(f5, d, 0, 0, 0, pick(LAST_NAMES));
    setComponent(f5, d, 0, 1, 0, pick(FIRST_NAMES));
    setComponent(f5, d, 0, 2, 0, '');
    setComponent(f5, d, 0, 4, 0, '');
  }
  const f7 = seg.fields.find((f) => f.index === 7);
  if (f7) setComponent(f7, d, 0, 0, 0, randomDOB());
  const f11 = seg.fields.find((f) => f.index === 11);
  if (f11) {
    setComponent(f11, d, 0, 0, 0, `${100 + Math.floor(Math.random() * 9000)} ${pick(STREETS)}`);
    setComponent(f11, d, 0, 2, 0, pick(CITIES));
    setComponent(f11, d, 0, 3, 0, pick(STATES));
    setComponent(f11, d, 0, 4, 0, String(10000 + Math.floor(Math.random() * 80000)));
  }
  const f13 = seg.fields.find((f) => f.index === 13);
  if (f13 && f13.raw) setComponent(f13, d, 0, 6, 0, randomPhone());
  const f14 = seg.fields.find((f) => f.index === 14);
  if (f14 && f14.raw) setComponent(f14, d, 0, 6, 0, randomPhone());
  const f19 = seg.fields.find((f) => f.index === 19);
  if (f19) setComponent(f19, d, 0, 0, 0, randomSSN());
  const f6 = seg.fields.find((f) => f.index === 6);
  if (f6) {
    setComponent(f6, d, 0, 0, 0, pick(LAST_NAMES));
    setComponent(f6, d, 0, 1, 0, '');
  }
}

function anonymizeNK1(seg: SegmentNode, delims: Delimiters) {
  const d = delims;
  const f2 = seg.fields.find((f) => f.index === 2);
  if (f2) {
    setComponent(f2, d, 0, 0, 0, pick(LAST_NAMES));
    setComponent(f2, d, 0, 1, 0, pick(FIRST_NAMES));
  }
  const f4 = seg.fields.find((f) => f.index === 4);
  if (f4) {
    setComponent(f4, d, 0, 0, 0, `${100 + Math.floor(Math.random() * 9000)} ${pick(STREETS)}`);
    setComponent(f4, d, 0, 2, 0, pick(CITIES));
    setComponent(f4, d, 0, 3, 0, pick(STATES));
    setComponent(f4, d, 0, 4, 0, String(10000 + Math.floor(Math.random() * 80000)));
  }
  const f5 = seg.fields.find((f) => f.index === 5);
  if (f5 && f5.raw) setComponent(f5, d, 0, 6, 0, randomPhone());
}

export function anonymizeMessage(msg: ParsedMessage): ParsedMessage {
  const cloned: ParsedMessage = {
    delimiters: { ...msg.delimiters },
    segments: msg.segments.map((seg) => ({
      id: seg.id,
      fields: seg.fields.map((f) => ({
        index: f.index,
        raw: f.raw,
        repetitions: f.repetitions.map((rep) => rep.map((comp) => [...comp])),
      })),
    })),
  };

  const d = cloned.delimiters;
  cloned.segments.forEach((seg) => {
    if (seg.id === 'PID') anonymizePID(seg, d);
    if (seg.id === 'NK1') anonymizeNK1(seg, d);
  });

  return cloned;
}

export function generateACK(msg: ParsedMessage): string {
  const msh = msg.segments.find((s) => s.id === 'MSH');
  if (!msh) return '';

  const d = msg.delimiters;
  const sendingApp = msh.fields.find((f) => f.index === 3)?.raw || '';
  const sendingFac = msh.fields.find((f) => f.index === 4)?.raw || '';
  const receivingApp = msh.fields.find((f) => f.index === 5)?.raw || '';
  const receivingFac = msh.fields.find((f) => f.index === 6)?.raw || '';
  const msgType = msh.fields.find((f) => f.index === 9)?.raw || '';
  const msgCtrlId = msh.fields.find((f) => f.index === 10)?.raw || '';
  const version = msh.fields.find((f) => f.index === 12)?.raw || '2.5';

  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

  const ackCtrlId = `ACK${Date.now()}`;

  const mshLine = [
    'MSH',
    d.field,
    d.component + d.repetition + d.escape + d.subcomponent,
    receivingApp,
    receivingFac,
    sendingApp,
    sendingFac,
    ts,
    '',
    'ACK',
    ackCtrlId,
    'P',
    version,
  ].join(d.field);

  const msaLine = [
    'MSA',
    'AA',
    msgCtrlId,
  ].join(d.field);

  return `${mshLine}\r\n${msaLine}`;
}

export function defaultSampleMessage(): string {
  return `MSH|^~\\&|EPIC|HOSPITAL|LAB|HOSPITAL|20260906120000||ADT^A08|MSG00001|P|2.5
EVN|A08|20260906120000|||SMITH^JOHN^A^^DR
PID|1||PATID1234^5^M11^ADT1^MR||DOE^JANE^Q||19850515|F|||123 MAIN ST^^SPRINGFIELD^CA^94025||(555)555-1234|(555)555-5678||S||PATID1234^^^HOSPITAL^MR||123456789||||||||||||
PV1|1|I|ICU^101^A^^HOSPITAL||||123456^SMITH^JOHN^A^^DR^^MD||||||||||I|20260906080000||||||||||||||||||||||20260906120000
OBX|1|NM|WEIGHT||72|kg|||||F
OBX|2|NM|HEIGHT||175|cm|||||F
OBX|3|ST|BLOOD_TYPE||O+||||||F
NK1|1|DOE^ROBERT^B||456 OAK AVE^^RIVERSIDE^NY^10001|(555)222-3333||BRO`;
}
