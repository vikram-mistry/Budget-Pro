# Budget Pro

Fintrack Pro is a personal finance management application designed to help users track their income, expenses, and investments efficiently. It provides a comprehensive view of your financial health with an intuitive and responsive user interface.

## Features

- **Dashboard Overview**: View your net worth, monthly income, monthly spending, and burn rate at a glance.
    - **Net Worth Breakdown**: Click on the Net Worth card to see a detailed breakdown of your assets and liabilities.
- **Transaction Management**:
    - Log Income, Expense, and Transfer transactions.
    - Categorize transactions for better tracking.
    - View recent transactions and a detailed log.
- **Account Management**:
    - Track balances across multiple accounts (Bank, Wallet, Credit Card, Investment, etc.).
    - Support for credit card due dates and bill payments.
- **Budgeting**:
    - Set a monthly budget and track your progress.
    - Set category-specific budget limits.
    - Visual indicators for budget health.
- **Recurring Transactions**:
    - Set up recurring payments for bills, subscriptions, or salaries.
    - Get reminders for upcoming due payments.
- **Data Visualization**:
    - Visual representations of spending vs. income.
    - Category-wise spending breakdown.
- **Data Persistence & Management**:
    - All data is stored locally in your browser (IndexedDB).
    - **Backup & Restore**: Export your entire data to a JSON file and import it back to sync across devices or keep backups.
    - **Reset**: Option to completely wipe data and start fresh.
    - **Archives**: Automatic monthly archiving of transactions to keep the active view clean.
- **Advanced Search**:
    - Filter logs by type (Income/Expense) and date range.
    - Floating search bar to instantly find transactions by note, category, or amount.
- **Export Data**:
    - Export transaction logs to CSV for external analysis.
- **UI/UX**:
    - **Liquid Navigation**: Smooth sliding animations for navigation tabs.
    - **Theme Support**: Dark mode with glassmorphism design aesthetics.
    - Glassmorphism design aesthetics.

## Technologies Used

- **HTML5**: Structure of the application.
- **CSS3**: Styling, including Tailwind CSS (via CDN) for utility classes and custom CSS for glassmorphism effects.
- **JavaScript (Vanilla)**: Application logic, DOM manipulation, and state management.
- **LocalStorage**: Client-side data storage.

## Setup and Usage

1.  **Clone or Download**: Clone this repository or download the files.
2.  **Open the Application**: Simply open the `index.html` file in any modern web browser. No server setup or installation is required.
    ```bash
    # If you have python installed, you can serve it locally for a better experience
    python3 -m http.server
    ```
3.  **Start Tracking**:
    - Add your accounts.
    - Set your monthly budget.
    - Start logging your daily transactions.

## Application Structure

- `index.html`: The main entry point containing the application structure.
- `style.css`: Contains custom styles and overrides.
- `script.js`: Contains all the application logic.

## Screenshot
<img width="590" height="1278" alt="Screenshot 2026-01-08 at 12 22 49 PM" src="https://github.com/user-attachments/assets/aa072de9-d966-4294-a88c-299f598af895" />

<img width="590" height="1278" alt="IMG_7139" src="https://github.com/user-attachments/assets/d81cf2c0-8bd8-4b90-a9a5-ec237fc3ca70" />

<img width="590" height="1278" alt="IMG_7138" src="https://github.com/user-attachments/assets/152fbe1c-b576-407d-adad-920102b221f2" />

<img width="590" height="1278" alt="IMG_7137" src="https://github.com/user-attachments/assets/7ce42d7f-b757-4bda-b192-b6cdb8f7c7cc" />

<img width="590" height="1278" alt="IMG_7136" src="https://github.com/user-attachments/assets/273326cb-d8de-4477-a8dc-9c9d9a897091" />

<img width="590" height="1278" alt="IMG_7135" src="https://github.com/user-attachments/assets/7d9c5650-0388-4565-b6ba-51fa331300f3" />

<img width="590" height="1278" alt="IMG_7134" src="https://github.com/user-attachments/assets/de543851-9ae1-4d60-a151-6dc0febd6139" />

<img width="590" height="1278" alt="IMG_7133" src="https://github.com/user-attachments/assets/391ee71f-5b77-4ceb-baa2-100bcfb582aa" />

<img width="590" height="1278" alt="IMG_7132" src="https://github.com/user-attachments/assets/f1fd5b08-2d04-4056-9979-54dfc1d8d0c2" />

<img width="590" height="1278" alt="IMG_7131" src="https://github.com/user-attachments/assets/643e4209-6c32-4bcc-9825-b8d98bbf73e9" />

<img width="590" height="1278" alt="IMG_7130" src="https://github.com/user-attachments/assets/a5513312-0423-46f1-ae2b-4ee251c26b32" />

<img width="590" height="1278" alt="IMG_7129" src="https://github.com/user-attachments/assets/bb5dfe66-6eb4-44a8-9c8c-2da23051f230" />

<img width="590" height="1278" alt="IMG_7128" src="https://github.com/user-attachments/assets/715659ba-4e02-4368-8485-9142403daf11" />

<img width="590" height="1278" alt="IMG_7127" src="https://github.com/user-attachments/assets/53583d3c-3d38-4bf5-88f8-da0979c88a07" />

<img width="590" height="1278" alt="IMG_7126" src="https://github.com/user-attachments/assets/27fbe501-c7db-4f6a-921b-784aee8c9bc8" />

## License

This project is open-source and available for personal use.
