# TaskExtreme - Modern Task Management

A feature-rich, client-side task management application with offline support and focus mode.

## Features

- 📅 **Date-based Task Management**: Organize tasks by date with a clean calendar interface
- 📱 **Mobile-First Design**: Fully responsive interface that works on all devices
- 🎨 **Multiple Themes**: 9 beautiful themes with dark/light mode support
- ⏱️ **Focus Mode**: Built-in Pomodoro timer with ambient sound options
- 📊 **Task Categories**: Organize tasks with color-coded categories
- 🔄 **Offline Support**: Works without an internet connection
- 📄 **PDF Export**: Export your tasks and schedules to PDF
- 🎵 **Ambient Sounds**: Built-in background sounds for better focus

## Getting Started

### Quick Start
1. Clone or download the repository
2. Open `index.html` in any modern web browser
3. Start managing your tasks!

### Local Development Server
For a better development experience, you can use a local server:

```bash
# Using Python (built-in server)
python -m http.server 8000
# Then open http://localhost:8000 in your browser

# Or using Node.js with http-server
npx http-server
# Then open http://localhost:8080 in your browser
```

## Key Features

### Task Management
- Add, edit, and delete tasks with ease
- Set due dates and priorities
- Organize tasks into categories
- Mark tasks as complete

### Focus Mode
- Built-in Pomodoro timer (25/5 by default)
- Customizable work/break durations
- Ambient sound options for better concentration
- Session tracking and statistics

### Calendar & Navigation
- Monthly and weekly calendar views
- Quick navigation between dates
- Visual task indicators on the calendar
- "Today" button for quick access

## Project Structure

```
TaskExtreme/
├── index.html            # Main application entry point
├── offline.html          # Offline fallback page
├── manifest.json         # Web app manifest for PWA
├── sw.js                # Service worker for offline support
├── styles/
│   └── main.css         # Main stylesheet
├── scripts/
│   ├── app.js           # Core application logic
│   ├── calendar2.js     # Calendar functionality
│   ├── focus-mode.js    # Pomodoro timer and focus mode
│   ├── offline.js       # Offline functionality
│   ├── scroll-spy.js    # Scroll behavior enhancements
│   └── db.js           # IndexedDB operations
├── audio/               # Ambient sound files
│   ├── Blossoming Love.mp3
│   ├── Calm piano.mp3
│   ├── Heavy rain.mp3
│   └── Jazz soft.mp3
└── images/              # Application images and icons
```

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: IndexedDB for offline data persistence
- **Responsive Design**: Mobile-first CSS with media queries
- **Progressive Web App**: Service Worker for offline functionality

## Browser Support

TaskExtreme works best in modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- IndexedDB
- Service Workers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - feel free to use and modify as needed.

## Contact

Created by MoReqasse
- Email: reqasse@gmail.com
- Phone: +212-700-82-13-40