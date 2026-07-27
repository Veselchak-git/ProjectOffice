/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import { DATE_TIME_PICKER } from "@helpdesk-portal/i18n";
import CalendarIcon from "@helpdesk-portal/icons/Calendar.svg?react";
import { Button } from "@helpdesk-portal/ui-kit";
import { enUS } from "date-fns/locale/en-US";
import { ru } from "date-fns/locale/ru";
import { forwardRef, useState } from "react";
import { registerLocale } from "react-datepicker";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";

import { i18n } from "@/shared/lib/i18n";

import "./DateTimePicker.css";

registerLocale("ru", ru);
registerLocale("en", enUS);

interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
}

interface TriggerButtonProps {
    onClick?: () => void;
    isActive: boolean;
}

interface CustomTimeInputInnerProps {
    date?: Date;
    value?: string;
    onChange?: (time: string) => void;
    seconds: number;
    onSecondsChange: (sec: number) => void;
}
const CustomTimeInput = forwardRef<HTMLInputElement, CustomTimeInputInnerProps>(function CustomTimeInput(
    { value: timeValue, onChange: onTimeChange, seconds, onSecondsChange },
    ref
) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const parts = val.split(":");
        if (parts.length >= 3) {
            onSecondsChange(parseInt(parts[2] ?? "0", 10));
        }
        // InputTime.onTimeChange принимает только HH:mm, игнорирует секунды
        onTimeChange?.(val.substring(0, 5));
    };

    // step="1" требует значение в формате HH:mm:ss
    const displayValue =
        timeValue && timeValue.length === 5 ? `${timeValue}:${String(seconds).padStart(2, "0")}` : timeValue || "";

    return (
        <input
            ref={ref}
            type="time"
            step="1"
            className="react-datepicker-time__input datetime-picker__time-input"
            value={displayValue}
            onChange={handleChange}
        />
    );
});

const TriggerButton = forwardRef<HTMLButtonElement, TriggerButtonProps>(function TriggerButton(
    { onClick, isActive },
    ref
) {
    return (
        <span ref={ref} className="datetime-picker__trigger-wrapper">
            <Button
                variant="link"
                iconOnly
                className={`datetime-picker__trigger${isActive ? " datetime-picker__trigger--active" : ""}`}
                onClick={onClick}
                aria-label="Выбрать дату и время"
            >
                <CalendarIcon />
            </Button>
        </span>
    );
});

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
    const { t } = useTranslation(DATE_TIME_PICKER);
    const locale = i18n.language === "ru" ? "ru" : "en";
    const timeLabel = t("time");

    const selectedDate = value ? new Date(value) : null;
    const isActive = Boolean(value);

    // Храним секунды из кастомного <input type="time" step="1"> в state,
    // т.к. react-datepicker не умеет работать с секундами нативно.
    // Внутренний InputTime.onTimeChange парсит только HH:mm,
    // секунды извлекаем из значения нативного инпута и восстанавливаем в onChange.
    const [seconds, setSeconds] = useState(selectedDate ? selectedDate.getSeconds() : 0);

    // customTimeInput передаётся как React-элемент в DatePicker.
    // InputTime клонирует его через cloneElement, добавляя date/value/onChange.
    // seconds/onSecondsChange передаются напрямую через JSX и сохраняются при клонировании.

    return (
        <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => {
                if (date && !isNaN(date.getTime())) {
                    // Восстанавливаем секунды из state (библиотека их обнуляет/не трогает)
                    date.setSeconds(seconds);
                    setSeconds(date.getSeconds());
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    const secs = String(date.getSeconds()).padStart(2, "0");
                    onChange(`${year}-${month}-${day}T${hours}:${minutes}:${secs}`);
                } else {
                    onChange("");
                }
            }}
            showTimeInput
            customTimeInput={<CustomTimeInput seconds={seconds} onSecondsChange={setSeconds} />}
            timeInputLabel={timeLabel}
            dateFormat="dd.MM.yyyy HH:mm:ss"
            locale={locale}
            calendarClassName="datetime-picker__calendar"
            popperClassName="datetime-picker__popper"
            wrapperClassName="datetime-picker__wrapper"
            customInput={<TriggerButton isActive={isActive} />}
            isClearable={false}
            popperPlacement="bottom-start"
        />
    );
}
