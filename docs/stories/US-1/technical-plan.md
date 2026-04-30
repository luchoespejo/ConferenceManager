# Technical Plan — US-1: Registro y login de organizadores

**Date:** 2026-04-26
**Author:** Technical Lead
**Story:** [story.md](./story.md)
**Status:** Approved

---

## Summary

Esta historia establece el scaffolding completo de los tres repos del proyecto (backend .NET Core 8, admin Angular 17+, mini-sitio Next.js 14) e implementa el flujo de autenticación de organizadores: registro con email/contraseña, verificación de email vía token de un solo uso con expiración de 24 horas, login con retorno de JWT (15 min) + refresh token (7 días), endpoint de refresco de token y reenvío del correo de verificación. Es la historia fundacional de la que dependen todas las demás; la estructura de carpetas, convenciones de código y contratos de seguridad establecidos aquí deben respetarse en todas las historias siguientes.

---

## Architectural impact

Sin impacto en ADRs existentes. El scaffolding define la estructura de directorios base y las convenciones que todos los agentes DEV deberán seguir en historias posteriores. Se incorporan dos tablas nuevas a la base de datos (`usuarios`, `refresh_tokens`). No se modifican ADR-001 ni ADR-003; esta historia es la primera implementación concreta de las decisiones ya tomadas en esos documentos.

---

## ADRs referenced

- [ADR-001 — Core Technology Stack](../../architecture/adr/ADR-001-tech-stack.md)
- [ADR-003 — Authentication Strategy](../../architecture/adr/ADR-003-authentication.md)

---

## Tasks

### Task 1: Scaffolding backend .NET Core 8
**Repo:** backend
**Files affected:**
- `backend/ConferenceManager.Api.csproj`
- `backend/Program.cs`
- `backend/appsettings.json`
- `backend/appsettings.Development.json`
- `backend/.gitignore`

**Description:**
Ejecutar `dotnet new webapi -n ConferenceManager.Api -o backend/ --no-openapi` y luego agregar los paquetes NuGet requeridos:
- `Npgsql.EntityFrameworkCore.PostgreSQL` — driver PostgreSQL para EF Core 8
- `Microsoft.AspNetCore.Authentication.JwtBearer` — middleware JWT
- `BCrypt.Net-Next` — hashing de contraseñas con BCrypt

En `Program.cs` configurar el pipeline mínimo: `UseHttpsRedirection`, CORS con política nombrada `AllowAdminClient` (orígenes permitidos: `http://localhost:4200` en Development, origen de producción Angular via variable de entorno), autenticación JWT Bearer, autorización, y mapeo de controllers.

En `appsettings.json` definir la sección `Jwt` con claves `Issuer`, `Audience` y `SecretKey` (este último debe venir de variable de entorno o user-secrets, nunca hardcodeado). Definir sección `ConnectionStrings:DefaultConnection` para PostgreSQL. Definir sección `Resend:ApiKey` (variable de entorno). Definir sección `Cors:AllowedOrigins` como array.

En `appsettings.Development.json` setear valores de desarrollo local.

**Acceptance:**
`dotnet build` sin errores. `dotnet run` levanta en `https://localhost:5001`. La ruta `/api/health` (o el WeatherForecast eliminado) retorna 200. CORS permite requests desde `localhost:4200`.

---

### Task 2: Estructura de carpetas backend
**Repo:** backend
**Files affected:**
- `backend/Controllers/.gitkeep`
- `backend/Models/.gitkeep`
- `backend/Data/.gitkeep`
- `backend/Services/.gitkeep`
- `backend/DTOs/.gitkeep`

**Description:**
Crear la estructura de carpetas canónica del proyecto. Cada carpeta tendrá su propósito exclusivo:
- `Controllers/` — clases que heredan de `ControllerBase`, solo enrutamiento y validación de entrada, sin lógica de negocio
- `Models/` — entidades EF Core (POCO), sin lógica de aplicación
- `Data/` — `AppDbContext`, configuraciones Fluent API y migraciones EF Core
- `Services/` — lógica de negocio, interfaces e implementaciones
- `DTOs/` — records o clases de request/response; nunca exponer entidades directamente en la API

**Acceptance:**
Carpetas presentes en el repo. Ningún código de producción mezcla responsabilidades entre capas.

---

### Task 3: Modelo `Usuario` y `RefreshToken` + `AppDbContext`
**Repo:** backend
**Files affected:**
- `backend/Models/Usuario.cs`
- `backend/Models/RefreshToken.cs`
- `backend/Data/AppDbContext.cs`
- `backend/Data/Configurations/UsuarioConfiguration.cs`
- `backend/Data/Configurations/RefreshTokenConfiguration.cs`

**Description:**

