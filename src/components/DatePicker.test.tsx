import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DatePicker } from "./DatePicker";
import { HotkeysProvider } from "react-hotkeys-hook";

describe("DatePicker", () => {
  it("renders the date picker button", () => {
    const { getByText } = render(
      <HotkeysProvider>
        <DatePicker value={null} onChange={() => {}}>
          <button>Open Picker</button>
        </DatePicker>
      </HotkeysProvider>
    );
    expect(getByText("Open Picker")).toBeInTheDocument();
  });

  it("opens the date picker on click", () => {
    const { getByText, queryByText } = render(
      <HotkeysProvider>
        <DatePicker value={null} onChange={() => {}}>
          <button>Open Picker</button>
        </DatePicker>
      </HotkeysProvider>
    );

    fireEvent.click(getByText("Open Picker"));
    expect(queryByText("Today")).toBeInTheDocument();
  });

  it("calls onChange with the correct date when a date is clicked", () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <HotkeysProvider>
        <DatePicker value={null} onChange={onChange}>
          <button>Open Picker</button>
        </DatePicker>
      </HotkeysProvider>
    );

    fireEvent.click(getByText("Open Picker"));
    fireEvent.click(getByText("Today"));
    expect(onChange).toHaveBeenCalled();
  });
});
