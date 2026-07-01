# Frontend Guide: Warranty API Structure Changes

This document outlines the recent backend architecture changes to the Warranty module and how the frontend API payload has been updated. Please refer to these changes when updating the Figma designs and frontend components.

## 1. Architectural Changes

We have revamped the warranty module to support a three-level hierarchy.

**Old Structure:**
`Warranty Group` -> `Warranty Options` (where one option was flagged as `is_default`)

**New Structure:**
`Warranty Group` -> `Warranty Types` (e.g. Extended Warranty, Accidental Damage) -> `Warranty Options` (e.g. 1 Year, 2 Years)

### The "Default Included Warranty"
The free, default warranty is no longer mixed in with the paid `Warranty Options`. It has been moved entirely to the **Group level**. 
- A group can optionally have a default warranty enabled (`has_default_warranty`).
- If enabled, the default warranty details are managed directly on the group.
- The `Warranty Options` arrays will now *only* contain extra, paid options.

## 2. API Payload Structure

The `warranty` object within the Product API response (`/api/products/...`) has been updated to reflect these changes.

### JSON Structure Example

```json
{
  "warranty": {
    "is_available": true,
    "has_options": true,
    "default_option": {
      "type": "default_warranty",
      "warranty_option_id": "default",
      "sku": null,
      "name": "1 Year Included Warranty",
      "duration_years": 1,
      "description": "Standard coverage included for free.",
      "price": 0
    },
    "types": [
      {
        "id": 1,
        "name": "Extended Warranty",
        "description": "Extends the standard coverage.",
        "icon": "shield-check",
        "badge_text": "Recommended",
        "badge_color": "blue",
        "options": [
          {
            "type": "extended_warranty",
            "warranty_option_id": 10,
            "sku": "PRODUCT-SKU-WAR-2Y-10",
            "name": "2 Years Extra",
            "duration_years": 2,
            "description": "Adds 2 extra years of coverage.",
            "price": 49.99
          },
          {
            "type": "extended_warranty",
            "warranty_option_id": 11,
            "sku": "PRODUCT-SKU-WAR-3Y-11",
            "name": "3 Years Extra",
            "duration_years": 3,
            "description": "Adds 3 extra years of coverage.",
            "price": 69.99
          }
        ]
      }
    ]
  }
}
```

## 3. Key Takeaways for Frontend & Design

1. **Separate Default Warranty Card UI:** The design should account for a standalone section/card displaying the `default_option` (if it is not `null`). You no longer need to search through an array of options to find the one where `price == 0` or `is_default == true`.
2. **Nested Paid Options:** The paid options are now nested under `types`. The UI should group options by their `Warranty Type` name (e.g., "Extended Warranty").
3. **Badges and Icons:** `types` can now include an `icon`, `badge_text`, and `badge_color`. Use these properties to highlight specific warranty categories (e.g. a "Recommended" badge).
4. **Conditional Default:** The `default_option` object will be `null` if the admin disables the free warranty for a specific group. Ensure the UI falls back gracefully if `default_option` is absent.
5. **Add to Cart:** The `default_option` has a `sku` of `null` and should not be submitted as a separate cart item, as it is implicitly included with the product. Only items from the `options` array have cart-ready SKUs.
