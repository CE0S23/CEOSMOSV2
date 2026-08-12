import { Injectable, signal, computed } from '@angular/core';
import { CosmosImage, MusicTrack, InspirationQuote, FeedItem } from '../models/feed-item.model';

const IMAGES: CosmosImage[] = [
  { id: 'img-1', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80', title: 'Via Lactea', category: 'space', height: 320 },
  { id: 'img-2', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', title: 'Montanas Serenas', category: 'nature', height: 240 },
  { id: 'img-3', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', title: 'Tierra desde el Espacio', category: 'space', height: 280 },
  { id: 'img-4', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800&q=80', title: 'Aurora Boreal', category: 'space', height: 360 },
  { id: 'img-5', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', title: 'Bosque Tranquilo', category: 'nature', height: 260 },
  { id: 'img-6', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80', title: 'Oceano Cosmico', category: 'nature', height: 300 },
  { id: 'img-7', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80', title: 'Arquitectura Moderna', category: 'architecture', height: 220 },
  { id: 'img-8', url: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&q=80', title: 'Diseno Minimalista', category: 'architecture', height: 340 },
  { id: 'img-9', url: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800&q=80', title: 'Arte Abstracto', category: 'art', height: 280 },
  { id: 'img-10', url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80', title: 'Galaxia Espiral', category: 'space', height: 300 },
  { id: 'img-11', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', title: 'Lago Cristalino', category: 'nature', height: 260 },
  { id: 'img-12', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', title: 'Arte Digital', category: 'art', height: 320 },
];

const TRACKS: MusicTrack[] = [
  { id: 'trk-1', name: 'Lofi Hip Hop Radio', embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk', type: 'lofi', description: 'Beats relajantes para estudiar' },
  { id: 'trk-2', name: 'Alpha Waves Focus', embedUrl: 'https://www.youtube.com/embed/WPni755-Krg', type: 'alpha', description: 'Frecuencias alfa para concentracion profunda' },
  { id: 'trk-3', name: 'Ambient Space Music', embedUrl: 'https://www.youtube.com/embed/1-RW82JF7EM', type: 'ambient', description: 'Musica espacial ambiental' },
  { id: 'trk-4', name: 'Deep Focus Mix', embedUrl: 'https://www.youtube.com/embed/5qap5aO4i9A', type: 'alpha', description: 'Ondas binaurales para trabajo profundo' },
  { id: 'trk-5', name: 'Jazz para Estudiar', embedUrl: 'https://www.youtube.com/embed/Dx5qFachd3A', type: 'lofi', description: 'Jazz suave para concentracion' },
  { id: 'trk-6', name: 'Cosmic Ambient', embedUrl: 'https://www.youtube.com/embed/mvvFMilNDfE', type: 'ambient', description: 'Sonidos del cosmos para relajacion' },
];

const QUOTES: InspirationQuote[] = [
  { id: 'qt-1', text: 'El trabajo profundo es como un superpoder en nuestra economia cada vez mas competitiva.', author: 'Cal Newport', category: 'focus' },
  { id: 'qt-2', text: 'La creatividad es la inteligencia divirtiendose.', author: 'Albert Einstein', category: 'creativity' },
  { id: 'qt-3', text: 'El enfoque es la nueva moneda de la economia del conocimiento.', author: 'Nir Eyal', category: 'focus' },
  { id: 'qt-4', text: 'En el estado de flujo, el tiempo desaparece y solo existe el presente.', author: 'Mihaly Csikszentmihalyi', category: 'motivation' },
];

function buildFeed(): FeedItem[] {
  const items: FeedItem[] = [];
  let trackIndex = 0;
  let quoteIndex = 0;

  IMAGES.forEach((img, i) => {
    items.push({ id: `feed-img-${img.id}`, type: 'image', data: img });
    if ((i + 1) % 4 === 0 && trackIndex < TRACKS.length) {
      items.push({ id: `feed-trk-${TRACKS[trackIndex].id}`, type: 'music', data: TRACKS[trackIndex++] });
    }
    if ((i + 1) % 6 === 0 && quoteIndex < QUOTES.length) {
      items.push({ id: `feed-qt-${QUOTES[quoteIndex].id}`, type: 'quote', data: QUOTES[quoteIndex++] });
    }
  });

  return items;
}

@Injectable({ providedIn: 'root' })
export class FeedDataService {
  private readonly _feed = signal<FeedItem[]>(buildFeed());
  private readonly _activeTrackId = signal<string | null>(null);
  private readonly _searchTerm = signal<string>('');

  readonly feed = computed(() => {
    const term = this._searchTerm().toLowerCase().trim();
    if (!term) return this._feed();
    return this._feed().filter(item => {
      if (item.type === 'image') return (item.data as CosmosImage).title.toLowerCase().includes(term);
      if (item.type === 'music') return (item.data as MusicTrack).name.toLowerCase().includes(term);
      return true;
    });
  });

  readonly activeTrackId = this._activeTrackId.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();

  readonly randomQuote = computed(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  getImages(): CosmosImage[] { return IMAGES; }
  getTracks(): MusicTrack[] { return TRACKS; }

  setActiveTrack(id: string | null): void { this._activeTrackId.set(id); }

  updateSearch(term: string): void { this._searchTerm.set(term); }

  refreshQuote(): InspirationQuote {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  getFeedSnapshot(): FeedItem[] {
    return this._feed();
  }
}
