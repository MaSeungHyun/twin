/** UI / store action ids */
export const OFFICE_FLOOR_ACTION_IDS = [
  "Default",
  "1F",
  "2F",
  "3F",
  "4F",
] as const;

export type OfficeFloorActionId = (typeof OFFICE_FLOOR_ACTION_IDS)[number];

export const OFFICE_FLOOR_ACTIONS: ReadonlyArray<{
  id: OfficeFloorActionId;
  label: string;
}> = [
  { id: "Default", label: "All" },
  { id: "1F", label: "1F" },
  { id: "2F", label: "2F" },
  { id: "3F", label: "3F" },
  { id: "4F", label: "4F" },
];

/** GLB scene object name 후보 */
export const FLOOR_OBJECT_CANDIDATES: Record<
  Exclude<OfficeFloorActionId, "Default">,
  readonly string[]
> = {
  /** optimize 후 F1 → OfficeFloorInstances */
  "1F": ["OfficeFloorInstances", "F1", "1F"],
  "2F": ["F2", "2F"],
  "3F": ["F3", "3F"],
  "4F": ["F4", "4F"],
};
