import type { ParsedMessage, SegmentNode } from './types';
import { lookupValue } from './tables';
import { getFieldDef } from './segmentDefs';

export interface HumanReadableItem {
  segment: string;
  field: string;
  label: string;
  value: string;
}

const MSG_TYPES: Record<string, string> = {
  'ADT-A01': 'Admit/Visit Notification',
  'ADT-A02': 'Transfer a Patient',
  'ADT-A03': 'Discharge/End Visit',
  'ADT-A04': 'Register a Patient',
  'ADT-A05': 'Pre-admit a Patient',
  'ADT-A06': 'Change an Outpatient to Inpatient',
  'ADT-A07': 'Change an Inpatient to Outpatient',
  'ADT-A08': 'Update Patient Information',
  'ADT-A09': 'Patient Departing',
  'ADT-A10': 'Patient Arriving',
  'ADT-A11': 'Cancel Admit',
  'ADT-A12': 'Cancel Transfer',
  'ADT-A13': 'Cancel Discharge',
  'ADT-A14': 'Pending Admit',
  'ADT-A15': 'Pending Transfer',
  'ADT-A16': 'Pending Discharge',
  'ADT-A17': 'Swap Patients',
  'ADT-A18': 'Merge Patient Information',
  'ADT-A20': 'Bed Status Update',
  'ADT-A21': 'Patient Goes on Leave',
  'ADT-A22': 'Patient Returns from Leave',
  'ADT-A23': 'Cancel Patient Going on Leave',
  'ADT-A24': 'Link Patient Information',
  'ADT-A25': 'Cancel Patient Returns from Leave',
  'ADT-A26': 'Cancel Pending Discharge',
  'ADT-A28': 'Add Person Information',
  'ADT-A29': 'Delete Person Information',
  'ADT-A31': 'Update Person Information',
  'ORM-O01': 'Order Message',
  'ORU-R01': 'Observation Result (Unsolicited)',
  'ACK': 'Acknowledgement',
  'QRY-Q01': 'Query',
  'RDE-O11': 'Pharmacy/Treatment Encoded Order',
  'RDS-O01': 'Pharmacy/Treatment Dispense',
  'MDM-T01': 'Original Document Notification',
  'SIU-S12': 'Scheduling Information Unsolicited',
};

function formatDate(s: string): string {
  if (!s) return '';
  const m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return s;
  const [, y, mo, d, h, mi, sec] = m;
  let result = `${y}-${mo}-${d}`;
  if (h) result += ` ${h}:${mi ?? '00'}${sec ? ':' + sec : ''}`;
  return result;
}

function getComponent(seg: SegmentNode, fieldIdx: number, rep: number, comp: number, subcomp: number): string {
  const field = seg.fields.find((f) => f.index === fieldIdx);
  if (!field) return '';
  return field.repetitions?.[rep]?.[comp]?.[subcomp] ?? '';
}

