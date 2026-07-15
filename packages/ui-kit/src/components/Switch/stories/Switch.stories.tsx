import type { Meta, StoryObj } from "@storybook/react-vite";

import { Switch } from "../Switch";

const meta: Meta<typeof Switch> = {
    title: "UI Kit/Switch",
    component: Switch,
    argTypes: {
        inputSize: {
            control: "select",
            options: ["m", "l"]
        },
        disabled: { control: "boolean" },
        label: { control: "text" }
    }
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
    args: {
        label: "Toggle"
    }
};

export const Checked: Story = {
    args: {
        label: "Enabled",
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
        label: "Large switch",
        inputSize: "l"
    }
};
