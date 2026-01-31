# Module 1: Component Hygiene and File Structure

**Goal:** Stop dumping everything in one component.

---

## Lesson 1: The "God Component" Problem

**Teaches:** Readability, boundaries, moving logic out

---

### Lesson Text (Display)

A common React anti-pattern is the God Component. This is when a single component handles fetching, state, formatting, event logic, conditional rendering, and UI layout all at once. It works, but it becomes impossible to maintain. The goal is not to write less code. The goal is to put code in the right place so each piece has a single job.

---

### Voice Prompt (TTS)

A common React anti-pattern is the God Component. This is when a single component handles fetching, state, formatting, event logic, conditional rendering, and UI layout all at once. It works, but it becomes impossible to maintain. The goal is not to write less code. The goal is to put code in the right place so each piece has a single job.

---

### Bad Example

```tsx
export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/orders?q=${query}`)
      .then(r => r.json())
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [query])

  const total = orders.reduce((sum, o) => sum + o.amount, 0)

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading ? <p>Loading...</p> : null}
      <p>Total: {total}</p>
      {orders.map(o => (
        <div key={o.id}>
          <p>{o.customer.name}</p>
          <button onClick={() => alert(`Refund ${o.id}`)}>Refund</button>
        </div>
      ))}
    </div>
  )
}
```

**Problems:**
- Fetching logic mixed with UI
- State management inline
- Business logic (total calculation) in component
- Event handlers inline
- No separation of concerns

---

### Good Example

```tsx
// hooks/useOrders.ts
export function useOrders(query: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchOrders(query)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [query])

  return { orders, loading }
}

// utils/orderUtils.ts
export function calculateTotal(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.amount, 0)
}

// services/orderService.ts
export async function refundOrder(id: string): Promise<void> {
  await fetch(`/api/orders/${id}/refund`, { method: 'POST' })
}

// components/OrderRow.tsx
export function OrderRow({ order, onRefund }: OrderRowProps) {
  return (
    <div>
      <p>{order.customer.name}</p>
      <button onClick={() => onRefund(order.id)}>Refund</button>
    </div>
  )
}

// pages/OrdersPage.tsx
export function OrdersPage() {
  const [query, setQuery] = useState('')
  const { orders, loading } = useOrders(query)
  const total = calculateTotal(orders)

  const handleRefund = async (id: string) => {
    await refundOrder(id)
  }

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading ? <p>Loading...</p> : null}
      <p>Total: {total}</p>
      {orders.map(o => (
        <OrderRow key={o.id} order={o} onRefund={handleRefund} />
      ))}
    </div>
  )
}
```

**Improvements:**
- `useOrders` hook for fetching
- `calculateTotal` utility for business logic
- `OrderRow` component for UI reuse
- `refundOrder` service for API calls
- Main component orchestrates, doesn't implement
