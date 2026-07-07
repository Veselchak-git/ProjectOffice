import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "../Select";

const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" }
];

const meta: Meta<typeof Select> = {
    title: "UI Kit/Select",
    component: Select,
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
        placeholder: { control: "text" },
        label: { control: "text" },
        errorMessage: { control: "text" }
    }
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
    args: {
        label: "Label",
        placeholder: "Select option",
        options
    }
};

export const WithValue: Story = {
    args: {
        label: "Label",
        value: "option2",
        options
    }
};

export const Error: Story = {
    args: {
        label: "Label",
        color: "error",
        errorMessage: "Error message",
        options
    }
};

export const Disabled: Story = {
    args: {
        label: "Label",
        placeholder: "Disabled select",
        disabled: true,
        options
    }
};

export const SizeL: Story = {
    args: {
        label: "Label",
        placeholder: "Large select",
        inputSize: "l",
        options
    }
};
