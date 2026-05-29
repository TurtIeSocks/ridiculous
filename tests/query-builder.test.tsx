import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import {
  ContainerNameInput,
  FeatureTestRow,
  JoinerSelect,
  MediaTypeSelect,
  NotToggle,
  QueryBuilder,
  QueryBuilderPanel,
  QueryPreview,
} from "@/components/ui/query-builder/query-builder"
import { cssMediaQuery } from "@/components/ui/query-builder/query-builder.types"

// jsdom has no matchMedia — mock it for every test.
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

test("cssMediaQuery returns its argument unchanged at runtime", () => {
  expect(cssMediaQuery("(min-width: 600px)")).toBe("(min-width: 600px)")
})

// ===========================================================================
// QueryBuilderPanel — media mode
// ===========================================================================

describe("QueryBuilderPanel (media)", () => {
  test("renders one row per feature test", () => {
    render(
      <QueryBuilderPanel
        value="(min-width: 600px) and (max-width: 900px)"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^feature/i)).toHaveLength(2)
  })

  test("editing a length value emits an updated string", () => {
    const onChange = vi.fn()
    render(<QueryBuilderPanel value="(min-width: 600px)" onChange={onChange} />)
    // unit-input drives length values: edit the numeric part, commit on blur;
    // the px unit is re-applied from the current value.
    const field = screen.getByLabelText("value 1")
    fireEvent.change(field, { target: { value: "800" } })
    fireEvent.blur(field)
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining("800px"))
  })

  test("changing the feature emits an updated string", () => {
    const onChange = vi.fn()
    render(<QueryBuilderPanel value="(min-width: 600px)" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText("feature 1"), {
      target: { value: "max-width" },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining("max-width"),
    )
  })

  test("an enum feature renders a keyword select", () => {
    render(
      <QueryBuilderPanel
        value="(orientation: landscape)"
        onChange={() => {}}
      />,
    )
    const valueSelect = screen.getByLabelText("value 1") as HTMLSelectElement
    expect(valueSelect.tagName).toBe("SELECT")
    expect(Array.from(valueSelect.options).map((o) => o.value)).toEqual([
      "portrait",
      "landscape",
    ])
  })

  test("the add button appends a default test", () => {
    const onChange = vi.fn()
    render(<QueryBuilderPanel value="(min-width: 600px)" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/add a feature test/i))
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringMatching(/and \(width/),
    )
  })

  test("removing a test drops it", () => {
    const onChange = vi.fn()
    render(
      <QueryBuilderPanel
        value="(min-width: 600px) and (max-width: 900px)"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText("Remove feature test 1"))
    expect(onChange).toHaveBeenLastCalledWith("(max-width: 900px)")
  })

  test("the joiner select switches and/or", () => {
    const onChange = vi.fn()
    render(
      <QueryBuilderPanel
        value="(hover) and (pointer: fine)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/combine tests with/i), {
      target: { value: "or" },
    })
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining(" or "))
  })

  test("the not toggle negates", () => {
    const onChange = vi.fn()
    render(<QueryBuilderPanel value="(monochrome)" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/negate/i))
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining("not "))
  })

  test("an external value change re-syncs the rows", () => {
    const { rerender } = render(
      <QueryBuilderPanel value="(min-width: 600px)" onChange={() => {}} />,
    )
    expect(screen.getAllByLabelText(/^feature/i)).toHaveLength(1)
    rerender(
      <QueryBuilderPanel
        value="(min-width: 600px) and (max-width: 900px)"
        onChange={() => {}}
      />,
    )
    expect(screen.getAllByLabelText(/^feature/i)).toHaveLength(2)
  })

  test("an empty value renders no rows but an add control", () => {
    render(<QueryBuilderPanel value="" onChange={() => {}} />)
    expect(screen.queryAllByLabelText(/^feature/i)).toHaveLength(0)
    expect(screen.getByLabelText(/add a feature test/i)).toBeInTheDocument()
  })
})

// ===========================================================================
// QueryBuilderPanel — container mode
// ===========================================================================

