# PIFU - Hospital Shift Analysis Application

A comprehensive web application for analyzing hospital nursing staff shift schedules and calculating vacation day balances.

## 🏗️ Project Structure

```
pifu/
├── src/                         # Frontend source code
│   ├── components/              # UI components (future)
│   ├── services/                # Data services
│   │   ├── data-loader.js
│   │   ├── data-processor.js
│   │   ├── data-adjuster.js
│   │   ├── monthly-processor.js
│   │   └── summary-generator.js
│   ├── managers/                # Business logic managers
│   │   ├── display-manager.js
│   │   ├── ui-controller.js
│   │   ├── tab-manager.js
│   │   ├── selection-manager.js
│   │   ├── monthly-display-manager.js
│   │   ├── calendar-display-manager.js
│   │   ├── person-display-manager.js
│   │   ├── chart-display-manager.js
│   │   ├── ranking-display-manager.js
│   │   └── chart-manager.js
│   ├── utils/                   # Utility functions
│   │   ├── calculation-explanation-loader.js
│   │   └── maintenance-manager.js
│   └── hospital-shift-analyzer.js
├── styles/                      # CSS styles
│   └── main.css
├── index.html                   # Main HTML file
├── backend/                     # Backend data processing
│   ├── src/
│   │   ├── converters/         # Data conversion scripts
│   │   │   ├── csv-converter.js
│   │   │   └── batch-converter.js
│   │   ├── processors/         # Data processing (future)
│   │   └── utils/              # Utility functions (future)
│   └── scripts/
│       └── toggle-maintenance.js
├── data/                       # Data storage
│   ├── raw/                    # Raw CSV files
│   ├── processed/              # Processed JSON data
│   └── config/                 # Configuration files
├── docs/                       # Documentation
│   └── frontend-architecture.md
├── tests/                      # Test files (future)
├── legacy/                     # Legacy code
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3 (for serving frontend)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pifu
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

#### Frontend (Web Interface)
```bash
# Serve the application from project root
npm run serve-frontend
# or
python -m http.server 8000
```

Then open your browser to `http://localhost:8000`

#### Backend (Data Processing)
```bash
# Convert CSV data to JSON
npm run convert-data

# Run in development mode with auto-restart
npm run dev
```

## 📊 Features

### Frontend Features
- **Overview Dashboard**: Nurse vacation day rankings and trend comparisons
- **Monthly Statistics**: Detailed monthly shift analysis
- **Personal Details**: Individual nurse statistics with charts
- **Interactive Charts**: Visual representation of data trends
- **Responsive Design**: Works on desktop and mobile devices

### Backend Features
- **CSV to JSON Conversion**: Batch processing of shift data
- **Data Validation**: Ensures data integrity during conversion
- **Flexible Date Ranges**: Process data from any time period
- **Error Handling**: Comprehensive error reporting

## 🛠️ Development

### File Naming Conventions

- **Files**: Use kebab-case (e.g., `data-processor.js`)
- **Classes**: Use PascalCase (e.g., `DataProcessor`)
- **Functions**: Use camelCase (e.g., `processData()`)
- **Directories**: Use lowercase with hyphens (e.g., `data-processors/`)

### Code Organization

- **Services**: Handle data operations and business logic
- **Managers**: Manage UI state and user interactions
- **Utils**: Provide utility functions and helpers
- **Components**: Reusable UI components (future)

### Adding New Features

1. **Frontend**: Add new files to appropriate directories in `frontend/src/`
2. **Backend**: Add processing scripts to `backend/src/`
3. **Update HTML**: Add script tags to `frontend/index.html`
4. **Update Documentation**: Keep this README current

## 📁 Data Structure

The application processes hospital shift data with the following key metrics:

- **Legal Workdays**: Standard working days per month
- **Worked Days**: Actual days worked by each nurse
- **Saved Rest Days**: Accumulated vacation time (worked days - legal workdays)
- **Holiday Days**: Official holidays and time off

## 🔧 Configuration

Configuration files are stored in `data/config/`:
- `calculation_explanation.json`: Explanation of calculation methods
- `initial_saved_rest_days.json`: Initial vacation day balances
- `maintenance.json`: Maintenance mode settings
- `year_end_adjustments.json`: Year-end adjustment rules

## 📈 Usage

1. **Data Preparation**: Place CSV files in `data/raw/csv/`
2. **Data Conversion**: Run `npm run convert-data` to process data
3. **View Results**: Open `index.html` in a web browser or serve with `npm run serve-frontend`
4. **Navigate**: Use the tab interface to explore different views

## 🤝 Contributing

1. Follow the established file structure and naming conventions
2. Add appropriate documentation for new features
3. Test changes thoroughly before submitting
4. Update this README when making structural changes

## 📝 License

ISC License - see package.json for details

## 🆘 Support

For issues or questions, please refer to the documentation in the `docs/` directory or create an issue in the repository.
