export function calculateDisplayedCheckoutTotals(
  netProducts: number,
  shipping: number,
  paymentFee: number,
  taxRate: number,
) {
  const netTotal = netProducts + shipping + paymentFee;
  const taxAmount = netTotal * taxRate;

  return { taxAmount, finalTotal: netTotal + taxAmount };
}

export function shouldPromptForInvalidVat(status: string, accepted: boolean) {
  return status === 'invalid' && !accepted;
}
