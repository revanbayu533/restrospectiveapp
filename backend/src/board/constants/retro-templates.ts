export interface RetroColumn {
  name: string;
  order: number;
  description?: string;
}

export interface RetroTemplate {
  id: string;
  name: string;
  description: string;
  columns: RetroColumn[];
}

export const RETRO_TEMPLATES: Record<string, RetroTemplate> = {
  'start-stop-continue': {
    id: 'start-stop-continue',
    name: 'Start, Stop, Continue',
    description: 'Format klasik untuk mengidentifikasi ide baru, kebiasaan buruk yang harus dihentikan, dan hal baik yang perlu dilanjutkan.',
    columns: [
      { name: 'Start', order: 1, description: 'Hal baru yang harus mulai dilakukan' },
      { name: 'Stop', order: 2, description: 'Hal yang tidak efektif dan harus dihentikan' },
      { name: 'Continue', order: 3, description: 'Hal yang berjalan baik dan harus dilanjutkan' },
    ],
  },
  'mad-sad-glad': {
    id: 'mad-sad-glad',
    name: 'Mad, Sad, Glad',
    description: 'Format berfokus pada emosi tim untuk mengevaluasi pengalaman kerja selama sprint.',
    columns: [
      { name: 'Mad', order: 1, description: 'Hal yang membuat frustrasi atau menghambat tim' },
      { name: 'Sad', order: 2, description: 'Hal yang mengecewakan atau kurang memuaskan' },
      { name: 'Glad', order: 3, description: 'Hal yang membuat tim senang dan bangga' },
    ],
  },
  '4ls': {
    id: '4ls',
    name: '4Ls (Liked, Learned, Lacked, Longed For)',
    description: 'Format komprehensif untuk mengeksplorasi pembelajaran dan harapan tim di masa depan.',
    columns: [
      { name: 'Liked', order: 1, description: 'Hal yang disukai selama sesi/sprint' },
      { name: 'Learned', order: 2, description: 'Pelajaran atau insight baru yang didapatkan' },
      { name: 'Lacked', order: 3, description: 'Hal yang dirasa kurang atau dibutuhkan' },
      { name: 'Longed For', order: 4, description: 'Harapan atau keinginan untuk sprint berikutnya' },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom (Bebas / Tanpa Template)',
    description: 'Tentukan dan buat nama kolom sesuai keinginan dan alur tim Anda secara bebas.',
    columns: [
      { name: 'Kolom 1', order: 1 },
      { name: 'Kolom 2', order: 2 },
    ],
  },
};

/**
 * Mengambil daftar kolom untuk template tertentu
 */
export function getTemplateColumns(templateId: string): RetroColumn[] {
  const template = RETRO_TEMPLATES[templateId] || RETRO_TEMPLATES['start-stop-continue'];
  return template.columns;
}

/**
 * Mengambil semua template yang tersedia
 */
export function getAllTemplates(): RetroTemplate[] {
  return Object.values(RETRO_TEMPLATES);
}
