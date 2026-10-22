// Native-host Browser verification only. One sample, no wait/retry or page mutation.
const FIELDS = Object.freeze([
  "inner_width", "inner_height", "client_width", "client_height",
  "scroll_width", "scroll_height", "visual_width", "visual_height",
  "visual_scale", "device_pixel_ratio",
]);

export function measureNativeViewport() {
  const root = document.documentElement;
  const visual = window.visualViewport;
  return {
    inner_width: window.innerWidth,
    inner_height: window.innerHeight,
    client_width: root?.clientWidth ?? null,
    client_height: root?.clientHeight ?? null,
    scroll_width: root?.scrollWidth ?? null,
    scroll_height: root?.scrollHeight ?? null,
    visual_width: visual?.width ?? null,
    visual_height: visual?.height ?? null,
    visual_scale: visual?.scale ?? null,
    device_pixel_ratio: window.devicePixelRatio,
  };
}

export function assessNativeViewportFit(requested, sample) {
  if (!requested || !Number.isSafeInteger(requested.width) || requested.width <= 0 ||
      !Number.isSafeInteger(requested.height) || requested.height <= 0 ||
      typeof requested.mobile !== "boolean" || requested.deviceScaleFactor !== 1) {
    throw new Error("native_viewport_request_invalid");
  }
  const request = Object.freeze({ width: requested.width, height: requested.height,
    mobile: requested.mobile, deviceScaleFactor: requested.deviceScaleFactor });
  const actual = Object.freeze(Object.fromEntries(FIELDS.map(key => [key,
    typeof sample?.[key] === "number" && Number.isFinite(sample[key]) ? sample[key] : null])));
  const problems = [];
  for (const key of FIELDS) {
    if (!(actual[key] > 0) || (!key.startsWith("visual_") && key !== "device_pixel_ratio" && !Number.isSafeInteger(actual[key]))) {
      problems.push(`invalid_${key}`);
    }
  }
  let status = "measurement_invalid";
  if (!problems.length) {
    // CSS layout viewport and unzoomed visual viewport must reflect the request.
    // outerWidth/screen dimensions describe the host window/device, not CSS fit.
    if (actual.inner_width !== request.width || actual.inner_height !== request.height ||
        actual.device_pixel_ratio !== request.deviceScaleFactor || actual.visual_scale !== 1) {
      status = "viewport_mismatch";
      problems.push("requested_css_viewport_not_established");
    } else if (actual.client_width > actual.inner_width || actual.client_height > actual.inner_height ||
        actual.scroll_width < actual.client_width || actual.scroll_height < actual.client_height ||
        Math.round(actual.visual_width) !== actual.client_width || Math.round(actual.visual_height) !== actual.client_height) {
      // client dimensions may exclude scrollbars; visual dimensions are floating
      // CSS pixels, whereas client dimensions are integer CSS pixels.
      status = "measurement_inconsistent";
      problems.push("contradictory_viewport_dimensions");
    } else if (actual.scroll_width > actual.client_width + 1 || actual.scroll_width > request.width + 1) {
      status = "document_overflow";
      problems.push("document_exceeds_viewport_plus_one_css_pixel");
    } else {
      status = "fit";
    }
  }
  return Object.freeze({ contract: "operator_native_viewport_fit.v1", status,
    requested: request, actual, problems: Object.freeze(problems),
    original_predicate: actual.scroll_width !== null && actual.inner_width !== null
      ? actual.scroll_width <= actual.inner_width + 1 : null });
}

export async function assertNativeViewportFit(lifecycle, requested, label) {
  const sample = await lifecycle.evaluateJson(`(${measureNativeViewport.toString()})()`);
  const evidence = assessNativeViewportFit(requested, sample);
  const checkpoint = /^[a-z0-9_-]{1,80}$/u.test(label) ? label : "invalid_checkpoint_label";
  // Closed numeric schema: no DOM text, source contents, locators or credentials.
  console.log(JSON.stringify({ native_viewport_fit: { checkpoint, ...evidence } }));
  if (evidence.status !== "fit") {
    const error = new Error(`native_viewport_fit:${evidence.status}:${checkpoint}:${JSON.stringify(evidence)}`);
    error.evidence = evidence; // Immutable first failure survives later fitting reads.
    throw error;
  }
  return evidence;
}
