import { describe, expect, it } from "vitest";
import { mapPriority, mapProjectStatus, mapTaskStatus } from "./notion-map";

describe("mapProjectStatus", () => {
  it("reconnaît les libellés Notion courants", () => {
    expect(mapProjectStatus("En cours")).toBe("en_cours");
    expect(mapProjectStatus("Not started")).toBe("pas_commence");
    expect(mapProjectStatus("Terminé")).toBe("termine");
    expect(mapProjectStatus("Montage")).toBe("montage");
  });
  it("retombe sur pas_commence si inconnu", () => {
    expect(mapProjectStatus("Zzz")).toBe("pas_commence");
    expect(mapProjectStatus("")).toBe("pas_commence");
  });
});

describe("mapTaskStatus", () => {
  it("privilégie la case cochée", () => {
    expect(mapTaskStatus("En cours", true)).toBe("termine");
    expect(mapTaskStatus("Doing", null)).toBe("en_cours");
    expect(mapTaskStatus("", false)).toBe("a_faire");
  });
});

describe("mapPriority", () => {
  it("normalise les priorités", () => {
    expect(mapPriority("Urgent")).toBe("haute");
    expect(mapPriority("Low")).toBe("basse");
    expect(mapPriority("bidule")).toBe("moyenne");
  });
});
