# Test Strategy

**Objetivo**: Prevenir regressions que hoy requirieron horas para debuggear. Tests automatizados en cada cambio.

## Principios

1. **Unit tests** cubren lógica de negocio aislada
2. **Integration tests** verifican flujos end-to-end (DB real)
3. **No mocks de BD**: Tests usan PostgreSQL real en Docker
4. **Cobertura mínima**: 70% en servicios críticos (Auth, Upload, Conferencia)
5. **Tests antes de merge**: Todas las PR deben pasar tests

## Backend (.NET)

### Structure

```
backend/
├── ConferenceManager.csproj    → Main project
├── ConferenceManager.Tests/     → Unit + Integration tests
│   ├── Unit/
│   │   ├── Auth/
│   │   ├── Files/
│   │   └── Conferencias/
│   ├── Integration/
│   │   └── Controllers/
│   └── Fixtures/
│       ├── DbContextFixture.cs     → Isolated test DB per test
│       └── TestDataBuilder.cs      → Helper para crear entidades
└── xunit.runner.json           → Config de tests
```

### Herramientas

- **xUnit**: Test framework
- **Moq**: Mocking (solo para servicios externos)
- **Respawn**: Limpiar DB entre tests
- **TestContainers**: PostgreSQL en Docker para tests

### Ejemplo: Unit test (AuthService)

```csharp
public class AuthServiceTests : IAsyncLifetime
{
    private readonly AppDbContext _context;
    private readonly AuthService _service;
    private readonly PostgreSqlContainer _dbContainer;

    public async Task InitializeAsync()
    {
        _dbContainer = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .Build();
        await _dbContainer.StartAsync();
        
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_dbContainer.GetConnectionString())
            .Options;
        _context = new AppDbContext(options);
        await _context.Database.MigrateAsync();
        
        _service = new AuthService(_context, ...);
    }

    [Fact]
    public async Task RegistrarAsync_WithValidEmail_CreatesUser()
    {
        // Arrange
        var dto = new RegistroRequest
        {
            Email = "test@example.com",
            Password = "SecurePass123!",
            Nombre = "Test User"
        };

        // Act
        var result = await _service.RegistrarAsync(dto);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("test@example.com", result.Data.Email);
        
        // Verify en DB
        var user = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == dto.Email);
        Assert.NotNull(user);
        Assert.True(BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash));
    }

    [Fact]
    public async Task RegistrarAsync_WithDuplicateEmail_ReturnsFail()
    {
        // Arrange
        var email = "duplicate@example.com";
        var existingUser = new Usuario 
        { 
            Email = email, 
            Nombre = "Existing",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass"),
            Organizacion = "Org"
        };
        _context.Usuarios.Add(existingUser);
        await _context.SaveChangesAsync();

        var dto = new RegistroRequest
        {
            Email = email,
            Password = "NewPass123!",
            Nombre = "New User"
        };

        // Act
        var result = await _service.RegistrarAsync(dto);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("EMAIL_ALREADY_EXISTS", result.ErrorCode);
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
        if (_dbContainer != null)
            await _dbContainer.StopAsync();
    }
}
```

### Ejemplo: Integration test (FilesController)

```csharp
public class FilesControllerTests : IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly AppDbContext _context;

    public async Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace BD con test DB
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    services.AddDbContext<AppDbContext>(options =>
                        options.UseNpgsql("Server=localhost;Database=test_conference;..."));
                });
            });

        _client = _factory.CreateClient();
        _context = _factory.Services.GetRequiredService<AppDbContext>();
        await _context.Database.MigrateAsync();
    }

    [Fact]
    public async Task Upload_WithValidImage_ReturnsOkWithUrl()
    {
        // Arrange: crear usuario autenticado
        var usuario = TestDataBuilder.CreateUsuario();
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var token = JwtTestHelper.GenerateToken(usuario.Id);
        _client.DefaultRequestHeaders.Authorization 
            = new AuthenticationHeaderValue("Bearer", token);

        var request = new { 
            base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
            contentType = "image/png"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/dashboard/upload", request);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var json = await response.Content.ReadAsAsync<dynamic>();
        Assert.NotNull(json.url);
        Assert.NotNull(json.id);
        
        // Verificar BD
        var imagen = await _context.ImagenesAlmacenadas
            .FirstOrDefaultAsync(i => i.Id.ToString() == json.id);
        Assert.NotNull(imagen);
        Assert.Equal("image/png", imagen.ContentType);
    }

    [Fact]
    public async Task Upload_WithoutToken_Returns401()
    {
        var request = new { base64 = "...", contentType = "image/png" };
        var response = await _client.PostAsJsonAsync("/api/dashboard/upload", request);
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        _factory?.Dispose();
    }
}
```

