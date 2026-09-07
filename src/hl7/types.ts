export interface Delimiters {
  field: string;
  component: string;
  repetition: string;
  escape: string;
  subcomponent: string;
}

export interface SegmentField {
  index: number;
  raw: string;
  repetitions: string[][][]; // [rep][component][subcomponent]
}

export interface SegmentNode {
  id: string;
  fields: SegmentField[];
}

export interface ParsedMessage {
  delimiters: Delimiters;
  segments: SegmentNode[];
}

export interface ValidationResult {
  segmentId: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface SegmentDef {
  name: string;
  description: string;
  fields: FieldDef[];
}

export interface FieldDef {
  position: number;
  name: string;
  dataType: string;
  required: boolean;
  length?: string;
  table?: string;
  description: string;
}
