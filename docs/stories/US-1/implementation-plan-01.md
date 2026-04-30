# Implementation Plan 01 — US-1: Registro y login de organizadores

**Date:** 2026-04-26
**Author:** Developer
**Technical plan:** [technical-plan.md](./technical-plan.md)
**Approach:** Layered service pattern con ServiceResult<T>

---

## Branch

- **Base:** main
- **Name:** feature/US-1-auth-organizadores

---

## Proposed changes

### Step 1: Scaffolding backend (.NET Core 8 WebAPI)

- **File:** `backend/ConferenceManager.Api.csproj`
- **Action:** Create
- **What changes:** Generado por `dotnet new webapi -n ConferenceManager.Api -o backend/ --no-openapi`. Agregar referencias NuGet: `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `BCrypt.Net-Next`. Eliminar el controlador `WeatherForecastController` y la clase `WeatherForecast` que genera la plantilla por defecto.

- **File:** `backend/appsettings.json`
- **Action:** Modify
- **What changes:** Definir tres secciones de configuración: `Jwt` con claves `Issuer`, `Audience` y `SecretKey` (el valor de `SecretKey` debe ser una cadena vacía o placeholder que indique que proviene de variable de entorno — nunca un valor real); `ConnectionStrings` con clave `DefaultConnection` como cadena vacía/placeholder; `Resend` con claves `ApiKey` (placeholder) y `FromAddress`; `Cors` con clave `AllowedOrigins` como array vacío o con placeholder. Agregar la sección `Email` con clave `UseFake: false`.

- **File:** `backend/appsettings.Development.json`
- **Action:** Modify
- **What changes:** Sobreescribir los valores para entorno local: `ConnectionStrings:DefaultConnection` apunta a PostgreSQL local (usuario, contraseña y nombre de BD de desarrollo); `Cors:AllowedOrigins` incluye `http://localhost:4200`; `Email:UseFake: true`; `Resend:FromAddress` con `onboarding@resend.dev`. La clave `Jwt:SecretKey` debe setearse vía `dotnet user-secrets` y no aparecer en este archivo.

- **File:** `backend/.gitignore`
- **Action:** Create
- **What changes:** Plantilla estándar de .NET (generada automáticamente) complementada con entradas para excluir `*.user`, `appsettings.*.local.json` y la carpeta `secrets/`.

- **Files:** `backend/Controllers/.gitkeep`, `backend/Models/.gitkeep`, `backend/Data/.gitkeep`, `backend/Services/.gitkeep`, `backend/DTOs/.gitkeep`
- **Action:** Create
- **What changes:** Archivos vacíos para forzar el tracking de las carpetas en git. Cada carpeta tiene responsabilidad exclusiva: `Controllers/` solo enruta y valida entrada, `Models/` solo define entidades EF Core, `Data/` aloja `AppDbContext` y migraciones, `Services/` aloja interfaces e implementaciones de negocio, `DTOs/` aloja records de request/response.

- **File:** `backend/Program.cs`
- **Action:** Modify
- **What changes:** Configurar pipeline mínimo sin la ruta de ejemplo: `UseHttpsRedirection`, política CORS nombrada `AllowAdminClient` (orígenes leídos desde `Cors:AllowedOrigins` en config), `UseAuthentication`, `UseAuthorization`, `MapControllers`. Agregar placeholder `GET /api/health` que retorna `200 OK` con `{ "status": "ok" }` — sin `[Authorize]`. El registro de servicios de autenticación y DI se completa en Step 8.

---

### Step 2: Modelos Usuario y RefreshToken + AppDbContext + configuración Fluent API

- **File:** `backend/Models/Usuario.cs`
- **Action:** Create
- **What changes:** Clase POCO sin lógica de aplicación. Propiedades: `Id` (`Guid`), `Email` (`string`), `PasswordHash` (`string`), `Nombre` (`string`), `Organizacion` (`string`), `EmailVerificado` (`bool`), `VerificationToken` (`string?`), `VerificationTokenExpiresAt` (`DateTime?`), `CreatedAt` (`DateTime`). Propiedad de navegación: `ICollection<RefreshToken> RefreshTokens`. No se agrega ningún Data Annotation en el modelo — toda la configuración de columnas, constraints e índices se delega a Fluent API.

- **File:** `backend/Models/RefreshToken.cs`
- **Action:** Create
- **What changes:** Clase POCO. Propiedades: `Id` (`Guid`), `UsuarioId` (`Guid`), `TokenHash` (`string`), `ExpiresAt` (`DateTime`), `Revoked` (`bool`). Propiedad de navegación: `Usuario Usuario`.

- **File:** `backend/Data/AppDbContext.cs`
- **Action:** Create
- **What changes:** Clase `AppDbContext : DbContext`. Propiedades `DbSet<Usuario> Usuarios` y `DbSet<RefreshToken> RefreshTokens`. En `OnModelCreating`, llamar `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())` para descubrir automáticamente todos los `IEntityTypeConfiguration<T>`. Sobreescribir `SaveChangesAsync` para garantizar que `CreatedAt` se establece en `DateTime.UtcNow` en entidades nuevas de tipo `Usuario` antes de persistir (via `ChangeTracker.Entries`).

