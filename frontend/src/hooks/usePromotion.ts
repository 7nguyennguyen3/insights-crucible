"use client";

import { useState, useEffect } from "react";

interface PromotionData {
  isPromoActive: boolean;
  credits: string;
  promoDeadlineText: string;
}

export const usePromotion = (): PromotionData => {
  const [isPromoActive, setIsPromoActive] = useState(false);
  const [credits, setCredits] = useState(
    process.env.NEXT_PUBLIC_DEFAULT_CREDITS || "5"
  );
  const [promoDeadlineText, setPromoDeadlineText] = useState("");

  useEffect(() => {
    const promoEndDateString = process.env.NEXT_PUBLIC_PROMO_END_DATE;
    if (!promoEndDateString || !promoEndDateString.includes("/")) return;

    const [month, day] = promoEndDateString.split("/");
    const currentYear = new Date().getFullYear();
    const promoEndDate = new Date(`${currentYear}-${month}-${day}T00:00:00Z`);
    const now = new Date();

    if (now < promoEndDate) {
      setIsPromoActive(true);
      setCredits(process.env.NEXT_PUBLIC_PROMO_CREDITS || "10");

      const dayOfMonth = promoEndDate.getUTCDate();
      const getOrdinalSuffix = (d: number) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };

      const formattedMonth = new Intl.DateTimeFormat("en-US", {
        month: "long",
        timeZone: "UTC",
      }).format(promoEndDate);
      
      setPromoDeadlineText(
        `${formattedMonth} ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`
      );
    }
  }, []);

  return {
    isPromoActive,
    credits,
    promoDeadlineText,
  };
};