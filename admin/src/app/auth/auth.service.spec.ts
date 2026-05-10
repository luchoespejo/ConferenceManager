import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, LoginDto, RegistroDto } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('should send login request and store session', (done) => {
      const loginDto: LoginDto = { email: 'user@example.com', password: 'password123' };
      const mockResponse = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        expiresIn: 3600,
        usuario: {
          id: 'user-id',
          email: 'user@example.com',
          nombre: 'Test User',
          organizacion: 'Test Org'
        }
      };

      service.login(loginDto).subscribe(() => {
        expect(service.accessToken()).toBe('access_token_123');
        expect(service.usuario()?.email).toBe('user@example.com');
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginDto);
      req.flush(mockResponse);
    });

    it('should store tokens in localStorage', (done) => {
      const loginDto: LoginDto = { email: 'user@example.com', password: 'password123' };
      const mockResponse = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        expiresIn: 3600,
        usuario: { id: 'user-id', email: 'user@example.com', nombre: 'Test User' }
      };

      service.login(loginDto).subscribe(() => {
        expect(localStorage.getItem('access_token')).toBe('access_token_123');
        expect(localStorage.getItem('refresh_token')).toBe('refresh_token_456');
        expect(localStorage.getItem('usuario')).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(mockResponse);
    });
  });

  describe('registro', () => {
    it('should send registration request', (done) => {
      const registroDto: RegistroDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        nombre: 'New User',
        organizacion: 'New Org'
      };

      service.registro(registroDto).subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/registro`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registroDto);
      req.flush(null);
    });
  });

  describe('logout', () => {
    it('should clear session and navigate to login', () => {
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('refresh_token', 'refresh');
      localStorage.setItem('usuario', JSON.stringify({ id: '1', email: 'test@example.com' }));

      service.logout();

      expect(service.accessToken()).toBeNull();
      expect(service.usuario()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('refresh', () => {
    it('should refresh access token', (done) => {
      localStorage.setItem('refresh_token', 'old_refresh_token');

      const mockResponse = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 3600,
        usuario: { id: 'user-id', email: 'user@example.com', nombre: 'Test User' }
      };

      service.refresh().subscribe(() => {
        expect(service.accessToken()).toBe('new_access_token');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.refreshToken).toBe('old_refresh_token');
      req.flush(mockResponse);
    });
  });

  describe('isAuthenticated signal', () => {
    it('should return true when access token is present', (done) => {
      const loginDto: LoginDto = { email: 'user@example.com', password: 'password123' };
      const mockResponse = {
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_456',
        expiresIn: 3600,
        usuario: { id: 'user-id', email: 'user@example.com', nombre: 'Test User' }
      };

      service.login(loginDto).subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(mockResponse);
    });

    it('should return false when no access token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