export function translateMessage(msg: ParsedMessage): HumanReadableItem[][] {
  return msg.segments.map((seg) => {
    const items: HumanReadableItem[] = [];
    const segDef = SEGMENT_NAMES[seg.id] || seg.id;

    if (seg.id === 'MSH') {
      items.push({ segment: 'MSH', field: 'MSH-9', label: 'Message Type', value: translateMsgType(seg) });
      items.push({ segment: 'MSH', field: 'MSH-3', label: 'Sending Application', value: getComponent(seg, 3, 0, 0, 0) });
      items.push({ segment: 'MSH', field: 'MSH-4', label: 'Sending Facility', value: getComponent(seg, 4, 0, 0, 0) });
      items.push({ segment: 'MSH', field: 'MSH-5', label: 'Receiving Application', value: getComponent(seg, 5, 0, 0, 0) });
      items.push({ segment: 'MSH', field: 'MSH-6', label: 'Receiving Facility', value: getComponent(seg, 6, 0, 0, 0) });
      items.push({ segment: 'MSH', field: 'MSH-7', label: 'Date/Time of Message', value: formatDate(getComponent(seg, 7, 0, 0, 0)) });
      items.push({ segment: 'MSH', field: 'MSH-10', label: 'Message Control ID', value: getComponent(seg, 10, 0, 0, 0) });
      items.push({ segment: 'MSH', field: 'MSH-11', label: 'Processing ID', value: translateProcessingId(getComponent(seg, 11, 0, 0, 0)) });
      items.push({ segment: 'MSH', field: 'MSH-12', label: 'Version ID', value: getComponent(seg, 12, 0, 0, 0) });
      return items;
    }

    if (seg.id === 'PID') {
      const pid3 = getComponent(seg, 3, 0, 0, 0);
      const pid3Type = getComponent(seg, 3, 0, 0, 5);
      const pid5Family = getComponent(seg, 5, 0, 0, 0);
      const pid5Given = getComponent(seg, 5, 0, 1, 0);
      const pid5Middle = getComponent(seg, 5, 0, 2, 0);
      const pid5Prefix = getComponent(seg, 5, 0, 4, 0);
      const pid7 = getComponent(seg, 7, 0, 0, 0);
      const pid8 = getComponent(seg, 8, 0, 0, 0);
      const pid11street = getComponent(seg, 11, 0, 0, 0);
      const pid11city = getComponent(seg, 11, 0, 2, 0);
      const pid11state = getComponent(seg, 11, 0, 3, 0);
      const pid11zip = getComponent(seg, 11, 0, 4, 0);
      const pid13 = getComponent(seg, 13, 0, 6, 0) || getComponent(seg, 13, 0, 0, 0);
      const pid19 = getComponent(seg, 19, 0, 0, 0);

      items.push({ segment: 'PID', field: 'PID-3', label: 'Patient ID', value: pid3 + (pid3Type ? ` (${pid3Type})` : '') });
      items.push({ segment: 'PID', field: 'PID-5', label: 'Patient Name', value: [pid5Prefix, pid5Family, pid5Given, pid5Middle].filter(Boolean).join(', ') });
      items.push({ segment: 'PID', field: 'PID-7', label: 'Date of Birth', value: formatDate(pid7) });
      const sexDesc = lookupValue('0001', pid8) || pid8;
      items.push({ segment: 'PID', field: 'PID-8', label: 'Sex', value: pid8 ? `${pid8} - ${sexDesc}` : '' });
      items.push({ segment: 'PID', field: 'PID-11', label: 'Address', value: [pid11street, pid11city, pid11state, pid11zip].filter(Boolean).join(', ') });
      items.push({ segment: 'PID', field: 'PID-13', label: 'Home Phone', value: pid13 });
      items.push({ segment: 'PID', field: 'PID-19', label: 'SSN', value: pid19 });
      return items;
    }

    if (seg.id === 'PV1') {
      const patientClass = getComponent(seg, 2, 0, 0, 0);
      const patientClassDesc = lookupValue('0004', patientClass) || '';
      items.push({ segment: 'PV1', field: 'PV1-2', label: 'Patient Class', value: patientClass ? `${patientClass} - ${patientClassDesc}` : '' });
      items.push({ segment: 'PV1', field: 'PV1-3', label: 'Assigned Location', value: getComponent(seg, 3, 0, 0, 0) });
      const attendDoc = getComponent(seg, 7, 0, 1, 0) + ' ' + getComponent(seg, 7, 0, 2, 0);
      items.push({ segment: 'PV1', field: 'PV1-7', label: 'Attending Doctor', value: attendDoc.trim() });
      items.push({ segment: 'PV1', field: 'PV1-44', label: 'Admit Date/Time', value: formatDate(getComponent(seg, 44, 0, 0, 0)) });
      items.push({ segment: 'PV1', field: 'PV1-45', label: 'Discharge Date/Time', value: formatDate(getComponent(seg, 45, 0, 0, 0)) });
      return items;
    }

    if (seg.id === 'OBR') {
      items.push({ segment: 'OBR', field: 'OBR-4', label: 'Requested Test', value: [getComponent(seg, 4, 0, 0, 0), getComponent(seg, 4, 0, 1, 0)].filter(Boolean).join(' - ') });
      items.push({ segment: 'OBR', field: 'OBR-7', label: 'Observation Date/Time', value: formatDate(getComponent(seg, 7, 0, 0, 0)) });
      const orderingProv = getComponent(seg, 16, 0, 1, 0) + ' ' + getComponent(seg, 16, 0, 2, 0);
      items.push({ segment: 'OBR', field: 'OBR-16', label: 'Ordering Provider', value: orderingProv.trim() });
      items.push({ segment: 'OBR', field: 'OBR-25', label: 'Result Status', value: translateResultStatus(getComponent(seg, 25, 0, 0, 0)) });
      return items;
    }

    if (seg.id === 'OBX') {
      const valueType = getComponent(seg, 2, 0, 0, 0);
      items.push({ segment: 'OBX', field: 'OBX-2', label: 'Value Type', value: valueType });
      items.push({ segment: 'OBX', field: 'OBX-3', label: 'Observation', value: [getComponent(seg, 3, 0, 0, 0), getComponent(seg, 3, 0, 1, 0)].filter(Boolean).join(' - ') });
      items.push({ segment: 'OBX', field: 'OBX-5', label: 'Value', value: getComponent(seg, 5, 0, 0, 0) });
      items.push({ segment: 'OBX', field: 'OBX-6', label: 'Units', value: getComponent(seg, 6, 0, 0, 0) });
      items.push({ segment: 'OBX', field: 'OBX-7', label: 'Reference Range', value: getComponent(seg, 7, 0, 0, 0) });
      items.push({ segment: 'OBX', field: 'OBX-11', label: 'Result Status', value: translateResultStatus(getComponent(seg, 11, 0, 0, 0)) });
      items.push({ segment: 'OBX', field: 'OBX-14', label: 'Observation Date/Time', value: formatDate(getComponent(seg, 14, 0, 0, 0)) });
      return items;
    }

    // Generic: translate known fields
    seg.fields.forEach((field) => {
      if (field.index === 0 && seg.id !== 'MSH') return;
      const def = getFieldDef(seg.id, field.index);
      if (!def) return;
      const value = field.repetitions[0]?.[0]?.[0] ?? '';
      if (!value) return;
      let displayValue = value;
      if (def.table) {
        const desc = lookupValue(def.table, value);
        if (desc) displayValue = `${value} - ${desc}`;
      }
      items.push({
        segment: seg.id,
        field: `${seg.id}-${field.index}`,
        label: def.name,
        value: displayValue,
      });
    });

    return items.length > 0 ? items : [{ segment: seg.id, field: '', label: segDef, value: '' }];
  });
}