- **File:** `backend/Data/Configurations/UsuarioConfiguration.cs`
- **Action:** Create
- **What changes:** Clase `UsuarioConfiguration : IEntityTypeConfiguration<Usuario>`. Configurar: tabla `usuarios`; `Id` como PK con `HasDefaultValueSql("gen_random_uuid()")`; `Email` como `varchar(254)` requerido; índice único sobre `Email` con `HasIndex(u => u.Email).IsUnique()`; índice simple sobre `VerificationToken` para las búsquedas de verificación con `HasIndex(u => u.VerificationToken)`; `PasswordHash` como `text` requerido; `Nombre` como `varchar(200)` requerido; `Organizacion` como `varchar(200)` requerido; `EmailVerificado` con `HasDefaultValue(false)`; `VerificationToken` como `varchar(32)` nullable; `VerificationTokenExpiresAt` como `timestamptz` nullable; `CreatedAt` como `timestamptz` con `HasDefaultValueSql("NOW()")` y `ValueGeneratedOnAdd()` para que EF no intente actualizarlo.

- **File:** `backend/Data/Configurations/RefreshTokenConfiguration.cs`
- **Action:** Create
- **What changes:** Clase `RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>`. Configurar: tabla `refresh_tokens`; `Id` con `HasDefaultValueSql("gen_random_uuid()")`; `TokenHash` como `varchar(64)` requerido; índice simple sobre `TokenHash`; índice compuesto sobre `(UsuarioId, Revoked)` para queries de cleanup futuras; `ExpiresAt` como `timestamptz` requerido; `Revoked` con `HasDefaultValue(false)`; FK `UsuarioId` con `HasForeignKey<RefreshToken>(rt => rt.UsuarioId)` y `OnDelete(DeleteBehavior.Cascade)`.

---

### Step 3: Primera migración EF Core + índices

- **File:** `backend/Data/Migrations/` (generado por tooling)
- **Action:** Create
- **What changes:** Ejecutar `dotnet ef migrations add InitialCreate --output-dir Data/Migrations`. Revisar manualmente el snapshot generado y verificar: tabla `usuarios` con columna `id uuid DEFAULT gen_random_uuid()`, columna `email varchar(254)` con índice único, columnas `DateTime` generadas como `timestamp with time zone` (requiere que Npgsql no tenga `EnableLegacyTimestampBehavior`); tabla `refresh_tokens` con FK `usuario_id uuid` con cascade delete, índice simple en `token_hash`, índice compuesto `(usuario_id, revoked)`. Documentar en `backend/README.md` (archivo nuevo, mínimo) la convención de nombres de migración y la prohibición de squash en producción.

---

### Step 4: JwtService (generación access token + refresh token + hashing SHA-256)

- **File:** `backend/Services/IJwtService.cs`
- **Action:** Create
- **What changes:** Interfaz pública con tres métodos: `string GenerateAccessToken(Usuario usuario)`, `string GenerateRefreshTokenRaw()`, `string HashRefreshToken(string rawToken)`. Sin dependencias concretas en la interfaz.

- **File:** `backend/Services/JwtService.cs`
- **Action:** Create
- **What changes:** Clase `JwtService : IJwtService`. Constructor inyecta `IConfiguration`. `GenerateAccessToken` construye un `JwtSecurityToken` con: `Issuer` y `Audience` leídos desde `Jwt:Issuer` y `Jwt:Audience`; claims `new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString())`, `new Claim(JwtRegisteredClaimNames.Email, usuario.Email)`, `new Claim("name", usuario.Nombre)`; firma `HmacSha256` con clave leída desde `Jwt:SecretKey`; expiración `DateTime.UtcNow.AddMinutes(15)`. Retorna el token serializado con `JwtSecurityTokenHandler.WriteToken`. `GenerateRefreshTokenRaw` usa `RandomNumberGenerator.GetBytes(64)` y convierte a base64 con `Convert.ToBase64String` — nunca usa `Guid.NewGuid()`. `HashRefreshToken` usa `SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))` y formatea el resultado como hex string en minúsculas con `BitConverter.ToString(...).Replace("-", "").ToLowerInvariant()`.

---

### Step 5: ResendEmailService (HttpClient directo, fake para Development)

- **File:** `backend/Services/IEmailService.cs`
- **Action:** Create
- **What changes:** Interfaz con un único método: `Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl)`. Sin métodos adicionales en US-1.

- **File:** `backend/Services/ResendEmailService.cs`
- **Action:** Create
- **What changes:** Clase `ResendEmailService : IEmailService`. Constructor inyecta `IHttpClientFactory` e `IConfiguration`. `SendVerificationEmailAsync` construye un objeto anónimo serializable con las propiedades `from`, `to` (array de strings), `subject` y `html`. El campo `from` lee `Resend:FromAddress` desde config. El campo `html` es una cadena con template inline mínimo que incluye el nombre del destinatario y el enlace `verificationUrl` como `<a>`. Serializa con `JsonSerializer.Serialize` (`System.Text.Json`) y hace POST a `https://api.resend.com/emails` con el header `Authorization: Bearer {apiKey}` (leído desde `Resend:ApiKey`). Si `response.IsSuccessStatusCode` es false, loguea el status code y el body de error con `ILogger<ResendEmailService>` y lanza `EmailDeliveryException` (clase propia en `Services/`) con el mensaje de error. Registrar el cliente nombrado con `AddHttpClient("ResendClient")` en Program.cs.