### Tests críticos a implementar

| Feature | Test | Por qué |
|---------|------|--------|
| **Auth** | Login con email/pass válido → token JWT | Hoy falló silenciosamente |
| **Auth** | Duplicated email → error específico | Edge case crítico |
| **Upload** | Base64 válido → guardado en imagenes_almacenadas | Hoy faltó tabla |
| **Upload** | Sin token → 401 | Seguridad |
| **Conferencia** | Crear + Update sin ambigüedad | Hoy colisionaron endpoints |
| **Conferencia** | Slug único por usuario | Integridad datos |
| **EF Core** | Migrations aplicadas en startup | Hoy saltaron migraciones |

## Admin (Angular)

### Structure

```
admin/src/
├── app/
│   ├── tests/
│   │   ├── auth.service.spec.ts
│   │   ├── conferencia.service.spec.ts
│   │   └── upload.service.spec.ts
│   └── services/
│       ├── auth.service.ts
│       ├── conferencia.service.ts
│       └── upload.service.ts
└── karma.conf.js
```

### Herramientas

- **Jasmine**: Test framework
- **Karma**: Test runner
- **HttpClientTestingModule**: Mock HTTP

### Ejemplo

```typescript
describe('ConferenciaService', () => {
  let service: ConferenciaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConferenciaService]
    });
    service = TestBed.inject(ConferenciaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should update conferencia without ambiguity', () => {
    const id = '2d98b897-e81a-4a84-a3e4-145f04fd8a21';
    const updateDto = { nombre: 'Updated Name' };

    service.updateConferencia(id, updateDto).subscribe();

    const req = httpMock.expectOne(`/api/dashboard/conferencias/${id}`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id, nombre: 'Updated Name' });
  });

  it('should handle upload 500 error gracefully', () => {
    service.uploadImage(base64).subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne('/api/dashboard/upload');
    req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});
```

## Next.js Site

### Herramientas

- **Jest**: Test framework
- **React Testing Library**: Component testing
- **MSW**: Mock Service Worker para API

### Ejemplo

```typescript
describe('CongresoPage', () => {
  it('renders conference details', async () => {
    const { getByText } = render(
      <CongresoPage params={{ slug: 'reactconf' }} />
    );
    
    await waitFor(() => {
      expect(getByText('ReactConf Argentina 2026')).toBeInTheDocument();
    });
  });
});
```

## Ejecutar todos los tests

### Desarrollo local

```bash
# Backend
cd backend && dotnet test --verbosity normal

# Admin
cd admin && npm test -- --watch=false

# Sitio
cd site && npm test
```

### CI/CD (GitHub Actions)

Agregar `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      - run: cd backend && dotnet test

  admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd admin && npm ci && npm test

  site:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd site && npm ci && npm test
```

## Checklist pre-merge

- [ ] Todos los tests pasan localmente
- [ ] Cobertura de nuevas funciones ≥ 70%
- [ ] No hay warnings en logs
- [ ] Migrations aplicadas correctamente
- [ ] BR no introduce breaking changes

## Roadmap

**Fase 1** (MVP): Unit tests backend (Auth, Upload)
**Fase 2**: Integration tests backend (Controllers)
**Fase 3**: Tests admin (Services, Components)
**Fase 4**: E2E tests (Cypress/Playwright)
