/**
 * LogicFlow extension compat declaration (temporary bridge).
 * Freeze policy: do not add new compat modules/symbols.
 * Exit plan: docs/2design/ADR-006-logicflow-compat-exit.md
 */
declare module "@logicflow/extension" {
  export const Menu: any;
  export const Label: any;
  export const Snapshot: any;
  export const SelectionSelect: any;
  export const MiniMap: any;
  export const Control: any;
  export const DynamicGroup: any;
}