- **File:** `backend/Services/FakeEmailService.cs`
- **Action:** Create
- **What changes:** Clase `FakeEmailService : IEmailService`. Constructor inyecta `ILogger<FakeEmailService>`. `SendVerificationEmailAsync` loguea con nivel `Information` el email destinatario y la URL de verificación completa. No hace ningún request HTTP. Útil solo en Development — el registro condicional se configura en Step 8.

- **File:** `backend/Services/EmailDeliveryException.cs`
- **Action:** Create
- **What changes:** Clase de excepción `EmailDeliveryException : Exception` con constructor que acepta `string message` y opcionalmente `Exception? innerException`. No agrega propiedades adicionales en US-1.

---

### Step 6: AuthService (ServiceResult\<T\>, lógica de negocio sin excepciones)

- **File:** `backend/Services/ServiceResult.cs`
- **Action:** Create
- **What changes:** Dos tipos relacionados. `ServiceResult` (no genérico): propiedades `bool Success`, `string? ErrorCode`, `string? ErrorMessage`. Métodos de fábrica estáticos: `ServiceResult.Ok()` y `ServiceResult.Fail(string errorCode, string? errorMessage = null)`. `ServiceResult<T>` hereda de `ServiceResult` y agrega `T? Data`. Métodos de fábrica: `ServiceResult<T>.Ok(T data)` y `ServiceResult<T>.Fail(string errorCode, string? errorMessage = null)`. Las constantes de error code se definen como `public static class AuthErrorCodes` dentro del mismo archivo o en un archivo separado `Services/AuthErrorCodes.cs`: `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `REFRESH_TOKEN_INVALID`.

- **File:** `backend/DTOs/Auth/RegistroRequest.cs`
- **Action:** Create
- **What changes:** `record RegistroRequest` con propiedades: `Email` con `[Required, EmailAddress, MaxLength(254)]`; `Password` con `[Required, MinLength(8)]` (la validación del dígito se hace en el servicio con `Regex.IsMatch(dto.Password, @"\d")`); `Nombre` con `[Required, MaxLength(200)]`; `Organizacion` con `[Required, MaxLength(200)]`.

- **File:** `backend/DTOs/Auth/LoginRequest.cs`
- **Action:** Create
- **What changes:** `record LoginRequest` con `Email` (`[Required, EmailAddress]`) y `Password` (`[Required]`).

- **File:** `backend/DTOs/Auth/LoginResponse.cs`
- **Action:** Create
- **What changes:** `record LoginResponse` con `string AccessToken`, `string RefreshToken`, `int ExpiresIn` (valor siempre 900).

- **File:** `backend/DTOs/Auth/RefreshRequest.cs`
- **Action:** Create
- **What changes:** `record RefreshRequest` con `RefreshToken` (`[Required]`).

- **File:** `backend/DTOs/Auth/RefreshResponse.cs`
- **Action:** Create
- **What changes:** `record RefreshResponse` con la misma estructura que `LoginResponse`: `string AccessToken`, `string RefreshToken`, `int ExpiresIn`.

- **File:** `backend/DTOs/Auth/ReenviarVerificacionRequest.cs`
- **Action:** Create
- **What changes:** `record ReenviarVerificacionRequest` con `Email` (`[Required, EmailAddress]`).

- **File:** `backend/Services/IAuthService.cs`
- **Action:** Create
- **What changes:** Interfaz con cinco métodos: `Task<ServiceResult> RegistrarAsync(RegistroRequest dto)`, `Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest dto)`, `Task<ServiceResult<LoginResponse>> RefreshAsync(string refreshTokenRaw)`, `Task<ServiceResult> VerificarEmailAsync(string token)`, `Task<ServiceResult> ReenviarVerificacionAsync(string email)`.

- **File:** `backend/Services/AuthService.cs`
- **Action:** Create
- **What changes:** Clase `AuthService : IAuthService`. Constructor inyecta `AppDbContext`, `IJwtService`, `IEmailService`, `IConfiguration`, `ILogger<AuthService>`.

  `RegistrarAsync`: (1) query `AsNoTracking` sobre `Usuarios` para verificar unicidad de email; si existe retorna `ServiceResult.Fail(AuthErrorCodes.EMAIL_ALREADY_EXISTS)`; (2) valida que `dto.Password` matchea `\d` con `Regex.IsMatch`, si falla retorna `ServiceResult.Fail` con mensaje descriptivo; (3) hashea con `BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12)`; (4) genera `VerificationToken = Guid.NewGuid().ToString("N")` (32 chars hex sin guiones); (5) crea entidad `Usuario` con `EmailVerificado = false`, `VerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24)`; (6) `await context.SaveChangesAsync()`; (7) construye `verificationUrl = $"{baseUrl}/api/auth/verificar-email?token={token}"` (baseUrl desde `IConfiguration`); (8) llama `await emailService.SendVerificationEmailAsync(...)`; (9) retorna `ServiceResult.Ok()`.

  `LoginAsync`: (1) busca usuario por email con `AsNoTracking`; (2) si no existe, ejecuta `BCrypt.Net.BCrypt.HashPassword("dummy_timing_safe")` y retorna `ServiceResult.Fail(AuthErrorCodes.INVALID_CREDENTIALS)` — esto consume tiempo similar para prevenir user enumeration por timing; (3) si `EmailVerificado == false` retorna `ServiceResult.Fail(AuthErrorCodes.EMAIL_NOT_VERIFIED)`; (4) verifica password con `BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash)`; si falla retorna `ServiceResult.Fail(AuthErrorCodes.INVALID_CREDENTIALS)`; (5) genera access token y refresh token raw; (6) persiste entidad `RefreshToken` con `TokenHash`, `ExpiresAt = DateTime.UtcNow.AddDays(7)`, `Revoked = false`; (7) retorna `ServiceResult<LoginResponse>.Ok(new LoginResponse {...})`.

  `VerificarEmailAsync`: (1) busca usuario donde `VerificationToken == token` (query exacta, no `AsNoTracking` porque se va a modificar); (2) si null retorna `TOKEN_INVALID`; (3) si `VerificationTokenExpiresAt < DateTime.UtcNow` retorna `TOKEN_EXPIRED`; (4) setea `EmailVerificado = true`, `VerificationToken = null`, `VerificationTokenExpiresAt = null`; (5) `SaveChangesAsync`; (6) `ServiceResult.Ok()`.

  `ReenviarVerificacionAsync`: (1) busca usuario por email; (2) si null o `EmailVerificado == true` retorna `ServiceResult.Ok()` sin revelar información; (3) genera nuevo token y nueva expiración (24h), sobrescribe los anteriores; (4) `SaveChangesAsync`; (5) llama `SendVerificationEmailAsync`; (6) `ServiceResult.Ok()`.

  `RefreshAsync`: (1) hashea el raw token con `IJwtService.HashRefreshToken`; (2) busca en `RefreshTokens` (con `Include(rt => rt.Usuario)`) donde `TokenHash == hash && Revoked == false && ExpiresAt > DateTime.UtcNow`; (3) si null retorna `REFRESH_TOKEN_INVALID`; (4) marca el token actual `Revoked = true`; (5) genera nuevo raw token, persiste nuevo `RefreshToken`; (6) genera nuevo access token para `refreshTokenEntity.Usuario`; (7) `SaveChangesAsync`; (8) retorna `LoginResponse`.

---

### Step 7: AuthController (5 endpoints, mapeo ServiceResult → HTTP status codes)

- **File:** `backend/Controllers/AuthController.cs`
- **Action:** Create
- **What changes:** Clase `AuthController : ControllerBase` con atributos `[Route("api/auth")]`, `[ApiController]`, `[AllowAnonymous]`. Constructor inyecta `IAuthService`. Sin lógica de negocio — solo traduce DTOs a llamadas de servicio y mapea `ServiceResult` a `IActionResult`.

  `POST /api/auth/registro` (`[HttpPost("registro")]`): recibe `[FromBody] RegistroRequest dto`. Si `ServiceResult.Success` retorna `StatusCode(201, new { message = "..." })`; si `ErrorCode == EMAIL_ALREADY_EXISTS` retorna `Conflict(new { error = "EMAIL_ALREADY_EXISTS", message = "..." })`; si otro error de validación retorna `BadRequest(new { errors = new { password = new[] { result.ErrorMessage } } })`; errores inesperados retornan `StatusCode(500)`.

  `GET /api/auth/verificar-email` (`[HttpGet("verificar-email")]`): recibe `[FromQuery] string token`. Llama `VerificarEmailAsync(token)`. Si ok retorna `Ok(new { message = "..." })`; si `TOKEN_INVALID` o `TOKEN_EXPIRED` retorna `BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage })`.

  `POST /api/auth/reenviar-verificacion` (`[HttpPost("reenviar-verificacion")]`): recibe `[FromBody] ReenviarVerificacionRequest dto`. Siempre retorna `Ok(new { message = "..." })` independientemente del resultado del servicio.

  `POST /api/auth/login` (`[HttpPost("login")]`): recibe `[FromBody] LoginRequest dto`. Si ok retorna `Ok(result.Data)`; si `INVALID_CREDENTIALS` retorna `Unauthorized(new { error = "INVALID_CREDENTIALS", message = "..." })`; si `EMAIL_NOT_VERIFIED` retorna `StatusCode(403, new { error = "EMAIL_NOT_VERIFIED", message = "..." })`.

  `POST /api/auth/refresh` (`[HttpPost("refresh")]`): recibe `[FromBody] RefreshRequest dto`. Si ok retorna `Ok(result.Data)`; si `REFRESH_TOKEN_INVALID` retorna `Unauthorized(new { error = "REFRESH_TOKEN_INVALID", message = "..." })`.

  Endpoint de validación en un controller separado:

- **File:** `backend/Controllers/DashboardController.cs`
- **Action:** Create
- **What changes:** Clase `DashboardController : ControllerBase` con `[Route("api/dashboard")]`, `[ApiController]`, `[Authorize]`. Un único endpoint `GET /api/dashboard/test` que lee el claim `email` del usuario autenticado via `User.FindFirstValue(JwtRegisteredClaimNames.Email)` y retorna `Ok(new { email })`. Este controller es solo el placeholder de US-1; los endpoints reales se implementan en historias posteriores.

---

### Step 8: Program.cs (DI, JWT middleware, CORS, Swagger)

- **File:** `backend/Program.cs`
- **Action:** Modify
- **What changes:** Configuración completa del pipeline y registro de todos los servicios.

  **Registro de servicios (builder.Services):**
  - `AddDbContext<AppDbContext>` con `UseNpgsql(connectionString)`, `connectionString` leído desde `ConnectionStrings:DefaultConnection`.
  - `AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => { options.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidIssuer = ..., ValidateAudience = true, ValidAudience = ..., ValidateLifetime = true, ClockSkew = TimeSpan.Zero, ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)) }; })`.
  - `AddAuthorization()`.
  - `AddCors` con política `AllowAdminClient`: `WithOrigins(allowedOrigins)`, `AllowAnyHeader()`, `AllowAnyMethod()` — nunca `AllowAnyOrigin()`.
  - `AddScoped<IJwtService, JwtService>()`.
  - Registro condicional de email service: `if (builder.Configuration.GetValue<bool>("Email:UseFake")) { builder.Services.AddScoped<IEmailService, FakeEmailService>(); } else { builder.Services.AddHttpClient("ResendClient"); builder.Services.AddScoped<IEmailService, ResendEmailService>(); }`.
  - `AddScoped<IAuthService, AuthService>()`.
  - `AddControllers()`.
  - `AddEndpointsApiExplorer()` y `AddSwaggerGen()` (con configuración de Bearer token en Swagger UI para facilitar las pruebas manuales en Development).

  **Validación de startup crítica:** antes de `app.Run()`, leer `Jwt:SecretKey` y verificar que tiene al menos 32 caracteres. Si no, lanzar `InvalidOperationException("Jwt:SecretKey must be at least 32 characters.")`. Esto implementa la mitigación de R-1 del technical plan.

  **Pipeline HTTP:** `UseCors("AllowAdminClient")` antes de `UseAuthentication`; `UseAuthentication`; `UseAuthorization`; `UseHttpsRedirection`; `MapControllers`.

  **Swagger condicional:** solo habilitar `UseSwagger` y `UseSwaggerUI` en `Development` (envuelto en `if (app.Environment.IsDevelopment())`).

---

### Step 9: Scaffolding Angular admin (ng new, Angular Material, rutas base)

- **File:** `admin/` (todo el scaffolding generado por Angular CLI)
- **Action:** Create
- **What changes:** Ejecutar `ng new admin --routing --style=scss --standalone` dentro de la carpeta `admin/`. Ejecutar `ng add @angular/material` con tema pre-built (Indigo/Pink). Esto configura `provideAnimationsAsync()` en `app.config.ts` automáticamente.

- **File:** `admin/src/app/app.component.ts` y `admin/src/app/app.component.html`
- **Action:** Modify
- **What changes:** Limpiar el template de bienvenida generado por Angular CLI. El template de `AppComponent` queda solo con `<router-outlet />`. El componente mantiene el decorador `@Component` con `changeDetection: ChangeDetectionStrategy.OnPush`.

- **File:** `admin/src/environments/environment.ts` y `admin/src/environments/environment.production.ts`
- **Action:** Create
- **What changes:** Definir la interfaz `Environment` con `apiUrl: string` y `production: boolean`. En `environment.ts`: `apiUrl: 'http://localhost:5001'`, `production: false`. En `environment.production.ts`: `apiUrl` leído desde la variable de build (placeholder para que el equipo de infra configure `NG_APP_API_URL` — documentar en el archivo con un comentario). Esto documenta la open question OQ-1 del technical plan.

- **File:** `admin/src/app/core/models/auth.models.ts`
- **Action:** Create
- **What changes:** Definir las interfaces TypeScript del dominio de auth: `RegistroDto` con `email`, `password`, `nombre`, `organizacion` (todos `string`); `LoginResponse` con `accessToken`, `refreshToken`, `expiresIn` (number); `ApiError` con `error?: string` y `message?: string`.

- **File:** `admin/src/app/features/auth/` y `admin/src/app/features/dashboard/`
- **Action:** Create
- **What changes:** Crear la estructura de carpetas con `.gitkeep` temporales. Las carpetas `core/services/`, `core/guards/`, `core/interceptors/` también se crean aquí.

- **File:** `admin/src/app/app.routes.ts`
- **Action:** Modify
- **What changes:** Definir las rutas: `/login` → `LoginComponent` (sin guard); `/registro` → `RegistroComponent` (sin guard); `/dashboard` → `DashboardComponent` placeholder con `canActivate: [authGuard]`; `/congreso/:id` → `CongresoComponent` placeholder con `canActivate: [authGuard]`; ruta vacía `''` redirige a `/dashboard`; `'**'` redirige a `/login`. Los componentes placeholder de dashboard y congreso son inline en el archivo de rutas o en archivos mínimos separados con un `<h1>` — la funcionalidad real es de historias posteriores.

- **File:** `admin/src/app/app.config.ts`
- **Action:** Modify
- **What changes:** Configurar providers standalone: `provideRouter(routes)`, `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))`, `provideAnimationsAsync()`. Los interceptors se referencian aquí pero se implementan en Step 11.

---

### Step 10: AuthService Angular (signals, localStorage, login/registro/logout)

- **File:** `admin/src/app/core/services/auth.service.ts`
- **Action:** Create
- **What changes:** Clase `AuthService` con `providedIn: 'root'`. Constructor inyecta `HttpClient` (vía `inject(HttpClient)`) y `Router` (vía `inject(Router)`). Lee la URL base de `environment.apiUrl`.

  **Signals privados:** `_accessToken = signal<string | null>(localStorage.getItem('access_token'))` y `_refreshToken = signal<string | null>(localStorage.getItem('refresh_token'))` — inicializados en la declaración de campo (no en el constructor) para que el estado esté disponible antes de cualquier operación.

  **Signals y computeds públicos:** `isAuthenticated = computed(() => this._accessToken() !== null)` (readonly computed); `accessToken = this._accessToken.asReadonly()`.

  **`login(email: string, password: string): Observable<void>`:** POST a `${environment.apiUrl}/api/auth/login`. Usa `pipe(tap(response => this.setTokens(response.accessToken, response.refreshToken)), tap(() => this.router.navigate(['/dashboard'])), map(() => undefined))`.

  **`registro(dto: RegistroDto): Observable<{ message: string }>`:** POST a `/api/auth/registro`. Retorna el observable directamente sin side effects — el componente maneja la respuesta.

  **`refresh(): Observable<void>`:** POST a `/api/auth/refresh` con `{ refreshToken: this._refreshToken() }`. En tap actualiza solo el access token con `this._accessToken.set(response.accessToken)` y lo persiste en localStorage. Si no hay refresh token, retorna `throwError(() => new Error('No refresh token'))`.

  **`logout(): void`:** `this._accessToken.set(null)`, `this._refreshToken.set(null)`, `localStorage.removeItem('access_token')`, `localStorage.removeItem('refresh_token')`, `this.router.navigate(['/login'])`.

  **`private setTokens(accessToken: string, refreshToken: string): void`:** helper que actualiza ambos signals y ambas entradas de localStorage de forma atómica.

  **Nota de deuda técnica:** incluir un comentario en el archivo que explique que `localStorage` es la decisión Phase 1 para el refresh token y que en fases futuras se puede migrar a `httpOnly` cookies para mayor seguridad (documentando FR-4 de la story).

---

### Step 11: authInterceptor + errorInterceptor + authGuard

- **File:** `admin/src/app/core/guards/auth.guard.ts`
- **Action:** Create
- **What changes:** Función `authGuard` de tipo `CanActivateFn`. Usa `inject(AuthService)` y `inject(Router)`. Si `authService.isAuthenticated()` es `true` retorna `true`. Si es `false` retorna `router.createUrlTree(['/login'])`. Exportar como función nombrada (no como clase).

- **File:** `admin/src/app/core/interceptors/auth.interceptor.ts`
- **Action:** Create
- **What changes:** Función `authInterceptor` de tipo `HttpInterceptorFn`. Usa `inject(AuthService)`. Lee `authService.accessToken()`. Si no es null, clona el request con `req.clone({ headers: req.headers.set('Authorization', \`Bearer ${token}\`) })` y pasa el request clonado a `next`. Si es null, pasa el request original sin modificar.

- **File:** `admin/src/app/core/interceptors/error.interceptor.ts`
- **Action:** Create
- **What changes:** Función `errorInterceptor` de tipo `HttpInterceptorFn`. Usa `inject(AuthService)` y `inject(MatSnackBar)`. Aplica `catchError` sobre el observable de `next(req)`. Si el error es `HttpErrorResponse`: status `401` → `authService.logout()` y retorna `EMPTY`; status `403` → snackbar con `error.error?.message ?? 'Acceso denegado.'` y retorna `EMPTY`; status `409` → snackbar con `error.error?.message ?? 'Conflicto.'` y retorna `EMPTY`; status `400` → snackbar con mensaje genérico de validación y retorna `throwError(() => error)` para que el componente pueda inspeccionar los errores de campo; otros → snackbar con `'Error inesperado. Intentá de nuevo.'` y retorna `throwError(() => error)`. La duración del snackbar es 4000ms. Importar `MatSnackBarModule` o configurar `provideSnackBar` si es necesario en `app.config.ts`.

---

### Step 12: LoginComponent + RegistroComponent (reactive forms tipados, OnPush)

- **File:** `admin/src/app/features/auth/login/login.component.ts`
- **Action:** Create
- **What changes:** Componente standalone con `ChangeDetectionStrategy.OnPush`. Inyecta `AuthService` via `inject`. Importa `MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatProgressSpinnerModule`, `ReactiveFormsModule`.

  Reactive form tipado: `form = new FormGroup<{ email: FormControl<string>; password: FormControl<string> }>({ email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }), password: new FormControl('', { nonNullable: true, validators: [Validators.required] }) })`.

  Signal `isLoading = signal(false)`. Signal `errorMessage = signal<string | null>(null)`.

  Método `onSubmit()`: si `form.invalid` retorna sin acción. Setea `isLoading.set(true)`, limpia `errorMessage`. Suscribe a `authService.login(...)`. En error, inspeccionará `error.error?.error`: si es `EMAIL_NOT_VERIFIED` setea `errorMessage` con el mensaje específico y muestra botón "Reenviar verificación"; si es otro error (ej: `INVALID_CREDENTIALS` — manejado por el errorInterceptor vía snackbar) solo resetea `isLoading`. En `finalize`, `isLoading.set(false)`.

- **File:** `admin/src/app/features/auth/login/login.component.html`
- **Action:** Create
- **What changes:** Template con `<mat-card>` conteniendo: título "Iniciar sesión"; `<form [formGroup]="form" (ngSubmit)="onSubmit()">`; `<mat-form-field>` para email con `matInput` y `<mat-error>` condicional; ídem para password con `type="password"`; bloque `@if (errorMessage())` para el mensaje `EMAIL_NOT_VERIFIED` con un enlace "Reenviar verificación" que navega a `/registro`; botón submit `<button mat-raised-button color="primary" [disabled]="isLoading()">` que muestra `<mat-spinner diameter="20">` inline cuando `isLoading()` es true; enlace de navegación a `/registro`.

- **File:** `admin/src/app/features/auth/login/login.component.scss`
- **Action:** Create
- **What changes:** Estilos mínimos para centrar el card en la pantalla (`display: flex; justify-content: center; align-items: center; height: 100vh`) y dar un ancho máximo al card.

- **File:** `admin/src/app/features/auth/registro/registro.component.ts`
- **Action:** Create
- **What changes:** Componente standalone con `ChangeDetectionStrategy.OnPush`. Inyecta `AuthService` y `HttpClient` (para reenvío de verificación). Mismo stack de Material imports que LoginComponent, más `MatDividerModule`.

  Reactive form tipado con cuatro controles: `email` (`[Validators.required, Validators.email]`), `password` (`[Validators.required, Validators.minLength(8), Validators.pattern(/.*\d.*/)]`), `nombre` (`[Validators.required]`), `organizacion` (`[Validators.required]`).

  Signal `registroExitoso = signal(false)`. Signal `isLoading = signal(false)`. Signal `reenvioLoading = signal(false)`.

  Método `onSubmit()`: si `form.invalid` retorna. Llama `authService.registro(form.getRawValue())`. En success (`201`): `registroExitoso.set(true)`. En error 409 (manejado por errorInterceptor con snackbar) o 400 (snackbar + el interceptor retorna el error): no cambiar estado especial — el snackbar ya informó al usuario.

  Método `reenviarVerificacion()`: hace POST a `/api/auth/reenviar-verificacion` con el email del form. Muestra `reenvioLoading.set(true)` durante la llamada. Al completar, muestra snackbar "Enlace reenviado. Revisá tu casilla." o maneja error.

- **File:** `admin/src/app/features/auth/registro/registro.component.html`
- **Action:** Create
- **What changes:** Template con `@if (!registroExitoso())` mostrando el formulario, y `@else` mostrando el panel de confirmación. Panel de confirmación: `<mat-card>` con mensaje "Revisá tu correo para confirmar tu cuenta." y botón "Reenviar verificación" que llama `reenviarVerificacion()` con spinner mientras `reenvioLoading()`. Enlace de vuelta a `/login`. Formulario: mismos `<mat-form-field>` para los cuatro campos con sus respectivos `<mat-error>` para cada validación (mensajes en español).

- **File:** `admin/src/app/features/auth/registro/registro.component.scss`
- **Action:** Create
- **What changes:** Mismos estilos de centrado que login, ajustando el ancho máximo del card para acomodar cuatro campos.

---

### Step 13: Scaffolding Next.js + middleware.ts extracción de slug

- **File:** `site/` (todo el scaffolding generado por create-next-app)
- **Action:** Create
- **What changes:** Ejecutar `npx create-next-app@latest site --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"` en la carpeta raíz del monorepo.

- **File:** `site/src/app/page.tsx`
- **Action:** Modify
- **What changes:** Reemplazar el contenido de ejemplo generado por create-next-app por un placeholder mínimo: componente por defecto que retorna un `<main>` con un `<h1>ConferenceManager</h1>` y un párrafo indicando que el mini-sitio público está en construcción. Sin imports de imágenes ni estilos de la plantilla de ejemplo. Limpiar también `site/src/app/globals.css` para dejar solo las directivas base de Tailwind (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).

- **File:** `site/src/middleware.ts`
- **Action:** Create
- **What changes:** Función `middleware(request: NextRequest): NextResponse`. Extrae `hostname` de `request.headers.get('host') ?? ''` (sin el puerto). Determina si el hostname es el dominio raíz o localhost: condición `hostname === 'localhost' || hostname === 'tuplataforma.com' || hostname.startsWith('www.')`. Si es dominio raíz/localhost, clona el request sin modificación y llama `NextResponse.next()`. Si el hostname tiene subdominio, extrae la primera parte: `slug = hostname.split('.')[0]`. Crea la respuesta con `NextResponse.next()` y agrega el header `x-slug` con `response.headers.set('x-slug', slug)`. Retorna la respuesta modificada.

  Exportar el objeto `config` con `matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)']` para que el middleware aplique solo a rutas de contenido, excluyendo assets estáticos, rutas internas de Next.js y rutas API.

  El dominio de producción `tuplataforma.com` se lee de una variable de entorno `NEXT_PUBLIC_ROOT_DOMAIN` en lugar de estar hardcodeado: `const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'tuplataforma.com'`. Esto facilita configurar entornos de staging sin modificar código.

---

## Commits planned

1. `chore(US-1): scaffold .NET backend project structure`
2. `feat(US-1): add Usuario and RefreshToken models with EF Core config`
3. `feat(US-1): add initial migration and DB indexes`
4. `feat(US-1): implement JwtService with access and refresh token generation`
5. `feat(US-1): implement ResendEmailService with dev fake`
6. `feat(US-1): implement AuthService business logic`
7. `feat(US-1): implement AuthController with 5 auth endpoints`
8. `chore(US-1): configure DI, JWT middleware, CORS, Swagger`
9. `chore(US-1): scaffold Angular admin with Material and base routes`
10. `feat(US-1): implement Angular AuthService with signals`
11. `feat(US-1): add auth interceptors and guard`
12. `feat(US-1): implement LoginComponent and RegistroComponent`
13. `chore(US-1): scaffold Next.js site with slug middleware`

---

## Consideraciones de implementación

### Correspondencia Steps → Tasks del technical plan

| Step | Task(s) del technical plan |
|------|----------------------------|
| Step 1 | Task 1 + Task 2 |
| Step 2 | Task 3 |
| Step 3 | Task 4 |
| Step 4 | Task 5 |
| Step 5 | Task 6 |
| Step 6 | Task 7 + Task 8 (DTOs + AuthService) |
| Step 7 | Task 9 |
| Step 8 | Task 10 |
| Step 9 | Task 11 + Task 12 (scaffolding + rutas) |
| Step 10 | Task 13 |
| Step 11 | Task 14 |
| Step 12 | Task 15 |
| Step 13 | Task 16 |

### Open questions del technical plan y decisiones tomadas en este plan

- **OQ-1 (URL base Angular):** Se usa `environment.ts` con `apiUrl: 'http://localhost:5001'` en Development. El valor de producción se configura vía variable de entorno en el build de Angular. Pendiente confirmar con infraestructura antes del deploy (ver Step 9).
- **OQ-2 (dominio Resend):** Se usa `onboarding@resend.dev` en Development vía `appsettings.Development.json`. El dominio de producción se configura como variable de entorno `Resend:FromAddress` (ver Step 5).
- **OQ-3 (tema Angular Material):** Se usa el tema pre-built Indigo/Pink como placeholder. Se reemplazará cuando UX produzca `design-baseline.md`.

### Reglas del proyecto aplicadas en este plan

- `AsNoTracking` en todas las queries de lectura en `AuthService` (CLAUDE.md regla 6).
- `Guid` como PK en todas las tablas — `gen_random_uuid()` en PostgreSQL (CLAUDE.md regla 7).
- Sin NgModules en Angular — todos los componentes son standalone (CLAUDE.md regla 5).
- Código en inglés, documentación en español, UI en español (CLAUDE.md language policy).
- Push solo con confirmación del usuario — este plan no incluye ningún push (CLAUDE.md regla 1).

---

## Trade-offs

**Pros:**
- El patrón `ServiceResult<T>` evita el uso de excepciones para flujos de negocio esperados (credenciales incorrectas, email duplicado), lo que hace que el código del controller sea predecible y testeable sin necesidad de capturar excepciones.
- La protección timing-safe en `LoginAsync` (ejecutar BCrypt incluso cuando el usuario no existe) previene user enumeration por análisis de tiempo de respuesta sin costo de complejidad significativo.
- El registro condicional de `FakeEmailService` vs `ResendEmailService` permite desarrollo local sin credenciales reales de Resend y sin modificar código de producción.
- Los interceptors funcionales de Angular (no basados en clases) son la forma idiomática en Angular 17+ y se integran naturalmente con el sistema de DI de `inject()`.
- La validación de longitud mínima de `Jwt:SecretKey` en startup convierte un error silencioso de seguridad (clave débil) en un fallo ruidoso e inmediato.
- El middleware de Next.js es stateless y se ejecuta en el Edge — no agrega latencia perceptible y no tiene estado mutable.

**Cons:**
- Los tokens de verificación se generan con `Guid.NewGuid().ToString("N")` (32 chars hex). Aunque la guía del technical plan lo especifica explícitamente, un GUID v4 tiene 122 bits de entropía real — es suficiente para este caso de uso pero menos que un `RandomNumberGenerator.GetBytes(16)` (128 bits). La decisión es del TL; el plan la respeta.
- `localStorage` para los tokens de Angular es la decisión Phase 1 aceptada. Queda documentado en el código y en este plan que en fases futuras se puede migrar a `httpOnly` cookies para el refresh token, eliminando el vector XSS.
- El `errorInterceptor` hace logout automático en cualquier 401. Esto puede causar un logout no deseado si hay un endpoint público que retorna 401 (actualmente ninguno, pero es un riesgo a considerar en historias futuras cuando se agreguen más endpoints). Mitigación: filtrar por URL antes de hacer logout si el endpoint no es de auth.
- No hay renovación automática del access token antes de que expire en el `authInterceptor`. Si el access token expira durante una sesión activa, la siguiente request fallará con 401 y deslogueará al usuario. El flujo de refresh manual existe pero no hay lógica proactiva. Esta deuda se documenta para historias de mejora de UX.

## Comparison with other plans

Single plan — no alternatives produced.
