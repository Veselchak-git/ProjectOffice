import { ALL_NAMESPACES } from "@helpdesk-portal/i18n";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18n.use(HttpBackend)
    .use(new LanguageDetector())
    .use(initReactI18next)
    .init({
        backend: {
            loadPath: "http://localhost:3001/locales/{{lng}}/{{ns}}.json"
        },
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"]
        },
        fallbackLng: "ru",
        supportedLngs: ["ru", "en"],
        ns: ALL_NAMESPACES,
        defaultNS: "common",
        load: "currentOnly",
        interpolation: {
            escapeValue: false
        }
    });

export { i18n };
