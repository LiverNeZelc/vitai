'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

type FormState = {
  name: string;
  phone: string;
  interest: 'subscription' | 'single_order' | 'question';
  comment: string;
};

type SubmitState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  name: '',
  phone: '',
  interest: 'subscription',
  comment: '',
};

function parseUtm() {
  const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  return {
    utm_source: search.get('utm_source') ?? null,
    utm_medium: search.get('utm_medium') ?? null,
    utm_campaign: search.get('utm_campaign') ?? null,
    utm_content: search.get('utm_content') ?? null,
    utm_term: search.get('utm_term') ?? null,
    gclid: search.get('gclid') ?? null,
    pageUrl: typeof window !== 'undefined' ? window.location.href : null,
  };
}

function validateField<K extends keyof FormState>(field: K, value: FormState[K]): string | undefined {
  if (field === 'name') {
    const name = String(value).trim();
    if (name.length < 2 || name.length > 100) {
      return 'Укажите имя длиной от 2 до 100 символов.';
    }
  }

  if (field === 'phone') {
    const phone = String(value).trim();
    const digits = phone.replace(/\D/g, '');
    const validCharacters = /^[+\d\s()-]+$/.test(phone);
    const validBelarusianNumber =
      (phone.startsWith('+') && /^375\d{9}$/.test(digits)) ||
      /^375\d{9}$/.test(digits) ||
      /^80\d{9}$/.test(digits) ||
      /^\d{9}$/.test(digits);

    if (!validCharacters || !validBelarusianNumber) {
      return 'Введите белорусский номер, например +375 29 123-45-67.';
    }
  }

  if (field === 'comment' && String(value).length > 1000) {
    return 'Комментарий не должен быть длиннее 1000 символов.';
  }

  return undefined;
}

