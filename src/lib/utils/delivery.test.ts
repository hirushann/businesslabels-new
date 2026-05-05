import { describe, it, expect } from '@jest/globals';
import { getExpectedDeliveryMessage } from './delivery';

describe('getExpectedDeliveryMessage', () => {
  const pickupTime = '13:00';

  describe('before cutoff', () => {
    it('should calculate correct countdown for in-stock product', () => {
      const now = new Date('2026-05-06T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 197,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.hours).toBe(4);
      expect(result.countdown.minutes).toBe(0);
      expect(result.countdown.formattedMinutes).toBe('00');
      expect(result.deliveryLabel).toBe('tomorrow');
      expect(result.message).toBe('Order within 4 hours 00 minutes for delivery tomorrow');
    });

    it('should calculate correct date for in-stock product with 2 days delivery', () => {
      const now = new Date('2026-05-06T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.hours).toBe(4);
      expect(result.countdown.minutes).toBe(0);
      expect(result.deliveryLabel).toBe('8th May');
      expect(result.message).toBe('Order within 4 hours 00 minutes for delivery 8th May');
    });

    it('should calculate correct date for out-of-stock product', () => {
      const now = new Date('2026-05-06T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 0,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.hours).toBe(4);
      expect(result.countdown.minutes).toBe(0);
      expect(result.deliveryLabel).toBe('11th May');
      expect(result.message).toBe('Order within 4 hours 00 minutes for delivery 11th May');
    });
  });
  
  describe('after cutoff', () => {
    it('should add extra day and count to next cutoff for in-stock product', () => {
      const now = new Date('2026-05-06T15:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 197,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.hours).toBe(22);
      expect(result.countdown.minutes).toBe(0);
      expect(result.deliveryLabel).toBe('8th May');
      expect(result.message).toBe('Order within 22 hours 00 minutes for delivery 8th May');
    });

    it('should add extra day and count to next cutoff for out-of-stock product', () => {
      const now = new Date('2026-05-06T15:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 0,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.hours).toBe(22);
      expect(result.countdown.minutes).toBe(0);
      expect(result.deliveryLabel).toBe('12th May');
      expect(result.message).toBe('Order within 22 hours 00 minutes for delivery 12th May');
    });
  });

  describe('exactly at cutoff', () => {
    it('should treat exact cutoff time as passed', () => {
      const now = new Date('2026-05-06T13:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 197,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.hours).toBe(24);
      expect(result.countdown.minutes).toBe(0);
      expect(result.deliveryLabel).toBe('8th May');
      expect(result.message).toBe('Order within 24 hours 00 minutes for delivery 8th May');
    });
  });
  
  describe('date formatting', () => {
    it('should show "tomorrow" for next day delivery', () => {
      const now = new Date('2026-05-06T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('tomorrow');
      expect(result.message).toContain('tomorrow');
    });

    it('should format 1st correctly', () => {
      const now = new Date('2026-05-30T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('1st June');
      expect(result.message).toContain('1st June');
    });
    
    it('should format 2nd correctly', () => {
      const now = new Date('2026-05-31T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('2nd June');
      expect(result.message).toContain('2nd June');
    });

    it('should format 3rd correctly', () => {
      const now = new Date('2026-05-01T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('3rd May');
      expect(result.message).toContain('3rd May');
    });
    
    it('should format 21st correctly', () => {
      const now = new Date('2026-05-19T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('21st May');
      expect(result.message).toContain('21st May');
    });

    it('should format 11th correctly (not 11st)', () => {
      const now = new Date('2026-05-09T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('11th May');
      expect(result.message).toContain('11th May');
    });
  });

  describe('zero-padded minutes', () => {
    it('should zero-pad single digit minutes', () => {
      const now = new Date('2026-05-06T12:55:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.hours).toBe(0);
      expect(result.countdown.minutes).toBe(5);
      expect(result.countdown.formattedMinutes).toBe('05');
      expect(result.message).toBe('Order within 0 hours 05 minutes for delivery tomorrow');
    });
    
    it('should show 00 for zero minutes', () => {
      const now = new Date('2026-05-06T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.minutes).toBe(0);
      expect(result.countdown.formattedMinutes).toBe('00');
      expect(result.message).toContain('4 hours 00 minutes');
    });

    it('should not pad double digit minutes', () => {
      const now = new Date('2026-05-06T12:30:00');
      const result = getExpectedDeliveryMessage({
        stock: 100,
        delivery_dates_in_stock: 1,
        delivery_dates_no_stock: 5,
        now,
        pickupTime,
      });
      
      expect(result.countdown.hours).toBe(0);
      expect(result.countdown.minutes).toBe(30);
      expect(result.countdown.formattedMinutes).toBe('30');
      expect(result.message).toBe('Order within 0 hours 30 minutes for delivery tomorrow');
    });
  });

  describe('stock levels', () => {
    it('should use delivery_dates_in_stock when stock > 0', () => {
      const now = new Date('2026-05-06T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 1,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 10,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('8th May'); // 6 + 2 = 8th
      expect(result.message).toContain('8th May');
    });
    
    it('should use delivery_dates_no_stock when stock = 0', () => {
      const now = new Date('2026-05-06T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: 0,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 10,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('16th May'); // 6 + 10 = 16th
      expect(result.message).toContain('16th May');
    });

    it('should use delivery_dates_no_stock when stock < 0', () => {
      const now = new Date('2026-05-06T09:00:00');
      const result = getExpectedDeliveryMessage({
        stock: -5,
        delivery_dates_in_stock: 2,
        delivery_dates_no_stock: 10,
        now,
        pickupTime,
      });
      
      expect(result.deliveryLabel).toBe('16th May'); // 6 + 10 = 16th
      expect(result.message).toContain('16th May');
    });
  });
});
