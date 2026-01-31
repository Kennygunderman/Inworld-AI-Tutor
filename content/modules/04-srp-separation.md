# Module 4: SRP and Separation of Concerns

**Goal:** Teach "one reason to change" in React land.

---

## Lesson 1: Single Responsibility in Practice

**Teaches:** SRP, layered architecture, maintainability

---

### Lesson Text (Display)

SRP does not mean tiny files everywhere. It means each unit has one reason to change. In a React app, the most common reasons for change are UI changes, data changes, and business rules changes. When those are tangled together, everything breaks at once.

---

### Voice Prompt (TTS)

S R P does not mean tiny files everywhere. It means each unit has one reason to change. In a React app, the most common reasons for change are UI changes, data changes, and business rules changes. When those are tangled together, everything breaks at once.

---

### The Pattern

```
┌─────────────────────────────────────────────────┐
│                    UI Layer                      │
│  (Presentational components - styling, layout)   │
│  Changes when: design updates, UX tweaks         │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│               Container Layer                    │
│  (Smart components - state, composition)         │
│  Changes when: page structure, data flow         │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                 Hooks Layer                      │
│  (Data fetching, mutations, side effects)        │
│  Changes when: API changes, caching strategy     │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│               Services Layer                     │
│  (HTTP calls, external integrations)             │
│  Changes when: API endpoints, auth flow          │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                Utils Layer                       │
│  (Pure functions, formatters, validators)        │
│  Changes when: business rules change             │
└─────────────────────────────────────────────────┘
```

---

### Bad Example

```tsx
// Everything in one file, one component
export function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    // API call inline
    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(r => r.json())
      .then(data => {
        // Data transformation inline
        const mapped = data.map((o: any) => ({
          ...o,
          total: `$${(o.amount / 100).toFixed(2)}`,
          date: new Date(o.createdAt).toLocaleDateString()
        }))
        setOrders(mapped)
      })
      .finally(() => setLoading(false))
  }, [])

  // Business logic inline
  const pendingTotal = orders
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => sum + o.amount, 0)

  return (
    // UI mixed with everything
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <p className="text-gray-600">Pending: ${(pendingTotal / 100).toFixed(2)}</p>
      {loading ? (
        <div className="animate-spin">Loading...</div>
      ) : (
        <ul className="divide-y">
          {orders.map(o => (
            <li key={o.id} className="py-2 flex justify-between">
              <span className="font-medium">{o.customerName}</span>
              <span className="text-green-600">{o.total}</span>
              <button 
                className="px-3 py-1 bg-red-500 text-white rounded"
                onClick={async () => {
                  await fetch(`/api/orders/${o.id}/refund`, { method: 'POST' })
                  setOrders(prev => prev.filter(x => x.id !== o.id))
                }}
              >
                Refund
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**What changes break this:**
- Designer wants new layout → touch business logic
- API endpoint changes → dig through UI code
- Refund rules change → find it in onClick handler
- Add tests → need to render entire component

---

### Good Example

```tsx
// services/api.ts - Changes when: auth, base URL, headers
const API_BASE = import.meta.env.VITE_API_URL

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// services/orderService.ts - Changes when: order endpoints change
import { apiFetch } from './api'

export const orderService = {
  getAll: () => apiFetch<Order[]>('/orders'),
  refund: (id: string) => apiFetch<void>(`/orders/${id}/refund`, { method: 'POST' }),
}

// utils/orderUtils.ts - Changes when: business rules change
export function calculatePendingTotal(orders: Order[]): number {
  return orders
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => sum + o.amountCents, 0)
}

export function toDisplayOrder(order: Order): DisplayOrder {
  return {
    ...order,
    total: formatCents(order.amountCents),
    date: formatDate(order.createdAt),
  }
}

// hooks/useOrders.ts - Changes when: data flow
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    orderService.getAll().then(setOrders)
  }, [])

  const refund = async (id: string) => {
    await orderService.refund(id)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  return { orders, refund }
}

// components/OrderRow.tsx - Changes when: row design changes
interface OrderRowProps {
  order: DisplayOrder
  onRefund: () => void
}

export function OrderRow({ order, onRefund }: OrderRowProps) {
  return (
    <li className="py-2 flex justify-between items-center">
      <span className="font-medium">{order.customerName}</span>
      <span className="text-green-600">{order.total}</span>
      <Button variant="destructive" size="sm" onClick={onRefund}>
        Refund
      </Button>
    </li>
  )
}

// components/OrdersList.tsx - Changes when: list layout changes
interface OrdersListProps {
  orders: DisplayOrder[]
  onRefund: (id: string) => void
}

export function OrdersList({ orders, onRefund }: OrdersListProps) {
  return (
    <ul className="divide-y">
      {orders.map(o => (
        <OrderRow key={o.id} order={o} onRefund={() => onRefund(o.id)} />
      ))}
    </ul>
  )
}

// pages/OrdersDashboard.tsx - Changes when: page composition changes
export function OrdersDashboard() {
  const { orders, loading, refund } = useOrders()
  
  const displayOrders = useMemo(
    () => orders.map(toDisplayOrder),
    [orders]
  )
  
  const pendingTotal = useMemo(
    () => calculatePendingTotal(orders),
    [orders]
  )

  if (loading) return <Spinner />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <p className="text-muted-foreground">
          Pending: {formatCents(pendingTotal)}
        </p>
      </CardHeader>
      <CardContent>
        <OrdersList orders={displayOrders} onRefund={refund} />
      </CardContent>
    </Card>
  )
}
```

**Now each layer has one reason to change:**
- `api.ts` → auth strategy
- `orderService.ts` → endpoints
- `orderUtils.ts` → business rules
- `useOrders.ts` → data flow
- `OrderRow.tsx` → row design
- `OrdersDashboard.tsx` → page composition
