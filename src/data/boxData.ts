export const BUSINESS_INFO = {
  brandName: 'Crossfit Ebber',
  legalName: 'Ebber Atividades Físicas',
  whatsappRaw: '5531986325827',
  whatsappDisplay: '(31) 98632-5827',
  instagramHandle: '@ebberwillian',
  instagramUrl: 'https://www.instagram.com/ebberwillian/',
  addressStreet: 'Rua Refinaria União, 124',
  addressReference: 'Em frente à UPA Petrolândia',
  addressNeighborhood: 'Bairro Petrolândia, Contagem/MG',
  addressFull:
    'Rua Refinaria União, 124 (Em frente à UPA Petrolândia) - Petrolândia, Contagem/MG',
  addressSearchQuery:
    'Rua Refinaria União, 124, Petrolândia, Contagem, MG, Brasil',
  addressCoverage: 'Divisa/fronteira com Betim',
  openingHours: '06:00 às 22:00',
  openingDays: 'Segunda a Sexta · 06:00 às 22:00',
  trialOffer: '2 dias de aula experimental',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Rua+Refinaria+Uniao+124+Petrolandia+Contagem+MG',
  assets: {
    logoBanner: '/assets/ebber/logo-ebber-oficial.webp',
    logoCircle: '/assets/ebber/logo-circle.webp',
    logoShare: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_22.02.39_d4fcd800.jpeg',
    boxPhoto: '/assets/ebber/box-espaco.webp',
    boxComunidade: '/assets/ebber/box-comunidade.webp',
    boxTurmaPneu: '/assets/ebber/box-turma-pneu.webp',
    boxTreinoDupla: '/assets/ebber/box-treino-dupla.webp',
    boxEquipamentos: '/assets/ebber/box-equipamentos.webp',
    boxArgolasCorda: '/assets/ebber/box-argolas-corda.webp',
    boxSegunda: '/assets/ebber/box-segunda.webp',
    posterMente: '/assets/ebber/poster-mente-v2.webp',
    posterInvista: '/assets/ebber/poster-invista-v2.webp',
    posterSaude: '/assets/ebber/poster-saude-v2.webp',
    promoVideo:
      '/assets/aistudio/WhatsApp_Video_2026-11-13_at_09.31.13_43b81fe2.mp4',
  },
};

