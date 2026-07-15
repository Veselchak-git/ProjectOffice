import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../Input";

const meta: Meta<typeof Input> = {
    title: "UI Kit/Input",
    component: Input,
    argTypes: {
        color: {
            control: "select",
            options: ["default", "error"]
        },
        inputSize: {
            control: "select",
            options: ["m", "l"]
        },
        disabled: { control: "boolean" },
        filled: { control: "boolean" },
        placeholder: { control: "text" },
        label: { control: "text" },
        errorMessage: { control: "text" }
    }
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
    args: {
        label: "Title",
        placeholder: "Placeholder"
    }
};

export const WithValue: Story = {
    args: {
        label: "Title",
        value: "Some value",
        filled: true
    }
};

export const Error: Story = {
    args: {
        label: "Title",
        color: "error",
        errorMessage: "Error message",
        value: "Wrong value"
    }
};

export const Disabled: Story = {
    args: {
        label: "Title",
        placeholder: "Disabled input",
        disabled: true
    }
};

export const WithIcon: Story = {
    args: {
        label: "Search",
        placeholder: "Search...",
        startIcon: "S"
    }
};

export const SizeL: Story = {
    args: {
        label: "Title",
        placeholder: "Large input",
        inputSize: "l"
    }
};
