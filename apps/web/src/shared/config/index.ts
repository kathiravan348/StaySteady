// Shared configuration pattern (UI spec 7.18), used by every configuration area (decision 25).

export type { DiffRow } from './configFields';
export { diffDescriptions, errorsByPath, visibleError } from './configFields';
export type { ConfigEntryListProps, ConfigListEntry } from './ConfigEntryList';
export { ConfigEntryList } from './ConfigEntryList';
export type { CapabilitySwitchProps } from './ConfigControls';
export { CapabilitySwitch, FieldError, SimulationNotice } from './ConfigControls';
export type { HistoryVersion, VersionHistoryProps } from './VersionHistory';
export { VersionHistory } from './VersionHistory';
