export type PersonaType =
  | 'skrblik'
  | 'investor'
  | 'technik'
  | 'ekolog'
  | 'lhostejny'
  | 'novacek';

export const PERSONA_TYPES: Record<
  PersonaType,
  { name: string; imagePath: string; aiHint: string }
> = {
  skrblik: {
    name: 'Skrblík',
    imagePath: '/personas/skrblik.png',
    aiHint:
      'Je primárně motivován náklady. Každý výdaj mu přijde zbytečný, ptá se „kolik to stojí?" a „nelze to udělat levněji?". Opakovaně vznáší námitky k ceně a výši fondu oprav.',
  },
  investor: {
    name: 'Investor',
    imagePath: '/personas/investor.png',
    aiHint:
      'Přemýšlí o nemovitosti jako o investici. Zajímá ho návratnost, zhodnocení bytu a efektivita nákladů. Je analytický, chce čísla a data.',
  },
  technik: {
    name: 'Technický kritik',
    imagePath: '/personas/technik.png',
    aiHint:
      'Má technické vzdělání nebo zálibu. Zpochybňuje kvalitu materiálů, odbornost zhotovitelů a technická řešení. Chce dokumentaci a reference.',
  },
  ekolog: {
    name: 'Ekologický nadšenec',
    imagePath: '/personas/ekolog.png',
    aiHint:
      'Primárně ho zajímá ekologický dopad a udržitelnost. Prosazuje zelená řešení, fotovoltaiku, zateplení. Odmítá scénáře bez ekologického přínosu.',
  },
  lhostejny: {
    name: 'Lhostejný',
    imagePath: '/personas/lhostejny.png',
    aiHint:
      'Nemá zájem se angažovat. Na schůze nechodí nebo mlčí. Schválí cokoliv, ale aktivně nepomáhá. Rozhoduje se pozdě a na poslední chvíli.',
  },
  novacek: {
    name: 'Nováček',
    imagePath: '/personas/novacek.png',
    aiHint:
      'Čerstvě se nastěhoval, nezná ostatní ani historii domu. Klade základní otázky, potřebuje vysvětlení kontextu. Je otevřený, ale nejistý.',
  },
};
