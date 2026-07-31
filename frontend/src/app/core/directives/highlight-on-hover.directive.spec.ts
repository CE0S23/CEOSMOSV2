import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HighlightOnHoverDirective } from './highlight-on-hover.directive';

@Component({
  standalone: true,
  imports: [HighlightOnHoverDirective],
  template: `<article id="target" appHighlightOnHover>Contenido real</article>`,
})
class DefaultHostComponent {}

@Component({
  standalone: true,
  imports: [HighlightOnHoverDirective],
  template: `<div id="custom" appHighlightOnHover highlightClass="glow-card">Contenido real</div>`,
})
class CustomClassHostComponent {}

describe('HighlightOnHoverDirective', () => {
  describe('clase por defecto', () => {
    let fixture: ComponentFixture<DefaultHostComponent>;
    let el: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [DefaultHostComponent] }).compileComponents();
      fixture = TestBed.createComponent(DefaultHostComponent);
      el = fixture.nativeElement.querySelector('#target') as HTMLElement;
    });

    it('agrega highlight-on-hover al entrar el puntero', () => {
      el.dispatchEvent(new PointerEvent('pointerenter'));
      expect(el.classList.contains('highlight-on-hover')).toBeTrue();
    });

    it('la elimina al salir el puntero', () => {
      el.dispatchEvent(new PointerEvent('pointerenter'));
      expect(el.classList.contains('highlight-on-hover')).toBeTrue();
      el.dispatchEvent(new PointerEvent('pointerleave'));
      expect(el.classList.contains('highlight-on-hover')).toBeFalse();
    });

    it('no toca la clase cuando no hay interacción', () => {
      expect(el.classList.contains('highlight-on-hover')).toBeFalse();
    });
  });

  describe('clase personalizada', () => {
    let fixture: ComponentFixture<CustomClassHostComponent>;
    let el: HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CustomClassHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(CustomClassHostComponent);
      el = fixture.nativeElement.querySelector('#custom') as HTMLElement;
    });

    it('usa highlightClass en lugar de la clase por defecto', () => {
      el.dispatchEvent(new PointerEvent('pointerenter'));
      expect(el.classList.contains('glow-card')).toBeTrue();
      expect(el.classList.contains('highlight-on-hover')).toBeFalse();
    });
  });
});
