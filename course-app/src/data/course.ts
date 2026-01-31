import { Course } from '../types'

export const course: Course = {
  title: 'React Patterns That Scale',
  description: 'Five modules to level up your React architecture',
  modules: [
    {
      id: 'module-1',
      title: 'Component Hygiene',
      description: 'Stop dumping everything in one component',
      lessons: [
        {
          id: 'lesson-1-1',
          title: 'The "God Component" Problem',
          text: `A common React anti-pattern is the God Component. This is when a single component handles fetching, state, formatting, event logic, conditional rendering, and UI layout all at once. It works, but it becomes impossible to maintain.

The goal is not to write less code. The goal is to put code in the right place so each piece has a single job.`,
          voicePrompt: `A common React anti-pattern is the God Component. This is when a single component handles fetching, state, formatting, event logic, conditional rendering, and UI layout all at once. It works, but it becomes impossible to maintain. The goal is not to write less code. The goal is to put code in the right place so each piece has a single job.`,
          badCode: `export function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(\`/api/orders?q=\${query}\`)
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
          <button onClick={() => alert(\`Refund \${o.id}\`)}>Refund</button>
        </div>
      ))}
    </div>
  )
}`,
          goodCode: `// hooks/useOrders.ts
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

// pages/OrdersPage.tsx
export function OrdersPage() {
  const [query, setQuery] = useState('')
  const { orders, loading } = useOrders(query)
  const total = calculateTotal(orders)

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
}`,
          refactorSteps: [
            'Extract useOrders hook for data fetching',
            'Create calculateTotal utility function',
            'Build OrderRow component for list items',
            'Move refundOrder to service layer',
          ],
        },
      ],
    },
    {
      id: 'module-2',
      title: 'Hooks Done Right',
      description: 'Stop misusing hooks or shoving everything into effects',
      lessons: [
        {
          id: 'lesson-2-1',
          title: 'Extracting Custom Hooks',
          text: `A custom hook is shared logic with a stable API. When you extract a hook, you are not just moving code. You are creating an interface.

The component should read like a story: inputs at the top, hooks next, derived data next, and UI last.`,
          voicePrompt: `A custom hook is shared logic with a stable API. When you extract a hook, you are not just moving code. You are creating an interface. The component should read like a story: inputs at the top, hooks next, derived data next, and UI last.`,
          badCode: `export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

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
    fetch(\`/api/orders?q=\${debouncedQuery}\`)
      .then(r => r.json())
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  // Expensive derivation on every render
  const filtered = orders
    .filter(o => o.status === 'pending')
    .sort((a, b) => b.createdAt - a.createdAt)

  return <div>{/* ... */}</div>
}`,
          goodCode: `// hooks/useDebouncedValue.ts
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

  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    setLoading(true)

    fetchOrders(query, controller.signal)
      .then(setOrders)
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [query])

  return { orders, loading }
}

// pages/OrdersPage.tsx
export function OrdersPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const { orders, loading } = useOrders(debouncedQuery)

  const pendingOrders = useMemo(
    () => orders.filter(o => o.status === 'pending'),
    [orders]
  )

  return <div>{/* ... */}</div>
}`,
          refactorSteps: [
            'Create useDebouncedValue as a reusable hook',
            'Extract useOrders with AbortController',
            'Add useMemo for expensive derivations',
            'Component now reads like a story',
          ],
        },
      ],
    },
    {
      id: 'module-3',
      title: 'Pure Functions',
      description: 'Move business logic out of React so you can test it easily',
      lessons: [
        {
          id: 'lesson-3-1',
          title: 'Derivations Belong Outside',
          text: `If you cannot unit test your logic without rendering a component, that is a smell. React components should orchestrate and render. The logic should live in pure functions.

Pure functions are predictable, testable, and reusable.`,
          voicePrompt: `If you cannot unit test your logic without rendering a component, that is a smell. React components should orchestrate and render. The logic should live in pure functions. Pure functions are predictable, testable, and reusable.`,
          badCode: `export function OrdersTable({ orders, query }: Props) {
  // Business logic mixed into render
  const filtered = orders
    .filter(o => o.customer.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .map(o => ({
      ...o,
      displayTotal: \`$\${(o.amount / 100).toFixed(2)}\`,
      statusLabel: o.status === 'pending' ? 'Awaiting' : 'Done'
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
          <td>{o.displayTotal}</td>
          <button disabled={!canRefund(o)}>Refund</button>
        </tr>
      ))}
    </table>
  )
}`,
          goodCode: `// utils/orderFilters.ts
export function filterSortAndMapOrders(orders: Order[], query: string) {
  const q = query.trim().toLowerCase()
  return orders
    .filter(o => o.customerName.toLowerCase().includes(q))
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .map(o => ({ ...o, displayTotal: formatCents(o.amountCents) }))
}

// utils/orderRules.ts
const REFUND_WINDOW_DAYS = 30

export function canRefundOrder(order: Order): boolean {
  if (order.status === 'refunded') return false
  if (order.amountCents <= 0) return false
  const daysSince = (Date.now() - order.createdAtMs) / 86400000
  return daysSince < REFUND_WINDOW_DAYS
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
}`,
          tests: `import { describe, it, expect } from 'vitest'
import { filterSortAndMapOrders } from './orderFilters'
import { canRefundOrder } from './orderRules'

it('filters by customer name case-insensitive', () => {
  const result = filterSortAndMapOrders(
    [{ customerName: 'Kenny', createdAtMs: 1, amountCents: 1000 }],
    'ken'
  )
  expect(result).toHaveLength(1)
})

it('returns false for already refunded', () => {
  expect(canRefundOrder({ 
    status: 'refunded', 
    amountCents: 100, 
    createdAtMs: Date.now() 
  })).toBe(false)
})`,
        },
      ],
    },
    {
      id: 'module-4',
      title: 'SRP & Separation',
      description: 'One reason to change in React land',
      lessons: [
        {
          id: 'lesson-4-1',
          title: 'Single Responsibility in Practice',
          text: `SRP does not mean tiny files everywhere. It means each unit has one reason to change.

In a React app, the most common reasons for change are UI changes, data changes, and business rules changes. When those are tangled together, everything breaks at once.`,
          voicePrompt: `S R P does not mean tiny files everywhere. It means each unit has one reason to change. In a React app, the most common reasons for change are UI changes, data changes, and business rules changes. When those are tangled together, everything breaks at once.`,
          badCode: `// Everything in one file, one component
export function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    // API call inline
    fetch('/api/orders', {
      headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
    })
      .then(r => r.json())
      .then(data => {
        // Data transformation inline
        const mapped = data.map((o: any) => ({
          ...o,
          total: \`$\${(o.amount / 100).toFixed(2)}\`
        }))
        setOrders(mapped)
      })
  }, [])

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {orders.map(o => (
        <li key={o.id} onClick={async () => {
          await fetch(\`/api/orders/\${o.id}/refund\`, { method: 'POST' })
          setOrders(prev => prev.filter(x => x.id !== o.id))
        }}>
          {o.total}
        </li>
      ))}
    </div>
  )
}`,
          goodCode: `// services/api.ts - Changes when: auth, headers
export async function apiFetch<T>(path: string): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(\`\${API_BASE}\${path}\`, {
    headers: { Authorization: \`Bearer \${token}\` }
  })
  return res.json()
}

// services/orderService.ts - Changes when: endpoints
export const orderService = {
  getAll: () => apiFetch<Order[]>('/orders'),
  refund: (id: string) => apiFetch<void>(\`/orders/\${id}/refund\`)
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

// components/OrderRow.tsx - Changes when: row design
export function OrderRow({ order, onRefund }: Props) {
  return <li onClick={onRefund}>{order.total}</li>
}

// pages/OrdersDashboard.tsx - Changes when: composition
export function OrdersDashboard() {
  const { orders, refund } = useOrders()
  return orders.map(o => <OrderRow key={o.id} order={o} onRefund={() => refund(o.id)} />)
}`,
          refactorSteps: [
            'Extract apiFetch for auth handling',
            'Create orderService for API endpoints',
            'Build useOrders hook for data flow',
            'Separate OrderRow for UI concerns',
            'Dashboard only handles composition',
          ],
        },
      ],
    },
    {
      id: 'module-5',
      title: 'Refactor Capstone',
      description: 'End-to-end refactor of a real component',
      lessons: [
        {
          id: 'lesson-5-1',
          title: 'Refactoring Step by Step',
          text: `In this module we are going to refactor a real component the way you would on the job.

We will not rewrite everything. We will make safe changes in small steps: extract logic, create hooks, add tests, and only then reorganize files.`,
          voicePrompt: `In this module we are going to refactor a real component the way you would on the job. We will not rewrite everything. We will make safe changes in small steps. Extract logic, create hooks, add tests, and only then reorganize files.`,
          badCode: `export function CustomerOrders() {
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    fetch(\`/api/customers?q=\${debouncedSearch}\`)
      .then(r => r.json())
      .then(setCustomers)
  }, [debouncedSearch])

  useEffect(() => {
    if (!selectedId) return
    fetch(\`/api/customers/\${selectedId}/orders\`)
      .then(r => r.json())
      .then(setOrders)
  }, [selectedId])

  const total = orders.reduce((s, o) => s + o.amount, 0)

  return (
    <div className="flex gap-4">
      <div className="w-1/3">
        <input value={search} onChange={e => setSearch(e.target.value)} />
        <ul>
          {customers.map(c => (
            <li key={c.id} onClick={() => setSelectedId(c.id)}>
              {c.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-2/3">
        <h2>Total: $\${(total / 100).toFixed(2)}</h2>
        {orders.map(o => <div key={o.id}>{o.product}</div>)}
      </div>
    </div>
  )
}`,
          goodCode: `// After refactoring step by step

// hooks/useDebouncedValue.ts
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// hooks/useCustomers.ts
export function useCustomers(query: string) {
  const [customers, setCustomers] = useState<Customer[]>([])
  useEffect(() => {
    customerService.search(query).then(setCustomers)
  }, [query])
  return { customers }
}

// hooks/useCustomerOrders.ts
export function useCustomerOrders(customerId: string | null) {
  const [orders, setOrders] = useState<Order[]>([])
  useEffect(() => {
    if (!customerId) return setOrders([])
    customerService.getOrders(customerId).then(setOrders)
  }, [customerId])
  return { orders }
}

// pages/CustomerOrders.tsx
export function CustomerOrders() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 300)
  const { customers } = useCustomers(debouncedSearch)
  const { orders } = useCustomerOrders(selectedId)

  return (
    <div className="flex gap-6">
      <CustomerList 
        customers={customers}
        selectedId={selectedId}
        onSelect={setSelectedId}
        search={search}
        onSearchChange={setSearch}
      />
      <OrdersPanel orders={orders} />
    </div>
  )
}`,
          refactorSteps: [
            'Step 1: Extract useDebouncedValue hook',
            'Step 2: Extract useCustomers hook',
            'Step 3: Extract useCustomerOrders hook',
            'Step 4: Create CustomerList component',
            'Step 5: Create OrdersPanel component',
            'Step 6: Add service layer for API calls',
            'Step 7: Add tests for pure functions',
          ],
          tests: `describe('CustomerOrders refactor', () => {
  it('debounces search input', async () => {
    const { result } = renderHook(() => useDebouncedValue('test', 300))
    expect(result.current).toBe('test')
  })

  it('fetches customers on query change', async () => {
    const { result } = renderHook(() => useCustomers('test'))
    await waitFor(() => expect(result.current.customers).toHaveLength(2))
  })

  it('fetches orders when customer selected', async () => {
    const { result } = renderHook(() => useCustomerOrders('customer-1'))
    await waitFor(() => expect(result.current.orders).toHaveLength(3))
  })
})`,
        },
      ],
    },
  ],
}
