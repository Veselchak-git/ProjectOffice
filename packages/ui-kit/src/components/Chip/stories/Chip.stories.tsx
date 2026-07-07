import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "../Chip";

const meta: Meta<typeof Chip> = {
    title: "UI Kit/Chip",
    component: Chip,
    argTypes: {
        color: {
            control: "select",
            options: ["accent", "neutral", "red", "green", "orange"]
        },
        disabled: { control: "boolean" },
        children: { control: "text" }
    }
};

export default meta;

type Story = StoryObj<typeof Chip>;

export const Accent: Story = {
    args: {
        children: "Chip",
        color: "accent"
    }
};

export const Neutral: Story = {
    args: {
        children: "Chip",
        color: "neutral"
    }
};

export const Red: Story = {
    args: {
        children: "Chip",
        color: "red"
    }
};

export const Green: Story = {
    args: {
        children: "Chip",
        color: "green"
    }
};

export const Orange: Story = {
    args: {
        children: "Chip",
        color: "orange"
    }
};

export const WithRemove: Story = {
    args: {
        children: "Chip",
        color: "accent",
        onRemove: () => {}
    }
};

export const Disabled: Story = {
    args: {
        children: "Chip",
        disabled: true
    }
};
