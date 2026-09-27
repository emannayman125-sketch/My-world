"use client";

import { createContext, useContext, useEffect, useState } from "react";

const SIZES = { normal: "16px", large: "18px", xlarge: "20px" };

const FontSizeContext = createContext({ fontSize: "normal", setFontSize: () => {} });

export function useFontSize() {
  return useContext(FontSizeContext);
}

export default function FontSizeProvider({ children }) {
  const [fontSize, setFontSize] = useState("normal");

  useEffect(() => {
    const saved = window.localStorage.getItem("pw-font-size");
    if (saved && SIZES[saved]) setFontSize(saved);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = SIZES[fontSize] || SIZES.normal;
    window.localStorage.setItem("pw-font-size", fontSize);
  }, [fontSize]);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}
