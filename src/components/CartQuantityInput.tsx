'use client';

import { useState } from 'react';
import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type CartQuantityInputProps = {
  quantity: number;
  itemName: string;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
  onQuantityChange: (quantity: number) => void;
  className?: string;
  buttonClassName?: string;
  inputClassName?: string;
};

function parseQuantity(value: string): number | null {
  const normalized = value.trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    return null;
  }

  const quantity = Number(normalized);
  return Number.isSafeInteger(quantity) ? quantity : null;
}

export default function CartQuantityInput({
  quantity,
  itemName,
  decreaseLabel,
  increaseLabel,
  onDecrease,
  onIncrease,
  onQuantityChange,
  className,
  buttonClassName,
  inputClassName,
}: CartQuantityInputProps) {
  const [draftQuantity, setDraftQuantity] = useState<string | null>(null);
  const displayQuantity = draftQuantity ?? String(quantity);

  const stopCartLinkClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleQuantityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value;
    setDraftQuantity(nextValue);

    const nextQuantity = parseQuantity(nextValue);
    if (nextQuantity === null) {
      return;
    }

    onQuantityChange(nextQuantity);
  };

  const handleQuantityBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (parseQuantity(event.currentTarget.value) === null) {
      setDraftQuantity(null);
      return;
    }

    setDraftQuantity(null);
  };

  const handleDecrease = () => {
    setDraftQuantity(null);
    onDecrease();
  };

  const handleIncrease = () => {
    setDraftQuantity(null);
    onIncrease();
  };

  const handleInputClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const handleInputFocus = () => {
    if (draftQuantity === null) {
      setDraftQuantity(String(quantity));
    }
  };

  return (
    <div className={cn('flex h-10 items-center rounded-full border border-slate-200 bg-white px-1', className)}>
      <button
        type="button"
        onClick={(event) => {
          stopCartLinkClick(event);
          handleDecrease();
        }}
        className={cn(
          'flex size-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-slate-100',
          buttonClassName,
        )}
        aria-label={decreaseLabel}
      >
        -
      </button>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[1-9][0-9]*"
        value={displayQuantity}
        onClick={handleInputClick}
        onFocus={handleInputFocus}
        onChange={handleQuantityChange}
        onBlur={handleQuantityBlur}
        aria-label={`Quantity for ${itemName}`}
        className={cn(
          'h-8 w-12 rounded-full border-0 bg-transparent px-1 text-center text-sm font-semibold text-neutral-800 shadow-none focus-visible:border-0 focus-visible:ring-0',
          inputClassName,
        )}
      />
      <button
        type="button"
        onClick={(event) => {
          stopCartLinkClick(event);
          handleIncrease();
        }}
        className={cn(
          'flex size-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-slate-100',
          buttonClassName,
        )}
        aria-label={increaseLabel}
      >
        +
      </button>
    </div>
  );
}
