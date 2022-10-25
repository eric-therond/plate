---
"@udecode/plate-selection": minor
---

- new dep: `copy-to-clipboard`
- `blockSelectionStore`
  - new state: `isSelecting` - can be true even with no block selected
  - action `reset` renamed to `resetSelectedIds`
  - new action: `unselect`
- moved hooks from `BlockSelectionArea` to `useHooksBlockSelection`
- when block selection is updating, an invisible input element is added to the document to capture the following events:
  - `escape`: unselect
  - `mod+z`: undo
  - `mod+shift+z`: redo
  - `enter`: focus the end of the first selected block
  - `delete`: delete selected blocks
  - `copy`
  - `cut`
  - `paste`
- we no longer reset block selection on focus but rather on change when the editor selection gets defined
- new plugin option: `onKeyDownSelecting`