export default function Page() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle', message: '' });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const utm = useMemo(() => parseUtm(), []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const error = validateField(key, value);
      return { ...current, [key]: error };
    });
    setSubmitState((current) =>
      current.status === 'loading' ? current : { status: 'idle', message: '' },
    );
  }

  function validateForm(values: FormState): FormErrors {
    return {
      name: validateField('name', values.name),
      phone: validateField('phone', values.phone),
      comment: validateField('comment', values.comment),
    };
  }

  function handleBlur<K extends keyof FormState>(key: K) {
    const error = validateField(key, form[key]);
    setFieldErrors((current) => ({ ...current, [key]: error }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateForm(form);
    setFieldErrors(errors);
    const firstInvalidField = (Object.keys(errors) as (keyof FormState)[]).find(
      (key) => errors[key],
    );
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      setSubmitState({ status: 'idle', message: '' });
      return;
    }

    setSubmitState({ status: 'loading', message: 'Отправляем заявку…' });

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...utm,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serverErrors = payload?.error?.fields as Record<string, string> | undefined;
        if (serverErrors) {
          setFieldErrors({
            name: serverErrors.name,
            phone: serverErrors.phone,
            interest: serverErrors.interest,
            comment: serverErrors.comment,
          });
        }

        const message =
          payload?.error?.message ||
          payload?.message ||
          'Не удалось отправить заявку. Проверьте поля и попробуйте ещё раз.';

        setSubmitState({ status: 'error', message });
        return;
      }

      setSubmitState({
        status: 'success',
        message: payload?.data?.message || 'Заявка отправлена. Менеджер свяжется с вами в ближайшее время.',
      });
      setForm(initialForm);
      setFieldErrors({});
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: 'Сайт временно недоступен. Попробуйте отправить заявку позже или позвоните нам.',
      });
    }
  }

  return (
    <main>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #f8f3ee;
          color: #1d1b18;
          line-height: 1.5;
        }
        a { color: inherit; text-decoration: none; }
        img { max-width: 100%; display: block; }
        .container {
          width: min(1120px, calc(100% - 32px));
          margin: 0 auto;
        }
        .topbar {
          background: #241a15;
          color: #f7f3ef;
          padding: 14px 0;
        }
        .topbar-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .brand { font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .nav {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          font-size: 0.95rem;
          opacity: 0.9;
        }
        .hero {
          background: linear-gradient(135deg, #f7ebdf 0%, #f2d4a8 100%);
          padding: 48px 0 30px;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 30px;
          align-items: center;
        }
        .eyebrow {
          display: inline-block;
          background: rgba(35, 28, 23, 0.08);
          border: 1px solid rgba(35, 28, 23, 0.15);
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        h1 {
          font-size: clamp(2.4rem, 5vw, 5rem);
          line-height: 0.96;
          margin: 18px 0 18px;
          letter-spacing: -0.05em;
        }
        .lead {
          max-width: 560px;
          font-size: 1.1rem;
          margin-bottom: 24px;
        }
        .cta-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .button {
          appearance: none;
          border: none;
          border-radius: 999px;
          background: #2f261f;
          color: white;
          padding: 14px 22px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .button:hover { transform: translateY(-1px); }
        .button.secondary {
          background: transparent;
          border: 1px solid rgba(34, 28, 24, 0.3);
          color: #2a221d;
        }
        .hero-card {
          background: rgba(255,255,255,0.52);
          border: 1px solid rgba(31,24,21,0.12);
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 22px 50px rgba(58, 39, 24, 0.12);
        }
        .coffee-image {
          border-radius: 24px;
          overflow: hidden;
          min-height: 420px;
          background: linear-gradient(180deg, #d5ae79 0%, #714b2e 100%);
          position: relative;
        }
        .coffee-image::before {
          content: "";
          position: absolute;
          inset: 16% 18% 12% 18%;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #f4d8a2 0%, #c68e52 18%, #6e3c24 68%, #362217 100%);
          box-shadow: 0 30px 60px rgba(49,22,12,0.24);
        }
        section { padding: 54px 0; }
        .section-title {
          font-size: clamp(1.8rem, 3vw, 3rem);
          line-height: 1.1;
          margin-bottom: 10px;
        }
        .muted { color: #5e524d; }
        .features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 26px;
        }
        .feature {
          background: #fff;
          border: 1px solid rgba(32,26,22,0.08);
          border-radius: 20px;
          padding: 22px 20px;
        }
        .feature strong {
          display: block;
          margin-bottom: 10px;
          font-size: 1.05rem;
        }
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-top: 24px;
        }
        .product {
          background: white;
          border-radius: 20px;
          padding: 20px 18px;
          border: 1px solid rgba(31,24,21,0.08);
        }
        .product .origin {
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8d6d57;
          margin-bottom: 6px;
        }
        .product h3 {
          margin: 8px 0;
          font-size: 1.35rem;
        }
        .price {
          font-size: 1.6rem;
          font-weight: 700;
          margin: 12px 0 0;
        }
        .subscription-box, .delivery-box {
          background: #fff;
          border-radius: 22px;
          padding: 26px;
          border: 1px solid rgba(34, 27, 25, 0.08);
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 22px;
          margin-top: 22px;
        }
        .list {
          padding-left: 18px;
          margin: 10px 0 0;
        }
        .contacts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 24px;
        }
        .contact-card {
          background: white;
          border: 1px solid rgba(35,28,24,0.08);
          border-radius: 20px;
          padding: 20px;
        }
        .form-wrap {
          background: white;
          border-radius: 28px;
          border: 1px solid rgba(35,28,24,0.08);
          padding: 24px;
        }
        form {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }
        label {
          display: grid;
          gap: 8px;
          font-weight: 600;
        }
        input, select, textarea {
          width: 100%;
          border: 1px solid rgba(32,25,22,0.2);
          border-radius: 12px;
          padding: 12px 14px;
          font: inherit;
          background: #fff;
        }
        input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"] {
          border-color: #b83227;
        }
        .field-error {
          color: #8f2e28;
          font-size: 0.9rem;
          font-weight: 400;
        }
        textarea { min-height: 110px; resize: vertical; }
        .status {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          font-weight: 600;
          border: 1px solid transparent;
        }
        .status.success {
          background: #eaf8ee;
          border-color: #a9d8b8;
          color: #1f5d37;
        }
        .status.error {
          background: #fff1f0;
          border-color: #f1b0a8;
          color: #8f2e28;
        }
        footer {
          padding: 30px 0 60px;
          color: #5a4e49;
        }
        @media (max-width: 900px) {
          .hero-grid, .grid-2, .contacts, .features, .catalog-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">Кварта</div>
          <nav className="nav" aria-label="Основная навигация">
            <a href="#about">О нас</a>
            <a href="#catalog">Ассортимент</a>
            <a href="#subscription">Подписка</a>
            <a href="#delivery">Доставка</a>
            <a href="#contacts">Контакты</a>
            <a href="#form">Оставить заявку</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Свежая обжарка</span>
            <h1>Кофе, который пахнет утром и живёт по-честному.</h1>
            <p className="lead">
              Маленькая мастерская из Минска: обжариваем небольшими партиями, доставляем свежие зерна
              в день после обжарки и делаем кофе простым, домашним и понятным.
            </p>
            <div className="cta-row">
              <a className="button" href="#form">Заказать кофе</a>
              <a className="button secondary" href="#catalog">Смотреть ассортимент</a>
            </div>
            <p className="muted">Четверг и пятница — дни обжарки и доставки по Минску.</p>
          </div>

          <div className="hero-card">
            <div className="coffee-image" aria-label="Пример свежесваренного кофе" />
          </div>
        </div>
      </section>

      <section id="about">
        <div className="container">
          <div className="eyebrow">Почему мы</div>
          <h2 className="section-title">Свежесть — не маркетинг, а смысл.</h2>
          <p className="muted">
            Мы обжариваем небольшими партиями по 5 кг с 2019 года. Основатели — Аня и Дмитрий, раньше
            работали бариста. Для нас важно, чтобы зерно приходило к вам в течение 1–3 дней после обжарки,
            а не недельной давности и не с «премиальным» блеском без вкуса.
          </p>

          <div className="features">
            <div className="feature">
              <strong>Небольшие партии</strong>
              Каждая обжарка свежая, контролируемая и без лишнего объёма.
            </div>
            <div className="feature">
              <strong>Скорость доставки</strong>
              Свежеобжаренное зерно доезжает до клиента быстро и по-честному.
            </div>
            <div className="feature">
              <strong>Простой вкус</strong>
              Без пафоса, без глянца, без искусственной «премиальности».
            </div>
          </div>
        </div>
      </section>

      <section id="catalog">
        <div className="container">
          <div className="eyebrow">Ассортимент</div>
          <h2 className="section-title">Проверенные сорта и привычный вкус</h2>

          <div className="catalog-grid">
            <article className="product">
              <div className="origin">Эфиопия</div>
              <h3>Иргачеффе</h3>
              <p>Цветочный, бергамот, светлая обжарка</p>
              <p className="price">32 BYN</p>
            </article>

            <article className="product">
              <div className="origin">Колумбия</div>
              <h3>Уила</h3>
              <p>Карамель, красное яблоко</p>
              <p className="price">29 BYN</p>
            </article>

            <article className="product">
              <div className="origin">Бразилия</div>
              <h3>Серрадо</h3>
              <p>Орех, шоколад, под эспрессо</p>
              <p className="price">26 BYN</p>
            </article>

            <article className="product">
              <div className="origin">Дрип-пакеты</div>
              <h3>Ассорти</h3>
              <p>10 штук</p>
              <p className="price">18 BYN</p>
            </article>
          </div>
        </div>
      </section>

      <section id="subscription">
        <div className="container grid-2">
          <div className="subscription-box">
            <div className="eyebrow">Подписка</div>
            <h2 className="section-title">Пачки по 250 г раз в месяц</h2>
            <p className="muted">2 пачки по 250 г, доставка бесплатно.</p>
            <p className="price">54 BYN / мес</p>
            <ul className="list">
              <li>Подбор подходящего вкуса под привычку кофе</li>
              <li>Свежая обжарка без задержек</li>
              <li>Простой формат: дома или в офисе</li>
            </ul>
          </div>

          <div className="delivery-box">
            <div className="eyebrow">Как купить</div>
            <h2 className="section-title">Самовывоз и доставка</h2>
            <ul className="list">
              <li>Самовывоз: Минск, ул. Короля, 9</li>
              <li>Часы работы: пн–пт 8:00–20:00, сб–вс 10:00–18:00</li>
              <li>Доставка по Минску в пятницу от 50 BYN — бесплатно</li>
              <li>Свежесть важнее громких обещаний</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="contacts">
        <div className="container">
          <div className="eyebrow">Контакты</div>
          <h2 className="section-title">Кофе без лишнего шума</h2>

          <div className="contacts">
            <div className="contact-card">
              <strong>Адрес</strong>
              <p>Минск, ул. Короля, 9</p>
            </div>
            <div className="contact-card">
              <strong>Связь</strong>
              <p>Telegram, Instagram, звонок — менеджер всё оформит.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="form">
        <div className="container">
          <div className="grid-2">
            <div>
              <div className="eyebrow">Заявка</div>
              <h2 className="section-title">Оставьте заявку — мы всё оформим</h2>
              <p className="muted">
                Укажите, что вам нужно: подписка, разовый заказ или вопрос. Наш менеджер перезвонит и поможет
                подобрать вариант под ваш вкус.
              </p>
            </div>

            <div className="form-wrap">
              <form onSubmit={handleSubmit} noValidate>
                <label>
                  Имя
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    onBlur={() => handleBlur('name')}
                    disabled={submitState.status === 'loading'}
                    placeholder="Ваше имя"
                    minLength={2}
                    maxLength={100}
                    required
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  />
                  {fieldErrors.name && <span className="field-error" id="name-error">{fieldErrors.name}</span>}
                </label>

                <label>
                  Телефон
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    onBlur={() => handleBlur('phone')}
                    disabled={submitState.status === 'loading'}
                    placeholder="+375 29 123-45-67"
                    required
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                  />
                  {fieldErrors.phone && <span className="field-error" id="phone-error">{fieldErrors.phone}</span>}
                </label>

                <label>
                  Что интересует
                  <select
                    id="interest"
                    value={form.interest}
                    onChange={(event) =>
                      updateField('interest', event.target.value as FormState['interest'])
                    }
                    onBlur={() => handleBlur('interest')}
                    disabled={submitState.status === 'loading'}
                    aria-invalid={Boolean(fieldErrors.interest)}
                    aria-describedby={fieldErrors.interest ? 'interest-error' : undefined}
                  >
                    <option value="subscription">Подписка</option>
                    <option value="single_order">Разовый заказ</option>
                    <option value="question">Вопрос</option>
                  </select>
                  {fieldErrors.interest && <span className="field-error" id="interest-error">{fieldErrors.interest}</span>}
                </label>

                <label>
                  Комментарий
                  <textarea
                    id="comment"
                    value={form.comment}
                    onChange={(event) => updateField('comment', event.target.value)}
                    onBlur={() => handleBlur('comment')}
                    disabled={submitState.status === 'loading'}
                    placeholder="Например: хочу попробовать смешение для дома, под эспрессо"
                    maxLength={1000}
                    aria-invalid={Boolean(fieldErrors.comment)}
                    aria-describedby={fieldErrors.comment ? 'comment-error' : undefined}
                  />
                  {fieldErrors.comment && <span className="field-error" id="comment-error">{fieldErrors.comment}</span>}
                </label>

                <button className="button" type="submit" disabled={submitState.status === 'loading'}>
                  {submitState.status === 'loading' ? 'Отправляем…' : 'Отправить заявку'}
                </button>

                {submitState.status !== 'idle' && (
                  <div
                    className={`status ${submitState.status === 'success' ? 'success' : 'error'}`}
                    role={submitState.status === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                  >
                    {submitState.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">Кварта — обжарка кофе для дома и офиса.</div>
      </footer>
    </main>
  );
}
