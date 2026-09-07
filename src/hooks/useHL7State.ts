import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ParsedMessage, ValidationResult } from '@/hl7/types';
import { parseMessage, serializeMessage, serializeField } from '@/hl7/parser';
import { validateMessage } from '@/hl7/validator';
import { anonymizeMessage, generateACK, defaultSampleMessage } from '@/hl7/devTools';
import { translateMessage } from '@/hl7/translator';

export type UpdateSource = 'raw' | 'tree';

export function useHL7State() {
  const [rawText, setRawText] = useState<string>(() => defaultSampleMessage());
  const [parsed, setParsed] = useState<ParsedMessage>(() => parseMessage(rawText));
  const [lastSource, setLastSource] = useState<UpdateSource>('raw');
  const [ackMessage, setAckMessage] = useState<string>('');

  const validation = useMemo<ValidationResult[]>(() => validateMessage(parsed), [parsed]);
  const humanReadable = useMemo(() => translateMessage(parsed), [parsed]);

  const errorCount = validation.filter((v) => v.severity === 'error').length;
  const warningCount = validation.filter((v) => v.severity === 'warning').length;

  const updateFromRaw = useCallback((text: string) => {
    setLastSource('raw');
    setRawText(text);
    setParsed(parseMessage(text));
  }, []);

  const updateField = useCallback((
    segIdx: number,
    fieldIdx: number,
    rep: number,
    compIdx: number,
    subcompIdx: number,
    value: string,
  ) => {
    setLastSource('tree');
    setParsed((prev) => {
      const next: ParsedMessage = {
        delimiters: { ...prev.delimiters },
        segments: prev.segments.map((seg, si) => {
          if (si !== segIdx) return { ...seg, fields: [...seg.fields] };
          return {
            ...seg,
            fields: seg.fields.map((f) => {
              if (f.index !== fieldIdx) return f;
              const reps = f.repetitions.map((r) => r.map((c) => [...c]));
              if (!reps[rep]) reps[rep] = [];
              if (!reps[rep][compIdx]) reps[rep][compIdx] = [];
              reps[rep][compIdx][subcompIdx] = value;
              return { ...f, repetitions: reps, raw: serializeField(reps, prev.delimiters) };
            }),
          };
        }),
      };
      setRawText(serializeMessage(next));
      return next;
    });
  }, []);

  const loadSample = useCallback(() => {
    const sample = defaultSampleMessage();
    setLastSource('raw');
    setRawText(sample);
    setParsed(parseMessage(sample));
    setAckMessage('');
  }, []);

  const clearMessage = useCallback(() => {
    setLastSource('raw');
    setRawText('');
    setParsed({ delimiters: parsed.delimiters, segments: [] });
    setAckMessage('');
  }, [parsed.delimiters]);

  const doAnonymize = useCallback(() => {
    setLastSource('tree');
    const anon = anonymizeMessage(parsed);
    setParsed(anon);
    setRawText(serializeMessage(anon));
  }, [parsed]);

  const doGenerateACK = useCallback(() => {
    setAckMessage(generateACK(parsed));
  }, [parsed]);

  const loadFile = useCallback((content: string) => {
    setLastSource('raw');
    setRawText(content);
    setParsed(parseMessage(content));
    setAckMessage('');
  }, []);

  return {
    rawText,
    parsed,
    validation,
    humanReadable,
    errorCount,
    warningCount,
    lastSource,
    ackMessage,
    updateFromRaw,
    updateField,
    loadSample,
    clearMessage,
    doAnonymize,
    doGenerateACK,
    loadFile,
  };
}
