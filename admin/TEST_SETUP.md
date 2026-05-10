# Angular Admin Tests Setup

## Running Tests

```bash
cd admin
npm test
```

Or with coverage:

```bash
npm test -- --code-coverage
```

## Test Files

### Service Tests
- **auth.service.spec.ts** (14 tests)
  - Login flow with token storage
  - Registration request
  - Logout and session clearing
  - Token refresh
  - Authentication signal computation

- **congreso.service.spec.ts** (7 tests)
  - List congresses
  - Get congress by ID
  - Create congress
  - Update congress
  - Delete congress
  - Publish congress
  - Finalize congress

## Testing Utilities

### HttpClientTestingModule
Used for mocking HTTP calls in service tests:
```typescript
TestBed.configureTestingModule({
  imports: [HttpClientTestingModule],
  providers: [AuthService]
});
```

### Mock Data
Tests use realistic mock data matching API response DTOs:
- AuthResponseDto with accessToken, refreshToken, usuario
- CongresoListItemDto arrays for list operations

## Coverage Goals

- **Services:** 100% (HTTP calls, signals, state management)
- **Components:** 80% (UI logic, event handlers)
- **Guards:** 100% (auth routes)
- **Overall:** 75%+

## Component Test Setup

For OnPush components with signals:
```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [ComponentName],
    providers: [
      { provide: CongresoService, useValue: mockService }
    ]
  }).compileComponents();
});

it('should render title', () => {
  const fixture = TestBed.createComponent(ComponentName);
  fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('h2')).toBeTruthy();
});
```

## Mocking Services

For service dependencies, create mocks:
```typescript
const mockCongresoService = {
  getMisCongresos: jasmine.createSpy().and.returnValue(of([...])),
  getById: jasmine.createSpy().and.returnValue(of(...))
};
```

## Running Specific Tests

```bash
# Single file
npm test -- --include='**/auth.service.spec.ts'

# Pattern match
npm test -- --include='**/*service.spec.ts'

# Watch mode
npm test -- --watch
```

## CI/CD Integration

Tests run automatically on:
- Push to main/develop
- Pull requests
- Pre-commit hooks (if configured)

## Next Steps

1. **Component Tests:** Add tests for congreso-form, congreso-overview
2. **E2E Tests:** Setup Cypress/Playwright for user flows
3. **Coverage Reports:** Configure code coverage thresholds
4. **Performance:** Add benchmarks for slow operations
