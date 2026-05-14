"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseDebouncedSearchParamOptions = {
  value: string;
  delay?: number;
  minLength?: number;
  onCommit: (value: string) => void;
};

export function useDebouncedSearchParam({
  value,
  delay = 350,
  minLength = 0,
  onCommit,
}: UseDebouncedSearchParamOptions) {
  const normalizedInitialValue = value.trim();
  const [inputValue, setInputValue] = useState(value);
  const committedValueRef = useRef(normalizedInitialValue);
  const latestInputRef = useRef(inputValue);
  const commitRef = useRef(onCommit);

  useEffect(() => {
    latestInputRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    const externalValue = value.trim();

    if (externalValue === committedValueRef.current) {
      return;
    }

    committedValueRef.current = externalValue;
    const timeoutId = window.setTimeout(() => {
      setInputValue(value);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextValue = latestInputRef.current.trim();
      const committedValue = nextValue.length >= minLength ? nextValue : "";

      if (committedValue === committedValueRef.current) {
        return;
      }

      committedValueRef.current = committedValue;
      commitRef.current(committedValue);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, inputValue, minLength]);

  const commitNow = useCallback(() => {
    const nextValue = latestInputRef.current.trim();
    const committedValue = nextValue.length >= minLength ? nextValue : "";

    if (committedValue === committedValueRef.current) {
      return;
    }

    committedValueRef.current = committedValue;
    commitRef.current(committedValue);
  }, [minLength]);

  return {
    inputValue,
    setInputValue,
    commitNow,
  };
}
