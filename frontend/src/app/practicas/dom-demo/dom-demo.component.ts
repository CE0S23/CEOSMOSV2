import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';

interface LogEntry {
  time: string;
  message: string;
}

@Component({
  selector: 'app-dom-demo',
  standalone: true,
  templateUrl: './dom-demo.component.html',
  styleUrl: './dom-demo.component.scss',
})
export class DomDemoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('listContainer') listContainer!: ElementRef<HTMLUListElement>;

  readonly items = signal<string[]>([]);
  readonly logEntries = signal<LogEntry[]>([]);
  readonly isListening = signal(false);

  private keyHandler: ((event: KeyboardEvent) => void) | null = null;

  ngAfterViewInit(): void {
    this.addItem('Elemento inicial creado vía ngAfterViewInit');
    this.log('Lista inicializada con ViewChild');
  }

  addItem(label?: string): void {
    const value = label ?? this.randomLabel();
    this.items.update(items => [...items, value]);
    this.log(`item agregado: "${value}"`);
  }

  removeLast(): void {
    if (this.items().length === 0) return;
    const removed = this.items()[this.items().length - 1];
    this.items.update(items => items.slice(0, -1));
    this.log(`item removido: "${removed}"`);
  }

  removeItem(item: string): void {
    this.items.update(list => list.filter(i => i !== item));
    this.log(`item eliminado: "${item}"`);
  }

  clearItems(): void {
    this.items.set([]);
    this.log('lista vaciada');
  }

  insertBefore(): void {
    const value = this.randomLabel();
    this.items.update(items => [value, ...items]);
    this.log(`item insertado al inicio: "${value}"`);
  }

  /** Manipulación directa del DOM sin Angular: crear y anexar <li> manualmente. */
  addItemViaNativeApi(): void {
    const li = document.createElement('li');
    li.className = 'dom-item native';
    li.textContent = `Creado con createElement en ${new Date().toLocaleTimeString()}`;
    li.addEventListener('click', () => {
      this.log(`click en elemento nativo: ${li.textContent}`);
    });
    this.listContainer?.nativeElement.appendChild(li);
    this.log('Elemento <li> creado con createElement() y appendChild()');
  }

  /** Escucha de eventos a nivel document para demostrar delegación. */
  toggleGlobalListener(): void {
    if (this.isListening()) {
      if (this.keyHandler) {
        document.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
      }
      this.isListening.set(false);
      this.log('Listener global de teclado removido');
      return;
    }

    this.keyHandler = (event: KeyboardEvent) => {
      this.log(`Tecla presionada: "${event.key}" (delegación de eventos)`, true);
    };
    document.addEventListener('keydown', this.keyHandler);
    this.isListening.set(true);
    this.log('Listener global de teclado registrado (delegación de eventos)');
  }

  ngOnDestroy(): void {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }

  private randomLabel(): string {
    const adjectives = ['Galaxia', 'Nebulosa', 'Quasar', 'Supernova', 'Cometa', 'Estrella'];
    const nouns = ['alfa', 'beta', 'gamma', 'delta', 'omega'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }

  private log(message: string, throttle?: boolean): void {
    const entry: LogEntry = { time: new Date().toLocaleTimeString(), message };
    if (throttle) {
      const last = this.logEntries()[0];
      if (last && last.message === message) return;
    }
    this.logEntries.update(entries => [entry, ...entries].slice(0, 30));
  }
}