export function buildWhatsAppUrl(customMessage?: string): string {
  const defaultMsg =
    'Olá! Vi o site da Crossfit Ebber e gostaria de agendar meus 2 dias de aula experimental.';
  const text = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${text}`;
}

export type StructureCategory =
  | 'todos'
  | 'comunidade'
  | 'estrutura'
  | 'campanhas';

export interface GalleryItem {
  id: string;
  category: Exclude<StructureCategory, 'todos'>;
  categoryLabel: string;
  title: string;
  description: string;
  specs: string[];
  imageSrc: string;
  imageAlt: string;
  fitMode: 'cover-top' | 'cover-center' | 'contain';
  featured?: boolean;
}

export const BOX_GALLERY: GalleryItem[] = [
  {
    id: 'estrutura-real',
    category: 'estrutura',
    categoryLabel: 'Estrutura Real do Box',
    title: 'Piso Emborrachado, Wood Boxes, Cordas e Medicine Balls',
    description:
      'Espaço preparado na Rua Refinaria União com piso emborrachado de alta absorção, caixas de salto Wood Store, cordas navais, medicine balls e rig completo.',
    specs: [
      'Piso emborrachado profissional em toda a área',
      'Wood boxes, medicine balls, cordas navais e barras',
      'Atendimento no Petrolândia e divisa com Betim',
    ],
    imageSrc: BUSINESS_INFO.assets.boxPhoto,
    imageAlt:
      'Interior da Crossfit Ebber no Petrolândia com caixas Wood Store, cordas, medicine balls e piso emborrachado',
    fitMode: 'cover-center',
    featured: true,
  },
  {
    id: 'turma-comunidade',
    category: 'comunidade',
    categoryLabel: 'Comunidade & Turmas',
    title: 'Turmas Acolhedoras com o Coach Ebber',
    description:
      'Treino funcional e CrossFit em grupo sem julgamentos, com adaptação segura para iniciantes e ritmo progressivo.',
    specs: [
      'Acompanhamento próximo do início ao fim',
      'Ambiente leve que incentiva constância',
    ],
    imageSrc: BUSINESS_INFO.assets.boxComunidade,
    imageAlt:
      'Alunos sorridentes ao lado do coach Ebber dentro do box no Petrolândia',
    fitMode: 'cover-top',
  },
  {
    id: 'treino-pneu',
    category: 'comunidade',
    categoryLabel: 'Força & Parceria',
    title: 'Treinos Dinâmicos com Pneu e Caixas',
    description:
      'Exercícios funcionais variados que combinam força e gasto calórico para acelerar emagrecimento e definição.',
    specs: [
      'Treinos em dupla e equipe',
      'Carga ajustada para seu nível',
    ],
    imageSrc: BUSINESS_INFO.assets.boxTurmaPneu,
    imageAlt:
      'Coach Ebber e alunas ao lado do pneu de treino após aula funcional',
    fitMode: 'cover-top',
  },
  {
    id: 'treino-elastico',
    category: 'comunidade',
    categoryLabel: 'Condicionamento Físico',
    title: 'Sprints com Elástico e Alta Queima Calórica',
    description:
      'Estímulos metabólicos que melhoram o fôlego e aceleram a queima de gordura com segurança articular.',
    specs: [
      'Especialidade em emagrecimento',
      'Supervisão técnica em cada série',
    ],
    imageSrc: BUSINESS_INFO.assets.boxTreinoDupla,
    imageAlt:
      'Alunas em treino funcional com elástico sobre piso emborrachado da Crossfit Ebber',
    fitMode: 'cover-top',
  },
  {
    id: 'area-equipamentos',
    category: 'estrutura',
    categoryLabel: 'Área de Treino',
    title: 'Kettlebells, Medicine Balls e Corda de Subida',
    description:
      'Estações organizadas para treinos de hipertrofia funcional, força e condicionamento físico.',
    specs: [
      'Kettlebells variados e medicine balls',
      'Piso modular antiderrapante',
    ],
    imageSrc: BUSINESS_INFO.assets.boxEquipamentos,
    imageAlt:
      'Área interna da Crossfit Ebber com kettlebells, medicine balls e caixas de madeira',
    fitMode: 'cover-center',
  },
  {
    id: 'argolas-cordas',
    category: 'estrutura',
    categoryLabel: 'Estação Funcional',
    title: 'Argolas Olímpicas, Pneu e Rig Estruturado',
    description:
      'Equipamentos completos para trabalhar força de superiores, abdômen e resistência cardiovascular.',
    specs: [
      'Argolas suspensas e barras de pull-up',
      'Circuitos metabólicos completos',
    ],
    imageSrc: BUSINESS_INFO.assets.boxArgolasCorda,
    imageAlt:
      'Estação funcional da Crossfit Ebber com argolas olímpicas, corda e pneu',
    fitMode: 'cover-center',
  },
  {
    id: 'rotina-segunda',
    category: 'estrutura',
    categoryLabel: 'Dia a Dia do Box',
    title: 'Box Aberto das 06:00 às 22:00',
    description:
      'Da primeira turma da manhã até o último horário da noite, estrutura pronta para sua rotina.',
    specs: [
      'Turmas flexíveis das 06:00 às 22:00',
      'Fácil acesso para Contagem e Betim',
    ],
    imageSrc: BUSINESS_INFO.assets.boxSegunda,
    imageAlt:
      'Alunos treinando na Crossfit Ebber no Petrolândia com argolas e wood boxes',
    fitMode: 'cover-center',
  },
  {
    id: 'invista-em-voce',
    category: 'campanhas',
    categoryLabel: '2 Dias Experimentais',
    title: 'Invista em Você e Teste por 2 Dias',
    description:
      'Não precisa já estar em forma para começar. Garanta seus 2 dias de aula experimental gratuita.',
    specs: [
      'Agendamento direto no (31) 98632-5827',
      'Horários das 06:00 às 22:00',
    ],
    imageSrc: BUSINESS_INFO.assets.posterInvista,
    imageAlt:
      'Arte oficial Crossfit Ebber Invista em você, agende sua aula experimental 31 98632-5827',
    fitMode: 'contain',
  },
  {
    id: 'saude-bem-estar',
    category: 'campanhas',
    categoryLabel: 'Propósito & Saúde',
    title: 'Treinar é Sobre Saúde, Confiança e Bem-Estar',
    description:
      'Mais saúde, autoconfiança e condicionamento físico para o seu dia a dia no Petrolândia e região.',
    specs: [
      'Emagrecimento e definição muscular',
      'Comunidade acolhedora',
    ],
    imageSrc: BUSINESS_INFO.assets.posterSaude,
    imageAlt:
      'Arte oficial Crossfit Ebber Treinar é sobre saúde, confiança e bem-estar',
    fitMode: 'contain',
  },
];

export interface BenefitItem {
  number: string;
  title: string;
  summary: string;
  highlight: string;
}

export const METHODOLOGY_BENEFITS: BenefitItem[] = [
  {
    number: '01.',
    title: 'Especialidade em Emagrecimento',
    summary:
      'Treinos funcionais de alta eficiência metabólica que aceleram a queima de gordura durante e após a aula.',
    highlight: 'Redução de medidas com acompanhamento próximo.',
  },
  {
    number: '02.',
    title: 'Definição Muscular',
    summary:
      'Movimentos integrados que reduzem percentual de gordura enquanto tonificam e definem todo o corpo.',
    highlight: 'Corpo mais firme, ágil e resistente.',
  },
  {
    number: '03.',
    title: 'Hipertrofia e Ganho de Força',
    summary:
      'Progressão segura de cargas com barras, kettlebells e exercícios funcionais para ganho de massa magra.',
    highlight: 'Evolução técnica antes de aumentar o peso.',
  },
  {
    number: '04.',
    title: 'Condicionamento Físico Completo',
    summary:
      'Melhora de fôlego, disposição e saúde articular — com turmas adaptadas do iniciante ao avançado das 06:00 às 22:00.',
    highlight: 'Mais energia dentro e fora do box.',
  },
];

export const TRIAL_STEPS = [
  {
    step: '01',
    title: 'Chame no WhatsApp',
    detail: 'Escolha um horário entre 06:00 e 22:00.',
  },
  {
    step: '02',
    title: 'Adaptação Total',
    detail: 'O coach ajusta movimentos e cargas ao seu nível.',
  },
  {
    step: '03',
    title: '2 Dias de Treino Real',
    detail: 'Conheça a turma e sinta os resultados na prática.',
  },
];

export const TRIAL_LEVELS = [
  'Nunca treinei CrossFit (Iniciante)',
  'Já treino, quero mudar de modalidade',
  'Já pratico CrossFit',
] as const;

export const TRIAL_GOALS = [
  'Emagrecimento',
  'Definição muscular',
  'Hipertrofia e força',
  'Condicionamento físico',
] as const;

export const TRIAL_PERIODS = [
  '06:00 - 11:00',
  '12:00 - 17:00',
  '18:00 - 22:00',
] as const;

export interface TestimonialItem {
  id: string;
  name: string;
  focus: string;
  memberSince: string;
  rating: number;
  quote: string;
  photoSrc: string;
  photoAlt: string;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'aluna-1',
    name: 'Camila Ferreira',
    focus: 'Emagrecimento · Petrolândia',
    memberSince: 'Aluna há 1 ano',
    rating: 5,
    quote: 'Comecei do zero com medo de não dar conta e hoje não fico sem!',
    photoSrc: BUSINESS_INFO.assets.boxComunidade,
    photoAlt: 'Camila Ferreira treinando com a turma na Crossfit Ebber',
  },
  {
    id: 'aluno-2',
    name: 'Rafael Mendes',
    focus: 'Hipertrofia & Definição · Betim',
    memberSince: 'Aluno há 8 meses',
    rating: 5,
    quote:
      'O coach corrige cada movimento. Ganhei força, definição e treino às 20h.',
    photoSrc: BUSINESS_INFO.assets.boxTurmaPneu,
    photoAlt: 'Rafael Mendes e turma da noite na Crossfit Ebber',
  },
  {
    id: 'aluna-3',
    name: 'Juliana Costa',
    focus: 'Condicionamento Físico · Contagem',
    memberSince: 'Aluna há 6 meses',
    rating: 5,
    quote:
      'Emagreci com saúde, ganhei fôlego e me senti acolhida desde o primeiro dia.',
    photoSrc: BUSINESS_INFO.assets.boxTreinoDupla,
    photoAlt: 'Juliana Costa durante treino funcional na Crossfit Ebber',
  },
];

export const INSTAGRAM_FEED = [
  {
    id: 'ig-1',
    src: BUSINESS_INFO.assets.boxComunidade,
    alt: 'Turma reunida após treino na Rua Refinaria União, 124',
    caption: 'Energia da turma no Petrolândia',
  },
  {
    id: 'ig-2',
    src: BUSINESS_INFO.assets.boxTurmaPneu,
    alt: 'Treino com pneu de trator e caixas na Crossfit Ebber',
    caption: 'Treino funcional em equipe',
  },
  {
    id: 'ig-3',
    src: BUSINESS_INFO.assets.boxTreinoDupla,
    alt: 'Alunas fazendo corrida resistida com elástico no box',
    caption: 'Condicionamento e queima calórica',
  },
  {
    id: 'ig-4',
    src: BUSINESS_INFO.assets.boxEquipamentos,
    alt: 'Equipamentos de treino da Crossfit Ebber na Rua Refinaria União',
    caption: 'Box pronto das 06:00 às 22:00',
  },
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-condicionamento',
    question: 'Preciso já ter condicionamento físico para começar?',
    answer:
      'Não. A maioria dos nossos alunos começa do absoluto zero. Nosso coach adapta cargas, movimentos e intensidade para o seu nível atual, garantindo evolução segura sem risco de sobrecarga.',
  },
  {
    id: 'faq-experimental',
    question: 'Como funcionam os 2 dias de aula experimental gratuita?',
    answer:
      'Basta clicar no botão de WhatsApp e escolher seu melhor horário entre 06:00 e 22:00. Você participa de 2 dias reais de treino acompanhado pelo coach, conhece a estrutura na Rua Refinaria União, 124 e só escolhe seu plano pessoalmente se gostar da experiência.',
  },
  {
    id: 'faq-seguranca',
    question: 'Tenho receio de me machucar. O treino é seguro para iniciantes?',
    answer:
      'Sim. Priorizamos técnica e postura antes de qualquer carga. Contamos com piso emborrachado de absorção de impacto e orientação próxima em todas as séries para proteger suas articulações.',
  },
  {
    id: 'faq-horarios',
    question: 'Quais são os horários das turmas?',
    answer:
      'Funcionamos das 06:00 às 22:00 de segunda a sexta, com turmas pela manhã, tarde e noite para você encaixar o treino facilmente antes ou depois do trabalho.',
  },
];

export const CLASS_SCHEDULE = [
  { period: 'Manhã', hours: ['06:00', '07:00', '08:00', '09:00', '10:00'] },
  { period: 'Tarde', hours: ['15:00', '16:00', '17:00'] },
  { period: 'Noite', hours: ['18:00', '19:00', '20:00', '21:00'] },
];
