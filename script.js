    let isMasked = false;
    let isDarkMode = true;

    function loadTheme() {
      const savedTheme = localStorage.getItem("fintrack_theme");
      if (savedTheme === "light") {
        isDarkMode = false;
        document.documentElement.setAttribute("data-theme", "light");
      }
      updateThemeUI();
    }

    function updateThemeUI() {
      const themeLabel = document.getElementById("themeLabel");
      const themeToggleBtn = document.getElementById("themeToggleBtn");
      const themeToggleKnob = document.getElementById("themeToggleKnob");

      if (isDarkMode) {
        themeLabel.textContent = "Dark mode with glass effects";
        themeToggleBtn.classList.remove("bg-sky-500");
        themeToggleBtn.classList.add("bg-slate-800");
        themeToggleKnob.style.left = "2px";
        themeToggleKnob.innerHTML = "🌙";
        themeToggleKnob.classList.remove("bg-gradient-to-r", "from-amber-400", "to-yellow-500");
        themeToggleKnob.classList.add("bg-gradient-to-r", "from-slate-600", "to-slate-700");
      } else {
        themeLabel.textContent = "Light mode with glass effects";
        themeToggleBtn.classList.remove("bg-slate-800");
        themeToggleBtn.classList.add("bg-sky-500");
        themeToggleKnob.style.left = "calc(100% - 26px)";
        themeToggleKnob.innerHTML = "☀️";
        themeToggleKnob.classList.remove("bg-gradient-to-r", "from-slate-600", "to-slate-700");
        themeToggleKnob.classList.add("bg-gradient-to-r", "from-amber-400", "to-yellow-500");
      }
    }

    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
      localStorage.setItem("fintrack_theme", isDarkMode ? "dark" : "light");
      document.getElementById("metaThemeColor").setAttribute("content", isDarkMode ? "#020617" : "#f0f9ff");
      updateThemeUI();
    });

    loadTheme();

    const currency = (v) => {
      if (!Number.isFinite(v)) return "₹0.00";
      return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const STORAGE_KEY = "fintrack_pro_v3_data";
    const expenseCategories = ["Groceries", "Dining", "Transport", "Housing", "Maintenance", "EMI", "Invest", "Subscription", "Tax", "Bills", "Education", "Health", "Apparels", "Beauty", "Toys", "Electronics", "Gift", "Other"];
    const incomeCategories = ["Salary", "Cashback", "Reversal", "Gift"];
    const transferCategories = ["Transfer"];

    const initialState = {
      transactions: [],
      budgetMonthly: 50000,
      accounts: {},
      accountTypes: {},
      accountInitialBalances: {},
      accountDueDays: {},
      monthStartDate: 1,
      categories: { "Groceries":{type:"expense",budget:0}, "Dining":{type:"expense",budget:0}, "Transport":{type:"expense",budget:0}, "Housing":{type:"expense",budget:0}, "Salary":{type:"income",budget:0}, "Cashback":{type:"income",budget:0}, "Reversal":{type:"income",budget:0}, "Gift":{type:"income",budget:0}, "Maintenance":{type:"expense",budget:0}, "EMI":{type:"expense",budget:0}, "Invest":{type:"expense",budget:0}, "Transfer":{type:"neutral",budget:0}, "Subscription":{type:"expense",budget:0}, "Tax":{type:"expense",budget:0}, "Bills":{type:"expense",budget:0}, "Education":{type:"expense",budget:0}, "Health":{type:"expense",budget:0}, "Apparels":{type:"expense",budget:0}, "Beauty":{type:"expense",budget:0}, "Toys":{type:"expense",budget:0}, "Electronics":{type:"expense",budget:0}, "Other":{type:"expense",budget:0} },
      reminderPayments: {}
    };

    // --- IndexedDB Storage Logic ---
    const DB_NAME = 'FintrackDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'state';

    const IDBStorage = {
      dbPromise: null,

      open() {
        if (this.dbPromise) return this.dbPromise;
        this.dbPromise = new Promise((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, DB_VERSION);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          };
          request.onsuccess = (event) => resolve(event.target.result);
          request.onerror = (event) => reject(event.target.error);
        });
        return this.dbPromise;
      },

      async save(data) {
        try {
          const db = await this.open();
          return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            // Cloning data to avoid "DataCloneError" or side-effects if IDB implementation varies
            // IDB uses structured clone, so passing the object directly is fine.
            store.put(data, 'data');
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
          });
        } catch (e) {
          console.error("IDB Save Failed:", e);
        }
      },

      async load() {
        try {
          const db = await this.open();
          return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get('data');
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
          });
        } catch (e) {
          console.error("IDB Load Failed:", e);
          return null;
        }
      }
    };

    function saveState() {
      // Async save (fire and forget for UI responsiveness)
      IDBStorage.save(state);
    }

    // Initialize with defaults, will be populated by initApp
    let state = structuredClone(initialState);

    const screenSections = document.querySelectorAll("[data-screen]");
    const tabButtons = document.querySelectorAll(".tabButton");

    function moveNavIndicator(activeBtn) {
       const nav = document.querySelector('nav');
       const indicator = document.getElementById('navIndicator');
       // Added check to ensure we don't run this for the 'Add' button
       if(!activeBtn || !indicator || activeBtn.dataset.tab === 'add') {
          if(indicator) indicator.style.opacity = "0"; // Hide if on Add tab
          return;
       }

       const navRect = nav.getBoundingClientRect();
       const btnRect = activeBtn.getBoundingClientRect();

       // Calculate center of the active button relative to the nav
       const centerX = (btnRect.left - navRect.left) + (btnRect.width / 2);
       // Matched size to CSS (50px)
       const indicatorSize = 50;
       const left = centerX - (indicatorSize / 2);

       // FIX: Changed `translate(${left}px, -50%)` to `translateX(${left}px)`
       // This prevents JS from lifting the bubble up, letting CSS handle the height.
       indicator.style.transform = `translateX(${left}px)`;
       indicator.style.opacity = "1";
    }

    function showScreen(name) {
      screenSections.forEach((sec) => sec.classList.toggle("hidden", sec.dataset.screen !== name));
      tabButtons.forEach((btn) => {
        const isActive = btn.dataset.tab === name;
        if (btn.dataset.tab === 'add') return;
        btn.classList.toggle("text-sky-300", isActive);
        btn.classList.toggle("text-slate-400", !isActive);

        if (isActive) {
           // Small delay to ensure layout is ready if needed, or immediate
           requestAnimationFrame(() => moveNavIndicator(btn));
        }
      });
      document.querySelector('main').scrollTop = 0;
    }

    // Handle resize to adjust indicator
    window.addEventListener('resize', () => {
       const activeBtn = document.querySelector('.tabButton.text-sky-300');
       if(activeBtn) moveNavIndicator(activeBtn);
    });

    tabButtons.forEach((btn) => btn.addEventListener("click", () => { if (btn.dataset.tab) showScreen(btn.dataset.tab); }));
    document.querySelectorAll("[data-nav]").forEach((btn) => btn.addEventListener("click", () => showScreen(btn.dataset.nav)));

    document.getElementById("toggleMaskButton").addEventListener("click", () => {
      isMasked = !isMasked;
      document.getElementById("maskIconVisible").classList.toggle("hidden", isMasked);
      document.getElementById("maskIconHidden").classList.toggle("hidden", !isMasked);
      applyMasking();
    });

    function applyMasking() {
      document.querySelectorAll(".amount-display").forEach(el => el.classList.toggle("masked-amount", isMasked));
    }

    const handleAccountTypeChange = (selectId, fieldId) => {
      const el = document.getElementById(selectId);
      const field = document.getElementById(fieldId);
      if(el && field) {
        el.addEventListener('change', () => {
           if(el.value === 'credit') field.classList.remove('hidden');
           else field.classList.add('hidden');
        });
      }
    };
    handleAccountTypeChange('newAccountType', 'creditCardDueDateField');
    handleAccountTypeChange('editAccountType', 'editCreditCardDueDateField');

    function getMonthCycleDates() {
      const now = new Date();
      const startDay = state.monthStartDate || 1;
      let startDate, endDate;
      if (now.getDate() >= startDay) {
        startDate = new Date(now.getFullYear(), now.getMonth(), startDay);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, startDay - 1);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, startDay);
        endDate = new Date(now.getFullYear(), now.getMonth(), startDay - 1);
      }
      return { startDate, endDate };
    }

    function formatDateShort(date) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function isInCurrentCycle(txDate) {
      const { startDate, endDate } = getMonthCycleDates();
      const d = new Date(txDate);
      return d >= startDate && d <= endDate;
    }

    function isDueSoon(dueDay) {
      const now = new Date();
      const currentDay = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      let daysUntilDue;
      if (dueDay >= currentDay) daysUntilDue = dueDay - currentDay;
      else daysUntilDue = (daysInMonth - currentDay) + dueDay;
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    }

    function getOrdinalSuffix(day) {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
    }

    window.exportMonthCSV = (monthKey) => {
       const [y, m] = monthKey.split('-').map(Number);
       const monthTx = state.transactions.filter(tx => {
          const d = new Date(tx.date);
          return d.getFullYear() === y && (d.getMonth() + 1) === m;
       });

       let csv = "Date,Type,Amount,Category,Account,Note\n";
       monthTx.forEach(tx => {
         csv += `${tx.date},${tx.type},${tx.amount},${tx.category || ''},${tx.account || ''},"${(tx.note||'').replace(/"/g, '""')}"\n`;
       });

       // USE NEW HELPER
       shareOrDownloadCSV(`FinTrack_${monthKey}.csv`, csv);
    };

    // NEW: Main Export CSV Logic for Logs Screen
    document.getElementById("exportCSVBtn").onclick = () => {
       let csv = "Date,Type,Amount,Category,Account,Note\n";
       // Export all transactions
       state.transactions.forEach(tx => {
         csv += `${tx.date},${tx.type},${tx.amount},${tx.category || ''},${tx.account || ''},"${(tx.note||'').replace(/"/g, '""')}"\n`;
       });

       // USE NEW HELPER
       shareOrDownloadCSV(`FinTrack_All_Logs.csv`, csv);
    };

    function renderArchive() {
       const list = document.getElementById("archiveList");
       list.innerHTML = "";

       const groups = {};
       state.transactions.forEach(tx => {
         const d = new Date(tx.date);
         const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
         if(!groups[key]) groups[key] = { income: 0, expense: 0, date: d };
         if(tx.type === 'income') groups[key].income += tx.amount;
         if(tx.type === 'expense') groups[key].expense += tx.amount;
       });

       const sortedKeys = Object.keys(groups).sort().reverse();

       if(sortedKeys.length === 0) {
         document.getElementById("emptyArchive").classList.remove("hidden");
       } else {
         document.getElementById("emptyArchive").classList.add("hidden");
         sortedKeys.forEach(key => {
            const g = groups[key];
            const div = document.createElement("div");
            div.className = "glass-soft rounded-2xl p-3 flex justify-between items-center mb-2";
            div.innerHTML = `
              <div class="flex items-center gap-3">
                <button onclick="exportMonthCSV('${key}')" class="text-xs text-sky-400 hover:text-sky-300 p-1 bg-slate-800 rounded-full">📥</button>
                <p class="text-sm font-medium text-slate-200">${g.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div class="text-right text-xs">
                 <p class="text-emerald-300">In: ${currency(g.income)}</p>
                 <p class="text-rose-300">Out: ${currency(g.expense)}</p>
              </div>
            `;
            list.appendChild(div);
         });
       }
    }

    // Collapsible Alerts Logic
    const alertsContainer = document.getElementById("alertsContainer");
    const alertsToggleBtn = document.getElementById("alertsToggleBtn");
    const homeAlertsSection = document.getElementById("homeAlertsSection");
    const alertsSummaryText = document.getElementById("alertsSummaryText");
    const alertsToggleIcon = document.getElementById("alertsToggleIcon");

    alertsToggleBtn.onclick = () => {
       const isHidden = homeAlertsSection.classList.contains("hidden");
       homeAlertsSection.classList.toggle("hidden", !isHidden);
       alertsToggleIcon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    };

    function renderHome() {
      homeAlertsSection.innerHTML = "";
      let alertCount = 0;

      // Recurring Dues
      const recurringTx = state.transactions.filter(tx => tx.isRecurring && tx.dueDay);
      recurringTx.forEach(reminder => {
        const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
        const isPaid = state.reminderPayments[reminder.id] && state.reminderPayments[reminder.id][monthKey];

        // Logic: Show alert if due within 7 days.
        // Also handling 'past due' if not paid in current month?
        // For simplicity, sticking to isDueSoon (within 7 days upcoming).
        if (isDueSoon(reminder.dueDay) && !isPaid) {
          alertCount++;
          const alert = document.createElement("div");
          const isIncome = reminder.type === "income";
          alert.className = isIncome
            ? "glass-soft rounded-2xl p-3 flex items-center justify-between border border-emerald-400/30"
            : "glass-soft rounded-2xl p-3 flex items-center justify-between border border-amber-400/30";
          const titleText = reminder.note && reminder.note.trim().length > 0 ? reminder.note : reminder.category;

          alert.innerHTML = `
            <div class="flex flex-col">
              <span class="text-sm font-medium ${isIncome ? 'text-emerald-200' : 'text-amber-200'}">${isIncome ? '✓' : '⚠️'} ${titleText} due soon</span>
              <span class="text-[11px] text-slate-400">Due ${reminder.dueDay}${getOrdinalSuffix(reminder.dueDay)} • ${currency(reminder.amount)}</span>
            </div>
          `;
          const payBtn = document.createElement("button");
          payBtn.className = "px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 shadow-md";
          payBtn.textContent = "Pay";
          payBtn.onclick = () => {
             const tx = {
               id: crypto.randomUUID(), type: reminder.type, amount: reminder.amount, category: reminder.category, account: reminder.account,
               date: new Date().toISOString().slice(0, 10), note: `Payment: ${titleText}`, isRecurring: false, createdAt: new Date().toISOString()
             };
             state.transactions.unshift(tx);
             if(!state.reminderPayments[reminder.id]) state.reminderPayments[reminder.id] = {};
             state.reminderPayments[reminder.id][monthKey] = true;
             recalcAccounts(); saveState(); renderAll();
          };
          alert.appendChild(payBtn);
          homeAlertsSection.appendChild(alert);
        }
      });

      // Credit Card Dues
      Object.keys(state.accounts).forEach(accName => {
         if(state.accountTypes[accName] === 'credit') {
            const balance = state.accounts[accName];
            if(balance > 0) {
               const dueDay = state.accountDueDays[accName];
               if(dueDay && isDueSoon(dueDay)) {
                  alertCount++;
                  const alert = document.createElement("div");
                  alert.className = "glass-soft rounded-2xl p-3 flex items-center justify-between border border-rose-400/30";
                  alert.innerHTML = `
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-rose-200">💳 ${accName} Bill Due</span>
                      <span class="text-[11px] text-slate-400">Due ${dueDay}${getOrdinalSuffix(dueDay)} • Outstanding: ${currency(balance)}</span>
                    </div>
                  `;
                  const payBtn = document.createElement("button");
                  payBtn.className = "px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-md";
                  payBtn.textContent = "Pay Bill";
                  payBtn.onclick = () => {
                     const typeToggles = document.querySelectorAll(".typeToggle");
                     typeToggles[2].click(); // Click Transfer
                     document.getElementById("toAccountInput").value = accName;
                     document.getElementById("amountInput").value = balance;
                     document.getElementById("noteInput").value = `Bill Payment: ${accName}`;
                     showScreen("add");
                  };
                  alert.appendChild(payBtn);
                  homeAlertsSection.appendChild(alert);
               }
            }
         }
      });

      // Update Alerts UI
      if (alertCount > 0) {
         alertsContainer.classList.remove("hidden");
         alertsSummaryText.textContent = `${alertCount} payment${alertCount > 1 ? 's' : ''} due in next 7 days`;
         alertsSummaryText.className = "text-amber-300 font-medium";
      } else {
         alertsContainer.classList.remove("hidden");
         alertsSummaryText.textContent = "No payments due in next 7 days";
         alertsSummaryText.className = "text-emerald-300 font-medium";
         // Auto-collapse if empty
         homeAlertsSection.classList.add("hidden");
         alertsToggleIcon.style.transform = "rotate(0deg)";
      }

      const { startDate, endDate } = getMonthCycleDates();
      document.getElementById("dateCycleLabel").textContent = `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;

      let monthlyIncome = 0, monthlySpent = 0;
      state.transactions.forEach((tx) => {
        if (!isInCurrentCycle(tx.date)) return;
        if (tx.type === "income") monthlyIncome += tx.amount;
        else if (tx.type === "expense") monthlySpent += tx.amount;
      });

      document.getElementById("monthlyIncomeDisplay").textContent = currency(monthlyIncome);
      document.getElementById("monthlySpentDisplay").textContent = currency(monthlySpent);

      let netWorth = 0;
      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const acc in state.accounts) {
        const type = state.accountTypes[acc];
        const balance = state.accounts[acc];

        if (type === "credit") {
             // Credit card balance is a liability
             netWorth -= balance;
             totalLiabilities += balance;
        } else {
             // Bank/Cash/Investment
             // If positive, it's an asset. If negative (overdraft), it's a liability?
             // For simplicity, let's treat negative bank balance as liability.
             netWorth += balance;
             if (balance >= 0) {
                 totalAssets += balance;
             } else {
                 totalLiabilities += Math.abs(balance);
             }
        }
      }
      document.getElementById("netWorthDisplay").textContent = currency(netWorth);

      // Update Net Worth Tooltip with dynamic breakdown
      const tooltip = document.getElementById("netWorthTooltip");
      if (tooltip) {
          tooltip.innerHTML = `
            Assets: <span class="text-emerald-300">${currency(totalAssets)}</span><br>
            Liabilities: <span class="text-rose-300">-${currency(totalLiabilities)}</span><br>
            <div class="h-px bg-slate-700 my-1"></div>
            Net Worth: <span class="font-semibold">${currency(netWorth)}</span>
          `;
      }

      const burnRatio = state.budgetMonthly ? Math.min(1, monthlySpent / state.budgetMonthly) : 0;
      const burnBar = document.getElementById("burnRateBar");
      burnBar.style.width = `${Math.max(3, burnRatio * 100)}%`;
      burnBar.style.backgroundImage = burnRatio < 0.5 ? "linear-gradient(to right, #4ade80, #22d3ee)" : burnRatio < 0.9 ? "linear-gradient(to right, #22d3ee, #facc15)" : "linear-gradient(to right, #fb7185, #f97316)";

      const monthlyTx = state.transactions.filter((tx) => isInCurrentCycle(tx.date));
      document.getElementById("transactionCountLabel").textContent = `${monthlyTx.length} transactions`;

      const recentList = document.getElementById("recentList");
      recentList.innerHTML = "";
      const sortedTx = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
      const recent = sortedTx.slice(0, 5);
      if (recent.length === 0) document.getElementById("emptyRecent").classList.remove("hidden");
      else {
        document.getElementById("emptyRecent").classList.add("hidden");
        recent.forEach((tx) => recentList.appendChild(createTransactionRow(tx, true)));
      }
      applyMasking();
    }

    function createTransactionRow(tx, showActions = false) {
      const row = document.createElement("div");
      row.className = "glass-soft rounded-2xl px-3 py-2 flex items-center justify-between text-sm";
      const hasNote = tx.note && tx.note.trim();
      const displayTitle = hasNote ? tx.note.trim() : tx.category;
      let accountText = tx.account;
      if (tx.type === "transfer") accountText = `${tx.fromAccount} → ${tx.toAccount}`;

      const amtClass = tx.type === "transfer" ? "text-sky-300" : (tx.type === "expense" ? "text-rose-300" : "text-emerald-300");
      const amtPrefix = tx.type === "expense" ? "-" : (tx.type === "income" ? "+" : "");

      let subtitle = `${new Date(tx.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})} • ${accountText}`;
      if (hasNote) subtitle += ` • ${tx.category}`;

      row.innerHTML = `
        <div class="flex flex-col flex-1 min-w-0">
          <span class="text-sm font-medium truncate text-slate-200">${displayTitle}</span>
          <span class="text-[11px] text-slate-400">${subtitle}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="amount-display font-semibold ${amtClass}">${amtPrefix}${currency(tx.amount)}</span>
          ${showActions ? `
          <div class="flex gap-1 ml-2">
            <button onclick="event.stopPropagation(); openEditTransactionModal('${tx.id}')" class="p-1 text-slate-400 hover:text-sky-300">✏️</button>
            <button onclick="event.stopPropagation(); openDeleteModal('${tx.id}', 'transaction')" class="p-1 text-slate-400 hover:text-rose-300">🗑️</button>
          </div>` : ''}
        </div>
      `;
      return row;
    }

    function renderLogs() {
      const logsList = document.getElementById("logsList");
      const filterType = document.getElementById("logsFilterType").value;
      const filterRange = document.getElementById("logsFilterRange").value;
      const searchQuery = document.getElementById("logsSearchInput").value.toLowerCase();

      logsList.innerHTML = "";
      const now = new Date();
      let filtered = state.transactions.filter((tx) => {
        if (filterType !== "all" && tx.type !== filterType) return false;
        if (filterRange === "month" && !isInCurrentCycle(tx.date)) return false;
        const d = new Date(tx.date);
        const diffDays = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
        if (filterRange === "week" && diffDays > 7) return false;

        // Search Logic
        if (searchQuery) {
           const note = (tx.note || "").toLowerCase();
           const cat = (tx.category || "").toLowerCase();
           const amt = tx.amount.toString();
           const dateStr = tx.date;
           if (!note.includes(searchQuery) && !cat.includes(searchQuery) && !amt.includes(searchQuery) && !dateStr.includes(searchQuery)) return false;
        }

        return true;
      });
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      if (filtered.length === 0) document.getElementById("emptyLogs").classList.remove("hidden");
      else {
        document.getElementById("emptyLogs").classList.add("hidden");
        filtered.forEach(tx => logsList.appendChild(createTransactionRow(tx, true)));
      }
      applyMasking();
    }
    document.getElementById("logsFilterType").addEventListener("change", renderLogs);
    document.getElementById("logsFilterRange").addEventListener("change", renderLogs);
    document.getElementById("logsSearchInput").addEventListener("input", renderLogs);

    function renderBudget() {
      let monthlySpent = 0;
      const categorySpending = {};
      state.transactions.forEach((tx) => {
        if (!isInCurrentCycle(tx.date)) return;
        if (tx.type === "expense") {
          monthlySpent += tx.amount;
          if (!categorySpending[tx.category]) categorySpending[tx.category] = 0;
          categorySpending[tx.category] += tx.amount;
        }
      });
      document.getElementById("budgetPlanned").textContent = currency(state.budgetMonthly);
      const remaining = Math.max(0, state.budgetMonthly - monthlySpent);
      document.getElementById("budgetRemaining").textContent = currency(remaining);
      const ratio = state.budgetMonthly ? Math.min(1, monthlySpent / state.budgetMonthly) : 0;
      document.getElementById("budgetBar").style.width = `${ratio * 100}%`;
      document.getElementById("budgetLabel").textContent = `${Math.round(ratio * 100)}% of your budget used.`;

      const list = document.getElementById("categorySpendingList");
      list.innerHTML = "";
      const sortedCats = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
      if(sortedCats.length === 0) document.getElementById("emptyCategorySpending").classList.remove("hidden");
      else {
        document.getElementById("emptyCategorySpending").classList.add("hidden");
        sortedCats.forEach(([cat, amount]) => {
          const budget = state.categories[cat]?.budget || 0;
          const card = document.createElement("div");
          card.className = "glass-soft rounded-2xl p-3";
          const pct = budget > 0 ? Math.min(100, (amount/budget)*100) : 0;
          card.innerHTML = `<div class="flex justify-between mb-2"><span class="text-sm font-medium text-slate-200">${cat}</span><span class="text-sm font-semibold ${amount > budget && budget > 0 ? 'text-rose-300' : 'text-slate-100'} amount-display">${currency(amount)}</span></div>${budget > 0 ? `<div class="h-1.5 rounded-full bg-slate-800/80 overflow-hidden mb-1"><div class="h-full rounded-full bg-sky-400" style="width: ${pct}%"></div></div><p class="text-[11px] text-slate-400">${Math.round(pct)}% of ${currency(budget)} budget</p>` : ''}`;
          list.appendChild(card);
        });
      }
      applyMasking();
    }

    function renderAccounts() {
      const list = document.getElementById("accountsList");
      list.innerHTML = "";
      const accounts = Object.keys(state.accounts);
      if (accounts.length === 0) document.getElementById("emptyAccounts").classList.remove("hidden");
      else {
        document.getElementById("emptyAccounts").classList.add("hidden");
        accounts.forEach(name => {
          const balance = state.accounts[name];
          const type = state.accountTypes[name] || "other";
          const isCredit = type === "credit";
          const div = document.createElement("div");
          div.className = "glass-soft rounded-2xl p-4 flex justify-between items-center";
          let displayBal = currency(Math.abs(balance));
          if (!isCredit && balance < 0) displayBal = "-" + displayBal;
          const colorClass = isCredit ? (balance <= 0 ? "text-emerald-300" : "text-rose-400") : (balance >= 0 ? "text-emerald-300" : "text-rose-400");
          div.innerHTML = `
            <div class="flex items-center gap-3"><span class="text-2xl">${type === 'bank' ? '🏦' : type === 'credit' ? '💳' : '📁'}</span><div><p class="text-sm font-medium text-slate-200">${name}</p><p class="text-[11px] text-slate-400 capitalize">${type}</p></div></div>
            <div class="text-right"><p class="text-lg font-semibold amount-display ${colorClass}">${displayBal}</p><div class="flex justify-end gap-2 mt-1"><button onclick="event.stopPropagation(); openEditAccountModal('${name}')" class="text-[10px] text-slate-500">Edit</button><button onclick="event.stopPropagation(); openDeleteModal('${name}', 'account')" class="text-[10px] text-slate-500">Delete</button></div></div>`;
          list.appendChild(div);
        });
      }
      updateAccountDropdowns();
      applyMasking();
    }

    function updateAccountDropdowns() {
      const names = Object.keys(state.accounts);
      ["accountInput", "fromAccountInput", "toAccountInput", "editTxAccount", "editTxFromAccount", "editTxToAccount"].forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        el.innerHTML = "";
        names.forEach(n => { const opt = document.createElement("option"); opt.value = n; opt.textContent = n; el.appendChild(opt); });
      });
    }

    function renderRecurring() {
      const list = document.getElementById("recurringList");
      list.innerHTML = "";
      const items = state.transactions.filter(tx => tx.isRecurring);
      if(items.length === 0) document.getElementById("emptyRecurring").classList.remove("hidden");
      else {
        document.getElementById("emptyRecurring").classList.add("hidden");
        items.forEach(tx => {
           const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
           const isPaid = state.reminderPayments[tx.id] && state.reminderPayments[tx.id][monthKey];
           const div = document.createElement("div");
           div.className = "glass-soft rounded-2xl px-3 py-2 flex items-center justify-between";
           const hasNote = tx.note && tx.note.trim();
           const title = hasNote ? tx.note.trim() : tx.category;
           let subtitle = `Day ${tx.dueDay} • ${currency(tx.amount)}`;
           if(hasNote) subtitle += ` • ${tx.category}`;

           div.innerHTML = `<div class="flex flex-col"><span class="text-sm font-medium text-slate-200">${title}</span><span class="text-[11px] text-slate-400">${subtitle}</span></div><div class="flex items-center gap-2"><span class="text-[10px] px-2 py-0.5 rounded-full border ${isPaid ? 'border-emerald-400/40 text-emerald-300' : 'border-amber-400/40 text-amber-300'}">${isPaid ? 'Paid' : 'Pending'}</span><button onclick="event.stopPropagation(); openDeleteModal('${tx.id}', 'transaction')" class="p-1 text-slate-400">🗑️</button></div>`;
           list.appendChild(div);
        });
      }
      applyMasking();
    }

    function calculateAllocatedExpenses(excludeName = null) {
      return Object.entries(state.categories).reduce((sum, [name, data]) => {
        if (name === excludeName) return sum;
        if (data.type === 'expense') return sum + (data.budget || 0);
        return sum;
      }, 0);
    }

    function renderCategoryBudgets() {
       const list = document.getElementById("categoryBudgetsList");
       list.innerHTML = "";
       // Sort: Expenses first, then Income. Alphabetical within.
       const cats = Object.keys(state.categories).filter(c => state.categories[c].type !== 'neutral');
       cats.sort((a,b) => {
          if(state.categories[a].type !== state.categories[b].type) return state.categories[a].type === 'expense' ? -1 : 1;
          return a.localeCompare(b);
       });

       if(cats.length === 0) {
          list.innerHTML = `<p class="text-xs text-slate-400 text-center py-2">No categories found.</p>`;
          return;
       }

       cats.forEach(cat => {
         const data = state.categories[cat];
         const row = document.createElement("div");
         row.className = "category-row";

         // Type Indicator Color
         const typeColor = data.type === 'expense' ? 'text-rose-400' : 'text-emerald-400';

         row.innerHTML = `
           <div class="flex items-center gap-2 overflow-hidden">
             <span class="text-[10px] ${typeColor}">●</span>
             <span class="text-xs font-medium text-slate-200 truncate">${cat}</span>
           </div>
           <div class="flex items-center gap-3">
             <input type="number" placeholder="Budget" class="w-20 bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-slate-200" value="${data.budget}" onchange="updateCatBudget('${cat}', this)" />
             <div class="actions">
               <button onclick="openCategoryModal('${cat}')" class="text-xs">✏️</button>
               <button onclick="deleteCategory('${cat}')" class="text-xs delete-btn">🗑️</button>
             </div>
           </div>
         `;
         list.appendChild(row);
       });
    }

    window.updateCatBudget = (cat, inputEl) => {
       const val = parseFloat(inputEl.value) || 0;
       const data = state.categories[cat];

       if(data) {
          // Validation for Expenses
          if (data.type === 'expense') {
              if (val < 0) {
                  inputEl.value = data.budget;
                  return;
              }
              const currentAllocated = calculateAllocatedExpenses(cat);
              const remaining = state.budgetMonthly - currentAllocated;

              if (val > remaining) {
                  alert(`⚠️ Budget Exceeded\n\nCannot allocate ₹${val} to '${cat}'.\nMaximum available: ₹${Math.max(0, remaining)}`);
                  inputEl.value = data.budget; // Revert
                  return;
              }
          }

          state.categories[cat].budget = val;
          saveState();
          renderBudget();
       }
    };

    // Category Modal Logic
    const categoryModal = document.getElementById("categoryModal");
    const categoryForm = document.getElementById("categoryForm");

    document.getElementById("addCategoryBtn").onclick = () => openCategoryModal();
    document.getElementById("cancelCategoryModal").onclick = () => categoryModal.classList.add("hidden");

    window.openCategoryModal = (name = null) => {
       const isEdit = !!name;
       document.getElementById("categoryModalTitle").textContent = isEdit ? "Edit Category" : "Add Category";
       document.getElementById("categoryOldName").value = name || "";
       document.getElementById("categoryNameInput").value = name || "";

       if(isEdit && state.categories[name]) {
          document.getElementById("categoryTypeInput").value = state.categories[name].type;
          document.getElementById("categoryBudgetInput").value = state.categories[name].budget;
       } else {
          document.getElementById("categoryTypeInput").value = "expense";
          document.getElementById("categoryBudgetInput").value = 0;
       }

       categoryModal.classList.remove("hidden");
    };

    categoryForm.onsubmit = (e) => {
       e.preventDefault();
       const oldName = document.getElementById("categoryOldName").value;
       const newName = document.getElementById("categoryNameInput").value.trim();
       const type = document.getElementById("categoryTypeInput").value;
       const budget = parseFloat(document.getElementById("categoryBudgetInput").value) || 0;

       if(!newName) return;

       // Validation: Check total budget (Only for Expenses)
       if (type === 'expense') {
           const currentAllocated = calculateAllocatedExpenses(oldName);
           const remaining = state.budgetMonthly - currentAllocated;

           if (budget > remaining) {
              return alert(`⚠️ Budget Exceeded\n\nCannot allocate ₹${budget} to '${newName}'.\nMaximum available: ₹${Math.max(0, remaining)}`);
           }
       }

       if(oldName && newName !== oldName) {
          // Rename: Check if exists
          if(state.categories[newName]) return alert("Category already exists!");

          // Migrate transactions
          state.transactions.forEach(tx => {
             if(tx.category === oldName) tx.category = newName;
          });

          delete state.categories[oldName];
       } else if (!oldName && state.categories[newName]) {
          return alert("Category already exists!");
       }

       state.categories[newName] = { type, budget };

       // Update global lists
       if(type === 'expense' && !expenseCategories.includes(newName)) expenseCategories.push(newName);
       if(type === 'income' && !incomeCategories.includes(newName)) incomeCategories.push(newName);

       // Remove from old list if type changed?
       // Complex to sync global arrays if type changes.
       // Simplified: Rebuild global arrays from state.categories on load/render?
       // For now, just push.

       saveState();
       renderAll(); // Will update dropdowns too
       categoryModal.classList.add("hidden");
    };

    window.deleteCategory = (name) => {
       if(confirm(`Delete category "${name}"? Transactions will keep the name but it won't appear in lists.`)) {
          delete state.categories[name];
          saveState();
          renderAll();
       }
    };

    // Fix: We need to ensure dropdowns use state.categories, not just the hardcoded arrays.
    // Replace the hardcoded arrays logic in updateCategoryDropdown

    function updateCategoryDropdown(type) {
      const categoryInput = document.getElementById("categoryInput");
      categoryInput.innerHTML = "";

      // Filter from state.categories
      const cats = Object.keys(state.categories).filter(c => state.categories[c].type === type);
      cats.sort();

      cats.forEach(cat => { const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat; categoryInput.appendChild(opt); });
    }

    function renderAll() {
      renderHome(); renderLogs(); renderBudget(); renderAccounts(); renderRecurring(); renderCategoryBudgets(); renderArchive();
      updateCategoryDropdown(currentType);
    }

    // Add Entry Form
    const entryForm = document.getElementById("entryForm");
    const typeToggles = document.querySelectorAll(".typeToggle");
    let currentType = "expense";

    function updateFormForType(type) {
      document.getElementById("categoryField").classList.toggle("hidden", type === "transfer");
      document.getElementById("regularAccountField").classList.toggle("hidden", type === "transfer");
      document.getElementById("transferFields").classList.toggle("hidden", type !== "transfer");
      document.getElementById("isRecurringInput").parentElement.classList.remove("hidden");
      updateCategoryDropdown(type);
    }

    typeToggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        currentType = btn.dataset.type;
        typeToggles.forEach((b) => {
          const active = b.dataset.type === currentType;
          if (active) b.className = `typeToggle flex-1 rounded-2xl px-3 py-2 border ${currentType === 'expense' ? 'border-rose-400/60 bg-rose-500/20 text-rose-50' : currentType === 'income' ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-50' : 'border-sky-400/60 bg-sky-500/20 text-sky-50'} transition-all`;
          else b.className = "typeToggle flex-1 rounded-2xl px-3 py-2 border border-slate-600/80 bg-slate-900/40 text-slate-200/80 transition-all";
        });
        updateFormForType(currentType);
      });
    });

    const isRecurringInput = document.getElementById("isRecurringInput");
    const recurringFields = document.getElementById("recurringFields");
    isRecurringInput.addEventListener("change", () => recurringFields.classList.toggle("hidden", !isRecurringInput.checked));

    document.getElementById("dateInput").valueAsDate = new Date();
    document.getElementById("transferDateInput").valueAsDate = new Date();

    // Helper to clear form
    function clearEntryForm() {
       entryForm.reset();
       currentType = "expense";
       typeToggles[0].click(); // Reset to Expense tab styling
       document.getElementById("dateInput").valueAsDate = new Date();
       document.getElementById("transferDateInput").valueAsDate = new Date();
       recurringFields.classList.add("hidden");
    }

    // Hook into screen switching to clear form when leaving 'add' screen
    // We modify showScreen slightly or add a listener to tab buttons
    // The original showScreen didn't provide a hook, so we add a check in the tab click listeners
    // But showScreen is called by multiple things. Let's add an observer or just patch showScreen.

    // Patching showScreen logic by overriding existing click listeners is hard without rewriting them.
    // Instead, let's just make sure when we LEAVE 'add', we clear.
    // We can do this by checking the button clicks.

    // Existing: tabButtons.forEach(...)
    // Let's add a specific listener to navigation buttons that are NOT 'add'
    document.querySelectorAll(".tabButton, [data-nav]").forEach(btn => {
       btn.addEventListener('click', () => {
          const target = btn.dataset.tab || btn.dataset.nav;
          // If we are navigating AWAY from add (meaning target is not 'add'), clear form
          // But wait, 'add' button opens 'add'. Others open others.
          if (target && target !== 'add') {
             // We can safely reset the form if it's currently visible?
             // Or just always reset it when leaving.
             // Ideally we check if 'add' screen is currently active, but simple is fine:
             clearEntryForm();
          }
       });
    });

    entryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById("amountInput").value || "0");
      if (!amount || amount <= 0) return;
      let tx;
      if (currentType === "transfer") {
        const fromAcc = document.getElementById("fromAccountInput").value;
        const toAcc = document.getElementById("toAccountInput").value;
        if (fromAcc === toAcc) return alert("Accounts must be different!");
        tx = { id: crypto.randomUUID(), type: "transfer", amount, category: "Transfer", fromAccount: fromAcc, toAccount: toAcc, account: fromAcc, date: document.getElementById("transferDateInput").value, note: document.getElementById("noteInput").value.trim(), isRecurring: isRecurringInput.checked, createdAt: new Date().toISOString() };
      } else {
        tx = { id: crypto.randomUUID(), type: currentType, amount, category: document.getElementById("categoryInput").value, account: document.getElementById("accountInput").value, date: document.getElementById("dateInput").value, note: document.getElementById("noteInput").value.trim(), isRecurring: isRecurringInput.checked, createdAt: new Date().toISOString() };
      }
      if (isRecurringInput.checked) {
        tx.recurringType = document.getElementById("recurringTypeInput").value;
        tx.dueDay = parseInt(document.getElementById("dueDayInput").value) || 1;
      }
      state.transactions.unshift(tx);
      recalcAccounts(); saveState(); renderAll();
      clearEntryForm();
      showScreen("home");
    });

    function recalcAccounts() {
      Object.keys(state.accounts).forEach(name => state.accounts[name] = state.accountInitialBalances[name] || 0);
      [...state.transactions].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(tx => {
        if (tx.type === "transfer") {
          // Transfer Logic
          // From Account: Assets decrease (-), Liabilities decrease if paying it back?
          // To Account: Assets increase (+), Liabilities increase if spending from it? (e.g. balance transfer)

          // Current logic:
          // Bank -> Bank: Bank1 -Amt, Bank2 +Amt
          // Bank -> Credit: Bank -Amt, Credit -Amt (Liability reduces)
          // Credit -> Bank: Credit +Amt (Liability increases), Bank +Amt (Asset increases) -- e.g. Cash advance

          // Implementation:
          // If account is Credit, balance is "Outstanding Debt".
          // So 'spending' (expense) increases balance. 'paying' (income/transfer in) decreases balance.

          if (state.accounts.hasOwnProperty(tx.fromAccount)) {
             const isCreditFrom = state.accountTypes[tx.fromAccount] === "credit";
             // If from is Credit (e.g. transfer from CC to somewhere), debt increases.
             // If from is Bank, asset decreases.
             state.accounts[tx.fromAccount] += (isCreditFrom ? 1 : -1) * tx.amount;
          }

          if (state.accounts.hasOwnProperty(tx.toAccount)) {
             const isCreditTo = state.accountTypes[tx.toAccount] === "credit";
             // If to is Credit (e.g. paying CC bill), debt decreases.
             // If to is Bank, asset increases.
             state.accounts[tx.toAccount] += (isCreditTo ? -1 : 1) * tx.amount;
          }

        } else if (state.accounts.hasOwnProperty(tx.account)) {
          const isCredit = state.accountTypes[tx.account] === "credit";
          if (isCredit) {
             // Credit Card: Expense increases debt (+), Income (refund) decreases debt (-)
             state.accounts[tx.account] += (tx.type === "expense" ? 1 : -1) * tx.amount;
          } else {
             // Bank/Cash: Expense decreases asset (-), Income increases asset (+)
             state.accounts[tx.account] += (tx.type === "income" ? 1 : -1) * tx.amount;
          }
        }
      });
    }

    // Modal Actions
    const addAccountModal = document.getElementById("addAccountModal");
    document.getElementById("addAccountBtn").onclick = () => {
       document.getElementById("addAccountForm").reset();
       document.getElementById("creditCardDueDateField").classList.add("hidden");
       addAccountModal.classList.remove("hidden");
    };
    document.getElementById("cancelAddAccount").onclick = () => addAccountModal.classList.add("hidden");
    document.getElementById("addAccountForm").onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById("newAccountName").value.trim();
      if(state.accounts[name]) return alert("Exists!");
      state.accounts[name] = parseFloat(document.getElementById("newAccountBalance").value) || 0;
      state.accountTypes[name] = document.getElementById("newAccountType").value;
      state.accountInitialBalances[name] = state.accounts[name];
      // Store due date for Credit Cards
      if(state.accountTypes[name] === 'credit') {
         state.accountDueDays[name] = parseInt(document.getElementById("newAccountDueDay").value) || 1;
      }
      saveState();
      addAccountModal.classList.add("hidden");
      renderAll();
    };

    const editAccountModal = document.getElementById("editAccountModal");
    window.openEditAccountModal = (name) => {
      document.getElementById("editAccountOldName").value = name;
      document.getElementById("editAccountName").value = name;
      const type = state.accountTypes[name];
      document.getElementById("editAccountType").value = type;
      document.getElementById("editAccountBalance").value = state.accountInitialBalances[name];

      const dueField = document.getElementById("editCreditCardDueDateField");
      if(type === 'credit') {
        dueField.classList.remove('hidden');
        document.getElementById("editAccountDueDay").value = state.accountDueDays[name] || "";
      } else {
        dueField.classList.add('hidden');
      }

      editAccountModal.classList.remove("hidden");
    };
    document.getElementById("cancelEditAccount").onclick = () => editAccountModal.classList.add("hidden");
    document.getElementById("editAccountForm").onsubmit = (e) => {
       e.preventDefault();
       const oldName = document.getElementById("editAccountOldName").value;
       const newName = document.getElementById("editAccountName").value.trim();
       if(newName !== oldName && state.accounts[newName]) return alert("Exists!");

       // Handle Rename
       if(newName !== oldName) {
         state.accounts[newName] = state.accounts[oldName];
         state.accountTypes[newName] = state.accountTypes[oldName];
         state.accountInitialBalances[newName] = state.accountInitialBalances[oldName];
         state.accountDueDays[newName] = state.accountDueDays[oldName];
         delete state.accounts[oldName];
         delete state.accountTypes[oldName];
         delete state.accountInitialBalances[oldName];
         delete state.accountDueDays[oldName];
         // Update transactions
         state.transactions.forEach(tx => {
           if(tx.account === oldName) tx.account = newName;
           if(tx.fromAccount === oldName) tx.fromAccount = newName;
           if(tx.toAccount === oldName) tx.toAccount = newName;
         });
       }

       state.accountTypes[newName] = document.getElementById("editAccountType").value;
       state.accountInitialBalances[newName] = parseFloat(document.getElementById("editAccountBalance").value) || 0;

       if(state.accountTypes[newName] === 'credit') {
          state.accountDueDays[newName] = parseInt(document.getElementById("editAccountDueDay").value) || 1;
       }

       recalcAccounts(); saveState(); renderAll();
       editAccountModal.classList.add("hidden");
    };

    // Edit Transaction Logic - Fixed Recurring Visibility
    const editTransactionModal = document.getElementById("editTransactionModal");
    const editTxIsRecurring = document.getElementById("editTxIsRecurring");
    const editTxRecurringFields = document.getElementById("editTxRecurringFields");

    // Toggle listener for edit modal
    editTxIsRecurring.addEventListener('change', () => {
       editTxRecurringFields.classList.toggle('hidden', !editTxIsRecurring.checked);
    });

    // Dynamic Fields for Edit Modal
    document.getElementById('editTxType').addEventListener('change', (e) => {
       const type = e.target.value;
       document.getElementById("editTxCategoryField").classList.toggle("hidden", type === "transfer");
       document.getElementById("editTxRegularAccountField").classList.toggle("hidden", type === "transfer");
       document.getElementById("editTxTransferFields").classList.toggle("hidden", type !== "transfer");

       // Populate correct categories if not transfer
       if(type !== 'transfer') {
          const catSelect = document.getElementById("editTxCategory");
          catSelect.innerHTML = "";
          const cats = Object.keys(state.categories).filter(c => state.categories[c].type === type).sort();
          cats.forEach(c => { const o = document.createElement("option"); o.value = c; o.textContent = c; catSelect.appendChild(o); });
       }
    });

    window.openEditTransactionModal = (id) => {
      // Find tx by ID (id passed might be object or string, handle both)
      const txId = (typeof id === 'object') ? id.id : id;
      const tx = state.transactions.find(t => t.id === txId);
      if(!tx) return;

      document.getElementById("editTxId").value = tx.id;
      document.getElementById("editTxType").value = tx.type;
      document.getElementById("editTxAmount").value = tx.amount;

      // Date logic for different fields
      document.getElementById("editTxDate").value = tx.date;
      document.getElementById("editTxTransferDate").value = tx.date;

      document.getElementById("editTxNote").value = tx.note || "";

      updateAccountDropdowns(); // Refresh options

      // Handle Fields visibility based on Type
      document.getElementById("editTxCategoryField").classList.toggle("hidden", tx.type === "transfer");
      document.getElementById("editTxRegularAccountField").classList.toggle("hidden", tx.type === "transfer");
      document.getElementById("editTxTransferFields").classList.toggle("hidden", tx.type !== "transfer");

      if(tx.type === "transfer") {
        document.getElementById("editTxFromAccount").value = tx.fromAccount;
        document.getElementById("editTxToAccount").value = tx.toAccount;
      } else {
        document.getElementById("editTxAccount").value = tx.account;
        // Re-populate category dropdown based on type
        const catSelect = document.getElementById("editTxCategory");
        catSelect.innerHTML = "";
        let cats;
        if(tx.type === 'transfer') cats = ['Transfer'];
        else cats = Object.keys(state.categories).filter(c => state.categories[c].type === tx.type).sort();

        cats.forEach(c => { const o = document.createElement("option"); o.value = c; o.textContent = c; catSelect.appendChild(o); });
        catSelect.value = tx.category;
      }

      // Populate Recurring
      editTxIsRecurring.checked = !!tx.isRecurring;
      editTxRecurringFields.classList.toggle("hidden", !tx.isRecurring);
      if(tx.isRecurring) {
         document.getElementById("editTxRecurringType").value = tx.recurringType || "monthly";
         document.getElementById("editTxDueDay").value = tx.dueDay || 1;
      }

      editTransactionModal.classList.remove("hidden");
    };
    document.getElementById("cancelEditTx").onclick = () => {
       editTransactionModal.classList.add("hidden");
       document.getElementById("editTransactionForm").reset(); // Clear edit form on cancel
    };
    document.getElementById("editTransactionForm").onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById("editTxId").value;
      const idx = state.transactions.findIndex(t => t.id === id);
      if(idx === -1) return;

      // Construct updated object (simplified)
      const type = document.getElementById("editTxType").value;
      const updated = {
         ...state.transactions[idx],
         type: type,
         amount: parseFloat(document.getElementById("editTxAmount").value),
         note: document.getElementById("editTxNote").value,
         isRecurring: editTxIsRecurring.checked
      };

      if(type === 'transfer') {
         updated.date = document.getElementById("editTxTransferDate").value;
         updated.fromAccount = document.getElementById("editTxFromAccount").value;
         updated.toAccount = document.getElementById("editTxToAccount").value;
         updated.account = updated.fromAccount;
         updated.category = "Transfer";
      } else {
         updated.date = document.getElementById("editTxDate").value;
         updated.account = document.getElementById("editTxAccount").value;
         updated.category = document.getElementById("editTxCategory").value;
      }

      if(updated.isRecurring) {
         updated.recurringType = document.getElementById("editTxRecurringType").value;
         updated.dueDay = parseInt(document.getElementById("editTxDueDay").value);
      }

      state.transactions[idx] = updated;
      recalcAccounts(); saveState(); renderAll();
      editTransactionModal.classList.add("hidden");
      document.getElementById("editTransactionForm").reset(); // Clear edit form on submit
    };

    // Date Cycle Settings Listener
    document.getElementById("monthStartDateInput").addEventListener('change', (e) => {
       state.monthStartDate = parseInt(e.target.value) || 1;
       saveState();
       renderHome(); // Explicitly re-render home to update cycle label
    });
    // Set initial value
    document.getElementById("monthStartDateInput").value = state.monthStartDate || 1;

    // Data Management: Reset
    const resetBtn = document.getElementById("resetDataBtn");
    if(resetBtn) {
        resetBtn.onclick = async () => {
          if(confirm("Are you sure? All data will be wiped.")) {
            // Clear IDB
            try {
                const db = await IDBStorage.open();
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.clear();
                await new Promise(r => { tx.oncomplete = r; tx.onerror = r; });
            } catch(e) { console.error(e); }

            // Clear LocalStorage just in case
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
          }
        };
    }

    // Data Management: Export JSON
    const exportBtn = document.getElementById("exportDataBtn");
    if(exportBtn) {
       exportBtn.onclick = async () => {
           const dataStr = JSON.stringify(state, null, 2);
           const filename = `FinTrack_Backup_${new Date().toISOString().slice(0,10)}.json`;

           // Create file for sharing
           const file = new File([dataStr], filename, { type: "application/json" });

           if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                 await navigator.share({ files: [file], title: 'FinTrack Backup' });
              } catch (e) { console.log("Share cancelled"); }
           } else {
              // Fallback
              const blob = new Blob([dataStr], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename;
              a.click();
           }
       };
    }

    // Data Management: Import JSON
    const importBtn = document.getElementById("importDataBtn");
    const importInput = document.getElementById("importFileInput");
    if(importBtn && importInput) {
       importBtn.onclick = () => importInput.click();

       importInput.onchange = (e) => {
           const file = e.target.files[0];
           if (!file) return;
           const reader = new FileReader();
           reader.onload = (event) => {
              try {
                 const imported = JSON.parse(event.target.result);
                 // Basic validation
                 if (!imported.transactions || !imported.accounts || !imported.categories) throw new Error("Invalid format");

                 if(confirm("This will overwrite your current data. Continue?")) {
                    // Update state synchronously for immediate feedback if needed, but primarily save to IDB
                    state = imported; // Update in-memory to be safe before reload, though reload clears it.

                    // We must wait for save before reloading
                    IDBStorage.save(imported).then(() => {
                        localStorage.removeItem(STORAGE_KEY); // Ensure no conflict
                        location.reload();
                    });
                 }
              } catch(err) {
                 alert("Failed to import data: " + err.message);
              }
           };
           reader.readAsText(file);
       };
    }

    // Archive Toggle Logic
    const archiveHeader = document.getElementById("archiveHeader");
    if(archiveHeader) {
       archiveHeader.addEventListener("click", () => {
           const container = document.getElementById("archiveContainer");
           const arrow = document.getElementById("archiveArrow");
           const isHidden = container.classList.contains("hidden");
           container.classList.toggle("hidden", !isHidden);
           arrow.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
       });
    }

    const editBudgetModal = document.getElementById("editBudgetModal");
    document.getElementById("editBudgetBtn").onclick = () => { document.getElementById("budgetAmountInput").value = state.budgetMonthly; editBudgetModal.classList.remove("hidden"); };
    document.getElementById("cancelEditBudget").onclick = () => editBudgetModal.classList.add("hidden");
    document.getElementById("editBudgetForm").onsubmit = (e) => { e.preventDefault(); state.budgetMonthly = parseFloat(document.getElementById("budgetAmountInput").value) || 0; saveState(); renderAll(); editBudgetModal.classList.add("hidden"); };

    const deleteModal = document.getElementById("deleteConfirmModal");
    window.openDeleteModal = (id, type) => { document.getElementById("deleteItemId").value = id; document.getElementById("deleteItemType").value = type; deleteModal.classList.remove("hidden"); };
    document.getElementById("cancelDelete").onclick = () => deleteModal.classList.add("hidden");
    document.getElementById("confirmDelete").onclick = () => {
      const id = document.getElementById("deleteItemId").value;
      const type = document.getElementById("deleteItemType").value;
      if(type === 'transaction') state.transactions = state.transactions.filter(t => t.id !== id);
      else if (type === 'account') { delete state.accounts[id]; delete state.accountTypes[id]; delete state.accountInitialBalances[id]; }
      recalcAccounts(); saveState(); renderAll(); deleteModal.classList.add("hidden");
    };

    updateCategoryDropdown("expense");
    updateFormForType("expense");
    // Initial UI render with empty state to prevent FOUC
    showScreen("home");

    async function initApp() {
        // 1. Try Load from IDB
        const loaded = await IDBStorage.load();

        if (loaded) {
            state = loaded;
        } else {
            // 2. Migration: Check localStorage
            const localRaw = localStorage.getItem(STORAGE_KEY);
            if (localRaw) {
                try {
                    const parsed = JSON.parse(localRaw);
                    state = Object.assign(structuredClone(initialState), parsed);
                    // Ensure deep structures exist
                    for (const cat in state.categories) if (typeof state.categories[cat].budget === 'undefined') state.categories[cat].budget = 0;
                    if (!state.reminderPayments) state.reminderPayments = {};
                    if (!state.accountInitialBalances) state.accountInitialBalances = {};
                    if (!state.accountDueDays) state.accountDueDays = {};

                    // Save to IDB immediately
                    await IDBStorage.save(state);
                    // Clear localStorage to complete migration
                    localStorage.removeItem(STORAGE_KEY);
                    console.log("Migrated data from LocalStorage to IndexedDB.");
                } catch (e) {
                    console.error("Migration failed:", e);
                }
            }
        }

        // 3. Re-render with loaded data
        recalcAccounts();
        renderAll();
    }

    initApp();

    // Net Worth Tooltip Logic
    const netWorthTooltip = document.getElementById("netWorthTooltip");
    const netWorthInfoIcon = document.getElementById("netWorthInfoIcon");

    if (netWorthInfoIcon && netWorthTooltip) {
       netWorthInfoIcon.addEventListener("click", (e) => {
          e.stopPropagation();
          netWorthTooltip.classList.toggle("visible");
       });

       document.addEventListener("click", (e) => {
          if (!netWorthTooltip.contains(e.target) && e.target !== netWorthInfoIcon) {
             netWorthTooltip.classList.remove("visible");
          }
       });
    }

    /* Helper: Use Native Share for iOS to prevent browser bars appearing */
    async function shareOrDownloadCSV(filename, csvContent) {
      const file = new File([csvContent], filename, { type: "text/csv" });

      // 1. Try Native iOS/Android Share Sheet first
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'FinTrack Export',
            text: 'Here is your transaction data.'
          });
          return; // Success! No browser bars.
        } catch (err) {
          if (err.name !== 'AbortError') console.error(err);
          // If user cancelled, do nothing. If error, fall through to download.
          return;
        }
      }

      // 2. Desktop Fallback (Original Logic)
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); // Required for Firefox/some browsers
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
