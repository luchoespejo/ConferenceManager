import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CongresoService } from './congreso.service';
import { environment } from '../../environments/environment';

describe('CongresoService', () => {
  let service: CongresoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/dashboard/conferencias`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CongresoService]
    });
    service = TestBed.inject(CongresoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getMisCongresos', () => {
    it('should fetch list of user congresses', (done) => {
      const mockCongresos = [
        { id: '1', nombre: 'Tech Conf 2026', slug: 'tech-conf-2026', estado: 'Borrador', creadoEn: new Date() },
        { id: '2', nombre: 'Web Summit', slug: 'web-summit', estado: 'Publicado', creadoEn: new Date() }
      ];

      service.getMisCongresos().subscribe(congresos => {
        expect(congresos.length).toBe(2);
        expect(congresos[0].nombre).toBe('Tech Conf 2026');
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockCongresos);
    });
  });

  describe('getById', () => {
    it('should fetch congress details by id', (done) => {
      const congresoId = 'congress-123';
      const mockCongreso = {
        id: congresoId,
        nombre: 'Tech Conf 2026',
        slug: 'tech-conf-2026',
        descripcion: 'Tech conference',
        estado: 'Borrador'
      };

      service.getById(congresoId).subscribe(congreso => {
        expect(congreso.id).toBe(congresoId);
        expect(congreso.nombre).toBe('Tech Conf 2026');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/${congresoId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCongreso);
    });
  });

  describe('create', () => {
    it('should create new congress', (done) => {
      const createDto = {
        nombre: 'New Conf',
        slug: 'new-conf',
        descripcion: 'Description',
        fechaInicio: new Date('2026-06-01'),
        fechaFin: new Date('2026-06-02'),
        venueName: 'Venue'
      };

      const mockResponse = { id: 'new-id', ...createDto, estado: 'Borrador' };

      service.create(createDto).subscribe(congreso => {
        expect(congreso.id).toBe('new-id');
        expect(congreso.nombre).toBe('New Conf');
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should update congress details', (done) => {
      const congresoId = 'congress-123';
      const updateDto = { nombre: 'Updated Name', descripcion: 'Updated desc' };
      const mockResponse = { id: congresoId, ...updateDto, estado: 'Borrador' };

      service.update(congresoId, updateDto).subscribe(congreso => {
        expect(congreso.nombre).toBe('Updated Name');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/${congresoId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete congress', (done) => {
      const congresoId = 'congress-123';

      service.delete(congresoId).subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/${congresoId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('publicar', () => {
    it('should publish congress', (done) => {
      const congresoId = 'congress-123';
      const mockResponse = { id: congresoId, nombre: 'Tech Conf', estado: 'Publicado' };

      service.publicar(congresoId).subscribe(congreso => {
        expect(congreso.estado).toBe('Publicado');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/${congresoId}/publicar`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('finalizar', () => {
    it('should finalize congress', (done) => {
      const congresoId = 'congress-123';
      const mockResponse = { id: congresoId, nombre: 'Tech Conf', estado: 'Finalizado' };

      service.finalizar(congresoId).subscribe(congreso => {
        expect(congreso.estado).toBe('Finalizado');
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/${congresoId}/finalizar`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });
});