**`Usuario`** — entidad principal de la tabla `usuarios`:
- `Id`: `Guid`, PK, valor por defecto `gen_random_uuid()` (configurar con `HasDefaultValueSql("gen_random_uuid()")` en Fluent API)
- `Email`: `string`, requerido, único (índice único en configuración Fluent)
- `PasswordHash`: `string`, requerido
- `Nombre`: `string`, requerido
- `Organizacion`: `string`, requerido
- `EmailVerificado`: `bool`, default `false`
- `VerificationToken`: `string?`, nullable
- `VerificationTokenExpiresAt`: `DateTime?`, nullable, timezone UTC
- `CreatedAt`: `DateTime`, default `NOW()` UTC, no updatable

**`RefreshToken`** — entidad para la tabla `refresh_tokens`:
- `Id`: `Guid`, PK, `gen_random_uuid()`
- `UsuarioId`: `Guid`, FK hacia `usuarios.Id`, con cascade delete
- `TokenHash`: `string`, requerido (SHA-256 del token raw, no el token en sí)
- `ExpiresAt`: `DateTime`, UTC
- `Revoked`: `bool`, default `false`
- Propiedad de navegación: `Usuario`

**`AppDbContext`** — registrar `DbSet<Usuario>` y `DbSet<RefreshToken>`. Aplicar configuraciones Fluent API desde archivos `IEntityTypeConfiguration<T>` separados usando `modelBuilder.ApplyConfigurationsFromAssembly(...)`. Sobreescribir `SaveChangesAsync` para setear `CreatedAt` automáticamente en entidades nuevas si se desea un enfoque centralizado.

Registrar `AppDbContext` en `Program.cs` con `AddDbContext<AppDbContext>(opt => opt.UseNpgsql(...))`. Usar `AddDbContextFactory` si se prevén operaciones concurrentes en el mismo scope.

**Acceptance:**
`dotnet ef migrations add InitialCreate` genera una migración con las dos tablas, los índices correctos y los defaults de PostgreSQL. `dotnet ef database update` aplica sin errores sobre una instancia PostgreSQL local.

---

### Task 4: Generación de migración inicial y convención de migraciones
**Repo:** backend
**Files affected:**
- `backend/Data/Migrations/` (generado por EF Core tooling)

