/*
 * Copyright (c) 2016-2026 Tecom LLC
 * All rights reserved
 *
 * Исключительное право (c) 2016-2026 принадлежит ООО Теком
 * Все права защищены
 */
import ArrowLeftIcon from "@helpdesk-portal/icons/ArrowLeft.svg?react";
import ArrowRightIcon from "@helpdesk-portal/icons/ArrowRight.svg?react";
import CaretRightIcon from "@helpdesk-portal/icons/CaretRight.svg?react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../Button";

const meta = {
    title: "Components/Button",
    component: Button,
    tags: ["autodocs"],
    args: {
        children: "Кнопка"
    },
    argTypes: {
        color: {
            control: "select",
            options: ["accent", "error"]
        },
        variant: {
            control: "select",
            options: ["fill", "stroke", "link"]
        },
        size: {
            control: "select",
            options: ["s", "m", "l", "xl"]
        }
    }
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FillAccent: Story = {
    args: {
        color: "accent",
        variant: "fill",
        size: "m"
    }
};

export const FillError: Story = {
    args: {
        color: "error",
        variant: "fill",
        size: "m"
    }
};

export const StrokeAccent: Story = {
    args: {
        color: "accent",
        variant: "stroke",
        size: "m"
    }
};

export const StrokeError: Story = {
    args: {
        color: "error",
        variant: "stroke",
        size: "m"
    }
};

export const LinkAccent: Story = {
    args: {
        color: "accent",
        variant: "link",
        size: "m"
    }
};

export const WithStartIcon: Story = {
    args: {
        startIcon: <ArrowLeftIcon />
    }
};

export const WithEndIcon: Story = {
    args: {
        endIcon: <ArrowRightIcon />
    }
};

export const WithBothIcons: Story = {
    args: {
        startIcon: <ArrowLeftIcon />,
        endIcon: <ArrowRightIcon />
    }
};

export const IconOnly: Story = {
    args: {
        iconOnly: true,
        children: <CaretRightIcon />,
        "aria-label": "Назад"
    }
};

export const StrokeWithStartIcon: Story = {
    args: {
        variant: "stroke",
        startIcon: <ArrowLeftIcon />
    }
};

export const ErrorWithStartIcon: Story = {
    args: {
        color: "error",
        startIcon: <ArrowLeftIcon />
    }
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <Button size="s">S</Button>
            <Button size="m">M</Button>
            <Button size="l">L</Button>
            <Button size="xl">XL</Button>
        </div>
    )
};

export const IconSizes: Story = {
    render: () => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <Button size="s" startIcon={<ArrowLeftIcon />}>
                S
            </Button>
            <Button size="m" startIcon={<ArrowLeftIcon />}>
                M
            </Button>
            <Button size="l" startIcon={<ArrowLeftIcon />}>
                L
            </Button>
            <Button size="xl" startIcon={<ArrowLeftIcon />}>
                XL
            </Button>
        </div>
    )
};

export const Disabled: Story = {
    args: {
        disabled: true
    }
};

export const ThemeComparison: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <Button color="accent" variant="fill">
                    Fill
                </Button>
                <Button color="accent" variant="stroke">
                    Stroke
                </Button>
                <Button color="accent" variant="link" size="m">
                    Link
                </Button>
                <Button color="error" variant="fill">
                    Error
                </Button>
                <Button color="error" variant="stroke">
                    Error stroke
                </Button>
                <Button color="error" variant="link" size="m">
                    Error link
                </Button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <Button color="accent" variant="fill" disabled>
                    Disabled
                </Button>
                <Button color="accent" variant="stroke" disabled>
                    Disabled
                </Button>
                <Button color="accent" variant="link" size="m" disabled>
                    Disabled
                </Button>
                <Button color="error" variant="fill" disabled>
                    Disabled
                </Button>
                <Button color="error" variant="stroke" disabled>
                    Disabled
                </Button>
                <Button color="error" variant="link" size="m" disabled>
                    Disabled
                </Button>
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(200px, 1fr))",
                    gap: 16,
                    maxWidth: 840
                }}
            >
                <div
                    style={{
                        padding: 24,
                        borderRadius: 8,
                        backgroundColor: "var(--semantic-bg-surface)",
                        color: "var(--semantic-text-primary)",
                        textAlign: "center"
                    }}
                >
                    Surface
                </div>
                <div
                    style={{
                        padding: 24,
                        borderRadius: 8,
                        backgroundColor: "var(--semantic-bg-surface-elevated)",
                        color: "var(--semantic-text-primary)",
                        textAlign: "center"
                    }}
                >
                    Surface elevated
                </div>
            </div>
        </div>
    )
};
