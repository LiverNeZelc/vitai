'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  MotionConfig,
  useReducedMotion,
} from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { KeyboardEvent, ReactNode } from 'react';
import type { LeadInterest } from '@/lib/lead-validation';
import { z } from 'zod';

const phonePattern = /^[+\d\s()-]+$/;

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Введите имя — не короче двух символов.')
    .max(100, 'Имя не должно быть длиннее 100 символов.'),
  phone: z
    .string()
    .trim()
    .refine((phone) => {
      if (!phonePattern.test(phone)) return false;
      const digits = phone.replace(/\D/g, '');
      return (
        (phone.startsWith('+') && /^375\d{9}$/.test(digits)) ||
        /^375\d{9}$/.test(digits) ||
        /^80\d{9}$/.test(digits) ||
        /^\d{9}$/.test(digits)
      );
    }, 'Введите белорусский номер, например +375 29 123-45-67.'),
  interest: z.enum(['subscription', 'single_order', 'question']),
  comment: z.string().max(1000, 'Комментарий не должен быть длиннее 1000 символов.'),
});

type LeadFormValues = z.infer<typeof leadSchema>;

type ResponseMessage = {
  type: 'success' | 'error';
  text: string;
};

const interestOptions: { value: LeadInterest; label: string; description: string }[] = [
  { value: 'subscription', label: 'Подписка на кофе', description: 'Две пачки каждый месяц' },
  { value: 'single_order', label: 'Разовый заказ', description: 'Выбрать свежее зерно' },
  { value: 'question', label: 'Хочу задать вопрос', description: 'Поможем разобраться' },
];

const initialValues: LeadFormValues = {
  name: '',
  phone: '',
  interest: 'subscription',
  comment: '',
};

const products = [
  {
    number: '01',
    origin: 'Эфиопия · Иргачеффе',
    name: 'Светлая сторона',
    notes: 'Бергамот, жасмин, сочный персик',
    process: 'Мытая обработка',
    roast: 'Светлая обжарка',
    price: '32',
    label: 'Фильтр',
    photo:
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=85',
    bean: 'Эфиопия',
  },
  {
    number: '02',
    origin: 'Колумбия · Уила',
    name: 'Яблочный пирог',
    notes: 'Карамель, красное яблоко, какао',
    process: 'Натуральная обработка',
    roast: 'Средняя обжарка',
    price: '29',
    label: 'Любимец',
    photo:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85',
    bean: 'Колумбия',
  },
  {
    number: '03',
    origin: 'Бразилия · Серрадо',
    name: 'Тихое утро',
    notes: 'Фундук, молочный шоколад, пралине',
    process: 'Палповая обработка',
    roast: 'Под эспрессо',
    price: '26',
    label: 'Для эспрессо',
    photo:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85',
    bean: 'Бразилия',
  },
  {
    number: '04',
    origin: 'Кварта · ассорти',
    name: 'Кофе с собой',
    notes: 'Десять хороших чашек где угодно',
    process: '10 дрип-пакетов',
    roast: 'Разные лоты',
    price: '18',
    label: 'В дорогу',
    photo:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=85',
    bean: 'Дрип',
  },
];

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const motion = m;

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
    >
      {diagonal ? (
        <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      ) : (
        <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      )}
    </svg>
  );
}

