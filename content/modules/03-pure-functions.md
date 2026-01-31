# Module 3: Pure Functions and Testable Logic

**Goal:** Move business logic out of React so you can test it easily.

---

## Lesson 1: Derivations and Formatting Belong Outside

**Teaches:** Pure functions, testability, separation of concerns

---

### Lesson Text (Display)

If you cannot unit test your logic without rendering a component, that is a smell. React components should orchestrate and render. The logic should live in pure functions. Pure functions are predictable, testable, and reusable.

---

### Voice Prompt (TTS)

If you cannot unit test your logic without rendering a component, that is a smell. React components should orchestrate and render. The logic should live in pure functions. Pure functions are predictable, testable, and reusable.

---

### Bad Example

```tsx
export function OrdersTable({ orders, query }: Props) {
  // Business logic mixed into render
  const filtered = orders
    .filter(o => o.customer.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .map(o => ({
      ...o,
      displayTotal: `$${(o.amount / 100).toFixed(2)}`,
      statusLabel: o.status === 'pending' ? 'Awaiting' : 
                   o.status === 'shipped' ? 'On the way' : 'Done',
      daysAgo: Math.floor((Date.now() - o.createdAt) / 86400000)
    }))

  // Validation logic inline
  const canRefund = (order: Order) => {
    return order.status !== 'refunded' && 
           order.amount > 0 && 
           Date.now() - order.createdAt < 30 * 86400000
  }

  return (
    <table>
      {filtered.map(o => (
        <tr key={o.id}>
          <td>{o.customer.name}</td>
          <td>{o.displayTotal}</td>
          <td>{o.statusLabel}</td>
          <td>{o.daysAgo} days ago</td>
          <td>
            <button disabled={!canRefund(o)}>Refund</button>
          </td>
        </tr>
      ))}
    </table>
  )
}
```

**Problems:**
- Cannot test filter/sort logic without React
- Cannot test formatting without rendering
- Cannot test `canRefund` rule in isolation
- Mixing presentation with business rules
- Hard to reuse any of this logic

---

### Good Example

```tsx
// utils/orderFilters.ts
export function filterOrdersByCustomer(orders: Order[], query: string): Order[] {
  const q = query.trim().toLowerCase()
  if (!q) return orders
  return orders.filter(o => o.customer.name.toLowerCase().includes(q))
}

export function sortOrdersByDate(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => b.createdAtMs - a.createdAtMs)
}

export function filterSortAndMapOrders(orders: Order[], query: string): DisplayOrder[] {
  const filtered = filterOrdersByCustomer(orders, query)
  const sorted = sortOrdersByDate(filtered)
  return sorted.map(toDisplayOrder)
}

// utils/orderFormatters.ts
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatStatus(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Awaiting',
    shipped: 'On the way',
    delivered: 'Done',
    refunded: 'Refunded'
  }
  return labels[status]
}

export function formatDaysAgo(timestampMs: number): string {
  const days = Math.floor((Date.now() - timestampMs) / 86400000)
  return `${days} days ago`
}

export function toDisplayOrder(order: Order): DisplayOrder {
  return {
    ...order,
    displayTotal: formatCents(order.amountCents),
    statusLabel: formatStatus(order.status),
    daysAgo: formatDaysAgo(order.createdAtMs)
  }
}

// utils/orderRules.ts
const REFUND_WINDOW_DAYS = 30
const MS_PER_DAY = 86400000

export function canRefundOrder(order: Order): boolean {
  if (order.status === 'refunded') return false
  if (order.amountCents <= 0) return false
  
  const daysSinceOrder = (Date.now() - order.createdAtMs) / MS_PER_DAY
  return daysSinceOrder < REFUND_WINDOW_DAYS
}

// components/OrdersTable.tsx
export function OrdersTable({ orders, query }: Props) {
  const displayOrders = filterSortAndMapOrders(orders, query)

  return (
    <table>
      {displayOrders.map(o => (
        <OrderRow key={o.id} order={o} canRefund={canRefundOrder(o)} />
      ))}
    </table>
  )
}
```

**Improvements:**
- Each function does one thing
- All logic testable without React
- Formatters reusable across app
- Business rules explicit and named
- Component just orchestrates

---

### Tests

```tsx
// utils/__tests__/orderFilters.test.ts
import { describe, it, expect } from 'vitest'
import { filterOrdersByCustomer, filterSortAndMapOrders } from '../orderFilters'

describe('filterOrdersByCustomer', () => {
  const orders = [
    { id: '1', customer: { name: 'Kenny' } },
    { id: '2', customer: { name: 'Alex' } },
  ] as Order[]

  it('filters by customer name case-insensitive', () => {
    expect(filterOrdersByCustomer(orders, 'ken')).toHaveLength(1)
    expect(filterOrdersByCustomer(orders, 'KEN')).toHaveLength(1)
  })

  it('returns all when query is empty', () => {
    expect(filterOrdersByCustomer(orders, '')).toHaveLength(2)
    expect(filterOrdersByCustomer(orders, '  ')).toHaveLength(2)
  })
})

describe('filterSortAndMapOrders', () => {
  it('filters, sorts, and maps in one pass', () => {
    const orders = [
      { customerName: 'Kenny', createdAtMs: 1, amountCents: 1000 },
      { customerName: 'Alex', createdAtMs: 2, amountCents: 2000 },
    ] as Order[]
    
    const result = filterSortAndMapOrders(orders, 'ken')
    expect(result).toHaveLength(1)
    expect(result[0].displayTotal).toBe('$10.00')
  })
})

// utils/__tests__/orderRules.test.ts
import { canRefundOrder } from '../orderRules'

describe('canRefundOrder', () => {
  it('returns false for already refunded', () => {
    expect(canRefundOrder({ status: 'refunded', amountCents: 100, createdAtMs: Date.now() })).toBe(false)
  })

  it('returns false for zero amount', () => {
    expect(canRefundOrder({ status: 'pending', amountCents: 0, createdAtMs: Date.now() })).toBe(false)
  })

  it('returns false after 30 days', () => {
    const oldOrder = { status: 'pending', amountCents: 100, createdAtMs: Date.now() - 31 * 86400000 }
    expect(canRefundOrder(oldOrder)).toBe(false)
  })

  it('returns true for valid refund', () => {
    const validOrder = { status: 'pending', amountCents: 100, createdAtMs: Date.now() }
    expect(canRefundOrder(validOrder)).toBe(true)
  })
})
```
