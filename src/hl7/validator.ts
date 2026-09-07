import type { ParsedMessage, ValidationResult, SegmentNode } from './types';
import { getFieldDef, getSegmentDef } from './segmentDefs';
import { lookupValue } from './tables';

function getComponent(seg: SegmentNode, fieldIdx: number, rep: number, comp: number, subcomp: number): string {
  const field = seg.fields.find((f) => f.index === fieldIdx);
  if (!field) return '';
  return field.repetitions?.[rep]?.[comp]?.[subcomp] ?? '';
}

function validateDate(s: string): boolean {
  if (!s) return true;
  return /^\d{8}(\d{6})?([+-]\d{4})?$/.test(s) || /^\d{4}(\d{2})?(\d{2})?$/.test(s);
}

export function validateMessage(msg: ParsedMessage): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (msg.segments.length === 0) {
    return [{ segmentId: '', field: '', severity: 'error', message: 'No message loaded' }];
  }

  const msh = msg.segments.find((s) => s.id === 'MSH');
  if (!msh) {
    results.push({ segmentId: '', field: 'MSH', severity: 'error', message: 'Missing required MSH (Message Header) segment' });
    return results;
  }

  const segDef = getSegmentDef('MSH');
  if (segDef) {
    segDef.fields.forEach((fdef) => {
      if (fdef.required) {
        const field = msh.fields.find((f) => f.index === fdef.position);
        if (!field || !field.raw || field.raw === '') {
          results.push({ segmentId: 'MSH', field: `MSH-${fdef.position}`, severity: 'error', message: `Missing required field: ${fdef.name}` });
        }
      }
    });
  }

  const msh7 = getComponent(msh, 7, 0, 0, 0);
  if (msh7 && !validateDate(msh7)) {
    results.push({ segmentId: 'MSH', field: 'MSH-7', severity: 'warning', message: 'Date/Time of Message does not match YYYYMMDD[HHMMSS] format' });
  }

  const msh9 = getComponent(msh, 9, 0, 0, 0);
  const msh9trigger = getComponent(msh, 9, 0, 1, 0);
  if (msh9 && !msh9trigger) {
    results.push({ segmentId: 'MSH', field: 'MSH-9', severity: 'warning', message: 'Message type missing trigger event component (e.g. ADT^A01)' });
  }

  const msh10 = getComponent(msh, 10, 0, 0, 0);
  if (msh10 && msh10.length > 20) {
    results.push({ segmentId: 'MSH', field: 'MSH-10', severity: 'warning', message: 'Message Control ID exceeds 20 characters' });
  }

  msg.segments.forEach((seg) => {
    if (seg.id === 'MSH') return;
    const def = getSegmentDef(seg.id);
    if (def) {
      def.fields.forEach((fdef) => {
        if (fdef.required) {
          const field = seg.fields.find((f) => f.index === fdef.position);
          if (!field || !field.raw || field.raw === '') {
            results.push({ segmentId: seg.id, field: `${seg.id}-${fdef.position}`, severity: 'error', message: `Missing required field: ${fdef.name}` });
          }
        }
        if (fdef.dataType === 'TS' || fdef.dataType === 'DT') {
          const field = seg.fields.find((f) => f.index === fdef.position);
          if (field && field.raw) {
            const val = field.repetitions[0]?.[0]?.[0] ?? '';
            if (val && !validateDate(val)) {
              results.push({ segmentId: seg.id, field: `${seg.id}-${fdef.position}`, severity: 'warning', message: `${fdef.name} does not match date format YYYYMMDD[HHMMSS]` });
            }
          }
        }
        if (fdef.table) {
          const field = seg.fields.find((f) => f.index === fdef.position);
          if (field && field.raw) {
            const val = field.repetitions[0]?.[0]?.[0] ?? '';
            if (val) {
              const desc = lookupValue(fdef.table, val);
              if (!desc && lookupValue(fdef.table, '') === undefined) {
                results.push({ segmentId: seg.id, field: `${seg.id}-${fdef.position}`, severity: 'warning', message: `${fdef.name}: value "${val}" not found in HL7 Table ${fdef.table}` });
              }
            }
          }
        }
      });
    }
  });

  if (msh9 === 'ADT') {
    const pid = msg.segments.find((s) => s.id === 'PID');
    if (!pid) {
      results.push({ segmentId: '', field: 'PID', severity: 'error', message: 'ADT message missing required PID segment' });
    }
    const pv1 = msg.segments.find((s) => s.id === 'PV1');
    if (!pv1) {
      results.push({ segmentId: '', field: 'PV1', severity: 'warning', message: 'ADT message missing PV1 segment' });
    }
    const evn = msg.segments.find((s) => s.id === 'EVN');
    if (!evn) {
      results.push({ segmentId: '', field: 'EVN', severity: 'warning', message: 'ADT message missing EVN segment' });
    }
  }

  if (msh9 === 'ORU') {
    const obr = msg.segments.find((s) => s.id === 'OBR');
    if (!obr) {
      results.push({ segmentId: '', field: 'OBR', severity: 'error', message: 'ORU message missing required OBR segment' });
    }
  }

  return results;
}
