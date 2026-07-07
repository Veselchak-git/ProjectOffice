import type { Meta, StoryObj } from "@storybook/react";
import { Radio } from "../Radio";

const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" }
];

const meta: Meta<typeof Radio> = {
    title: "UI Kit/Radio",
    component: Radio,
    argTypes: {
        inputSize: {
            control: "select",
            options: ["m", "l"]
        },
        disabled: { control: "boolean" }
    }
};

export default meta;

type Story = StoryObj<typeof Radio>;

export const Default: Story = {
    args: {
        name: "radio",
        options
    }
};

export const WithValue: Story = {
    args: {
        name: "radio",
        defaultValue: "option2",
        options
    }
};

export const Disabled: Story = {
    args: {
        name: "radio",
        disabled: true,
        options
    }
};

export const SizeL: Story = {
    args: {
        name: "radio",
        inputSize: "l",
        options
    }
};
