import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../Checkbox";

const meta: Meta<typeof Checkbox> = {
    title: "UI Kit/Checkbox",
    component: Checkbox,
    argTypes: {
        inputSize: {
            control: "select",
            options: ["m", "l"]
        },
        disabled: { control: "boolean" },
        indeterminate: { control: "boolean" },
        label: { control: "text" }
    }
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
    args: {
        label: "Checkbox"
    }
};

export const Checked: Story = {
    args: {
        label: "Checked",
        defaultChecked: true
    }
};

export const Indeterminate: Story = {
    args: {
        label: "Indeterminate",
        indeterminate: true,
        defaultChecked: true
    }
};

export const Disabled: Story = {
    args: {
        label: "Disabled",
        disabled: true
    }
};

export const DisabledChecked: Story = {
    args: {
        label: "Disabled checked",
        disabled: true,
        defaultChecked: true
    }
};

export const SizeL: Story = {
    args: {
        label: "Large checkbox",
        inputSize: "l"
    }
};
