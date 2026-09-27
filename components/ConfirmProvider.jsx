"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ConfirmContext = createContext({ confirm: async () => true });

const LABELS = {
  ar: { cancel: "إلغاء", delete: "حذف" },
  en: { cancel: "Cancel", delete: "Delete" },
};

function getClientLocale() {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )locale=(ar|en)/);
  return match ? match[1] : "en";
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

export default function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { message, resolve }
  const locale = getClientLocale();
  const labels = LABELS[locale] || LABELS.en;

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  function respond(result) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {state && (
          <motion.div
            className="fixed inset-0 z-[150] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-night/60 backdrop-blur-sm"
              onClick={() => respond(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="relative glass rounded-soft p-6 w-full max-w-sm text-center shadow-glow"
            >
              <p className="mb-5">{state.message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => respond(false)}
                  className="rounded-soft bg-black/5 dark:bg-white/10 px-5 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/20"
                >
                  {labels.cancel}
                </button>
                <button
                  onClick={() => respond(true)}
                  className="rounded-soft bg-red-500/90 text-white px-5 py-2 text-sm hover:bg-red-500"
                >
                  {labels.delete}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
