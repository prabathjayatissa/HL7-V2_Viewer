import type { Delimiters, SegmentNode, SegmentField, ParsedMessage } from './types';

const DEFAULT_DELIMITERS: Delimiters = {
  field: '|',
  component: '^',
  repetition: '~',
  escape: '\\',
  subcomponent: '&',
};

export function parseDelimiters(raw: string): Delimiters {
  const m = raw.trim().match(/^MSH(.{4})/);
  if (!m) return { ...DEFAULT_DELIMITERS };
  const s = m[1];
  return {
    field: s[0] ?? '|',
    component: s[1] ?? '^',
    repetition: s[2] ?? '~',
    escape: s[3] ?? '\\',
    subcomponent: s[4] ?? '&',
  };
}

function parseField(raw: string, delims: Delimiters): string[][][] {
  return raw.split(delims.repetition).map((rep) =>
    rep.split(delims.component).map((comp) =>
      comp.split(delims.subcomponent)
    )
  );
}

export function parseMessage(text: string): ParsedMessage {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  const delims = parseDelimiters(lines[0] ?? '');
  const segments: SegmentNode[] = lines.map((line) => {
    const parts = line.split(delims.field);
    const id = parts[0];
    const fields: SegmentField[] = [];

    if (id === 'MSH') {
      fields.push({ index: 0, raw: delims.field, repetitions: [[[delims.field]]] });
      fields.push({ index: 1, raw: delims.component + delims.repetition + delims.escape + delims.subcomponent, repetitions: [[[delims.component, delims.repetition, delims.escape, delims.subcomponent]]] });
      for (let i = 2; i < parts.length; i++) {
        fields.push({ index: i, raw: parts[i], repetitions: parseField(parts[i], delims) });
      }
    } else {
      for (let i = 1; i < parts.length; i++) {
        fields.push({ index: i, raw: parts[i], repetitions: parseField(parts[i], delims) });
      }
    }

    return { id, fields };
  });

  return { delimiters: delims, segments };
}

export function serializeField(reps: string[][][], delims: Delimiters): string {
  return reps
    .map((rep) =>
      rep
        .map((comp) => comp.join(delims.subcomponent))
        .join(delims.component)
    )
    .join(delims.repetition);
}

export function serializeSegment(seg: SegmentNode, delims: Delimiters): string {
  if (seg.id === 'MSH') {
    const parts = seg.fields.map((f) => f.raw);
    return parts.join(delims.field);
  }
  const parts = [seg.id, ...seg.fields.map((f) => f.raw)];
  return parts.join(delims.field);
}

export function serializeMessage(msg: ParsedMessage): string {
  return msg.segments
    .map((seg) => serializeSegment(seg, msg.delimiters))
    .join('\r\n');
}

export function createEmptyMessage(): ParsedMessage {
  return {
    delimiters: { ...DEFAULT_DELIMITERS },
    segments: [],
  };
}