**Description:**
Ejecutar `dotnet ef migrations add InitialCreate --output-dir Data/Migrations`. Verificar manualmente el archivo de migración generado antes de aplicarlo: confirmar que `usuarios.id` usa `gen_random_uuid()`, que el índice único sobre `email` está presente, que `refresh_tokens.usuario_id` tiene la FK con cascade delete, y que los campos `DateTime` usan tipos `timestamp with time zone` en PostgreSQL (requiere que las propiedades C# sean `DateTime` con `DateTimeKind.Utc` o que Npgsql esté configurado con `EnableLegacyTimestampBehavior` desactivado).

Documentar en el README de backend que todas las migraciones futuras deben nombrarse descriptivamente (ej: `AddCongressTable`, `AddSpeakerInvitationToken`) y nunca squashearse en producción.

**Acceptance:**
Migración generada refleja el esquema exacto descrito en Task 3. `dotnet ef database update` exitoso. `\d usuarios` en psql muestra columnas, defaults e índices correctos.

---

### Task 5: Servicio JWT
**Repo:** backend
**Files affected:**
- `backend/Services/IJwtService.cs`
- `backend/Services/JwtService.cs`

**Description:**
Definir la interfaz `IJwtService` con métodos:
- `string GenerateAccessToken(Usuario usuario)` — retorna un JWT firmado válido 15 minutos
- `string GenerateRefreshTokenRaw()` — retorna un string criptográficamente aleatorio (base64 de 64 bytes via `RandomNumberGenerator.GetBytes(64)`)
- `string HashRefreshToken(string rawToken)` — SHA-256 del token raw, retorna hex string

La implementación `JwtService` inyecta `IConfiguration` para leer `Jwt:SecretKey`, `Jwt:Issuer`, `Jwt:Audience`. El access token incluye claims: `sub` (usuario.Id.ToString()), `email` (usuario.Email), `name` (usuario.Nombre). Usar `HmacSha256` como algoritmo de firma. La expiración del access token es exactamente 15 minutos desde `DateTime.UtcNow`.

`GenerateRefreshTokenRaw()` nunca usa `Guid.NewGuid()` — usa `RandomNumberGenerator` del namespace `System.Security.Cryptography`.

Registrar como `AddScoped<IJwtService, JwtService>()` en `Program.cs`.

**Acceptance:**
Unit test que genera un access token, lo parsea con `JwtSecurityTokenHandler` y verifica que los claims y la expiración son correctos. Test que hashea el mismo raw token dos veces y obtiene el mismo hash (determinismo SHA-256). Test que dos llamadas a `GenerateRefreshTokenRaw()` producen strings distintos.

---

### Task 6: Servicio Email con Resend
**Repo:** backend
**Files affected:**
- `backend/Services/IEmailService.cs`
- `backend/Services/ResendEmailService.cs`

**Description:**
Definir `IEmailService` con método `Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl)`. No agregar SDK de Resend — usar `HttpClient` directamente via `IHttpClientFactory`.

`ResendEmailService` inyecta `IHttpClientFactory` e `IConfiguration` (para `Resend:ApiKey` y `Resend:FromAddress`). En `SendVerificationEmailAsync`:
- Construir un objeto anónimo con la estructura JSON de la API de Resend (`from`, `to`, `subject`, `html`)
- El cuerpo HTML es un template inline mínimo con el enlace de verificación
- El enlace de verificación tiene la forma `{baseUrl}/api/auth/verificar-email?token={token}`
- Serializar con `System.Text.Json` y POST a `https://api.resend.com/emails`
- El header `Authorization: Bearer {apiKey}` se agrega por `DelegatingHandler` o directamente en el método
- Si la respuesta no es 2xx, loguear el error y lanzar una excepción tipada `EmailDeliveryException`

Registrar `AddHttpClient<ResendEmailService>()` en `Program.cs`. `AddScoped<IEmailService, ResendEmailService>()`.

En testing y desarrollo local, registrar una implementación `FakeEmailService` que loguea el email en lugar de enviarlo — controlado por `appsettings.Development.json` con un flag `Email:UseFake: true` y registro condicional en `Program.cs`.

**Acceptance:**
En desarrollo con `UseFake: true`, el registro de un usuario loguea la URL de verificación en la consola. En un entorno con API key real de Resend, el email llega al destinatario.

---

### Task 7: DTOs de autenticación
**Repo:** backend
**Files affected:**
- `backend/DTOs/Auth/RegistroRequest.cs`
- `backend/DTOs/Auth/LoginRequest.cs`
- `backend/DTOs/Auth/LoginResponse.cs`
- `backend/DTOs/Auth/RefreshRequest.cs`
- `backend/DTOs/Auth/RefreshResponse.cs`
- `backend/DTOs/Auth/ReenviarVerificacionRequest.cs`

**Description:**
Todos los DTOs son `record` de C# (inmutables, con validaciones via Data Annotations).

**`RegistroRequest`:**
- `Email`: `[Required, EmailAddress, MaxLength(254)]`
- `Password`: `[Required, MinLength(8)]` — la validación de "al menos 1 número" se realiza en el servicio con regex, no en Data Annotations para dar un mensaje de error descriptivo
- `Nombre`: `[Required, MaxLength(200)]`
- `Organizacion`: `[Required, MaxLength(200)]`

**`LoginRequest`:**
- `Email`: `[Required, EmailAddress]`
- `Password`: `[Required]`

**`LoginResponse`:**
- `AccessToken`: `string`
- `RefreshToken`: `string`
- `ExpiresIn`: `int` (segundos hasta expiración del access token, siempre 900)

**`RefreshRequest`:**
- `RefreshToken`: `[Required]`

**`RefreshResponse`:** misma estructura que `LoginResponse`.

**`ReenviarVerificacionRequest`:**
- `Email`: `[Required, EmailAddress]`

**Acceptance:**
Todos los records compilan. Los controladores pueden bindearlos desde el body JSON sin configuración adicional.

---

### Task 8: Servicio de autenticación (`AuthService`)
**Repo:** backend
**Files affected:**
- `backend/Services/IAuthService.cs`
- `backend/Services/AuthService.cs`

**Description:**
Definir `IAuthService` con métodos:
- `Task<ServiceResult> RegistrarAsync(RegistroRequest dto)`
- `Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest dto)`
- `Task<ServiceResult<LoginResponse>> RefreshAsync(string refreshTokenRaw)`
- `Task<ServiceResult> VerificarEmailAsync(string token)`
- `Task<ServiceResult> ReenviarVerificacionAsync(string email)`

`ServiceResult` es un tipo genérico propio (no lanzar excepciones para flujos de negocio esperados) que encapsula `bool Success`, `string? ErrorCode`, `string? ErrorMessage` y opcionalmente `T? Data`. Los códigos de error son constantes string: `"EMAIL_ALREADY_EXISTS"`, `"INVALID_CREDENTIALS"`, `"EMAIL_NOT_VERIFIED"`, `"TOKEN_INVALID"`, `"TOKEN_EXPIRED"`, `"REFRESH_TOKEN_INVALID"`.

**Lógica de `RegistrarAsync`:**
1. Verificar unicidad de email (query con `AsNoTracking`)
2. Si duplicado: retornar `ServiceResult.Fail("EMAIL_ALREADY_EXISTS")`
3. Validar que el password contenga al menos 1 número (regex `\d`)
4. Hashear contraseña con `BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12)`
5. Generar `VerificationToken` = `Guid.NewGuid().ToString("N")` (32 chars hex, sin guiones)
6. Setear `VerificationTokenExpiresAt` = `DateTime.UtcNow.AddHours(24)`
7. Persistir `Usuario` nuevo con `EmailVerificado = false`
8. Llamar `IEmailService.SendVerificationEmailAsync(...)`
9. Retornar `ServiceResult.Ok()`

**Lógica de `LoginAsync`:**
1. Buscar usuario por email (con `AsNoTracking`)
2. Si no existe: ejecutar `BCrypt.Net.BCrypt.HashPassword("dummy")` para consumir tiempo similar y retornar `ServiceResult.Fail("INVALID_CREDENTIALS")` — esto previene timing attacks de user enumeration
3. Si existe pero `EmailVerificado == false`: retornar `ServiceResult.Fail("EMAIL_NOT_VERIFIED")`
4. Verificar password: `BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash)`
5. Si falla: retornar `ServiceResult.Fail("INVALID_CREDENTIALS")`
6. Generar access token via `IJwtService.GenerateAccessToken(usuario)`
7. Generar refresh token raw via `IJwtService.GenerateRefreshTokenRaw()`
8. Persistir `RefreshToken` con `TokenHash = IJwtService.HashRefreshToken(rawToken)`, `ExpiresAt = UtcNow + 7 días`, `Revoked = false`
9. Retornar `LoginResponse` con los dos tokens

**Lógica de `VerificarEmailAsync`:**
1. Buscar usuario donde `VerificationToken == token` (query exacta)
2. Si no encontrado: `ServiceResult.Fail("TOKEN_INVALID")`
3. Si `VerificationTokenExpiresAt < UtcNow`: `ServiceResult.Fail("TOKEN_EXPIRED")`
4. Setear `EmailVerificado = true`, `VerificationToken = null`, `VerificationTokenExpiresAt = null`
5. Guardar cambios
6. `ServiceResult.Ok()`

**Lógica de `ReenviarVerificacionAsync`:**
1. Buscar usuario por email
2. Si no encontrado o ya verificado: retornar `ServiceResult.Ok()` sin revelar información (seguridad)
3. Generar nuevo token, nueva expiración (24h), sobrescribir los anteriores
4. Guardar y reenviar email
5. `ServiceResult.Ok()`

**Lógica de `RefreshAsync`:**
1. Hashear el raw token recibido
2. Buscar `RefreshToken` en BD donde `TokenHash == hash && Revoked == false && ExpiresAt > UtcNow`
3. Si no encontrado: `ServiceResult.Fail("REFRESH_TOKEN_INVALID")`
4. Marcar el token actual como `Revoked = true`
5. Generar nuevo refresh token raw, persistir nuevo `RefreshToken`
6. Generar nuevo access token para el usuario asociado
7. Retornar `LoginResponse`

Registrar como `AddScoped<IAuthService, AuthService>()`.

**Acceptance:**
Todos los escenarios de los criterios de aceptación de la story están cubiertos por tests unitarios del servicio con mocks de `AppDbContext`, `IJwtService` e `IEmailService`.

---

### Task 9: `AuthController`
**Repo:** backend
**Files affected:**
- `backend/Controllers/AuthController.cs`

**Description:**
Clase `AuthController : ControllerBase` con `[Route("api/auth")]` y `[ApiController]`. Inyecta `IAuthService`. Todos los endpoints son anónimos (`[AllowAnonymous]`).

**Endpoints:**

`POST /api/auth/registro` — recibe `RegistroRequest` del body. Mapear `ServiceResult` a respuestas HTTP:
- Éxito: `201 Created` con body `{ "message": "Cuenta creada. Revisá tu correo para confirmar tu email." }`
- `EMAIL_ALREADY_EXISTS`: `409 Conflict`
- Validación de password (1 número): `400 Bad Request` con campo `password` en errors
- Otros errores: `500 Internal Server Error`

`GET /api/auth/verificar-email?token={token}` — recibe el token como query param. Mapear:
- Éxito: `200 OK` con `{ "message": "Email verificado correctamente. Ya podés iniciar sesión." }`
- `TOKEN_INVALID` o `TOKEN_EXPIRED`: `400 Bad Request`

`POST /api/auth/reenviar-verificacion` — recibe `ReenviarVerificacionRequest`. Siempre retorna `200 OK` con `{ "message": "Si el email existe y no está verificado, recibirás un nuevo enlace." }` — nunca revelar si el email existe.

`POST /api/auth/login` — recibe `LoginRequest`. Mapear:
- Éxito: `200 OK` con `LoginResponse`
- `INVALID_CREDENTIALS`: `401 Unauthorized`
- `EMAIL_NOT_VERIFIED`: `403 Forbidden` con body `{ "error": "EMAIL_NOT_VERIFIED", "message": "..." }`

`POST /api/auth/refresh` — recibe `RefreshRequest`. Mapear:
- Éxito: `200 OK` con `RefreshResponse`
- `REFRESH_TOKEN_INVALID`: `401 Unauthorized`

El controller no contiene lógica de negocio — solo traducción de DTOs a llamadas de servicio y de `ServiceResult` a `IActionResult`.

**Acceptance:**
Tests de integración (usando `WebApplicationFactory`) cubren todos los escenarios de los criterios de aceptación de la story. Los status codes y bodies de respuesta coinciden exactamente con el API contract definido más abajo.

---

### Task 10: Configuración de autenticación JWT en pipeline .NET
**Repo:** backend
**Files affected:**
- `backend/Program.cs`

**Description:**
En `Program.cs`, agregar `AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...)` con `TokenValidationParameters` que validen:
- `ValidateIssuer = true`, `ValidIssuer` desde config
- `ValidateAudience = true`, `ValidAudience` desde config
- `ValidateLifetime = true`
- `ClockSkew = TimeSpan.Zero` (sin margen extra — la expiración de 15 min es exacta)
- `ValidateIssuerSigningKey = true`, clave desde config

Agregar `UseAuthentication()` y `UseAuthorization()` al pipeline en el orden correcto (antes de `MapControllers()`).

El endpoint placeholder `GET /api/dashboard/test` (solo para validar el guard en US-1) debe tener `[Authorize]` — retorna `200 OK` con el email del claim si el JWT es válido, `401` si no hay token o expiró.

**Acceptance:**
Llamada a `GET /api/dashboard/test` sin header retorna 401. Con JWT válido retorna 200. Con JWT expirado retorna 401.

---

### Task 11: Scaffolding Angular admin
**Repo:** admin
**Files affected:**
- Todo el scaffolding generado por Angular CLI

**Description:**
Ejecutar `ng new admin --routing --style=scss --standalone` dentro de la carpeta `admin/`. Agregar `@angular/material` con `ng add @angular/material` (tema Indigo/Pink o el que el UX defina; usar tema pre-built, no custom). Esto configura `provideAnimationsAsync()` automáticamente.

Limpiar el contenido por defecto de `AppComponent` (remover el template de bienvenida de Angular CLI). Verificar que `app.config.ts` use providers standalone: `provideRouter(routes)`, `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))`, `provideAnimationsAsync()`.

**Acceptance:**
`ng serve` compila sin errores ni warnings. El browser muestra la app Angular en `http://localhost:4200` sin el template por defecto de Angular CLI.

---

### Task 12: Rutas Angular
**Repo:** admin
**Files affected:**
- `admin/src/app/app.routes.ts`

**Description:**
Definir las rutas de la aplicación:
- `/login` — `LoginComponent` (lazy o standalone directo, sin guard)
- `/registro` — `RegistroComponent` (sin guard)
- `/dashboard` — `DashboardComponent` placeholder, protegida por `authGuard`
- `/congreso/:id` — `CongresoComponent` placeholder, protegida por `authGuard`
- `` (raíz) — redirect a `/dashboard`
- `**` — redirect a `/login`

Todas las rutas protegidas usan `canActivate: [authGuard]`. Los componentes de dashboard y congreso son placeholders mínimos (template con un `<h1>` y el título de la ruta) — la funcionalidad real se implementa en historias posteriores.

**Acceptance:**
Navegar a `/dashboard` sin estar autenticado redirige a `/login`. Navegar a `/login` autenticado no redirige (el guard no protege rutas públicas). Las rutas cargan sus componentes correctamente.

---

### Task 13: `AuthService` Angular con signals
**Repo:** admin
**Files affected:**
- `admin/src/app/core/services/auth.service.ts`

**Description:**
Servicio injectable en root (`providedIn: 'root'`). Inyecta `HttpClient` y `Router`.

**Signals:**
- `private _accessToken = signal<string | null>(null)` — inicializar leyendo `localStorage.getItem('access_token')` en el constructor
- `private _refreshToken = signal<string | null>(null)` — ídem `localStorage.getItem('refresh_token')`
- `isAuthenticated = computed(() => this._accessToken() !== null)` — computed público
- `accessToken = this._accessToken.asReadonly()` — signal público readonly

**Métodos:**
- `login(email: string, password: string): Observable<void>` — POST a `/api/auth/login`, en el tap almacena tokens en signals y localStorage, navega a `/dashboard`
- `registro(dto: RegistroDto): Observable<void>` — POST a `/api/auth/registro`
- `refresh(): Observable<void>` — POST a `/api/auth/refresh` con el refresh token actual, actualiza el access token
- `logout(): void` — limpia signals, limpia localStorage, navega a `/login`
- `private setTokens(accessToken: string, refreshToken: string): void` — helper que actualiza signals y localStorage de forma consistente

**Importante:** los tokens se almacenan en `localStorage` (no `sessionStorage`) para sobrevivir refrescos de página. Esta decisión es aceptable para Phase 1; documentar que en fases futuras se puede migrar a `httpOnly` cookies para el refresh token.

Registrar tipo `RegistroDto` como interface en el mismo archivo o en `admin/src/app/core/models/auth.models.ts`.

**Acceptance:**
Signal `isAuthenticated` retorna `true` después de `login()` exitoso y `false` después de `logout()`. Después de un refresh de página, si hay tokens en localStorage, `isAuthenticated` es `true` sin necesidad de re-login.

---

### Task 14: `authGuard` y `authInterceptor`
**Repo:** admin
**Files affected:**
- `admin/src/app/core/guards/auth.guard.ts`
- `admin/src/app/core/interceptors/auth.interceptor.ts`
- `admin/src/app/core/interceptors/error.interceptor.ts`

**Description:**

**`authGuard`** — `CanActivateFn`:
Inyectar `AuthService` y `Router` vía `inject()`. Si `authService.isAuthenticated()` es `true`, retornar `true`. Si es `false`, retornar `router.createUrlTree(['/login'])`.

**`authInterceptor`** — `HttpInterceptorFn`:
Inyectar `AuthService` vía `inject()`. Si `authService.accessToken()` no es null, clonar el request con el header `Authorization: Bearer {token}`. Pasar el request modificado (o el original si no hay token).

**`errorInterceptor`** — `HttpInterceptorFn`:
Inyectar `AuthService` y `MatSnackBar` vía `inject()`. Usar `catchError` sobre el observable. Si el error es `HttpErrorResponse`:
- Status `401`: llamar `authService.logout()` (que redirige a `/login`) y retornar `EMPTY`
- Status `403`: mostrar snackbar con el mensaje del servidor (campo `message` del body si existe) y retornar `EMPTY`
- Status `400`: mostrar snackbar genérico o los errores de campo; propagar el error para que el componente pueda manejar errores de formulario
- Status `409`: mostrar snackbar con el mensaje del servidor
- Otros: mostrar snackbar "Error inesperado. Intentá de nuevo." y propagar

Ambos interceptores se registran en `app.config.ts` con `withInterceptors([authInterceptor, errorInterceptor])` — en ese orden.

**Acceptance:**
Request a un endpoint protegido incluye el header `Authorization`. Recibir un 401 desloguea al usuario y lo redirige a `/login`. `authGuard` en rutas protegidas redirige a `/login` si no hay token.

---

### Task 15: `LoginComponent` y `RegistroComponent`
**Repo:** admin
**Files affected:**
- `admin/src/app/features/auth/login/login.component.ts`
- `admin/src/app/features/auth/login/login.component.html`
- `admin/src/app/features/auth/login/login.component.scss`
- `admin/src/app/features/auth/registro/registro.component.ts`
- `admin/src/app/features/auth/registro/registro.component.html`
- `admin/src/app/features/auth/registro/registro.component.scss`

**Description:**
Ambos componentes son standalone, con `ChangeDetectionStrategy.OnPush`.

**`LoginComponent`:**
Reactive form tipado (`FormGroup<{email: FormControl<string>, password: FormControl<string>}>`). Validadores: `Validators.required` y `Validators.email` en email; `Validators.required` en password. Al submit, llama `authService.login()`. Mientras el request está en vuelo, mostrar un spinner y deshabilitar el botón. En error `EMAIL_NOT_VERIFIED`, mostrar un mensaje específico con un link "Reenviar verificación" que navega (o abre un dialog) al flujo de reenvío. En error `INVALID_CREDENTIALS`, mostrar mensaje debajo del formulario. UI construida con Angular Material: `MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatProgressSpinnerModule`.

**`RegistroComponent`:**
Reactive form tipado con campos: `email`, `password`, `nombre`, `organizacion`. Validadores client-side: email format, password mínimo 8 caracteres y patrón `.*\d.*`, campos requeridos. Al submit exitoso, no redirigir — mostrar en su lugar un panel/card con el mensaje "Revisá tu correo para confirmar tu cuenta." y un botón "Reenviar verificación" que llama al endpoint de reenvío. Errores de servidor (`409 EMAIL_ALREADY_EXISTS`, `400` con errores de campo) se muestran via `errorInterceptor` (snackbar) o en el campo correspondiente si el interceptor propaga el error.

**Acceptance:**
Formularios no permiten submit si hay campos inválidos. Mensajes de error client-side son visibles antes de enviar el request. El flujo completo de registro (submit → mensaje de verificación) y login (submit → dashboard) funciona end-to-end en el browser.

---

### Task 16: Scaffolding Next.js mini-sitio
**Repo:** site
**Files affected:**
- Todo el scaffolding generado por `create-next-app`
- `site/middleware.ts`

**Description:**
Ejecutar `npx create-next-app@latest site --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"` en la carpeta `site/`. Eliminar el contenido de ejemplo de `src/app/page.tsx` y reemplazar por un placeholder mínimo.

Crear `site/src/middleware.ts` que extraiga el slug del subdominio del hostname de la request y lo inyecte como header `x-slug` para que los Server Components lo consuman. Lógica: si `hostname === 'localhost'` o `hostname === tuplataforma.com` (dominio raíz), no inyectar slug. Si `hostname === '{slug}.tuplataforma.com'`, extraer la primera parte y setear `request.headers.set('x-slug', slug)`. El middleware aplica solo a rutas públicas (`matcher` que excluye `/_next/`, `/api/`, `/favicon.ico`).

No hay auth en el mini-sitio — todas las rutas son públicas. No implementar ninguna página de congreso en esta historia (eso corresponde a historias de epic E2).

**Acceptance:**
`npm run dev` levanta en `http://localhost:3000` sin errores. El middleware compila sin errores TypeScript. Acceder desde un host con subdominio (simulado via `/etc/hosts`) setea el header `x-slug` correctamente.

---

## Database changes

### Tabla nueva: `usuarios`

| Columna | Tipo PostgreSQL | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `email` | `varchar(254)` | NO | — | Índice único |
| `password_hash` | `text` | NO | — | BCrypt output |
| `nombre` | `varchar(200)` | NO | — | |
| `organizacion` | `varchar(200)` | NO | — | |
| `email_verificado` | `boolean` | NO | `false` | |
| `verification_token` | `varchar(32)` | YES | `NULL` | Hex sin guiones |
| `verification_token_expires_at` | `timestamptz` | YES | `NULL` | UTC |
| `created_at` | `timestamptz` | NO | `NOW()` | No updatable |

**Índices:**
- `PK` en `id`
- `UNIQUE` en `email`
- Índice simple en `verification_token` (para búsqueda al verificar)

### Tabla nueva: `refresh_tokens`

| Columna | Tipo PostgreSQL | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `usuario_id` | `uuid` | NO | — | FK → `usuarios.id` CASCADE DELETE |
| `token_hash` | `varchar(64)` | NO | — | SHA-256 hex del token raw |
| `expires_at` | `timestamptz` | NO | — | UTC, 7 días desde creación |
| `revoked` | `boolean` | NO | `false` | |

**Índices:**
- `PK` en `id`
- Índice simple en `token_hash` (búsqueda en cada refresh)
- Índice en `(usuario_id, revoked)` para queries de cleanup futuras

### Migraciones

Una única migración inicial: `InitialCreate`. Generada con EF Core tooling, aplicada con `dotnet ef database update`. Las migraciones futuras nunca modifican esta migración.

---

## API contract

### `POST /api/auth/registro`

**Request:**
```json
{
  "email": "org@example.com",
  "password": "MiPassword1",
  "nombre": "María García",
  "organizacion": "Universidad Nacional"
}
```

**Response 201 Created:**
```json
{ "message": "Cuenta creada. Revisá tu correo para confirmar tu email." }
```

**Response 400 Bad Request** (campo inválido):
```json
{
  "errors": {
    "email": ["El formato del email no es válido."],
    "password": ["La contraseña debe tener al menos 8 caracteres y contener al menos 1 número."]
  }
}
```

**Response 409 Conflict** (email duplicado):
```json
{ "error": "EMAIL_ALREADY_EXISTS", "message": "El email ya está registrado." }
```

---

### `GET /api/auth/verificar-email?token={token}`

**Response 200 OK:**
```json
{ "message": "Email verificado correctamente. Ya podés iniciar sesión." }
```

**Response 400 Bad Request:**
```json
{ "error": "TOKEN_INVALID", "message": "El enlace de verificación no es válido." }
```
```json
{ "error": "TOKEN_EXPIRED", "message": "El enlace de verificación expiró. Solicitá uno nuevo." }
```

---

### `POST /api/auth/reenviar-verificacion`

**Request:**
```json
{ "email": "org@example.com" }
```

**Response 200 OK** (siempre, independientemente de si el email existe):
```json
{ "message": "Si el email existe y no está verificado, recibirás un nuevo enlace." }
```

---

### `POST /api/auth/login`

**Request:**
```json
{ "email": "org@example.com", "password": "MiPassword1" }
```

**Response 200 OK:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "base64string...",
  "expiresIn": 900
}
```

**Response 401 Unauthorized** (credenciales incorrectas):
```json
{ "error": "INVALID_CREDENTIALS", "message": "Credenciales inválidas." }
```

**Response 403 Forbidden** (email no verificado):
```json
{ "error": "EMAIL_NOT_VERIFIED", "message": "Debés confirmar tu email antes de iniciar sesión." }
```

---

### `POST /api/auth/refresh`

**Request:**
```json
{ "refreshToken": "base64string..." }
```

**Response 200 OK:** misma estructura que Login 200.

**Response 401 Unauthorized:**
```json
{ "error": "REFRESH_TOKEN_INVALID", "message": "El token de refresco no es válido o expiró." }
```

---

### `GET /api/dashboard/test` *(endpoint de validación, solo US-1)*

**Response 200 OK** (JWT válido):
```json
{ "email": "org@example.com" }
```

**Response 401 Unauthorized:** body vacío (estándar JWT Bearer).

---

## Security checklist

- [ ] BCrypt work factor 12 aplicado en todos los hashes de contraseña
- [ ] `verification_token` generado con `Guid.NewGuid().ToString("N")` (32 chars hex, no predecible por secuencia)
- [ ] Refresh token raw generado con `RandomNumberGenerator.GetBytes(64)` (CSPRNG)
- [ ] Solo el SHA-256 del refresh token se almacena en BD — el raw nunca toca la base de datos
- [ ] Login aplica timing-safe compare: si el usuario no existe, ejecutar BCrypt con datos dummy antes de retornar 401 para prevenir user enumeration por timing
- [ ] `reenviar-verificacion` siempre retorna 200 independientemente de si el email existe en el sistema
- [ ] `ClockSkew = TimeSpan.Zero` en la validación JWT — sin margen de tolerancia extra
- [ ] `Jwt:SecretKey` cargado exclusivamente desde variable de entorno o user-secrets, nunca hardcodeado en código fuente ni en `appsettings.json` comiteado
- [ ] CORS configurado explícitamente con lista de orígenes permitidos — nunca `AllowAnyOrigin()` en producción
- [ ] Refresh token marcado como `Revoked = true` al ser utilizado (rotación) — el token anterior no puede reutilizarse
- [ ] `VerificationToken` se nullifica tras la verificación exitosa — el enlace es de un solo uso
- [ ] `[ApiController]` en el controller activa validación automática de Data Annotations — retorna 400 antes de llegar al servicio si el body es inválido
- [ ] Los logs no registran passwords, tokens raw ni hashes — solo IDs y emails

---

## Risks

| ID | Descripción | Probabilidad | Impacto | Mitigación |
|----|-------------|-------------|---------|-----------|
| R-1 | `Jwt:SecretKey` con entropía insuficiente (ej: contraseña corta) comprometería todos los tokens | Baja | Alto | Documentar en onboarding que la clave debe ser mínimo 32 bytes aleatorios. Validar longitud en startup con `IStartupFilter` y lanzar excepción si es menor a 32 chars |
| R-2 | Emails de verificación aterrizan en spam, bloqueando onboarding de organizadores | Media | Alto | Configurar SPF/DKIM/DMARC en Resend para el dominio de envío antes del launch. Prioridad P1 de infraestructura, no de código |
| R-3 | Acumulación de refresh tokens en BD sin expirar (usuarios que nunca hacen logout explícito) | Media | Bajo | Agregar un job de cleanup periódico en Phase 2. Para Phase 1, documentar la deuda técnica y el índice `(usuario_id, revoked)` ya habilita el cleanup futuro eficientemente |
| R-4 | Refresh token robado antes de rotación — el atacante usa el token antes que el usuario legítimo | Baja | Alto | Implementar detección de reutilización de refresh token en Phase 2 (si un token revocado es presentado, revocar toda la familia de tokens del usuario). Para Phase 1, la rotación en cada uso limita la ventana de ataque |
| R-5 | Contrato entre US-1 y el futuro flujo de cambio de contraseña (US-X Phase 2): refresh tokens activos no se invalidan al cambiar password | Baja | Alto | Documentado en story.md como FR-4. Al implementar cambio de contraseña (Phase 2), el DEV debe revocar todos los `RefreshToken` del usuario como parte de la misma transacción |
| R-6 | `dotnet ef migrations` aplicada sobre BD de producción sin revisión manual puede causar pérdida de datos | Baja | Alto | Regla de proyecto: ninguna migración se aplica en producción sin revisión del TL del SQL generado. Configurar CI para que genere el script SQL (`dotnet ef migrations script`) como artefacto de PR |

---

## Open questions for DEV

1. **URL base del backend en Angular**: la URL base de la API (`environment.apiUrl`) debe configurarse en `admin/src/environments/environment.ts` y `environment.production.ts`. Confirmar si Railway expone un dominio fijo en Phase 1 o si se usa una variable de entorno en el build de Angular (`NG_APP_API_URL`). Acción: confirmar con el equipo de infraestructura antes de implementar Task 11.

2. **Dominio de envío de emails en Resend**: el campo `from` del email de verificación requiere un dominio verificado en Resend. Confirmar qué dominio se usa en Development (Resend ofrece `onboarding@resend.dev` para testing sin verificación de dominio). Acción: el DEV de Task 6 debe usar `onboarding@resend.dev` en Development y dejar el dominio de producción como variable de entorno `Resend:FromAddress`.

3. **Tema Angular Material**: el UX no ha producido design spec para US-1 (la story es fundacional, no hay pantallas definitivas). El DEV debe usar el tema pre-built de Material como placeholder. Acción: cuando el UX produzca `design-baseline.md`, el tema custom se aplicará en una tarea posterior sin afectar la funcionalidad de auth.
