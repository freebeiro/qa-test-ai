# QA Testing Assistant

A Chrome extension for QA testing with visual automation.

## Features

- Navigation with "go to url"
- Scrolling with "scroll up/down"
- Back/forward navigation
- Smart element clicking with "click [element]"
- Enter key presses with "press enter"
- Text typing (general and targeted)
- Screenshots after each command

## Installation

1. Run `./build.sh` to build the extension
2. Load from Chrome's extension page using the dist/ folder

## Commands

- `go to [url]` - Navigate to a website
- `type [text]` - Type text in the active input
- `type [text] in [field]` - Type in a specific field
- `click [text]` - Click element containing text
- `scroll up/down` - Scroll the page
- `back` / `forward` - Navigate history
- `press enter` - Press the Enter key
