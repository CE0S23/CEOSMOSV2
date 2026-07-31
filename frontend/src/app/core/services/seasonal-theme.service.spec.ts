import { TestBed } from '@angular/core/testing';
import { SeasonalThemeService, seasonForMonth, SEASON_PALETTES } from './seasonal-theme.service';

describe('seasonForMonth', () => {
  it('invierno: diciembre, enero y febrero (11, 0, 1)', () => {
    expect(seasonForMonth(11)).toBe('invierno');
    expect(seasonForMonth(0)).toBe('invierno');
    expect(seasonForMonth(1)).toBe('invierno');
  });

  it('primavera: marzo, abril y mayo (2, 3, 4)', () => {
    expect(seasonForMonth(2)).toBe('primavera');
    expect(seasonForMonth(3)).toBe('primavera');
    expect(seasonForMonth(4)).toBe('primavera');
  });

  it('verano: junio, julio y agosto (5, 6, 7)', () => {
    expect(seasonForMonth(5)).toBe('verano');
    expect(seasonForMonth(6)).toBe('verano');
    expect(seasonForMonth(7)).toBe('verano');
  });

  it('otoño: septiembre, octubre y noviembre (8, 9, 10)', () => {
    expect(seasonForMonth(8)).toBe('otono');
    expect(seasonForMonth(9)).toBe('otono');
    expect(seasonForMonth(10)).toBe('otono');
  });
});

describe('SeasonalThemeService', () => {
  let service: SeasonalThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeasonalThemeService);
    service.reset();
  });

  afterEach(() => {
    service.reset();
  });

  it('debe crearse y aplicar la estación del mes actual', () => {
    expect(service).toBeTruthy();
    const expected = seasonForMonth(new Date().getMonth());
    expect(service.season()).toBe(expected);
    expect(document.documentElement.getAttribute('data-season')).toBe(expected);
  });

  it('debe aplicar una estación manualmente y sobrescribir variables CSS', () => {
    service.applySeason('verano');
    expect(service.season()).toBe('verano');
    expect(service.mode()).toBe('manual');
    expect(service.palette()).toEqual(SEASON_PALETTES.verano);
    expect(document.documentElement.getAttribute('data-season')).toBe('verano');
    expect(document.documentElement.style.getPropertyValue('--cosmos-aurora')).toBe(SEASON_PALETTES.verano.aurora);
  });

  it('debe volver a auto y recalcular la estación', () => {
    service.applySeason('invierno');
    service.setAuto();
    expect(service.mode()).toBe('auto');
    expect(service.season()).toBe(seasonForMonth(new Date().getMonth()));
  });

  it('cycleNext debe recorrer las estaciones en orden', () => {
    service.applySeason('primavera');
    expect(service.cycleNext()).toBe('verano');
    expect(service.cycleNext()).toBe('otono');
    expect(service.cycleNext()).toBe('invierno');
    expect(service.cycleNext()).toBe('primavera');
  });

  it('reset debe limpiar las variables CSS aplicadas', () => {
    service.applySeason('otono');
    service.reset();
    expect(document.documentElement.style.getPropertyValue('--cosmos-aurora')).toBe('');
  });
});
