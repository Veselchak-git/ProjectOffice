import type { Meta, StoryObj } from "@storybook/react-vite";

import { ContextItem } from "../ContextItem";

const meta: Meta<typeof ContextItem> = {
    title: "UI Kit/ContextItem",
    component: ContextItem,
    argTypes: {
        disabled: { control: "boolean" },
        label: { control: "text" }
    }
};

export default meta;

type Story = StoryObj<typeof ContextItem>;

export const Default: Story = {
    args: {
        label: "Menu item"
    }
};

export const WithIcon: Story = {
    args: {
        label: "Edit",
        icon: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M11.5 2.5L13.5 4.5L5.5 12.5L2 14L3.5 10.5L11.5 2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }
};

export const WithEndIcon: Story = {
    args: {
        label: "Open",
        endIcon: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }
};

export const WithBothIcons: Story = {
    args: {
        label: "Settings",
        icon: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path
                    d="M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M3.05 12.95L4.46 11.54M11.54 4.46L12.95 3.05"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
        ),
        endIcon: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }
};

export const Disabled: Story = {
    args: {
        label: "Disabled item",
        disabled: true
    }
};
