"use client";
import { useEffect } from "react";
import { processTelegramHash } from "@/components/telegram-login-button";

// Telegram redirect-oqib kelganda (#id=..&hash=..) — istalgan sahifada yakunlash
export function TelegramHashBoot() {
  useEffect(() => {
    if (window.location.hash.includes("auth_date")) processTelegramHash();
  }, []);
  return null;
}
