# Multi-Country Clock

An offline world clock Chrome extension that provides both analog and digital time for major countries and cities worldwide.

## Features

- **Multiple Clocks**: Add and monitor multiple time zones simultaneously.
- **Analog & Digital Display**: Each clock displays time in both classic analog and digital formats.
- **Wide Coverage**: Supports major countries including India, USA (multiple zones), UK, France, Germany, Japan, China, Australia, and more.
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing.
- **Time Format Toggle**: Switch between 12-hour and 24-hour digital time formats.
- **Persistent Settings**: Your selected clocks and preferences (theme, time format) are saved automatically.
- **Offline Functionality**: Works entirely offline without requiring an internet connection.

## Installation

1. Download or clone this repository to your local machine.
2. Open Google Chrome.
3. Navigate to `chrome://extensions/`.
4. Enable **Developer mode** by toggling the switch in the top right corner.
5. Click the **Load unpacked** button.
6. Select the folder containing the extension files.

## Usage

1. Click on the extension icon in the Chrome toolbar.
2. Select a country/timezone from the dropdown menu.
3. Click **Add Clock** to add it to your list.
4. Use the **🌗** button to toggle dark mode.
5. Use the **🕒** button to toggle between 12h/24h formats.
6. Click the **✖** icon on any clock to remove it from the list.

## Technologies Used

- HTML5
- CSS3 (Custom properties for theming)
- JavaScript (Vanilla JS)
- Chrome Extension API (Manifest V3, Storage API)
- Intl.DateTimeFormat API for accurate timezone handling

## License

MIT License
