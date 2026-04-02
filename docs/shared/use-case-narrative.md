# Shop — Use Case Narrative: Place Order

**Primary Actor:** Customer
**Preconditions:** TODO

## Main Flow

1. Customer submits order with SKU and quantity
2. System validates input
3. System calls ERP to look up product
4. System calls Clock to get current timestamp
5. System creates order with status PLACED
6. System returns confirmation

## Alternative Flows

### Invalid Input

- Customer submits invalid data — System returns validation error

### External System Unavailable

- ERP is unavailable — TODO: describe fallback

## Postconditions

- TODO
