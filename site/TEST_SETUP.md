# Next.js Site Tests Setup

## Installing Test Framework

```bash
cd site
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @types/jest ts-node
```

## Jest Configuration

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

## Jest Setup

Create `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

## Testing Strategy

### API Route Tests
Test server-side API routes with node test environment:
```typescript
import { GET } from '@/app/api/public/[slug]/route'

test('GET /api/public/[slug] returns conference', async () => {
  const response = await GET(
    new Request('http://localhost:3000/api/public/tech-conf'),
    { params: { slug: 'tech-conf' } }
  )
  expect(response.status).toBe(200)
})
```

### Component Tests
Test client components with React Testing Library:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import Home from '@/app/page'

test('Home loads and displays conference', async () => {
  render(<Home />)
  await waitFor(() => {
    expect(screen.getByText(/Cargando/)).not.toBeInTheDocument()
  })
})
```

### Utility Function Tests
Test helper functions:
```typescript
import { getSlug } from '@/lib/getSlug'

test('getSlug extracts subdomain', () => {
  Object.defineProperty(window, 'location', {
    value: { hostname: 'tech-conf.example.com' },
  })
  expect(getSlug()).toBe('tech-conf')
})
```

## Mock Fetch API

```typescript
import { MSW, server } from '@/lib/test/mswServer'
import { http, HttpResponse } from 'msw'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('fetches conference data', async () => {
  server.use(
    http.get('*/api/public/tech-conf', () => {
      return HttpResponse.json({
        id: '1',
        slug: 'tech-conf',
        nombre: 'Tech Conference'
      })
    })
  )
  render(<Home />)
  await waitFor(() => {
    expect(screen.getByText('Tech Conference')).toBeInTheDocument()
  })
})
```

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Single file
npm test -- app/page.test.tsx
```

## Package.json Scripts

Add to scripts:
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

## CI/CD Integration

GitHub Actions already configured in `.github/workflows/test.yml` runs backend tests. Add Next.js tests:

```yaml
- name: Run Next.js tests
  working-directory: ./site
  run: npm test -- --passWithNoTests
```

## Coverage Goals

- **API Routes:** 100% (business logic)
- **Utility Functions:** 90%+
- **Components:** 70%+ (focus on user flows)
- **Overall:** 65%+

## Test Files Structure

```
site/
├── app/
│   ├── page.test.tsx
│   ├── api/
│   │   └── public/
│   │       └── [slug]/
│   │           └── route.test.ts
├── lib/
│   ├── getSlug.test.ts
│   └── test/
│       ├── mswServer.ts
│       └── testUtils.ts
└── jest.config.ts
```

## Common Patterns

### Testing useEffect with API calls
```typescript
test('loads data on mount', async () => {
  render(<MyComponent />)
  await waitFor(() => {
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
  })
})
```

### Testing conditional rendering
```typescript
test('shows error when data not found', () => {
  server.use(
    http.get('*/api/public/*', () => HttpResponse.error())
  )
  render(<Home />)
  expect(screen.getByText(/no encontrado/i)).toBeInTheDocument()
})
```

### Testing Link navigation
```typescript
import Link from 'next/link'
test('renders navigation link', () => {
  render(<Link href="/programa">Ver programa</Link>)
  expect(screen.getByRole('link', { name: /programa/ })).toBeInTheDocument()
})
```

## Debugging Tests

Run with debug output:
```bash
npm test -- --verbose
```

Use debug() in tests:
```typescript
const { debug } = render(<Home />)
debug() // prints rendered HTML
```

## Next Steps

1. **Setup MSW (Mock Service Worker)** for API mocking
2. **Create test utilities** for common setup
3. **Add E2E tests** with Playwright for user journeys
4. **Coverage reporting** in CI/CD
5. **Performance tests** for page load times