function translateMsgType(seg: SegmentNode): string {
  const type = getComponent(seg, 9, 0, 0, 0);
  const trigger = getComponent(seg, 9, 0, 1, 0);
  const full = trigger ? `${type}-${trigger}` : type;
  const desc = MSG_TYPES[full] || MSG_TYPES[type] || '';
  return desc ? `${full} - ${desc}` : full;
}

function translateProcessingId(id: string): string {
  switch (id) {
    case 'D': return 'D - Debugging';
    case 'P': return 'P - Production';
    case 'T': return 'T - Training';
    default: return id;
  }
}

function translateResultStatus(code: string): string {
  return lookupValue('0085', code) || lookupValue('0123', code) || code;
}

const SEGMENT_NAMES: Record<string, string> = {
  MSH: 'Message Header',
  EVN: 'Event Type',
  PID: 'Patient Identification',
  PV1: 'Patient Visit',
  OBR: 'Observation Request',
  OBX: 'Observation/Result',
  NK1: 'Next of Kin',
  IN1: 'Insurance',
  AL1: 'Allergy Information',
  DG1: 'Diagnosis',
  ORC: 'Common Order',
  ACC: 'Accident',
  DB1: 'Disability Information',
  DRG: 'Diagnosis Related Group',
  GT1: 'Guarantor',
  PR1: 'Procedures',
  ROL: 'Role',
  NTE: 'Notes and Comments',
  PV2: 'Patient Visit - Additional Info',
};
