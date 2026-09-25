import type { AnalyticsEventV1 } from "../contracts/event-v1";

type ClickData = {
  coordinates?: { normalized_x?: number; normalized_y?: number };
  element?: { id?: string; type?: string };
};

type ScrollData = { depth?: number };

export interface ElementInteraction {
  element_id: string | null;
  element_type: string | null;
  clicks: number;
}

export interface SpatialBucket {
  x: number;
  y: number;
  clicks: number;
}

export interface PathInteraction {
  path: string;
  clicks: number;
  scroll_events: number;
  average_scroll_depth: number;
  max_scroll_depth: number;
  interactions_per_session: number;
  elements: ElementInteraction[];
  spatial: SpatialBucket[];
}

export interface InteractionSummary {
  clicks: number;
  scroll_events: number;
  paths: PathInteraction[];
}

export interface InteractionEngineOptions {
  spatialGridSize?: number;
}

export function buildInteractionSummary(
  events: readonly AnalyticsEventV1[],
  options: InteractionEngineOptions = {},
): InteractionSummary {
  const gridSize = Math.max(2, Math.min(100, Math.floor(options.spatialGridSize ?? 20)));
  const paths = new Map<string, {
    clicks: number;
    scrollDepths: number[];
    sessions: Set<string>;
    elements: Map<string, ElementInteraction>;
    spatial: Map<string, SpatialBucket>;
  }>();

  const stateFor = (path: string) => {
    let state = paths.get(path);
    if (!state) {
      state = { clicks: 0, scrollDepths: [], sessions: new Set(), elements: new Map(), spatial: new Map() };
      paths.set(path, state);
    }
    return state;
  };

  let clicks = 0;
  let scrollEvents = 0;

  for (const event of events) {
    if (event.event !== "click" && event.event !== "scroll") continue;
    const state = stateFor(event.path);
    if (event.session_id) state.sessions.add(event.session_id);

    if (event.event === "scroll") {
      const depth = (event.data as ScrollData).depth;
      if (typeof depth === "number" && depth >= 0 && depth <= 1) {
        state.scrollDepths.push(depth);
        scrollEvents += 1;
      }
      continue;
    }

    clicks += 1;
    state.clicks += 1;
    const data = event.data as ClickData;
    const elementId = data.element?.id ?? null;
    const elementType = data.element?.type ?? null;
    const elementKey = (elementId ?? "") + "\u001f" + (elementType ?? "");
    const element = state.elements.get(elementKey);
    if (element) element.clicks += 1;
    else state.elements.set(elementKey, { element_id: elementId, element_type: elementType, clicks: 1 });

    const nx = data.coordinates?.normalized_x;
    const ny = data.coordinates?.normalized_y;
    if (typeof nx === "number" && typeof ny === "number" && nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
      const x = Math.min(gridSize - 1, Math.floor(nx * gridSize));
      const y = Math.min(gridSize - 1, Math.floor(ny * gridSize));
      const key = x + ":" + y;
      const bucket = state.spatial.get(key);
      if (bucket) bucket.clicks += 1;
      else state.spatial.set(key, { x, y, clicks: 1 });
    }
  }

  const result: PathInteraction[] = [...paths.entries()].map(([path, state]) => {
    const scrollTotal = state.scrollDepths.reduce((sum, depth) => sum + depth, 0);
    const interactionCount = state.clicks + state.scrollDepths.length;
    return {
      path,
      clicks: state.clicks,
      scroll_events: state.scrollDepths.length,
      average_scroll_depth: state.scrollDepths.length ? scrollTotal / state.scrollDepths.length : 0,
      max_scroll_depth: state.scrollDepths.length ? Math.max(...state.scrollDepths) : 0,
      interactions_per_session: state.sessions.size ? interactionCount / state.sessions.size : 0,
      elements: [...state.elements.values()].sort((a, b) => b.clicks - a.clicks),
      spatial: [...state.spatial.values()].sort((a, b) => b.clicks - a.clicks),
    };
  });

  return {
    clicks,
    scroll_events: scrollEvents,
    paths: result.sort((a, b) => b.clicks - a.clicks || a.path.localeCompare(b.path)),
  };
}
