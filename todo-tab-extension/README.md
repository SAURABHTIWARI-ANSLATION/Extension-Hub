# 📝 Todo Tab - Privacy First Todo List

![Todo Tab Banner](https://via.placeholder.com/800x300/667eea/ffffff?text=Todo+Tab+-+Privacy+First+Todo+List)

A minimalist, privacy-focused todo list that replaces your browser's new tab page. Keep track of your tasks with color-coded labels, all while maintaining complete privacy - your data never leaves your browser.

## ✨ Features

### 🔒 **Privacy First**
- **100% Local Storage** - All data stays in your browser
- **No Cloud Sync** - We don't send data to any server
- **No Analytics/Tracking** - Complete anonymity
- **Open Source** - Transparent codebase

### 🎨 **Color-Coded Productivity**
- **Activity-based categorization** - 6 distinct colors for different task types
- **Visual organization** - Quickly identify task categories at a glance
- **Custom labels** - Work, Personal, Urgent, Ideas, Important, General

### 📊 **Smart Organization**
- **Quick Statistics** - Track total, pending, today's, and completed tasks
- **Smart Filtering** - Filter by All, Pending, Completed, or Today's tasks
- **Persistent Storage** - Tasks survive browser restarts

### 🔧 **Powerful Features**
- **Add/Edit/Delete** - Full task management
- **Mark as Complete** - Check off completed tasks
- **Export/Import** - Backup and restore your data
- **Clean Interface** - Minimalist, distraction-free design

## 🎯 Perfect For
- Developers and programmers
- Students and researchers
- Project managers
- Anyone who spends time in their browser
- Privacy-conscious users

## 📸 Screenshot

![Todo Tab Interface](https://via.placeholder.com/800x500/f5f7fa/667eea?text=Clean+Minimalist+Interface+with+Color-Coded+Tasks)

## 🚀 Installation

### Method 1: Chrome Web Store (Coming Soon)
1. Visit Chrome Web Store
2. Search for "Todo Tab"
3. Click "Add to Chrome"

### Method 2: Developer Mode (For Testing)
1. **Download** or clone this repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable** Developer mode (toggle in top-right)
4. **Click** "Load unpacked"
5. **Select** the extension folder
6. **Open** a new tab to see Todo Tab!

## 📁 Project Structure

```
todo-tab-extension/
├── manifest.json          # Extension configuration
├── index.html            # Main new tab page
├── style.css             # Clean, minimal styling
├── script.js             # Core functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This documentation
```

## 🛠️ Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables
- **JavaScript (ES6+)** - Core functionality
- **Chrome Extension API (Manifest V3)** - Browser integration
- **LocalStorage API** - Data persistence

## 💻 How It Works

### Data Flow
```
User Input → JavaScript Processing → LocalStorage → UI Update
      ↑                                     ↓
      └────────── Browser Memory ←─────────┘
```

### Key Components
1. **Task Manager** - Handles CRUD operations
2. **Color Coding System** - Manages task categorization
3. **Filter Engine** - Filters tasks based on status
4. **Statistics Calculator** - Updates real-time stats
5. **Import/Export Handler** - Manages data backup

## 🎨 Color Coding System

| Color | Label | Use Case |
|-------|-------|----------|
| 🟢 Green | Work | Professional tasks, office work |
| 🔵 Blue | Personal | Personal errands, family tasks |
| 🟠 Orange | Urgent | Time-sensitive, important tasks |
| 🟣 Purple | Ideas | Creative thoughts, brainstorming |
| 🔴 Red | Important | Critical tasks, deadlines |
| ⚫ Gray | General | Miscellaneous, uncategorized |

## 📊 Statistics

Todo Tab provides quick insights:
- **Total Tasks** - All tasks in your list
- **Pending** - Tasks waiting to be completed
- **Today** - Tasks added today
- **Completed** - Finished tasks

## 🔐 Privacy & Security

### What We **DO NOT** Collect:
- Your task list content
- Browser history
- Personal information
- Usage analytics
- Any tracking data

### What We **DO** Store (Locally):
- Task text (encrypted in localStorage)
- Task metadata (date, completion status)
- Color preferences
- Filter settings

### Data Location:
- **Storage**: Browser's localStorage
- **Location**: Your computer only
- **Access**: Only you through this extension

## 🔄 Export/Import

### Export:
- **Format**: JSON
- **Contents**: All tasks with metadata
- **Use**: Backup or transfer to another browser

### Import:
- **Support**: JSON format from previous exports
- **Validation**: Checks for valid format
- **Merge**: Adds new tasks without duplicates

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Add new task |
| `Tab` | Navigate between elements |
| `Click` | Toggle task completion |
| `Delete` | Remove task (via button) |

## 📱 Responsive Design

Todo Tab works perfectly on:
- Desktop browsers
- Laptops
- Tablets
- Large monitors

## 🚦 Performance

- **Lightweight**: < 2MB total size
- **Fast**: Instant task updates
- **Efficient**: Minimal memory usage
- **Optimized**: No external dependencies

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Development Setup:
```bash
git clone https://github.com/yourusername/todo-tab.git
cd todo-tab
# Make changes and test in Chrome
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by modern productivity tools
- Built for privacy-conscious users
- Thanks to all contributors

## 📞 Support

Having issues? Here's how to get help:

1. **Check** existing issues
2. **Create** a new issue with details
3. **Include**: Chrome version, steps to reproduce

## 🌟 Why Choose Todo Tab?

### ✅ **Advantages:**
- **Privacy**: Your data stays with you
- **Simplicity**: Clean, intuitive interface
- **Speed**: Lightning-fast performance
- **Reliability**: No dependencies, no crashes
- **Free**: 100% free, no subscriptions

### 🆚 **Compared to Alternatives:**
- **vs Cloud-based**: Your data isn't on someone else's server
- **vs Complex apps**: Focused on one thing - todo lists
- **vs Paper lists**: Always accessible, organized, searchable

## 🔮 Future Plans

- [ ] Dark mode enhancement
- [ ] Task due dates
- [ ] Recurring tasks
- [ ] Task priorities
- [ ] Search functionality
- [ ] Keyboard shortcuts
- [ ] Task categories
- [ ] Progress tracking

## 📈 Statistics

- **Lines of Code**: ~500
- **Development Time**: 2 weeks
- **File Size**: < 2MB
- **Supported Browsers**: Chrome 88+

---

<div align="center">

**Made with ❤️ for productive people**

*"Stay organized, stay private, stay productive"*

[Report Bug](https://github.com/yourusername/todo-tab/issues) · 
[Request Feature](https://github.com/yourusername/todo-tab/issues) · 
[⭐ Star on GitHub](#)

</div>

---

## 📝 Changelog

### v1.0.0 (Current)
- Initial release
- Basic todo functionality
- Color-coded tasks
- Export/Import
- Privacy-focused design

## 🔧 Troubleshooting

### Common Issues:

1. **Tasks not saving?**
   - Check if localStorage is enabled
   - Clear browser cache and reload

2. **Extension not loading?**
   - Ensure Developer mode is enabled
   - Check Chrome version (88+ required)

3. **Import not working?**
   - Verify JSON format is correct
   - Check for syntax errors

## 🌐 Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Opera 74+
- ⚠️ Firefox (requires Manifest V2 port)
- ⚠️ Safari (not currently supported)

---

**Remember**: Your productivity should never compromise your privacy. With Todo Tab, you get both.

**Happy Tasking!** 🎯