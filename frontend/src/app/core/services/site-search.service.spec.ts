import { TestBed } from '@angular/core/testing';
import { SiteSearchService } from './site-search.service';

describe('SiteSearchService', () => {
  let service: SiteSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SiteSearchService);
  });

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  it('devuelve al menos un resultado para un término existente', () => {
    const results = service.search('tareas');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain('tareas');
  });

  it('devuelve resultados al buscar por descripción o keywords', () => {
    const results = service.search('crud');
    expect(results.length).toBeGreaterThan(0);
  });

  it('devuelve arreglo vacío para un término inexistente', () => {
    const results = service.search('zzzznoexiste');
    expect(results).toEqual([]);
  });

  it('devuelve arreglo vacío para una búsqueda en blanco', () => {
    expect(service.search('   ')).toEqual([]);
  });
});
