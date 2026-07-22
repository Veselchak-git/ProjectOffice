/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Modal } from "../Modal";

const meta = {
    title: "Components/Modal",
    component: Modal,
    tags: ["autodocs"],
    args: {
        isOpen: true,
        onClose: () => {},
        children: "Содержимое модального окна"
    }
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTitle: Story = {
    args: {
        title: "Заголовок модального окна"
    }
};

export const SmallModal: Story = {
    args: {
        title: "Маленькое окно",
        size: "s",
        children: <div style={{ padding: "var(--space-4, 16px)" }}>Это маленькое модальное окно размера S.</div>
    }
};

export const MediumModal: Story = {
    args: {
        title: "Среднее окно",
        size: "m",
        children: (
            <div style={{ padding: "var(--space-4, 16px)" }}>
                Это среднее модальное окно размера M — размер по умолчанию.
            </div>
        )
    }
};

export const LargeModal: Story = {
    args: {
        title: "Большое окно",
        size: "l",
        children: <div style={{ padding: "var(--space-4, 16px)" }}>Это большое модальное окно размера L.</div>
    }
};

export const DifferentSizes: Story = {
    render: () => (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Modal isOpen onClose={() => {}} title="S" size="s">
                <div style={{ padding: "var(--space-4, 16px)" }}>Маленькое</div>
            </Modal>
            <Modal isOpen onClose={() => {}} title="M" size="m">
                <div style={{ padding: "var(--space-4, 16px)" }}>Среднее</div>
            </Modal>
            <Modal isOpen onClose={() => {}} title="L" size="l">
                <div style={{ padding: "var(--space-4, 16px)" }}>Большое</div>
            </Modal>
        </div>
    )
};

export const LongContent: Story = {
    args: {
        title: "Длинное содержимое",
        children: (
            <div style={{ padding: "var(--space-4, 16px)", maxHeight: 300, overflowY: "auto" }}>
                {Array.from({ length: 20 }, (_, i) => (
                    <p key={i} style={{ margin: "0 0 var(--space-3, 12px)" }}>
                        Параграф {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                        ullamco laboris.
                    </p>
                ))}
            </div>
        )
    }
};

export const ProgrammaticClose: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: "1px solid var(--semantic-border-default)",
                        background: "var(--semantic-bg-surface-elevated)",
                        color: "var(--semantic-text-primary)",
                        cursor: "pointer"
                    }}
                >
                    Открыть модальное окно
                </button>
                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Управляемое окно">
                    <div style={{ padding: "var(--space-4, 16px)" }}>
                        <p style={{ margin: "0 0 var(--space-3, 12px)" }}>
                            Нажмите Escape, крестик или область вокруг окна, чтобы закрыть.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: 6,
                                border: "1px solid var(--semantic-border-default)",
                                background: "var(--semantic-bg-surface-elevated)",
                                color: "var(--semantic-text-primary)",
                                cursor: "pointer"
                            }}
                        >
                            Закрыть программно
                        </button>
                    </div>
                </Modal>
            </div>
        );
    }
};
