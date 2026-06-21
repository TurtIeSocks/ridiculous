import { CssOutput } from "@/components/ui/css-output"
import { EasingPreview, type PreviewProperty } from "../preview/easing-preview"

interface PreviewSectionProps {
  easing: string
  previewProperty: PreviewProperty
  onPreviewPropertyChange: (property: PreviewProperty) => void
}

/**
 * The bottom half of the panel: the preview-property picker, the live
 * animated curve preview, and the copyable output snippet.
 */
export function PreviewSection({
  easing,
  previewProperty,
  onPreviewPropertyChange,
}: PreviewSectionProps) {
  return (
    <>
      <div className="flex items-center gap-2 text-xs">
        <label htmlFor="preview-property" className="text-muted-foreground">
          Preview:
        </label>
        <select
          id="preview-property"
          value={previewProperty}
          onChange={(e) =>
            onPreviewPropertyChange(e.target.value as PreviewProperty)
          }
          className="rounded bg-muted px-2 py-1 text-foreground"
        >
          <option value="moveX">Move X</option>
          <option value="moveY">Move Y</option>
          <option value="scale">Scale</option>
          <option value="rotate">Rotate</option>
          <option value="opacity">Opacity</option>
          <option value="width">Width</option>
        </select>
      </div>
      <EasingPreview easing={easing} property={previewProperty} />
      <CssOutput
        value={easing}
        property="transition-timing-function"
        output="both"
      />
    </>
  )
}