describe("QueryBuilderPanel (container)", () => {
  test("renders the container-name input, not a media-type select", () => {
    render(
      <QueryBuilderPanel
        mode="container"
        value="(inline-size > 30rem)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/container name/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/media type/i)).not.toBeInTheDocument()
  })

  test("the feature select offers container features only", () => {
    render(
      <QueryBuilderPanel
        mode="container"
        value="(inline-size > 30rem)"
        onChange={() => {}}
      />,
    )
    const featureSelect = screen.getByLabelText(
      "feature 1",
    ) as HTMLSelectElement
    const options = Array.from(featureSelect.options).map((o) => o.value)
    expect(options).toContain("inline-size")
    expect(options).not.toContain("resolution")
    expect(options).not.toContain("hover")
  })

  test("editing the container name emits it", () => {
    const onChange = vi.fn()
    render(
      <QueryBuilderPanel
        mode="container"
        value="(width > 400px)"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/container name/i), {
      target: { value: "sidebar" },
    })
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining("sidebar"),
    )
  })
})

// ===========================================================================
// FeatureTestRow (public)
// ===========================================================================

describe("FeatureTestRow", () => {
  test("renders feature + value for a plain test", () => {
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "plain", feature: "min-width", value: "600px" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect((screen.getByLabelText("feature") as HTMLSelectElement).value).toBe(
      "min-width",
    )
    // length values use unit-input; its numeric field shows the number, the
    // unit (px) is rendered separately as a suffix.
    expect(screen.getByLabelText("value")).toHaveValue("600")
  })

  test("a boolean test hides the value input", () => {
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "boolean", feature: "hover" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.queryByLabelText("value")).not.toBeInTheDocument()
  })

  test("calls onRemove when the × button is clicked", () => {
    const onRemove = vi.fn()
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "boolean", feature: "hover" }}
        onChange={() => {}}
        onRemove={onRemove}
      />,
    )
    fireEvent.click(screen.getByLabelText(/remove feature test/i))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// MediaTypeSelect / ContainerNameInput / JoinerSelect / NotToggle
// ===========================================================================

describe("sub-components", () => {
  test("MediaTypeSelect emits the chosen type", () => {
    const onChange = vi.fn()
    render(
      <MediaTypeSelect
        modifier={undefined}
        mediaType="screen"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/media type/i), {
      target: { value: "print" },
    })
    expect(onChange).toHaveBeenCalledWith({
      modifier: undefined,
      mediaType: "print",
    })
  })

  test("ContainerNameInput emits the typed name", () => {
    const onChange = vi.fn()
    render(<ContainerNameInput name="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/container name/i), {
      target: { value: "main" },
    })
    expect(onChange).toHaveBeenCalledWith("main")
  })

  test("JoinerSelect emits and/or", () => {
    const onChange = vi.fn()
    render(<JoinerSelect value="and" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/combine tests with/i), {
      target: { value: "or" },
    })
    expect(onChange).toHaveBeenCalledWith("or")
  })

  test("NotToggle emits the toggled state", () => {
    const onChange = vi.fn()
    render(<NotToggle checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText(/negate/i))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})

// ===========================================================================
// QueryPreview — media matches-now indicator
// ===========================================================================

describe("QueryPreview", () => {
  test("media mode shows a matches indicator from matchMedia", () => {
    render(<QueryPreview value="(min-width: 1px)" mode="media" />)
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 1px)")
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  test("container mode shows no matches indicator", () => {
    render(<QueryPreview value="(width > 1px)" mode="container" />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})

// ===========================================================================
// QueryBuilder (popover)
// ===========================================================================

describe("QueryBuilder (popover)", () => {
  test("trigger shows the mode badge and the value", () => {
    render(
      <QueryBuilder
        value="screen and (min-width: 600px)"
        onChange={() => {}}
      />,
    )
    const btn = screen.getByRole("button")
    expect(btn.textContent).toMatch(/media/i)
    expect(btn.textContent).toMatch(/min-width/)
  })

  test("container mode badge", () => {
    render(
      <QueryBuilder
        mode="container"
        value="(inline-size > 30rem)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole("button").textContent).toMatch(/container/i)
  })

  test("opening the popover reveals the panel", async () => {
    render(<QueryBuilder value="(min-width: 600px)" onChange={() => {}} />)
    fireEvent.click(screen.getByRole("button"))
    const fields = await screen.findAllByLabelText(/^feature/i)
    expect(fields.length).toBeGreaterThan(0)
  })
})
