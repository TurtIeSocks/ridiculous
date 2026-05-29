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
import { formatFeatureTest } from "@/components/ui/query-builder/query-builder.helpers"
import type { FeatureTest } from "@/components/ui/query-builder/query-builder.types"
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
// FeatureTestRow — shape changes + range3 + enum snap (coverage)
// ===========================================================================

describe("FeatureTestRow shape + feature changes", () => {
  test("the shape select reshapes a plain test to a 2-part range", () => {
    const onChange = vi.fn()
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "plain", feature: "width", value: "600px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("shape"), {
      target: { value: "range2" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "range2", feature: "width" }),
    )
  })

  test("the shape select reshapes to boolean", () => {
    const onChange = vi.fn()
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "plain", feature: "hover", value: "hover" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("shape"), {
      target: { value: "boolean" },
    })
    expect(onChange).toHaveBeenCalledWith({ kind: "boolean", feature: "hover" })
  })

  test("the shape select reshapes to a 3-part range", () => {
    const onChange = vi.fn()
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "range2", feature: "width", op: ">=", value: "600px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("shape"), {
      target: { value: "range3" },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "range3", feature: "width" }),
    )
  })

  test("reshaping a discrete feature to range3 does not duplicate the keyword", () => {
    // BUG: reshape() carried one string into BOTH value and value2, so a
    // discrete feature like `orientation: portrait` became the invalid
    // `portrait <= orientation <= portrait`. range3 is a numeric range shape;
    // a non-length feature must reset to numeric bounds, never the keyword.
    const onChange = vi.fn()
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "plain", feature: "orientation", value: "portrait" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("shape"), {
      target: { value: "range3" },
    })
    const emitted = onChange.mock.calls.at(-1)?.[0] as FeatureTest
    expect(emitted.kind).toBe("range3")
    if (emitted.kind === "range3") {
      // neither bound carries the discrete keyword
      expect(emitted.value).not.toBe("portrait")
      expect(emitted.value2).not.toBe("portrait")
    }
    // the serialized form is a numeric range, not `portrait <= orientation <= portrait`
    expect(formatFeatureTest(emitted)).not.toBe(
      "portrait <= orientation <= portrait",
    )
  })

  test("a range3 test renders two operators and two values", () => {
    render(
      <FeatureTestRow
        mode="media"
        index={0}
        test={{
          kind: "range3",
          feature: "width",
          op: "<=",
          value: "400px",
          op2: "<=",
          value2: "700px",
        }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("operator 1")).toBeInTheDocument()
    expect(screen.getByLabelText("operator2 1")).toBeInTheDocument()
    expect(screen.getByLabelText("value 1")).toBeInTheDocument()
    expect(screen.getByLabelText("value2 1")).toBeInTheDocument()
  })

  test("editing the second range3 operator emits it", () => {
    const onChange = vi.fn()
    render(
      <FeatureTestRow
        mode="media"
        test={{
          kind: "range3",
          feature: "width",
          op: "<=",
          value: "400px",
          op2: "<=",
          value2: "700px",
        }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("operator2"), {
      target: { value: "<" },
    })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ op2: "<" }))
  })

  test("editing a range2 operator emits it", () => {
    const onChange = vi.fn()
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "range2", feature: "width", op: ">=", value: "600px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("operator"), {
      target: { value: ">" },
    })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ op: ">" }))
  })

  test("switching to an enum feature snaps the value to a valid keyword", () => {
    const onChange = vi.fn()
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "plain", feature: "width", value: "600px" }}
        onChange={onChange}
        onRemove={() => {}}
      />,
    )
    fireEvent.change(screen.getByLabelText("feature"), {
      target: { value: "orientation" },
    })
    expect(onChange).toHaveBeenCalledWith({
      kind: "plain",
      feature: "orientation",
      value: "portrait",
    })
  })

  test("a ratio feature uses a plain input (not unit-input)", () => {
    render(
      <FeatureTestRow
        mode="media"
        test={{ kind: "plain", feature: "aspect-ratio", value: "16/9" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    )
    expect(screen.getByLabelText("value")).toHaveValue("16/9")
  })
})

// ===========================================================================
// MediaTypeSelect — modifier path
// ===========================================================================

describe("MediaTypeSelect modifier", () => {
  test("emits the chosen modifier", () => {
    const onChange = vi.fn()
    render(
      <MediaTypeSelect
        modifier={undefined}
        mediaType="screen"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/media modifier/i), {
      target: { value: "only" },
    })
    expect(onChange).toHaveBeenCalledWith({
      modifier: "only",
      mediaType: "screen",
    })
  })

  test("clearing the media type emits undefined", () => {
    const onChange = vi.fn()
    render(
      <MediaTypeSelect
        modifier="only"
        mediaType="screen"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText(/^media type/i), {
      target: { value: "" },
    })
    expect(onChange).toHaveBeenCalledWith({
      modifier: "only",
      mediaType: undefined,
    })
  })
})

// ===========================================================================
// QueryPreview — matches true + change listener + unavailable
// ===========================================================================

describe("QueryPreview matchMedia paths", () => {
  test("reflects a matching query and subscribes to change", () => {
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        media: "(min-width: 1px)",
        addEventListener,
        removeEventListener,
      }),
    })
    const { unmount } = render(
      <QueryPreview value="(min-width: 1px)" mode="media" />,
    )
    expect(screen.getByRole("status").textContent).toMatch(/matches now/i)
    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    )
    const handler = addEventListener.mock.calls[0][1] as (
      e: MediaQueryListEvent,
    ) => void
    handler({ matches: false } as MediaQueryListEvent)
    unmount()
    expect(removeEventListener).toHaveBeenCalled()
  })

  test("shows 'unavailable' when matchMedia is missing", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: undefined,
    })
    render(<QueryPreview value="(min-width: 1px)" mode="media" />)
    expect(screen.getByRole("status").textContent).toMatch(/unavailable/i)
  })

  test("returns null state when matchMedia throws", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn(() => {
        throw new Error("bad")
      }),
    })
    render(<QueryPreview value="(min-width: 1px)" mode="media" />)
    expect(screen.getByRole("status").textContent).toMatch(/unavailable/i)
  })
})

// ===========================================================================
// QueryBuilderPanel — mode switch resync
// ===========================================================================

describe("QueryBuilderPanel mode switch", () => {
  test("switching mode re-parses with the new feature table", () => {
    const { rerender } = render(
      <QueryBuilderPanel
        mode="media"
        value="(min-width: 600px)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/media type/i)).toBeInTheDocument()
    rerender(
      <QueryBuilderPanel
        mode="container"
        value="(inline-size > 30rem)"
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText(/container name/i)).toBeInTheDocument()
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