function BeanMark({ light = false }: { light?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-7 w-7 ${light ? 'text-[#e5cba3]' : 'text-[#315b47]'}`}
      fill="none"
      viewBox="0 0 32 32"
    >
      <path
        d="M25.6 7.2c-5.3-5.3-14.7-3-19 4.5-3.8 6.7-2 15.4 3.8 17 5.8 1.7 13.2-3.1 16-10.7 1.7-4.6 1.3-8.7-.8-10.8Z"
        fill="currentColor"
      />
      <path d="M7.4 25.1c2-7.3 8-13.7 16.8-18.2" stroke="#f7f4ec" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function SectionKicker({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className={`section-kicker mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${light ? 'text-[#d9bd88]' : 'text-[#565b52]'}`}>
      <span className={`h-px w-8 ${light ? 'bg-[#d9bd88]' : 'bg-[#9aa48d]'}`} />
      {children}
    </p>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4f5148]">
        {label}
      </span>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[#a44032]"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: -4 }}
            role="alert"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

function InterestSelect({
  value,
  onChange,
  onBlur,
  describedBy,
  invalid,
}: {
  value: LeadInterest;
  onChange: (value: LeadInterest) => void;
  onBlur: () => void;
  describedBy?: string;
  invalid: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    interestOptions.findIndex((option) => option.value === value),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = interestOptions.findIndex((option) => option.value === value);
  const selectedOption = interestOptions[selectedIndex] ?? interestOptions[0];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function chooseOption(option: (typeof interestOptions)[number]) {
    onChange(option.value);
    onBlur();
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
        return;
      }

      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => (current + direction + interestOptions.length) % interestOptions.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (open) {
        event.preventDefault();
        chooseOption(interestOptions[activeIndex] ?? selectedOption);
      }
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab' && open) {
      setOpen(false);
      onBlur();
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(interestOptions.length - 1);
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-activedescendant={open ? `interest-option-${activeIndex}` : undefined}
        aria-describedby={describedBy}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={invalid}
        aria-label="Что вас интересует"
        aria-controls="lead-interest-options"
        className="group flex w-full items-center justify-between border-b border-[#d9d5ca] bg-transparent py-3 text-left text-[13px] text-[#1e2c23] outline-none transition hover:border-[#8d9a87] focus:border-[#315b47] aria-invalid:border-[#a44032]"
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span>
          <span className="block">{selectedOption.label}</span>
          <span className="mt-1 block text-[10px] text-[#565b52]">{selectedOption.description}</span>
        </span>
        <svg
          aria-hidden="true"
          className={`ml-4 h-4 w-4 shrink-0 text-[#565b52] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 20 20"
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute inset-x-0 top-[calc(100%+8px)] z-20 origin-top border border-[#d9d5ca] bg-[#faf9f5] p-1.5 shadow-[0_18px_36px_rgba(31,43,33,0.14)]"
            exit={{ opacity: 0, y: -5, scale: 0.99 }}
            initial={{ opacity: 0, y: -5, scale: 0.99 }}
            id="lead-interest-options"
            role="listbox"
            transition={{ duration: 0.16 }}
          >
            {interestOptions.map((option, index) => (
              <div
                aria-selected={option.value === value}
                className={`flex cursor-pointer items-center justify-between px-3 py-3 transition-colors ${
                  index === activeIndex
                    ? 'bg-[#e9e8dc]'
                    : 'hover:bg-[#f0eee5]'
                }`}
                id={`interest-option-${index}`}
                key={option.value}
                onClick={() => chooseOption(option)}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
              >
                <span>
                  <span className="block text-[12px] text-[#26382d]">{option.label}</span>
                  <span className="mt-1 block text-[10px] text-[#565b52]">{option.description}</span>
                </span>
                {option.value === value && (
                  <svg aria-hidden="true" className="h-4 w-4 text-[#315b47]" fill="none" viewBox="0 0 20 20">
                    <path d="m4.5 10 3.5 3.5 7.5-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                  </svg>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Page() {
  const reduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState<ResponseMessage | null>(null);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const onSubmit = async (values: LeadFormValues) => {
    setResponseMessage(null);

    try {
      const search = new URLSearchParams(window.location.search);
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          utm_source: search.get('utm_source'),
          utm_medium: search.get('utm_medium'),
          utm_campaign: search.get('utm_campaign'),
          utm_content: search.get('utm_content'),
          utm_term: search.get('utm_term'),
          gclid: search.get('gclid'),
          pageUrl: window.location.href,
        }),
      });

      const payload: {
        data?: { message?: string };
        error?: { code?: string; message?: string; fields?: Record<string, string> };
      } = await response.json().catch(() => ({}));

      if (!response.ok) {
        for (const field of ['name', 'phone', 'interest', 'comment'] as const) {
          const message = payload.error?.fields?.[field];
          if (message) setError(field, { type: 'server', message });
        }

        setResponseMessage({
          type: 'error',
          text:
            payload.error?.message ??
            'Не получилось отправить заявку. Попробуйте ещё раз чуть позже.',
        });
        return;
      }

      reset(initialValues);
      setResponseMessage({
        type: 'success',
        text: 'Мы записали ваш запрос. Скоро свяжемся, ответим на вопросы и поможем выбрать свежую обжарку.',
      });
    } catch {
      setResponseMessage({
        type: 'error',
        text: 'Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.',
      });
    }
  };

  const motionProps = reduceMotion
    ? {}
    : {
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport: { once: true, amount: 0.16 },
        variants: reveal,
      };

  return (
        <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation}>
        <main className="site-shell overflow-x-clip bg-[#f4f1e9] text-[#1e2c23]">
          <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-[#20352a]/95 text-white shadow-sm backdrop-blur-md">
            <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 md:h-[86px] md:px-10 xl:px-16">
          <a aria-label="Кварта — на главную" className="flex items-center gap-3" href="#">
            <BeanMark light />
                <span className="text-[16px] font-semibold tracking-[0.2em] md:text-[19px] md:tracking-[0.22em]">КВАРТА</span>
          </a>

              <nav aria-label="Основная навигация" className="hidden items-center gap-9 text-[13px] text-white/80 md:flex">
            <a className="transition hover:text-white" href="#story">Наша история</a>
            <a className="transition hover:text-white" href="#coffee">Кофе</a>
            <a className="transition hover:text-white" href="#subscription">Подписка</a>
            <a className="transition hover:text-white" href="#visit">Контакты</a>
          </nav>

          <a
            className="group hidden items-center gap-3 border border-white/50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:bg-white hover:text-[#203a2d] md:flex"
            href="#order"
          >
            Выбрать кофе <ArrowIcon />
          </a>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            className="flex h-10 w-10 items-center justify-center border border-white/30 md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            <span className="flex w-4 flex-col gap-1.5">
              <span className={`h-px w-full bg-current transition-transform ${mobileMenuOpen ? 'translate-y-[4px] rotate-45' : ''}`} />
              <span className={`h-px w-full bg-current transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-px w-full bg-current transition-transform ${mobileMenuOpen ? '-translate-y-[4px] -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              animate={{ opacity: 1, height: 'auto' }}
              aria-label="Мобильная навигация"
              className="overflow-hidden border-t border-white/10 bg-[#20352a] md:hidden"
              exit={{ opacity: 0, height: 0 }}
              initial={{ opacity: 0, height: 0 }}
            >
              {[
                ['Наша история', '#story'],
                ['Кофе', '#coffee'],
                ['Подписка', '#subscription'],
                ['Контакты', '#visit'],
                ['Оставить заявку', '#order'],
              ].map(([label, href]) => (
                <a
                  className="block border-b border-white/10 px-5 py-4 text-sm text-white/85"
                  href={href}
                  key={href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <section className="site-hero relative min-h-[760px] bg-[#24372e] pt-[68px] text-white md:pt-0">
        <div className="absolute inset-0">
          <Image
            alt=""
            className="object-cover object-center opacity-60"
            fill
            priority
            quality={65}
            sizes="100vw"
            src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1440&q=75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17261f]/95 via-[#1c2c23]/75 to-[#1e3027]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17261f]/40 via-transparent to-[#15231d]/25" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100svh-68px)] max-w-[1440px] grid-cols-1 items-center gap-6 px-5 pb-28 pt-12 md:min-h-[760px] md:grid-cols-[1.05fr_0.95fr] md:gap-0 md:px-10 md:pb-20 md:pt-32 xl:px-16">
          <div className="relative z-10 max-w-[690px]">
            <p className="mb-7 flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-[#d8cba8]">
              <span className="h-px w-10 bg-[#d8cba8]" />
              Минская мастерская кофе · с 2019 года
            </p>
            <h1 className="max-w-[700px] font-serif text-[clamp(3.25rem,13vw,5.375rem)] font-normal leading-[0.98] tracking-[-0.055em] md:text-[86px]">
              Свежесть,
              <br />
              которую <span className="italic text-[#e3c997]">слышно.</span>
            </h1>
            <p className="mt-7 max-w-[450px] text-[16px] leading-7 text-white/75">
              Обжариваем кофе маленькими партиями. От нашей мастерской до вашей чашки — всего несколько
              дней.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 md:mt-10">
              <a
                className="button-primary group inline-flex items-center gap-8 bg-[#d9bd88] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#24372e] transition hover:bg-[#ead6ae]"
                href="#coffee"
              >
                Найти свой кофе <ArrowIcon />
              </a>
              <a className="button-secondary border-b border-white/45 pb-1 text-[12px] text-white/80 transition hover:border-white hover:text-white" href="#story">
                Познакомиться с нами
              </a>
            </div>
          </div>

          <motion.div
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            className="relative flex h-[330px] items-end justify-center md:h-[520px]"
            initial={reduceMotion ? undefined : { opacity: 0, y: 22 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative h-[300px] w-[225px] rotate-[2deg] bg-[#d9c6a4] p-2 shadow-[0_35px_90px_rgba(0,0,0,0.35)] md:h-[455px] md:w-[340px] md:p-3">
              <div className="relative h-full overflow-hidden">
                <Image
                  alt="Свежий кофе в кофейне"
                  className="object-cover"
                  fill
                  quality={65}
                  sizes="(max-width: 767px) 225px, 340px"
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85"
                />
                <div className="absolute inset-0 bg-[#17251d]/20" />
                <div className="absolute inset-x-5 bottom-5 border border-white/60 p-4 text-white">
                  <p className="text-[9px] uppercase tracking-[0.28em]">Маленькая обжарка</p>
                  <p className="mt-2 font-serif text-[20px] md:text-[26px]">Тёплое дело</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.22em]">Минск · Беларусь</p>
                </div>
              </div>
            </div>
            <div className="hero-roast-stamp absolute -bottom-1 right-0 flex h-[92px] w-[92px] rotate-[-10deg] flex-col items-center justify-center rounded-full border border-[#d9bd88]/70 text-center text-white md:right-12 md:h-[122px] md:w-[122px]">
              <span className="text-[8px] uppercase tracking-[0.2em]">обжарено</span>
              <span className="my-1 font-serif text-[21px] md:text-[28px]">в четверг</span>
              <span className="text-[7px] uppercase tracking-[0.16em] md:text-[8px] md:tracking-[0.2em]">привезено в пятницу</span>
            </div>
          </motion.div>

          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/20 pt-4 text-[8px] uppercase tracking-[0.12em] text-white/65 md:bottom-10 md:left-16 md:right-16 md:flex md:items-center md:justify-between md:pt-5 md:text-[10px] md:tracking-[0.18em]">
            <span>Партии по 5 кг</span>
            <span>Доставка по Минску</span>
            <span className="col-span-2 md:col-span-1">Зерно на 1–3 день после обжарки</span>
          </div>
        </div>
      </section>

      <section className="site-stats border-b border-[#dfdbd0] bg-[#f4f1e9]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-y divide-[#dcd8cd] px-5 py-5 md:grid-cols-4 md:divide-y-0 md:px-10 md:py-7 xl:px-16">
          {[
            ['2019', 'Начали обжаривать'],
            ['5 кг', 'Небольшие партии'],
            ['1–3 дня', 'От ростера до вас'],
            ['Минск', 'Наш город и дом'],
          ].map(([value, label]) => (
            <div className="px-4 py-3 first:pl-0 md:px-8 md:py-0 md:first:pl-0" key={value}>
              <p className="font-serif text-[24px] md:text-[26px]">{value}</p>
              <p className="mt-1 text-[8px] uppercase tracking-[0.1em] text-[#565b52] md:text-[10px] md:tracking-[0.13em]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-story py-16 md:py-32" id="story">
        <motion.div
          className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 md:grid-cols-[0.85fr_1.15fr] md:gap-16 md:px-10 xl:gap-24 xl:px-16"
          {...motionProps}
        >
          <div className="relative mr-4 min-h-[340px] md:mr-6 md:min-h-[490px]">
            <Image
              alt="Кофейные зёрна и работа в мастерской"
              className="object-cover"
              fill
              quality={65}
              sizes="(max-width: 767px) calc(100vw - 40px), 42vw"
              src="https://images.unsplash.com/photo-1524350876685-274059332603?auto=format&fit=crop&w=1200&q=85"
            />
            <div className="absolute -bottom-4 right-0 w-[190px] bg-[#e6ddc9] p-4 md:-bottom-7 md:-right-7 md:w-[225px] md:p-6">
              <p className="font-serif text-[23px] italic leading-tight md:text-[29px]">«Хороший кофе не должен быть сложным»</p>
              <p className="mt-3 text-[8px] uppercase tracking-[0.12em] text-[#565b52] md:mt-4 md:text-[9px] md:tracking-[0.16em]">Аня и Дмитрий, основатели</p>
            </div>
          </div>

          <div className="flex flex-col justify-center py-8">
            <SectionKicker>За каждым зерном — люди</SectionKicker>
            <h2 className="max-w-[610px] font-serif text-[clamp(2.5rem,9vw,3.625rem)] font-normal leading-[1.08] tracking-[-0.04em] md:text-[58px]">
              Мы начинали за барной стойкой. Теперь обжариваем своё.
            </h2>
            <p className="mt-7 max-w-[580px] text-[15px] leading-7 text-[#565b52]">
              Кварта — небольшая мастерская в Минске. Аня и Дмитрий раньше работали бариста и каждый день
              пробовали кофе, который хотелось бы забрать домой. В 2019 году мы купили первый ростер.
            </p>
            <p className="mt-4 max-w-[580px] text-[15px] leading-7 text-[#565b52]">
              С тех пор обжариваем по четвергам партиями по пять килограммов. Не потому, что так удобнее
              рассказывать историю — просто так кофе остаётся свежим, а мы помним каждую партию.
            </p>
            <a className="mt-8 inline-flex w-fit items-center gap-3 border-b border-[#758271] pb-2 text-[11px] font-semibold uppercase tracking-[0.15em]" href="#visit">
              Заглянуть в мастерскую <ArrowIcon />
            </a>
          </div>
        </motion.div>
      </section>

      <section className="site-coffee bg-[#e9e5d9] py-16 md:py-28" id="coffee">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10 xl:px-16">
          <motion.div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end" {...motionProps}>
            <div>
              <SectionKicker>На каждый день и чуть особенный</SectionKicker>
              <h2 className="font-serif text-[clamp(2.5rem,9vw,3.625rem)] font-normal leading-[1.02] tracking-[-0.04em] md:text-[58px]">
                Знакомьтесь, это зерно.
              </h2>
            </div>
            <p className="max-w-[340px] text-[12px] leading-5 text-[#565b52] md:pb-1 md:text-[13px] md:leading-6">
              Все пачки — 250 г. Обжариваем в четверг, отправляем в пятницу.
            </p>
          </motion.div>

          <motion.div
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-14 xl:grid-cols-4 xl:gap-5"
            initial="hidden"
            variants={stagger}
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
          >
            {products.map((product) => (
              <motion.article
                className="coffee-card group bg-[#f8f6f0]"
                key={product.number}
                variants={reveal}
              >
                <div className="coffee-card-image relative h-[260px] overflow-hidden bg-[#ded8c8] sm:h-[230px] xl:h-[270px]">
                  <Image
                    alt={`${product.origin}: чашка свежего кофе`}
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    fill
                    quality={65}
                    sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1279px) 45vw, 22vw"
                    src={product.photo}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e2c23]/45 via-transparent to-[#1e2c23]/10" />
                  <span className="coffee-card-label absolute left-4 top-4 z-10 border border-white/70 bg-[#f4f1e9]/95 px-3 py-2 text-[9px] uppercase tracking-[0.16em] text-[#3f4d40]">
                    {product.label}
                  </span>
                  <span className="absolute bottom-4 left-4 font-serif text-[17px] italic text-white/95">
                    Партия № {product.number}
                  </span>
                </div>
                <div className="p-5 pb-4">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[#565b52]">{product.origin} · 250 г</p>
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <h3 className="font-serif text-[24px] leading-tight xl:text-[27px]">{product.name}</h3>
                    <p className="shrink-0 font-serif text-[21px]">{product.price}<span className="ml-1 text-[10px]">BYN</span></p>
                  </div>
                  <p className="mt-2 min-h-[39px] text-[12px] leading-5 text-[#6e7168]">{product.notes}</p>
                  <div className="mt-4 flex items-end justify-between border-t border-[#dedacf] pt-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.12em] text-[#565b52]">{product.roast}</p>
                      <p className="mt-1 text-[11px] text-[#50564e]">{product.process}</p>
                    </div>
                    <a
                      className="coffee-card-link flex items-center gap-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#315b47] transition group-hover:gap-3"
                      href="#order"
                      onClick={() => setValue('interest', 'single_order')}
                    >
                      Выбрать <ArrowIcon />
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>

          <p className="mt-5 text-left text-[9px] uppercase tracking-[0.1em] text-[#565b52] md:mt-7 md:text-right md:text-[10px] md:tracking-[0.15em]">
            Цены указаны за пачку · 250 г, если не указано иначе
          </p>
        </div>
      </section>

      <section className="site-subscription bg-[#24372e] py-16 text-[#f4f1e9] md:py-28" id="subscription">
        <motion.div
          className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-5 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:px-10 xl:gap-20 xl:px-16"
          {...motionProps}
        >
          <div>
            <SectionKicker light>Кофе дома — без напоминаний</SectionKicker>
            <h2 className="max-w-[670px] font-serif text-[clamp(2.5rem,9vw,3.875rem)] font-normal leading-[1.03] tracking-[-0.04em] md:text-[62px]">
              Раз в месяц. Две пачки. Никакой суеты.
            </h2>
            <p className="mt-6 max-w-[510px] text-[14px] leading-7 text-white/65">
              Подписка для тех, кому просто нужен хороший кофе дома или в офисе. Менеджер уточнит, какой
              способ заваривания вы любите, и подберёт подходящие зерна.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-5 md:mt-9 md:gap-10">
              <div>
                <p className="font-serif text-[28px] md:text-[33px]">2 × 250 г</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/55">Свежего зерна</p>
              </div>
              <div className="hidden h-14 w-px bg-white/20 md:block" />
              <div>
                <p className="font-serif text-[28px] md:text-[33px]">Бесплатно</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/55">Доставка по Минску</p>
              </div>
            </div>
          </div>

          <div className="subscription-card relative border border-[#bba87e]/55 p-6 md:p-10">
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#d9bd88]" />
            <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-[#d9bd88]" />
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d9bd88]">Кофейная подписка</p>
            <p className="mt-6 font-serif text-[58px] leading-none md:text-[70px]">54 <span className="text-[22px]">BYN</span></p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/55">за месяц · доставка включена</p>
            <div className="my-7 h-px bg-white/20" />
            <ul className="space-y-3 text-[13px] text-white/75">
              <li className="flex gap-3"><span className="text-[#d9bd88]">—</span> 2 пачки по 250 г</li>
              <li className="flex gap-3"><span className="text-[#d9bd88]">—</span> Свежая обжарка под вашу чашку</li>
              <li className="flex gap-3"><span className="text-[#d9bd88]">—</span> Привезём в пятницу</li>
            </ul>
            <a
              className="button-primary mt-8 flex items-center justify-between bg-[#d9bd88] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#24372e] transition hover:bg-[#ead6ae]"
              href="#order"
              onClick={() => {
                setValue('interest', 'subscription', { shouldDirty: true });
              }}
            >
              Хочу подписку <ArrowIcon />
            </a>
          </div>
        </motion.div>
      </section>

      <section className="site-process py-16 md:py-28">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10 xl:px-16">
          <motion.div className="text-center" {...motionProps}>
            <SectionKicker>Просто и по-человечески</SectionKicker>
            <h2 className="font-serif text-[clamp(2.25rem,8vw,3.4375rem)] font-normal leading-[1.05] tracking-[-0.04em] md:text-[55px]">
              От ростера до чашки — три шага.
            </h2>
          </motion.div>
          <motion.div
            className="mt-9 grid grid-cols-1 border-y border-[#d9d5ca] md:mt-16 md:grid-cols-3"
            initial="hidden"
            variants={stagger}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {[
              ['01', 'Обжариваем', 'Каждый четверг, небольшими партиями по 5 кг.'],
              ['02', 'Собираем ваш заказ', 'Подписка, любимый сорт или просто вопрос — менеджер всё оформит.'],
              ['03', 'Привозим свежим', 'В пятницу доставляем по Минску или ждём вас на самовывозе.'],
            ].map(([number, title, text], index) => (
              <motion.article
                className={`py-7 md:py-8 ${index ? 'border-t border-[#d9d5ca] md:border-l md:border-t-0 md:pl-9' : 'md:pr-9'} ${index === 1 ? 'md:px-9' : ''}`}
                key={number}
                variants={reveal}
              >
                <span className="font-serif text-[39px] text-[#806d4b]">{number}</span>
                <h3 className="mt-5 font-serif text-[28px]">{title}</h3>
                <p className="mt-3 max-w-[300px] text-[13px] leading-6 text-[#565b52]">{text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="site-visit border-y border-[#dedacf] bg-[#e9e5d9] py-16 md:py-28" id="visit">
        <motion.div
          className="mx-auto grid max-w-[1440px] grid-cols-1 gap-9 px-5 md:grid-cols-[1fr_0.8fr] md:gap-14 md:px-10 xl:gap-20 xl:px-16"
          {...motionProps}
        >
          <div>
            <SectionKicker>Мы в Минске</SectionKicker>
            <h2 className="font-serif text-[clamp(2.5rem,9vw,3.6875rem)] font-normal leading-[1.05] tracking-[-0.04em] md:text-[59px]">
              Если рядом — заходите. Если нет — привезём.
            </h2>
            <p className="mt-6 max-w-[490px] text-[14px] leading-7 text-[#565b52]">
              Самовывоз из мастерской на Короля, 9. Или доставка по Минску в пятницу. Заказ от 50 BYN
              привезём бесплатно.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-5 border-t border-[#cfcbbf] pt-6 sm:grid-cols-2 sm:gap-8 md:mt-10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#565b52]">Адрес</p>
                <p className="mt-2 font-serif text-[21px] md:text-[23px]">Минск, Короля, 9</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#565b52]">Часы работы</p>
                <p className="mt-2 text-[13px] leading-6">Пн–пт · 8:00–20:00<br />Сб–вс · 10:00–18:00</p>
              </div>
            </div>
          </div>
          <div className="visit-image relative min-h-[280px] overflow-hidden bg-[#88917a] md:min-h-[390px]">
            <Image
              alt="Интерьер кофейной мастерской"
              className="object-cover grayscale-[20%]"
              fill
              quality={65}
              sizes="(max-width: 767px) calc(100vw - 40px), 38vw"
              src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=85"
            />
            <div className="absolute inset-0 bg-[#22352b]/20" />
            <div className="visit-image-caption absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#f4f1e9] px-4 py-3 md:bottom-5 md:left-5 md:right-5 md:px-5 md:py-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-[#565b52]">Заходите на чашку</p>
                <p className="mt-1 font-serif text-[18px] md:text-[21px]">Мастерская «Кварта»</p>
              </div>
              <a aria-label="Перейти к форме заявки" className="flex h-10 w-10 items-center justify-center bg-[#315b47] text-white" href="#order">
                <ArrowIcon diagonal />
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="site-order bg-[#f4f1e9] py-16 md:py-28" id="order">
        <motion.div
          className="mx-auto grid max-w-[1440px] grid-cols-1 gap-9 px-5 md:grid-cols-[0.85fr_1.15fr] md:gap-14 md:px-10 xl:gap-24 xl:px-16"
          {...motionProps}
        >
          <div className="pt-4">
            <SectionKicker>Будем на связи</SectionKicker>
            <h2 className="font-serif text-[clamp(2.5rem,9vw,3.625rem)] font-normal leading-[1.06] tracking-[-0.04em] md:text-[58px]">
              Давайте подберём вам кофе.
            </h2>
            <p className="mt-6 max-w-[410px] text-[14px] leading-7 text-[#686d63]">
              Оставьте номер и пару слов о том, что ищете. Менеджер перезвонит, ответит на вопросы и оформит
              заказ.
            </p>
            <div className="mt-7 border-t border-[#d9d5ca] pt-5 md:mt-10">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#565b52]">Удобнее написать?</p>
              <p className="mt-2 font-serif text-[23px]">Напишите нам в Telegram</p>
              <p className="mt-1 text-[11px] text-[#565b52]">Ссылку на чат подставим перед запуском сайта</p>
            </div>
          </div>

          <div className="lead-card border border-[#dedacf] bg-[#faf9f5] p-5 sm:p-7 md:p-10">
            <div className="flex items-start justify-between border-b border-[#e2ded4] pb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#565b52]">Форма заявки</p>
                <p className="mt-2 font-serif text-[27px]">Это займёт минуту</p>
              </div>
              <BeanMark />
            </div>

            <form
              className={`mt-7 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 ${responseMessage?.type === 'success' ? 'hidden' : ''}`}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <FormField error={errors.name?.message} label="Как к вам обращаться">
                <input
                  aria-invalid={Boolean(errors.name)}
                  autoComplete="name"
                  className="form-input"
                  id="lead-name"
                  placeholder="Например, Анна"
                  {...register('name')}
                  aria-describedby={errors.name ? 'lead-name-error' : undefined}
                />
                {errors.name?.message && <span id="lead-name-error" className="sr-only">{errors.name.message}</span>}
              </FormField>

              <FormField error={errors.phone?.message} label="Номер телефона">
                <input
                  aria-invalid={Boolean(errors.phone)}
                  autoComplete="tel"
                  className="form-input"
                  id="lead-phone"
                  inputMode="tel"
                  placeholder="+375 29 123-45-67"
                  {...register('phone')}
                  aria-describedby={errors.phone ? 'lead-phone-error' : undefined}
                />
                {errors.phone?.message && <span id="lead-phone-error" className="sr-only">{errors.phone.message}</span>}
              </FormField>

              <div className="sm:col-span-2">
                <FormField error={errors.interest?.message} label="Что вас интересует">
                  <Controller
                    control={control}
                    name="interest"
                    render={({ field }) => (
                      <InterestSelect
                        describedBy={errors.interest ? 'lead-interest-error' : undefined}
                        invalid={Boolean(errors.interest)}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                  {errors.interest?.message && <span id="lead-interest-error" className="sr-only">{errors.interest.message}</span>}
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField error={errors.comment?.message} label="Комментарий · по желанию">
                  <textarea
                    aria-describedby={errors.comment ? 'lead-comment-error' : undefined}
                    aria-invalid={Boolean(errors.comment)}
                    className="form-input min-h-[112px] resize-y"
                    id="lead-comment"
                    maxLength={1000}
                    placeholder="Расскажите, какой кофе вы любите или что хотите узнать"
                    {...register('comment')}
                  />
                  {errors.comment?.message && <span id="lead-comment-error" className="sr-only">{errors.comment.message}</span>}
                </FormField>
              </div>

              <div className="flex flex-col items-start gap-4 pt-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <button
                  className="button-primary group inline-flex min-h-12 w-full items-center justify-between bg-[#315b47] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#243f32] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-[235px] sm:px-6"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Отправляем…' : 'Отправить заявку'}
                  <ArrowIcon />
                </button>
                <p className="max-w-[300px] text-[10px] leading-5 text-[#565b52]">
                  Нажимая кнопку, вы соглашаетесь на обработку данных для связи по заявке.
                </p>
              </div>
              <div className="min-h-7 sm:col-span-2" aria-live="polite">
                <AnimatePresence mode="wait">
                  {responseMessage?.type === 'error' && (
                    <motion.p
                      animate={{ opacity: 1, y: 0 }}
                      className="border-l-2 border-[#a44032] py-2 pl-3 text-[12px] text-[#a44032]"
                      exit={{ opacity: 0, y: -5 }}
                      initial={{ opacity: 0, y: 5 }}
                      key={responseMessage.text}
                      role="alert"
                    >
                      {responseMessage.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </form>
            <AnimatePresence mode="wait">
              {responseMessage?.type === 'success' && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="py-10"
                  exit={{ opacity: 0, y: 10 }}
                  initial={{ opacity: 0, y: 10 }}
                  key="lead-success"
                  role="status"
                >
                  <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#565b52]">
                    <span className="h-px w-8 bg-[#9aa48d]" />
                    Уже передали Ане и Дмитрию
                  </div>
                  <div className="mt-8 flex items-start gap-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e7ecdf] text-[#315b47]">
                      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path d="m6 12 4 4 8-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-serif text-[34px] leading-tight text-[#263c2f]">
                        Скоро поговорим о кофе.
                      </h3>
                      <p className="mt-3 max-w-[430px] text-[14px] leading-7 text-[#6c7167]">
                        {responseMessage.text}
                      </p>
                    </div>
                  </div>
                  <div className="mt-9 border-t border-[#e2ded4] pt-5">
                    <p className="text-[11px] text-[#565b52]">
                      А пока рассказываем: кофе обжариваем по четвергам, а в пятницу уже развозим по Минску.
                    </p>
                    <button
                      className="mt-6 border-b border-[#82917d] pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#315b47] transition hover:border-[#315b47]"
                      onClick={() => {
                        reset(initialValues);
                        setResponseMessage(null);
                      }}
                      type="button"
                    >
                      Оставить ещё одну заявку
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      <footer className="site-footer bg-[#1c2d24] text-[#f4f1e9]">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10 xl:px-16">
          <div className="flex flex-col items-start gap-5 border-b border-white/15 py-7 md:flex-row md:items-center md:justify-between md:py-9">
            <a className="flex items-center gap-3" href="#">
              <BeanMark light />
              <span className="text-[16px] font-semibold tracking-[0.22em]">КВАРТА</span>
            </a>
            <p className="text-[10px] text-white/55 md:text-[11px]">Маленькая кофейная мастерская · Минск</p>
            <a className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/75 transition hover:text-white" href="#order">
              Оставить заявку <ArrowIcon />
            </a>
          </div>
          <div className="flex flex-col gap-2 py-5 text-[8px] uppercase tracking-[0.1em] text-white/60 sm:flex-row sm:justify-between md:text-[9px] md:tracking-[0.13em]">
            <span>Обжариваем с заботой, с 2019 года</span>
            <span>© Кварта, 2026</span>
          </div>
        </div>
      </footer>
    </main>
        </LazyMotion>
    </MotionConfig>
  );
}
