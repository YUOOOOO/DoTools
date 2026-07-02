# Feature Log

This file records user-visible behavior as features are added.

## Launcher

- Global shortcut opens the launcher.
- Preferred shortcut: `Alt+Space`.
- Fallback shortcut: `Ctrl+Space`.
- Launcher starts as a frameless floating input box.
- Initial launcher height is `92px`.
- Typing text expands the launcher to `430px`.
- Empty input shows no results.
- Search results appear only after typing.
- Result item layout is tile-based:
  - logo or plugin initial on top
  - command title below
- `Esc` hides the launcher.
- Losing focus hides the launcher.
- `Enter` opens the first matched command.

## Settings Entry

- Launcher input has a gear icon button on the right.
- The current implementation reloads plugin commands as a placeholder action.
- A real settings page still needs to be added.

## Example Plugin

- `Text Tools` is the current sample plugin.
- Search keywords include `text`, `clip`, `clipboard`, `uppercase`, `lowercase`, and `case`.
- The plugin can read clipboard text, transform it, write it back, store last text, and show a notification.
