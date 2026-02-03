import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FaqItem } from '@/types/cafe';

export type FaqSectionProps = {
  items: FaqItem[];
};

export const FaqSection: React.FC<FaqSectionProps> = ({ items }) => {
  const { t, i18n } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  if (!items || items.length === 0) return null;

  const locale = i18n.language as 'en' | 'de';

  return (
    <section className="listing-section">
      <h2 className="listing-section-title">
        {t('cafeDetail.frequentlyAskedQuestions')}
      </h2>

      <div className="listing-faq-list">
        {items.map((faq) => {
          const isOpen = openId === faq.id;
          const question = faq.question[locale] || faq.question.en;
          const answer = faq.answer[locale] || faq.answer.en;

          return (
            <div key={faq.id} className="listing-faq-item">
              <button
                type="button"
                className="listing-faq-question"
                onClick={() =>
                  setOpenId((prev) => (prev === faq.id ? null : faq.id))
                }
              >
                <span>{question}</span>
                <span className="listing-faq-toggle">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="listing-faq-answer">
                  <p>{answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};