import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlightOnHover]',
  standalone: true,
})
export class HighlightOnHoverDirective {
  @Input() highlightClass = 'highlight-on-hover';

  private readonly host: HTMLElement;

  constructor(private readonly el: ElementRef<HTMLElement>, private readonly renderer: Renderer2) {
    this.host = this.el.nativeElement;
  }

  @HostListener('pointerenter')
  onPointerEnter(): void {
    this.renderer.addClass(this.host, this.highlightClass);
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    this.renderer.removeClass(this.host, this.highlightClass);
  }
}
