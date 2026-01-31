# Module 5: Refactor a Real Component End-to-End

**Goal:** A single capstone that makes the course feel legit.

---

## Lesson 1: Refactoring Step by Step

**Teaches:** Safe refactoring, incremental improvement, professional workflow

---

### Lesson Text (Display)

In this module we are going to refactor a real component the way you would on the job. We will not rewrite everything. We will make safe changes in small steps: extract logic, create hooks, add tests, and only then reorganize files.

---

### Voice Prompt (TTS)

In this module we are going to refactor a real component the way you would on the job. We will not rewrite everything. We will make safe changes in small steps. Extract logic, create hooks, add tests, and only then reorganize files.

---

### The Starting Point: One Ugly Component

```tsx
// Before: The "production" code someone wrote at 2am
export function CustomerOrders() {
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/customers?q=${debouncedSearch}`)
      .then(r => r.json())
      .then(setCustomers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [debouncedSearch])

  useEffect(() => {
    if (!selectedId) return
    setOrderLoading(true)
    fetch(`/api/customers/${selectedId}/orders`)
      .then(r => r.json())
      .then(setOrders)
      .finally(() => setOrderLoading(false))
  }, [selectedId])

  const sorted = [...customers].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const total = orders.reduce((s, o) => s + o.amount, 0)

  return (
    <div className="flex gap-4">
      <div className="w-1/3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full p-2 border rounded"
        />
        <div className="flex gap-2 my-2">
          <button onClick={() => setSortBy('name')}>Name</button>
          <button onClick={() => setSortBy('date')}>Date</button>
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <ul>
          {sorted.map(c => (
            <li
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={selectedId === c.id ? 'bg-blue-100' : ''}
            >
              {c.name} - {c.email}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-2/3">
        {selectedId ? (
          orderLoading ? (
            <p>Loading orders...</p>
          ) : (
            <div>
              <h2>Orders (Total: ${(total / 100).toFixed(2)})</h2>
              {orders.map(o => (
                <div key={o.id}>
                  {o.product} - ${(o.amount / 100).toFixed(2)}
                </div>
              ))}
            </div>
          )
        ) : (
          <p>Select a customer</p>
        )}
      </div>
    </div>
  )
}
```

---

### Refactor Checklist

#### Step 1: Extract the debounce hook (safe, no behavior change)

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
```

#### Step 2: Extract sort utility (pure function, now testable)

```tsx
// utils/sorting.ts
export function sortCustomers(
  customers: Customer[],
  sortBy: 'name' | 'date'
): Customer[] {
  return [...customers].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}
```

#### Step 3: Extract formatting utilities

```tsx
// utils/format.ts
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function calculateOrderTotal(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.amount, 0)
}
```

#### Step 4: Create useCustomers hook

```tsx
// hooks/useCustomers.ts
export function useCustomers(query: string) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    customerService.search(query, controller.signal)
      .then(setCustomers)
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [query])

  return { customers, loading, error }
}
```

#### Step 5: Create useCustomerOrders hook

```tsx
// hooks/useCustomerOrders.ts
export function useCustomerOrders(customerId: string | null) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customerId) {
      setOrders([])
      return
    }

    setLoading(true)
    customerService.getOrders(customerId)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [customerId])

  return { orders, loading }
}
```

#### Step 6: Create service layer

```tsx
// services/customerService.ts
export const customerService = {
  search: (query: string, signal?: AbortSignal) =>
    apiFetch<Customer[]>(`/customers?q=${query}`, { signal }),
    
  getOrders: (customerId: string) =>
    apiFetch<Order[]>(`/customers/${customerId}/orders`),
}
```

#### Step 7: Create presentational components

```tsx
// components/CustomerList.tsx
export function CustomerList({ customers, selectedId, onSelect, loading, error }: Props) {
  if (loading) return <Skeleton />
  if (error) return <ErrorMessage message={error} />
  
  return (
    <ul className="divide-y">
      {customers.map(c => (
        <CustomerRow
          key={c.id}
          customer={c}
          selected={c.id === selectedId}
          onClick={() => onSelect(c.id)}
        />
      ))}
    </ul>
  )
}

// components/OrdersPanel.tsx
export function OrdersPanel({ orders, loading }: Props) {
  if (loading) return <Skeleton />
  
  const total = calculateOrderTotal(orders)
  
  return (
    <div>
      <h2 className="text-lg font-semibold">
        Orders (Total: {formatCents(total)})
      </h2>
      <ul className="mt-4 space-y-2">
        {orders.map(o => (
          <OrderItem key={o.id} order={o} />
        ))}
      </ul>
    </div>
  )
}
```

---

### The Final Result

```tsx
// pages/CustomerOrders.tsx
export function CustomerOrders() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('name')

  const debouncedSearch = useDebouncedValue(search, 300)
  const { customers, loading, error } = useCustomers(debouncedSearch)
  const { orders, loading: ordersLoading } = useCustomerOrders(selectedId)

  const sortedCustomers = useMemo(
    () => sortCustomers(customers, sortBy),
    [customers, sortBy]
  )

  return (
    <div className="flex gap-6 p-6">
      <Card className="w-1/3">
        <CardHeader>
          <SearchInput value={search} onChange={setSearch} />
          <SortToggle value={sortBy} onChange={setSortBy} />
        </CardHeader>
        <CardContent>
          <CustomerList
            customers={sortedCustomers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={loading}
            error={error}
          />
        </CardContent>
      </Card>

      <Card className="w-2/3">
        <CardContent>
          {selectedId ? (
            <OrdersPanel orders={orders} loading={ordersLoading} />
          ) : (
            <EmptyState message="Select a customer to view orders" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### What We Achieved

| Before | After |
|--------|-------|
| 80 lines, 1 file | 5 files, each < 30 lines |
| 0% testable | 100% logic testable |
| 6 useState calls | 3 useState + 2 hooks |
| Inline fetch calls | Service layer |
| Mixed concerns | Clear boundaries |

---

### Tests Added

```tsx
// utils/__tests__/sorting.test.ts
describe('sortCustomers', () => {
  it('sorts by name alphabetically', () => {
    const result = sortCustomers([{ name: 'Zoe' }, { name: 'Amy' }], 'name')
    expect(result[0].name).toBe('Amy')
  })

  it('sorts by date descending', () => {
    const result = sortCustomers([
      { name: 'A', createdAt: '2024-01-01' },
      { name: 'B', createdAt: '2024-06-01' }
    ], 'date')
    expect(result[0].name).toBe('B')
  })
})

// hooks/__tests__/useCustomers.test.ts
describe('useCustomers', () => {
  it('fetches customers on query change', async () => {
    const { result } = renderHook(() => useCustomers('test'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.customers).toHaveLength(2)
  })

  it('handles errors gracefully', async () => {
    server.use(rest.get('/customers', (_, res, ctx) => res(ctx.status(500))))
    const { result } = renderHook(() => useCustomers('test'))
    await waitFor(() => expect(result.current.error).toBeTruthy())
  })
})
```
