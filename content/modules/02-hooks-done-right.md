# Module 2: Hooks Done Right

**Goal:** Stop misusing hooks or shoving everything into effects.

---

## Lesson 1: Extracting Custom Hooks

**Teaches:** Custom hook patterns, stable APIs, component readability

---

### Lesson Text (Display)

A custom hook is shared logic with a stable API. When you extract a hook, you are not just moving code. You are creating an interface. The component should read like a story: inputs at the top, hooks next, derived data next, and UI last.

---

### Voice Prompt (TTS)

A custom hook is shared logic with a stable API. When you extract a hook, you are not just moving code. You are creating an interface. The component should read like a story: inputs at the top, hooks next, derived data next, and UI last.

---

### Bad Example

```tsx
export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [refunding, setRefunding] = useState<string | null>(null)

  // Debounce effect - unrelated to fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch effect - mixed concerns
  useEffect(() => {
    if (!debouncedQuery) return
    setLoading(true)
    setError(null)
    fetch(`/api/orders?q=${debouncedQuery}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(setOrders)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  // Refund handler with inline state management
  const handleRefund = async (id: string) => {
    setRefunding(id)
    try {
      await fetch(`/api/orders/${id}/refund`, { method: 'POST' })
      setOrders(prev => prev.filter(o => o.id !== id))
    } finally {
      setRefunding(null)
    }
  }

  // Expensive derivation on every render
  const filtered = orders
    .filter(o => o.status === 'pending')
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {filtered.map(o => (
        <div key={o.id}>
          <p>{o.customer.name}</p>
          <button 
            disabled={refunding === o.id}
            onClick={() => handleRefund(o.id)}
          >
            {refunding === o.id ? 'Refunding...' : 'Refund'}
          </button>
        </div>
      ))}
    </div>
  )
}
```

**Problems:**
- Multiple unrelated effects tangled together
- Debounce logic mixed with component
- Refund mutation inline
- Expensive derivation runs every render
- Hard to test any piece in isolation

---

### Good Example

```tsx
// hooks/useDebouncedValue.ts
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// hooks/useOrders.ts
export function useOrders(query: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) {
      setOrders([])
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchOrders(query, controller.signal)
      .then(setOrders)
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [query])

  return { orders, loading, error, setOrders }
}

// hooks/useRefund.ts
export function useRefund(onSuccess: (id: string) => void) {
  const [refundingId, setRefundingId] = useState<string | null>(null)

  const refund = async (id: string) => {
    setRefundingId(id)
    try {
      await refundOrder(id)
      onSuccess(id)
    } finally {
      setRefundingId(null)
    }
  }

  return { refund, refundingId }
}

// pages/OrdersPage.tsx
export function OrdersPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const { orders, loading, error, setOrders } = useOrders(debouncedQuery)
  
  const { refund, refundingId } = useRefund((id) => {
    setOrders(prev => prev.filter(o => o.id !== id))
  })

  // Memoize expensive derivation
  const pendingOrders = useMemo(
    () => orders.filter(o => o.status === 'pending').sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  )

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} />
      <OrdersList 
        orders={pendingOrders}
        loading={loading}
        error={error}
        refundingId={refundingId}
        onRefund={refund}
      />
    </div>
  )
}
```

**Improvements:**
- `useDebouncedValue` - reusable utility hook
- `useOrders` - encapsulates fetch logic with abort
- `useRefund` - mutation hook with loading state
- `useMemo` for expensive derivations
- Component reads like a story
